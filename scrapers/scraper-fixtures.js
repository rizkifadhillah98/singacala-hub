const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Konfigurasi dasar
const BASE_URL = 'https://www.ileague.id/fixtures/index/PEGADAIAN_CHAMPIONSHIP_2026-27';
const TOTAL_WEEKS_DEFAULT = 27;

// Helper: Tunggu jeda waktu (rate-limiting friendly)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Normalisasi URL gambar
function normalizeUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://www.ileague.id${url.startsWith('/') ? '' : '/'}${url}`;
}

// Ekstrak nama broadcast dari URL logo
function getBroadcastName(logoUrl) {
  if (!logoUrl) return '';
  try {
    const filename = path.basename(logoUrl, path.extname(logoUrl));
    return decodeURIComponent(filename).replace(/[_-]/g, ' ').trim();
  } catch {
    return '';
  }
}

// Fungsi parsing per grup (#group1 / #group2)
function parseGroupMatches($, groupId, groupName, weekNum) {
  const container = $(groupId);
  if (!container.length) return [];

  const matches = [];
  let currentDate = '';

  const parent = container.find('.table-responsive').first().length
    ? container.find('.table-responsive').first()
    : container;

  parent.children().each((_, el) => {
    const $el = $(el);

    // Deteksi tanggal pertandingan (div header)
    if ($el.is('div') && $el.hasClass('col-md-12') && !$el.find('table').length) {
      const text = $el.text().trim();
      if (text) {
        currentDate = text;
      }
      return;
    }

    // Deteksi baris pertandingan
    let matchLink = '';
    let rowEl = null;

    if ($el.is('a') && $el.hasClass('table-row')) {
      matchLink = $el.attr('href') || '';
      rowEl = $el.find('tr.table-row');
    } else if ($el.find('tr.table-row').length) {
      rowEl = $el.find('tr.table-row');
      matchLink = $el.find('a').attr('href') || '';
    }

    if (rowEl && rowEl.length) {
      const tds = rowEl.find('td');
      if (tds.length >= 6) {
        const homeTeam = $(tds[0]).text().trim();
        const homeLogo = normalizeUrl($(tds[1]).find('img').attr('src'));

        // Parsing skor atau waktu kickoff
        const scoreCell = $(tds[2]);
        const statusBadge = scoreCell.find('span span').text().trim(); // misal "FT", "HT"
        const fullScoreText = scoreCell.text().trim();

        let status = statusBadge || 'UPCOMING';
        let homeScore = null;
        let awayScore = null;
        let kickoffTime = null;

        if (statusBadge === 'FT' || statusBadge === 'HT' || /FT|HT/i.test(fullScoreText)) {
          status = statusBadge || 'FT';
          const scoreMatch = fullScoreText.match(/(\d+)\s*:\s*(\d+)/);
          if (scoreMatch) {
            homeScore = parseInt(scoreMatch[1], 10);
            awayScore = parseInt(scoreMatch[2], 10);
          }
        } else {
          status = 'UPCOMING';
          const timeMatch = fullScoreText.match(/(\d{1,2}:\d{2})/);
          if (timeMatch) {
            kickoffTime = timeMatch[1];
          }
        }

        const awayLogo = normalizeUrl($(tds[3]).find('img').attr('src'));
        const awayTeam = $(tds[4]).text().trim();
        const venue = $(tds[5]).text().trim();

        // Broadcast / Siaran TV
        const broadcastLogo = normalizeUrl($(tds[6]).find('img').attr('src'));
        const broadcastName = getBroadcastName(broadcastLogo) || $(tds[6]).text().trim();

        matches.push({
          pekan: weekNum,
          grup: groupName,
          tanggal: currentDate,
          waktu: kickoffTime,
          status: status,
          timHome: homeTeam,
          logoHome: homeLogo,
          skorHome: homeScore,
          skorAway: awayScore,
          timAway: awayTeam,
          logoAway: awayLogo,
          stadion: venue,
          siaran: broadcastLogo ? { nama: broadcastName, logo: broadcastLogo } : null,
          urlDetail: matchLink,
        });
      }
    }
  });

  return matches;
}

