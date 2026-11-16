// ==========================================================================
// PSGC CIAMIS ODDS & ANALYSIS MODULE
// Pure analytical module decoupled from simulation trials (simState).
// Adheres strictly to J.League Flat Dark Monochrome Athletic Design System.
// ==========================================================================

import { state } from './state.js';
import { generateRealisticScore } from './simulation.js';
import { getMatchPairs } from './round3-regulasi.js';
import { formatMatchDate, getLanguage, t } from './i18n.js';

/**
 * Club Logo Registry for Putaran 2 Match Cards
 */
const CLUB_LOGOS = {
  'PSGC Ciamis': 'https://assets.ileague.id/uploads/images/logo/96/h/50/204.png',
  'PERSIKU KUDUS': 'https://assets.ileague.id/uploads/images/logo/96/h/50/49.png',
  'PERSIKU': 'https://assets.ileague.id/uploads/images/logo/96/h/50/49.png',
  'PSIS SEMARANG': 'https://assets.ileague.id/uploads/images/logo/96/h/50/20.png',
  'PSPS PEKANBARU': 'https://assets.ileague.id/uploads/images/logo/96/h/50/2.png',
  'PERSIRAJA BANDA ACEH': 'https://assets.ileague.id/uploads/images/logo/96/h/50/4.png',
  'SEMEN PADANG FC': 'https://assets.ileague.id/uploads/images/logo/96/h/50/5.png',
  'SUMSEL UNITED': 'https://assets.ileague.id/uploads/images/logo/96/h/50/2409089.png',
  'PERSIKAD': 'https://assets.ileague.id/uploads/images/logo/96/h/50/2208194.png',
  'ADHYAKSA FC BEKASI': 'https://assets.ileague.id/uploads/images/logo/96/h/50/1817798767.png',
  'PSMS MEDAN': 'https://assets.ileague.id/uploads/images/logo/96/h/50/1.png'
};

/**
 * Baseline Putaran 2 PSGC Fixture Definitions with static tactical metadata
 */
const PSGC_PUTARAN_2_SCHEDULE = [
  {
    pekan: 10,
    tanggal: 'Sabtu, 21 November 2026',
    waktu: '19:00',
    opponent: 'PERSIKU KUDUS',
    opponentShort: 'Persiku',
    opponentPos: 10,
    isHome: true,
    venue: 'Stadion Galuh Ciamis',
    classification: 'calculated_win',
    isSixPointer: true,
    noteKey: 'psgc_notes_persiku'
  },
  {
    pekan: 11,
    tanggal: 'Minggu, 29 November 2026',
    waktu: '15:30',
    opponent: 'PSIS SEMARANG',
    opponentShort: 'PSIS',
    opponentPos: 4,
    isHome: false,
    venue: 'Stadion Jatidiri',
    classification: 'tough',
    isSixPointer: false,
    noteKey: 'psgc_notes_psis'
  },
  {
    pekan: 12,
    tanggal: 'Minggu, 6 Desember 2026',
    waktu: '19:00',
    opponent: 'PSPS PEKANBARU',
    opponentShort: 'PSPS',
    opponentPos: 1,
    isHome: true,
    venue: 'Stadion Galuh Ciamis',
    classification: 'tough',
    isSixPointer: false,
    noteKey: 'psgc_notes_psps'
  },
  {
    pekan: 13,
    tanggal: 'Jumat, 11 Desember 2026',
    waktu: '15:30',
    opponent: 'PERSIRAJA BANDA ACEH',
    opponentShort: 'Persiraja',
    opponentPos: 7,
    isHome: true,
    venue: 'Stadion Galuh Ciamis',
    classification: 'tight',
    isSixPointer: true,
    noteKey: 'psgc_notes_persiraja'
  },
  {
    pekan: 14,
    tanggal: 'Jumat, 18 Desember 2026',
    waktu: '19:00',
    opponent: 'SEMEN PADANG FC',
    opponentShort: 'Semen Padang',
    opponentPos: 5,
    isHome: false,
    venue: 'Stadion Patriot Chandra Bhaga',
    classification: 'tough',
    isSixPointer: false,
    noteKey: 'psgc_notes_semen_padang'
  },
  {
    pekan: 15,
    tanggal: 'Sabtu, 9 Januari 2027',
    waktu: '15:30',
    opponent: 'SUMSEL UNITED',
    opponentShort: 'Sumsel United',
    opponentPos: 6,
    isHome: false,
    venue: 'Stadion Gelora Sriwijaya Jakabaring',
    classification: 'tight',
    isSixPointer: false,
    noteKey: 'psgc_notes_sumsel'
  },
  {
    pekan: 16,
    tanggal: 'Jumat, 15 Januari 2027',
    waktu: '19:00',
    opponent: 'PERSIKAD',
    opponentShort: 'Persikad',
    opponentPos: 3,
    isHome: true,
    venue: 'Stadion Galuh Ciamis',
    classification: 'tight',
    isSixPointer: false,
    noteKey: 'psgc_notes_persikad'
  },
  {
    pekan: 17,
    tanggal: 'Sabtu, 23 Januari 2027',
    waktu: '15:30',
    opponent: 'ADHYAKSA FC BEKASI',
    opponentShort: 'Adhyaksa FC',
    opponentPos: 8,
    isHome: true,
    venue: 'Stadion Galuh Ciamis',
    classification: 'calculated_win',
    isSixPointer: true,
    noteKey: 'psgc_notes_adhyaksa'
  },
  {
    pekan: 18,
    tanggal: 'Sabtu, 30 Januari 2027',
    waktu: '15:30',
    opponent: 'PSMS MEDAN',
    opponentShort: 'PSMS',
    opponentPos: 2,
    isHome: false,
    venue: 'Stadion Utama Sumatera Utara',
    classification: 'tough',
    isSixPointer: false,
    noteKey: 'psgc_notes_psms'
  }
];

/**
 * Normalize club names so short/full aliases match reliably in H2H & standings lookups.
 */
