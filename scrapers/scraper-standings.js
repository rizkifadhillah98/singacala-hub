const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeKlasemen() {
  const url = 'https://www.ileague.id/table/index/PEGADAIAN_CHAMPIONSHIP_2026-27';

  console.log(`[INFO] Mengambil data klasemen dari: ${url}`);
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(html);
    const hasil = [];

    // Deteksi nama grup dari tab navigation (Grup A, Grup B)
    const tabPills = $('.nav-pills li a, .nav-pills a');
    const groupNames = [];
    tabPills.each((_, el) => {
      const t = $(el).text().trim();
      if (t.includes('Grup')) groupNames.push(t);
    });

    // Ambil semua tabel klasemen (Grup A & Grup B)
    $('table').each((index, tableEl) => {
      const namaGrup = groupNames[index] || (index === 0 ? 'Grup A' : index === 1 ? 'Grup B' : `Grup ${index + 1}`);
      const daftarKlub = [];

      $(tableEl).find('tbody tr').each((_, rowEl) => {
        const kolom = $(rowEl).find('td');
        if (kolom.length < 10) return;

        // Ambil elemen nama dan logo tim (kolom ke-2 / index 1)
        const klubCell = $(kolom[1]);
        let logoUrl = klubCell.find('img').attr('src') || '';
        if (logoUrl && !logoUrl.startsWith('http')) {
          logoUrl = `https://www.ileague.id${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
        }
        const rawNamaKlub = klubCell.text().trim();

        // Bersihkan nama klub dan deteksi penalti poin, contoh: "PSIS SEMARANG (-1)"
        const matchPenalti = rawNamaKlub.match(/\((-\d+)\)/);
        const penaltiPoin = matchPenalti ? parseInt(matchPenalti[1], 10) : 0;
        const namaKlub = rawNamaKlub.replace(/\s*\((-\d+)\)/, '').trim();

        // Ekstraksi form guide W/D/L
        const riwayatForm = [];
        if (kolom.length > 10) {
          const formText = $(kolom[10]).text().trim();
          const forms = formText.split(/\s+/).filter(x => ['W', 'D', 'L'].includes(x));
          if (forms.length) riwayatForm.push(...forms);
        }

        daftarKlub.push({
          posisi: parseInt($(kolom[0]).text().trim(), 10) || 0,
          klub: namaKlub,
          logo: logoUrl,
          catatanPenalti: penaltiPoin,
          main: parseInt($(kolom[2]).text().trim(), 10) || 0,
          menang: parseInt($(kolom[3]).text().trim(), 10) || 0,
          seri: parseInt($(kolom[4]).text().trim(), 10) || 0,
          kalah: parseInt($(kolom[5]).text().trim(), 10) || 0,
          gf: parseInt($(kolom[6]).text().trim(), 10) || 0, // Goal For (Memasukkan)
          ga: parseInt($(kolom[7]).text().trim(), 10) || 0, // Goal Against (Kemasukan)
          gd: parseInt($(kolom[8]).text().trim(), 10) || 0, // Goal Difference (Selisih Gol)
          poin: parseInt($(kolom[9]).text().trim(), 10) || 0,
          form: riwayatForm,
        });
      });

      if (daftarKlub.length > 0) {
        hasil.push({
          grup: namaGrup,
          totalTim: daftarKlub.length,
          klasemen: daftarKlub,
        });
      }
    });

    return hasil;
  } catch (error) {
    console.error('[ERROR] Gagal mengambil data:', error.message);
    throw error;
  }
}

async function runAndSaveStandings() {
  const data = await scrapeKlasemen();
  const outputPath = path.join(__dirname, '..', 'data', 'klasemen.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

// Eksekusi utama jika dijalankan langsung via CLI
async function main() {
  try {
    const data = await runAndSaveStandings();
    console.log(`[SUKSES] Berhasil mengekstrak ${data.length} grup klasemen:`);
    
    data.forEach((grup) => {
      console.log(`\n=== ${grup.grup} (${grup.totalTim} Klub) ===`);
      console.table(
        grup.klasemen.map((tim) => ({
          Pos: tim.posisi,
          Klub: tim.klub + (tim.catatanPenalti ? ` (${tim.catatanPenalti})` : ''),
          Main: tim.main,
          M: tim.menang,
          S: tim.seri,
          K: tim.kalah,
          GF: tim.gf,
          GA: tim.ga,
          GD: tim.gd,
          Poin: tim.poin,
        }))
      );
    });

    const outputPath = path.join(__dirname, '..', 'data', 'klasemen.json');
    console.log(`\n[INFO] Data lengkap tersimpan di: ${outputPath}`);
  } catch (err) {
    console.error('[FATAL]', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapeKlasemen, runAndSaveStandings };