// Scrape satu pekan tertentu dengan auto-retry
async function scrapeWeek(weekNum, maxRetries = 3) {
  const targetUrl = `${BASE_URL}/${weekNum}/0`;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: html } = await axios.get(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(html);
      const grupA = parseGroupMatches($, '#group1', 'Grup A', weekNum);
      const grupB = parseGroupMatches($, '#group2', 'Grup B', weekNum);
      const allMatches = [...grupA, ...grupB];

      return {
        pekan: weekNum,
        url: targetUrl,
        grup: 'Semua Grup (A & B)',
        totalPertandingan: allMatches.length,
        pertandingan: allMatches,
      };
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(`[RETRY] Pekan ${weekNum} gagal (percobaan ${attempt}/${maxRetries}): ${error.message}. Mencoba kembali...`);
        await sleep(1000);
      } else {
        console.error(`[WARN] Gagal mengambil Pekan ${weekNum} setelah ${maxRetries} percobaan: ${error.message}`);
        return {
          pekan: weekNum,
          url: targetUrl,
          grup: 'Grup A',
          totalPertandingan: 0,
          error: error.message,
          pertandingan: [],
        };
      }
    }
  }
}

async function scrapeAllWeeks(startWeek = 1, endWeek = TOTAL_WEEKS_DEFAULT, onProgress = null) {
  const hasilSemuaPekan = [];
  let totalPertandinganDitemukan = 0;

  for (let w = startWeek; w <= endWeek; w++) {
    const dataPekan = await scrapeWeek(w);
    hasilSemuaPekan.push(dataPekan);
    totalPertandinganDitemukan += dataPekan.totalPertandingan;

    if (onProgress) {
      onProgress(w, endWeek, dataPekan);
    }

    if (w < endWeek) {
      await sleep(200);
    }
  }

  const outputFile = path.join(__dirname, '..', 'data', 'jadwal_dan_hasil.json');
  fs.writeFileSync(outputFile, JSON.stringify(hasilSemuaPekan, null, 2), 'utf-8');
  return hasilSemuaPekan;
}

// Fungsi Utama jika dijalankan langsung via CLI
async function main() {
  const args = process.argv.slice(2);
  let startWeek = 1;
  let endWeek = TOTAL_WEEKS_DEFAULT;

  if (args.length === 1) {
    const val = parseInt(args[0], 10);
    if (!isNaN(val)) {
      startWeek = val;
      endWeek = val;
    }
  } else if (args.length >= 2) {
    const s = parseInt(args[0], 10);
    const e = parseInt(args[1], 10);
    if (!isNaN(s) && !isNaN(e)) {
      startWeek = s;
      endWeek = e;
    }
  }

  console.log(`=======================================================`);
  console.log(`SCRAPER JADWAL & HASIL PEGADAIAN CHAMPIONSHIP 2026-27`);
  console.log(`Rentang Pekan: Week ${startWeek} s/d Week ${endWeek}`);
  console.log(`=======================================================\n`);

  let totalLaga = 0;
  const hasil = await scrapeAllWeeks(startWeek, endWeek, (w, total, data) => {
    totalLaga += data.totalPertandingan;
    console.log(`[${w}/${total}] Pekan ${w} selesai (${data.totalPertandingan} laga)`);
  });

  console.log(`\n=======================================================`);
  console.log(`[SUKSES] Selesai memproses ${hasil.length} pekan.`);
  console.log(`Total pertandingan berhasil diambil: ${totalLaga} laga.`);
  console.log(`=======================================================\n`);

  const outputFile = path.join(__dirname, '..', 'data', 'jadwal_dan_hasil.json');
  console.log(`[INFO] Hasil lengkap tersimpan di: ${outputFile}`);
}

if (require.main === module) {
  main();
}

module.exports = { scrapeWeek, scrapeAllWeeks };