function normalizeClubKey(name) {
  const upper = String(name || '').trim().toUpperCase();
  if (upper === 'PERSIKU' || upper === 'PERSIKU KUDUS') return 'PERSIKU KUDUS';
  return upper;
}

/**
 * Determine whether a match object already has an official completed result.
 */
function isMatchFinished(m) {
  if (!m) return false;
  const hasScore =
    m.skorHome !== null &&
    m.skorHome !== undefined &&
    m.skorAway !== null &&
    m.skorAway !== undefined;
  return m.status ? m.status === 'FT' && hasScore : hasScore;
}

/**
 * Find a club in standings array using normalized club key matching.
 */
function findTeamInStandings(standings, clubName) {
  if (!Array.isArray(standings)) return null;
  const target = normalizeClubKey(clubName);
  return standings.find((t) => normalizeClubKey(t.klub) === target) || null;
}

/**
 * Format a clean short club display name for inline Hero/Roadmap subtexts.
 */
function formatShortClubLabel(name) {
  const upper = String(name || '').trim().toUpperCase();
  const map = {
    'PERSIKU KUDUS': 'Persiku',
    'PERSIKU': 'Persiku',
    'ADHYAKSA FC BEKASI': 'Adhyaksa FC',
    'PERSIRAJA BANDA ACEH': 'Persiraja',
    'SEMEN PADANG FC': 'Semen Padang',
    'SUMSEL UNITED': 'Sumsel United',
    'PSIS SEMARANG': 'PSIS',
    'PSPS PEKANBARU': 'PSPS',
    'PSMS MEDAN': 'PSMS',
    'PERSIKAD': 'Persikad',
    'PSGC CIAMIS': 'PSGC Ciamis'
  };
  return map[upper] || String(name || '').trim();
}

/**
 * Compute dynamic match classification, 6-pointer status, and bilingual notes
 * based on live standings while preserving baseline Pekan 9 tactical labels.
 */
function resolveDynamicFixtureAnalysis(baseFixture, psgcRank, liveOppPos, isBaselinePekan9) {
  if (isBaselinePekan9) {
    return {
      opponentPos: liveOppPos,
      classification: baseFixture.classification,
      isSixPointer: baseFixture.isSixPointer,
      noteKey: baseFixture.noteKey,
      dynamicNote: null
    };
  }

  const isHome = baseFixture.isHome;
  let classification = 'tight';
  if (liveOppPos <= 2 || (!isHome && liveOppPos <= 5)) {
    classification = 'tough';
  } else if ((isHome && liveOppPos >= 8) || liveOppPos >= 10) {
    classification = 'calculated_win';
  }

  const isSixPointer =
    Math.abs(liveOppPos - psgcRank) <= 3 && liveOppPos >= 6 && psgcRank >= 6;

  const oppShort = baseFixture.opponentShort || formatShortClubLabel(baseFixture.opponent);
  const dynamicNote = {
    id: isSixPointer
      ? `${isHome ? 'Kandang' : 'Tandang'} vs P${liveOppPos} ${oppShort} - Duel Langsung Zona Bertahan`
      : classification === 'calculated_win'
        ? `${isHome ? 'Kandang' : 'Tandang'} vs P${liveOppPos} ${oppShort} - Target Wajib 3 Poin`
        : classification === 'tough'
          ? `${isHome ? 'Menjamu' : 'Tandang ke'} P${liveOppPos} ${oppShort} - Laga Ujian Berat`
          : `${isHome ? 'Kandang' : 'Tandang'} vs P${liveOppPos} ${oppShort} - Peluang Curi Poin`,
    en: isSixPointer
      ? `${isHome ? 'Home' : 'Away'} vs P${liveOppPos} ${oppShort} - Direct Survival Zone Clash`
      : classification === 'calculated_win'
        ? `${isHome ? 'Home' : 'Away'} vs P${liveOppPos} ${oppShort} - Must-Win 3 Pts Target`
        : classification === 'tough'
          ? `${isHome ? 'Hosting' : 'Away at'} P${liveOppPos} ${oppShort} - Tough Challenge`
          : `${isHome ? 'Home' : 'Away'} vs P${liveOppPos} ${oppShort} - Competitive Points Chance`
  };

  return {
    opponentPos: liveOppPos,
    classification,
    isSixPointer,
    noteKey: baseFixture.noteKey,
    dynamicNote
  };
}

/**
 * Clear memoized Monte Carlo cache when official/dummy data changes.
 */
export function clearPsgcOddsCache() {
  cachedOddsResult = null;
  lastOddsCacheKey = null;
}

/**
 * Compute PSGC Ciamis Head-to-Head record and completed meetings against an opponent.
 */
function computePsgcHeadToHead(fixtures, opponentName) {
  const oppKey = normalizeClubKey(opponentName);
  const meetings = [];

  if (Array.isArray(fixtures)) {
    fixtures.forEach((week) => {
      if (!Array.isArray(week.pertandingan)) return;
      week.pertandingan.forEach((m) => {
        if (!isMatchFinished(m)) return;

        const isPsgcHome = /psgc/i.test(m.timHome || '');
        const isPsgcAway = /psgc/i.test(m.timAway || '');
        if (!isPsgcHome && !isPsgcAway) return;

        const otherClub = normalizeClubKey(isPsgcHome ? m.timAway : m.timHome);
        if (otherClub !== oppKey) return;

        const skorHome = Number(m.skorHome);
        const skorAway = Number(m.skorAway);
        const psgcGoals = isPsgcHome ? skorHome : skorAway;
        const oppGoals = isPsgcHome ? skorAway : skorHome;
        const outcome = psgcGoals > oppGoals ? 'W' : psgcGoals < oppGoals ? 'L' : 'D';

        meetings.push({
          pekan: week.pekan,
          tanggal: m.tanggal || week.tanggal || '',
          stadion: m.stadion || '',
          timHome: m.timHome,
          timAway: m.timAway,
          skorHome,
          skorAway,
          isPsgcHome,
          psgcGoals,
          oppGoals,
          outcome
        });
      });
    });
  }

  meetings.sort((a, b) => a.pekan - b.pekan);

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;

  meetings.forEach((m) => {
    if (m.outcome === 'W') wins++;
    else if (m.outcome === 'D') draws++;
    else losses++;
    gf += m.psgcGoals;
    ga += m.oppGoals;
  });

  return {
    played: meetings.length,
    wins,
    draws,
    losses,
    gf,
    ga,
    gd: gf - ga,
    meetings,
    lastMeeting: meetings.length > 0 ? meetings[meetings.length - 1] : null
  };
}

/**
 * Cache for Monte Carlo calculation to avoid repeated runs on tab switching
 */
let cachedOddsResult = null;
let lastOddsCacheKey = null;

/**
 * Calculate complete PSGC Ciamis Odds, Magic Numbers, and Fixtures Analysis
 * Pure function: strictly reads input standings & fixtures without touching simState.
 */
export function calculatePsgcOdds(customStandings = null, customFixtures = null) {
  const standings = customStandings || (state.standingsData && state.standingsData.klasemen) || [];
  const fixtures = customFixtures || state.fixturesData || [];

  // Generate cache key based on full standings & Grup A fixture scores
  const standingsKey = standings
    .map(t => `${t.posisi}:${t.klub}:${t.main}:${t.poin}:${t.gd}`)
    .join('|');
  const fixturesKey = Array.isArray(fixtures)
    ? fixtures
        .flatMap(w => (w.pertandingan || []).filter(m => !m.grup || m.grup === 'Grup A' || m.grup === 'A'))
        .map(m => `${m.pekan || ''}:${m.status || ''}:${m.skorHome ?? ''}-${m.skorAway ?? ''}`)
        .join(',')
    : '';
  const cacheKey = `${standingsKey}::${fixturesKey}`;
  if (cachedOddsResult && lastOddsCacheKey === cacheKey && !customStandings && !customFixtures) {
    return cachedOddsResult;
  }

  // Find PSGC Ciamis in official standings
  const psgc = standings.find(c => /psgc/i.test(c.klub)) || {
    posisi: 9,
    klub: 'PSGC Ciamis',
    main: 9,
    menang: 2,
    seri: 1,
    kalah: 6,
    gf: 8,
    ga: 15,
    gd: -7,
    poin: 7,
    catatanPenalti: 0
  };

  // Find key benchmark clubs dynamically
  const p8 = standings.find(c => c.posisi === 8) || standings[7] || standings.find(c => /adhyaksa/i.test(c.klub)) || { klub: 'Adhyaksa FC', poin: 8, main: 9 };
  const p10 = standings.find(c => c.posisi === 10) || standings[9] || standings.find(c => /persiku/i.test(c.klub)) || { klub: 'Persiku', poin: -1, main: 9 };
  const p2 = standings.find(c => c.posisi === 2) || standings[1] || { poin: 20, main: 9 };

  // Count remaining Putaran 2 & Putaran 3 matches dynamically from fixtures if available
  const r2PsgcMatches = [];
  const r3PsgcMatches = [];
  if (Array.isArray(fixtures)) {
    fixtures.forEach((w) => {
      if (!Array.isArray(w.pertandingan)) return;
      w.pertandingan.forEach((m) => {
        if (!/psgc/i.test(m.timHome || '') && !/psgc/i.test(m.timAway || '')) return;
        if (w.pekan >= 10 && w.pekan <= 18) r2PsgcMatches.push({ pekan: w.pekan, match: m });
        else if (w.pekan >= 19 && w.pekan <= 27) r3PsgcMatches.push({ pekan: w.pekan, match: m });
      });
    });
  }

  // Core metrics
  const currentRank = psgc.posisi || 9;
  const currentPoints = psgc.poin;
  const currentGd = psgc.gd;
  const matchesPlayed = psgc.main ?? 9;
  const totalSeasonMatches = 27;
  const matchesRemaining = Math.max(0, totalSeasonMatches - matchesPlayed);
  const round2MatchesRemaining = r2PsgcMatches.length > 0
    ? r2PsgcMatches.filter(item => !isMatchFinished(item.match)).length
    : Math.max(0, 18 - matchesPlayed);
  const round3MatchesRemaining = Math.max(0, matchesRemaining - round2MatchesRemaining);
  const maxPossiblePoints = currentPoints + (matchesRemaining * 3);

  // Deficits and Cushions
  const gapToSafeZone = p8.poin - currentPoints; // 8 - 7 = 1
  const leadOverDirectRelegation = currentPoints - p10.poin; // 7 - (-1) = 8
  const gapToPromotion = p2.poin - currentPoints; // 20 - 7 = 13

  // 1. Mathematical Magic Numbers
  // Magic Number to 100% eliminate direct relegation (P10)
  const p10Remaining = Math.max(0, totalSeasonMatches - (p10.main ?? 9));
  const p10MaxPoints = p10.poin + (p10Remaining * 3);
  const p10EliminationTarget = p10MaxPoints + 1; // 54 pts at baseline Pekan 9
  const p10PtsNeeded = Math.max(0, p10EliminationTarget - currentPoints);
  const p10WinsNeeded = Math.ceil(p10PtsNeeded / 3);

  // Benchmark Safe Zone target (Avoid Play-off, Rank 8 or higher)
  const safeZoneTargetPts = 28;
  const safeZonePtsNeeded = Math.max(0, safeZoneTargetPts - currentPoints);
  const safeZoneWinsNeeded = Math.ceil(safeZonePtsNeeded / 3);

  // Benchmark Promotion target (P2)
  const promoTargetPts = 53;
  const promoPtsNeeded = Math.max(0, promoTargetPts - currentPoints);
  const promoWinsNeeded = Math.ceil(promoPtsNeeded / 3);

  // 2. Unplayed Putaran 2 & Putaran 3 Matches for Monte Carlo
  const r2GrupAMatches = [];
  const r3GrupAAllMatches = [];
  const playedR3Weeks = new Set();
  if (Array.isArray(fixtures)) {
    fixtures.forEach((w) => {
      if (!Array.isArray(w.pertandingan)) return;
      const grupAMatches = w.pertandingan.filter(
        m => m.grup === 'Grup A' || m.grup === 'A' || (!m.grup && w.pekan >= 10)
      );
      if (w.pekan >= 10 && w.pekan <= 18) {
        grupAMatches.filter(m => !isMatchFinished(m)).forEach(m => r2GrupAMatches.push(m));
      } else if (w.pekan >= 19 && w.pekan <= 27) {
        grupAMatches.forEach((m) => {
          r3GrupAAllMatches.push({ pekan: w.pekan, match: m });
          if (isMatchFinished(m)) playedR3Weeks.add(w.pekan);
        });
      }
    });
  }
  const hasFullR3Fixtures = r3GrupAAllMatches.length >= 45;
  const remainingR3GrupAMatches = hasFullR3Fixtures
    ? r3GrupAAllMatches.filter(item => !isMatchFinished(item.match)).map(item => item.match)
    : [];
  const playedR3WeeksCount = playedR3Weeks.size;

  // 3. Monte Carlo Simulation (1,000 runs)
  let promoCount = 0;
  let survivalCount = 0;
  let playoffCount = 0;
  let directRelegCount = 0;
  const RUNS = 1000;

  if (standings.length >= 10) {
    for (let r = 0; r < RUNS; r++) {
      // Clone standings
      const teams = standings.map(t => ({
        klub: t.klub,
        poin: t.poin,
        gf: t.gf,
        ga: t.ga,
        gd: t.gd,
        catatanPenalti: t.catatanPenalti || 0,
        baselinePos: t.posisi
      }));

      const teamMap = {};
      teams.forEach((t) => {
        teamMap[t.klub] = t;
        teamMap[normalizeClubKey(t.klub)] = t;
      });

      // Simulate remaining Putaran 2 matches (Pekan 10-18)
      if (r2GrupAMatches.length > 0) {
        for (let i = 0; i < r2GrupAMatches.length; i++) {
          const m = r2GrupAMatches[i];
          const h = teamMap[m.timHome] || teamMap[normalizeClubKey(m.timHome)];
          const a = teamMap[m.timAway] || teamMap[normalizeClubKey(m.timAway)];
          if (!h || !a) continue;
          const score = generateRealisticScore(h.baselinePos, a.baselinePos);
          h.gf += score.home; h.ga += score.away; h.gd = h.gf - h.ga;
          a.gf += score.away; a.ga += score.home; a.gd = a.gf - a.ga;
          if (score.home > score.away) h.poin += 3;
          else if (score.home < score.away) a.poin += 3;
          else { h.poin += 1; a.poin += 1; }
        }
      }

      // Rank after Putaran 2
      teams.sort((a, b) => {
        const pA = a.poin + a.catatanPenalti;
        const pB = b.poin + b.catatanPenalti;
        if (pB !== pA) return pB - pA;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });

      teams.forEach((t, idx) => { t.r2Rank = idx + 1; });

      // Simulate remaining Putaran 3 matches (Pekan 19-27)
      if (hasFullR3Fixtures) {
        for (let j = 0; j < remainingR3GrupAMatches.length; j++) {
          const m = remainingR3GrupAMatches[j];
          const h = teamMap[m.timHome] || teamMap[normalizeClubKey(m.timHome)];
          const a = teamMap[m.timAway] || teamMap[normalizeClubKey(m.timAway)];
          if (!h || !a) continue;
          const score = generateRealisticScore(h.r2Rank, a.r2Rank);
          h.gf += score.home; h.ga += score.away; h.gd = h.gf - h.ga;
          a.gf += score.away; a.ga += score.home; a.gd = a.gf - a.ga;
          if (score.home > score.away) h.poin += 3;
          else if (score.home < score.away) a.poin += 3;
          else { h.poin += 1; a.poin += 1; }
        }
      } else {
        const persiraja = teams.find(t => /persiraja/i.test(t.klub));
        const persirajaRank = persiraja ? persiraja.r2Rank : 7;
        const { pairs } = getMatchPairs(true, persirajaRank);

        if (Array.isArray(pairs)) {
          const r3Fraction = Math.max(0, 9 - playedR3WeeksCount) / 9;
          const limit = Math.round(pairs.length * r3Fraction);
          for (let j = 0; j < limit; j++) {
            const p = pairs[j];
            const h = teams[p.homeRank - 1];
            const a = teams[p.awayRank - 1];
            if (!h || !a) continue;
            const score = generateRealisticScore(p.homeRank, p.awayRank);
            h.gf += score.home; h.ga += score.away; h.gd = h.gf - h.ga;
            a.gf += score.away; a.ga += score.home; a.gd = a.gf - a.ga;
            if (score.home > score.away) h.poin += 3;
            else if (score.home < score.away) a.poin += 3;
            else { h.poin += 1; a.poin += 1; }
          }
        }
      }

      // Final Rank after Pekan 27
      teams.sort((a, b) => {
        const pA = a.poin + a.catatanPenalti;
        const pB = b.poin + b.catatanPenalti;
        if (pB !== pA) return pB - pA;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });

      const psgcFinalRank = teams.findIndex(t => /psgc/i.test(t.klub)) + 1;
      if (psgcFinalRank <= 2) promoCount++;
      else if (psgcFinalRank <= 8) survivalCount++;
      else if (psgcFinalRank === 9) playoffCount++;
      else directRelegCount++;
    }
  } else {
    // Fallback baseline distribution
    promoCount = 1;
    survivalCount = 550;
    playoffCount = 410;
    directRelegCount = 39;
  }

  // Calculate percentages (rounded to 1 decimal place)
  const promoPct = +(promoCount / RUNS * 100).toFixed(1);
  const survivalPct = +(survivalCount / RUNS * 100).toFixed(1);
  const playoffPct = +(playoffCount / RUNS * 100).toFixed(1);
  // Ensure exact 100.0% sum
  const directRelegPct = +(100.0 - promoPct - survivalPct - playoffPct).toFixed(1);

  const isBaselinePekan9 = matchesPlayed === 9 && currentRank === 9 && r2PsgcMatches.every(item => !isMatchFinished(item.match));

  // Build remaining Putaran 2 fixtures dynamically (filtering out finished FT matches)
  const remainingR2Fixtures = PSGC_PUTARAN_2_SCHEDULE.reduce((acc, base) => {
    const liveEntry = r2PsgcMatches.find(item => item.pekan === base.pekan);
    const liveMatch = liveEntry ? liveEntry.match : null;
    if (liveMatch && isMatchFinished(liveMatch)) {
      return acc;
    }

    const oppTeam = findTeamInStandings(standings, base.opponent);
    const liveOppPos = (oppTeam && oppTeam.posisi) || base.opponentPos;
    const oppLogo = (oppTeam && oppTeam.logo) || CLUB_LOGOS[base.opponent] || '';
    const analysis = resolveDynamicFixtureAnalysis(base, currentRank, liveOppPos, isBaselinePekan9);

    acc.push({
      ...base,
      tanggal: (liveMatch && liveMatch.tanggal) || base.tanggal,
      waktu: (liveMatch && liveMatch.waktu) || base.waktu,
      venue: (liveMatch && liveMatch.stadion) || base.venue,
      opponentLogo: oppLogo,
      opponentPos: analysis.opponentPos,
      classification: analysis.classification,
      isSixPointer: analysis.isSixPointer,
      noteKey: analysis.noteKey,
      dynamicNote: analysis.dynamicNote,
      h2h: computePsgcHeadToHead(fixtures, base.opponent)
    });
    return acc;
  }, []);

  // If Putaran 2 is complete and Putaran 3 fixtures exist, surface unplayed Putaran 3 matches
  const remainingR3Fixtures = remainingR2Fixtures.length === 0
    ? r3PsgcMatches
        .filter(item => !isMatchFinished(item.match))
        .sort((a, b) => a.pekan - b.pekan)
        .map(({ pekan, match: m }) => {
          const isHome = /psgc/i.test(m.timHome || '');
          const opponent = isHome ? m.timAway : m.timHome;
          const oppTeam = findTeamInStandings(standings, opponent);
          const liveOppPos = (oppTeam && oppTeam.posisi) || 5;
          const oppShort = formatShortClubLabel(opponent);
          const analysis = resolveDynamicFixtureAnalysis(
            { pekan, opponent, opponentShort: oppShort, isHome, opponentPos: liveOppPos },
            currentRank,
            liveOppPos,
            false
          );
          return {
            pekan,
            tanggal: m.tanggal || '',
            waktu: m.waktu || '15:30',
            opponent,
            opponentShort: oppShort,
            opponentPos: liveOppPos,
            opponentLogo: (oppTeam && oppTeam.logo) || (isHome ? m.logoAway : m.logoHome) || CLUB_LOGOS[opponent] || '',
            isHome,
            venue: m.stadion || (isHome ? 'Stadion Galuh Ciamis' : 'Stadion Tandang'),
            classification: analysis.classification,
            isSixPointer: analysis.isSixPointer,
            noteKey: null,
            dynamicNote: analysis.dynamicNote,
            h2h: computePsgcHeadToHead(fixtures, opponent)
          };
        })
    : [];

  const activeRemainingFixtures = remainingR2Fixtures.length > 0 ? remainingR2Fixtures : remainingR3Fixtures;

  const p8Club = formatShortClubLabel(p8.klub || 'Adhyaksa FC');
  const p10Club = formatShortClubLabel(p10.klub || 'Persiku');
  const psgcLogo = (psgc && psgc.logo) || CLUB_LOGOS['PSGC Ciamis'] || '';

  const result = {
    hero: {
      currentRank,
      currentPoints,
      currentGd,
      matchesPlayed,
      matchesRemaining,
      round2MatchesRemaining,
      round3MatchesRemaining,
      maxPossiblePoints,
      gapToSafeZone,
      leadOverDirectRelegation,
      p8Club,
      p10Club,
      psgcLogo,
      record: {
        w: psgc.menang ?? 2,
        d: psgc.seri ?? 1,
        l: psgc.kalah ?? 6
      }
    },
    probabilities: {
      promotion: promoPct,
      survival: survivalPct,
      playoff: playoffPct,
      directRelegation: directRelegPct,
      runs: RUNS
    },
    magicNumbers: {
      directSafety: {
        targetPoints: p10EliminationTarget,
        ptsNeeded: p10PtsNeeded,
        winsNeeded: p10WinsNeeded,
        cushion: leadOverDirectRelegation,
        p10Club,
        statusKey: 'psgc_status_critical'
      },
      fullSafety: {
        targetPoints: safeZoneTargetPts,
        ptsNeeded: safeZonePtsNeeded,
        winsNeeded: safeZoneWinsNeeded,
        benchmark: 'Safe zone target ~28 pts',
        statusKey: 'psgc_status_active_chase'
      },
      promotion: {
        targetPoints: promoTargetPts,
        ptsNeeded: promoPtsNeeded,
        winsNeeded: promoWinsNeeded,
        benchmark: 'Promotion target ~53 pts',
        statusKey: 'psgc_status_longshot'
      }
    },
    fixtures: activeRemainingFixtures
  };

  if (!customStandings && !customFixtures) {
    cachedOddsResult = result;
    lastOddsCacheKey = cacheKey;
  }

  return result;
}

/**
 * Format match date concisely for tight mobile headers while preserving locale.
 */
function formatCompactMatchDate(dateStr, lang) {
  const formatted = formatMatchDate(dateStr, lang);
  if (!formatted) return '';

  const shortMap = lang === 'en'
    ? {
        Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
        Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
        January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
        May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
        September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec'
      }
    : {
        Senin: 'Sen', Selasa: 'Sel', Rabu: 'Rab', Kamis: 'Kam',
        Jumat: 'Jum', Sabtu: 'Sab', Minggu: 'Min',
        Januari: 'Jan', Februari: 'Feb', Maret: 'Mar', April: 'Apr',
        Mei: 'Mei', Juni: 'Jun', Juli: 'Jul', Agustus: 'Agu',
        September: 'Sep', Oktober: 'Okt', November: 'Nov', Desember: 'Des'
      };

  return formatted.replace(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\b/g,
    (m) => shortMap[m] || m
  );
}

/**
 * Build flat monochrome Head-to-Head HTML for a fixture card footer.
 */
function buildH2hContentHtml(h2h, lang) {
  if (!h2h || h2h.played === 0) {
    return {
      badgeHtml: `<span class="psgc-badge psgc-badge-h2h">${t('psgc_h2h_none', {}, lang)}</span>`,
      meetingsHtml: ''
    };
  }

  const recordText = t('psgc_h2h_record', {
    w: h2h.wins,
    d: h2h.draws,
    l: h2h.losses
  }, lang);

  const meetingsMarkup = h2h.meetings.map((m) => {
    const mwText = t('psgc_h2h_mw', { pekan: m.pekan }, lang);
    const venueText = m.isPsgcHome
      ? t('psgc_h2h_home_short', {}, lang)
      : t('psgc_h2h_away_short', {}, lang);

    return `
      <div class="psgc-h2h-meeting-item">
        <span class="psgc-badge psgc-h2h-meta">${mwText} &bull; ${venueText}</span>
        <span class="psgc-h2h-scoreline">
          <span class="psgc-h2h-team home">${m.timHome}</span>
          <strong class="psgc-h2h-score">${m.skorHome} - ${m.skorAway}</strong>
          <span class="psgc-h2h-team away">${m.timAway}</span>
        </span>
      </div>
    `;
  }).join('');

  return {
    badgeHtml: `<span class="psgc-badge psgc-badge-h2h">${recordText}</span>`,
    meetingsHtml: `<div class="psgc-h2h-meetings">${meetingsMarkup}</div>`
  };
}

/**
 * Render the 4 Sections into #standings-panel-psgc
 * Strictly follows Flat Dark Monochrome athletic design system.
 */
export function renderPsgcOddsPanel() {
  const container = document.getElementById('standings-panel-psgc');
  if (!container) return;

  const lang = getLanguage();
  const odds = calculatePsgcOdds();
  const { hero, probabilities, magicNumbers, fixtures } = odds;

  const isEn = lang === 'en';

  const maxPtsSubtext = isEn
    ? `From ${hero.matchesRemaining} remaining ${hero.matchesRemaining === 1 ? 'match' : 'matches'}`
    : `Dari ${hero.matchesRemaining} laga tersisa`;
  const safeGapPts = Math.abs(hero.gapToSafeZone);
  const safeGapValue = hero.gapToSafeZone > 0
    ? `-${safeGapPts}`
    : hero.gapToSafeZone < 0
      ? `+${safeGapPts}`
      : '0';
  const safeGapSubtext = hero.gapToSafeZone > 0
    ? (isEn && safeGapPts === 1
        ? `1 Point behind ${hero.p8Club}`
        : t('psgc_gap_behind_club', { pts: safeGapPts, club: hero.p8Club }, lang))
    : hero.gapToSafeZone === 0
      ? (isEn ? 'Level on points with Safe Zone (P8)' : 'Poin sama dengan Zona Aman (P8)')
      : (isEn ? `+${safeGapPts} ${safeGapPts === 1 ? 'Point' : 'Points'} inside Safe Zone` : `+${safeGapPts} Poin di Zona Aman`);

  const relegGapAbs = Math.abs(hero.leadOverDirectRelegation);
  const relegGapValue = hero.leadOverDirectRelegation >= 0
    ? `+${relegGapAbs}`
    : `-${relegGapAbs}`;
  const relegGapSubtext = hero.leadOverDirectRelegation >= 0
    ? t('psgc_gap_ahead_club', { pts: hero.leadOverDirectRelegation, club: hero.p10Club }, lang)
    : (isEn ? `${relegGapAbs} Pts inside direct relegation` : `${relegGapAbs} Poin di zona degradasi langsung`);

  // Section 1 HTML: Hero Status & Position Map
  const section1Html = `
    <div class="psgc-card">
      <div class="psgc-card-header">
        <h3 class="psgc-card-title">${t('psgc_hero_title', {}, lang)}</h3>
        <p class="psgc-card-subtitle">${t('psgc_hero_subtitle', {}, lang)}</p>
      </div>
      <div class="psgc-hero-grid">
        <div class="psgc-stat-box">
          <div class="psgc-stat-label">${t('psgc_stat_current_rank', {}, lang)}</div>
          <div class="psgc-stat-value">P${hero.currentRank}</div>
          <div class="psgc-stat-subtext">${t('psgc_record', { w: hero.record.w, d: hero.record.d, l: hero.record.l }, lang)}</div>
        </div>
        <div class="psgc-stat-box">
          <div class="psgc-stat-label">${t('psgc_stat_current_pts', {}, lang)}</div>
          <div class="psgc-stat-value">${hero.currentPoints}</div>
          <div class="psgc-stat-subtext">${t('psgc_stat_gd', {}, lang)}: ${hero.currentGd > 0 ? '+' : ''}${hero.currentGd}</div>
        </div>
        <div class="psgc-stat-box">
          <div class="psgc-stat-label">${t('psgc_stat_matches_left', {}, lang)}</div>
          <div class="psgc-stat-value">${hero.matchesRemaining}</div>
          <div class="psgc-stat-subtext">${t('psgc_matches_breakdown', { r2: hero.round2MatchesRemaining, r3: hero.round3MatchesRemaining }, lang)}</div>
        </div>
        <div class="psgc-stat-box">
          <div class="psgc-stat-label">${t('psgc_stat_max_pts', {}, lang)}</div>
          <div class="psgc-stat-value">${hero.maxPossiblePoints}</div>
          <div class="psgc-stat-subtext">${maxPtsSubtext}</div>
        </div>
        <div class="psgc-stat-box">
          <div class="psgc-stat-label">${t('psgc_stat_gap_safe', {}, lang)}</div>
          <div class="psgc-stat-value">${safeGapValue} ${isEn ? 'Pts' : 'Poin'}</div>
          <div class="psgc-stat-subtext">${safeGapSubtext}</div>
        </div>
        <div class="psgc-stat-box">
          <div class="psgc-stat-label">${t('psgc_stat_gap_releg', {}, lang)}</div>
          <div class="psgc-stat-value">${relegGapValue} ${isEn ? 'Pts' : 'Poin'}</div>
          <div class="psgc-stat-subtext">${relegGapSubtext}</div>
        </div>
      </div>
    </div>
  `;

  // Section 2 HTML: Probability Matrix Cards
  const section2Html = `
    <div class="psgc-card">
      <div class="psgc-card-header">
        <h3 class="psgc-card-title">${t('psgc_matrix_title', {}, lang)}</h3>
        <p class="psgc-card-subtitle">${t('psgc_matrix_subtitle', {}, lang)}</p>
      </div>
      <div class="psgc-matrix-grid">
        <div class="psgc-prob-card">
          <div class="psgc-prob-header">
            <span class="psgc-prob-label">${t('psgc_prob_promotion', {}, lang)}</span>
          </div>
          <div class="psgc-prob-val">${probabilities.promotion}%</div>
          <div class="psgc-prob-desc">${t('psgc_prob_promotion_desc', {}, lang)}</div>
        </div>
        <div class="psgc-prob-card">
          <div class="psgc-prob-header">
            <span class="psgc-prob-label">${t('psgc_prob_survival', {}, lang)}</span>
          </div>
          <div class="psgc-prob-val">${probabilities.survival}%</div>
          <div class="psgc-prob-desc">${t('psgc_prob_survival_desc', {}, lang)}</div>
        </div>
        <div class="psgc-prob-card">
          <div class="psgc-prob-header">
            <span class="psgc-prob-label">${t('psgc_prob_playoff', {}, lang)}</span>
          </div>
          <div class="psgc-prob-val">${probabilities.playoff}%</div>
          <div class="psgc-prob-desc">${t('psgc_prob_playoff_desc', {}, lang)}</div>
        </div>
        <div class="psgc-prob-card">
          <div class="psgc-prob-header">
            <span class="psgc-prob-label">${t('psgc_prob_relegation', {}, lang)}</span>
          </div>
          <div class="psgc-prob-val">${probabilities.directRelegation}%</div>
          <div class="psgc-prob-desc">${t('psgc_prob_relegation_desc', {}, lang)}</div>
        </div>
      </div>
    </div>
  `;

  // Section 3 HTML: Win Requirements Roadmap
  const section3Html = `
    <div class="psgc-card">
      <div class="psgc-card-header">
        <h3 class="psgc-card-title">${t('psgc_roadmap_title', {}, lang)}</h3>
        <p class="psgc-card-subtitle">${t('psgc_roadmap_subtitle', {}, lang)}</p>
      </div>
      <div class="psgc-roadmap-list">
        <!-- Target 1: Direct Safety -->
        <div class="psgc-roadmap-item">
          <div class="psgc-roadmap-info">
            <div class="psgc-roadmap-target">${t('psgc_target_direct_safety', {}, lang)}</div>
            <div class="psgc-roadmap-req">${t('psgc_pts_needed', { pts: magicNumbers.directSafety.ptsNeeded, wins: magicNumbers.directSafety.winsNeeded }, lang)}</div>
            <div class="psgc-roadmap-sub">${isEn ? `Current cushion: ${magicNumbers.directSafety.cushion >= 0 ? '+' : ''}${magicNumbers.directSafety.cushion} pts vs ${magicNumbers.directSafety.p10Club} (Target: ${magicNumbers.directSafety.targetPoints} pts)` : `Bantalan aman saat ini: ${magicNumbers.directSafety.cushion >= 0 ? '+' : ''}${magicNumbers.directSafety.cushion} poin atas ${magicNumbers.directSafety.p10Club} (Target pasti: ${magicNumbers.directSafety.targetPoints} poin)`}</div>
          </div>
          <div class="psgc-roadmap-status">
            <span class="psgc-badge">${t(magicNumbers.directSafety.statusKey, {}, lang)}</span>
          </div>
        </div>

        <!-- Target 2: Safe Zone Lock -->
        <div class="psgc-roadmap-item">
          <div class="psgc-roadmap-info">
            <div class="psgc-roadmap-target">${t('psgc_target_full_safety', {}, lang)}</div>
            <div class="psgc-roadmap-req">${t('psgc_pts_needed', { pts: magicNumbers.fullSafety.ptsNeeded, wins: magicNumbers.fullSafety.winsNeeded }, lang)}</div>
            <div class="psgc-roadmap-sub">${isEn ? `Benchmark target: ${magicNumbers.fullSafety.targetPoints} pts (Projected P8 ~24-28 pts)` : `Target patokan: ${magicNumbers.fullSafety.targetPoints} poin (Proyeksi P8 ~24-28 poin)`}</div>
          </div>
          <div class="psgc-roadmap-status">
            <span class="psgc-badge">${t(magicNumbers.fullSafety.statusKey, {}, lang)}</span>
          </div>
        </div>

        <!-- Target 3: Promotion Challenge -->
        <div class="psgc-roadmap-item">
          <div class="psgc-roadmap-info">
            <div class="psgc-roadmap-target">${t('psgc_target_promotion', {}, lang)}</div>
            <div class="psgc-roadmap-req">${t('psgc_pts_needed', { pts: magicNumbers.promotion.ptsNeeded, wins: magicNumbers.promotion.winsNeeded }, lang)}</div>
            <div class="psgc-roadmap-sub">${isEn ? `Benchmark target: ${magicNumbers.promotion.targetPoints} pts (Max achievable: ${hero.maxPossiblePoints} pts)` : `Target patokan: ${magicNumbers.promotion.targetPoints} poin (Maksimal poin: ${hero.maxPossiblePoints} poin)`}</div>
          </div>
          <div class="psgc-roadmap-status">
            <span class="psgc-badge">${t(magicNumbers.promotion.statusKey, {}, lang)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Section 4 HTML: Remaining Fixtures Putaran 2 (Jadwal Liga Match Card Stream with Tactical Analysis)
  const fixtureCardsHtml = fixtures.map(f => {
    let classBadge = '';
    if (f.classification === 'calculated_win') {
      classBadge = `<span class="psgc-badge psgc-badge-win">${t('psgc_class_calculated_win', {}, lang)}</span>`;
    } else if (f.classification === 'tight') {
      classBadge = `<span class="psgc-badge psgc-badge-tight">${t('psgc_class_tight', {}, lang)}</span>`;
    } else {
      classBadge = `<span class="psgc-badge psgc-badge-tough">${t('psgc_class_tough', {}, lang)}</span>`;
    }

    const sixPointerBadge = f.isSixPointer
      ? `<span class="psgc-badge psgc-badge-sixpointer">${t('psgc_badge_six_pointer', {}, lang)}</span>`
      : '';

    const isHome = f.isHome;
    const homeName = isHome ? 'PSGC Ciamis' : f.opponent;
    const awayName = isHome ? f.opponent : 'PSGC Ciamis';
    const psgcLogo = hero.psgcLogo || CLUB_LOGOS['PSGC Ciamis'] || '';
    const oppLogo = f.opponentLogo || CLUB_LOGOS[f.opponent] || '';
    const homeLogo = isHome ? psgcLogo : oppLogo;
    const awayLogo = isHome ? oppLogo : psgcLogo;

    const homeRank = isHome ? hero.currentRank : f.opponentPos;
    const awayRank = isHome ? f.opponentPos : hero.currentRank;

    const formattedDate = formatMatchDate(f.tanggal, lang);
    const shortDate = formatCompactMatchDate(f.tanggal, lang);
    const timeStr = f.waktu ? `${f.waktu} WIB` : '15:30 WIB';
    const mwLabel = isEn ? `Matchweek ${f.pekan}` : `Pekan ${f.pekan}`;

    const venueTypeLabel = isHome ? t('psgc_h2h_home_short', {}, lang) : t('psgc_h2h_away_short', {}, lang);
    const noteText = f.dynamicNote
      ? (isEn ? f.dynamicNote.en : f.dynamicNote.id)
      : t(f.noteKey, {}, lang);
    const stadiumName = `${f.venue.toUpperCase()} &bull; ${venueTypeLabel.toUpperCase()}`;
    const h2hData = buildH2hContentHtml(f.h2h, lang);

    return `
      <div class="match-card-row psgc-fixture-card" data-pekan="${f.pekan}">
        <div class="match-ko-time">
          <span class="psgc-mw-pill">${mwLabel}</span>
          <span class="psgc-ko-date">
            <span class="psgc-date-full">${formattedDate}</span>
            <span class="psgc-date-short">${shortDate}</span>
            <span class="psgc-ko-dot">&bull;</span>
            <span class="psgc-ko-clock">${timeStr}</span>
          </span>
        </div>

        <div class="match-teams-score-line">
          <!-- Home Team -->
          <div class="team-side home">
            <div class="psgc-team-info">
              <span class="match-team-name">${homeName}</span>
              <span class="psgc-opp-rank">P${homeRank}</span>
            </div>
            <img src="${homeLogo}" alt="${homeName}" class="match-team-logo" loading="lazy" onerror="this.style.opacity='0.2'">
          </div>

          <!-- Score Center: VS -->
          <div class="match-score-center">
            <span class="match-vs-label">VS</span>
          </div>

          <!-- Away Team -->
          <div class="team-side away">
            <img src="${awayLogo}" alt="${awayName}" class="match-team-logo" loading="lazy" onerror="this.style.opacity='0.2'">
            <div class="psgc-team-info">
              <span class="match-team-name">${awayName}</span>
              <span class="psgc-opp-rank">P${awayRank}</span>
            </div>
          </div>
        </div>

        <div class="match-stadium-name">${stadiumName}</div>

        <!-- Tactical Analytics Footer: Klasifikasi Laga, Head to Head & Catatan Strategis -->
        <div class="psgc-match-tactical-footer">
          <div class="psgc-tactical-row psgc-class-row">
            <span class="psgc-tactical-heading">${t('psgc_th_class', {}, lang)}</span>
            <div class="psgc-badges-wrap">
              ${classBadge}
              ${sixPointerBadge}
            </div>
          </div>
          <div class="psgc-tactical-row psgc-h2h-row">
            <div class="psgc-h2h-header">
              <span class="psgc-tactical-heading">${t('psgc_th_h2h', {}, lang)}</span>
              ${h2hData.badgeHtml}
            </div>
            ${h2hData.meetingsHtml}
          </div>
          <div class="psgc-tactical-row psgc-notes-row">
            <span class="psgc-tactical-heading">${t('psgc_th_notes', {}, lang)}</span>
            <span class="psgc-tactical-notes-text">${noteText}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const section4BodyHtml = fixtureCardsHtml || `
    <div class="psgc-empty-fixtures">
      <div class="psgc-empty-title">${t('psgc_fixtures_completed', {}, lang)}</div>
      <div class="psgc-empty-desc">${t('psgc_fixtures_completed_desc', {}, lang)}</div>
    </div>
  `;

  const section4Html = `
    <div class="psgc-card">
      <div class="psgc-card-header">
        <h3 class="psgc-card-title">${t('psgc_fixtures_title', {}, lang)}</h3>
        <p class="psgc-card-subtitle">${t('psgc_fixtures_subtitle', {}, lang)}</p>
      </div>
      <div class="psgc-fixtures-stream">
        ${section4BodyHtml}
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="psgc-panel-container">
      ${section1Html}
      ${section2Html}
      ${section3Html}
      ${section4Html}
    </div>
  `;
}

// Make accessible to other modules and global scripts
if (typeof window !== 'undefined') {
  window.renderPsgcOddsPanel = renderPsgcOddsPanel;
  window.calculatePsgcOdds = calculatePsgcOdds;
}
