// ==========================================================================
// SIMULATION MODULE - Singacala Hub 2026/27 Tournament Simulator
// ==========================================================================
// Features:
// - 100% Client-side in-memory & localStorage persistence.
// - Real data files remain 100% clean and untouched.
// - Live standings calculation with Head-to-Head and official tie-breakers.
// - Dynamic Round 3 generation (Pasal 7 Ayat 3 Bagian III & IV):
//   * Ranks 1-5 get 5H/4A, Ranks 6-10 get 4H/5A.
//   * Grup A Ramadhan clause: PERSIRAJA Banda Aceh Away in weeks 19, 20, 21.
// - Quick helpers: Simulasikan Pekan Ini, Simulasikan s/d Pekan 18, Simulasikan Semua, Reset.
// - Season Outcome Card / Payoff summary.
// ==========================================================================

import { state } from './state.js';
import { showToast, matchClubs } from './utils.js';
import { generateRound3Fixtures, getMatchRegulatoryReason } from './round3-regulasi.js';
import { getLanguage, t, formatMatchDate, translateReason, translateScenarioTitle } from './i18n.js';

const STORAGE_KEY = 'pc_simulation_state_v2';

// In-memory simulation state
export const simState = {
  activeGroup: 'Grup A', // 'Grup A' or 'Grup B'
  selectedWeek: 10,
  simMatches: {
    'Grup A': [],
    'Grup B': []
  },
  round3Meta: {
    'Grup A': null,
    'Grup B': null
  },
  baselineStandings: {
    'Grup A': [],
    'Grup B': []
  },
  highlightClub: null,
  activeMobileTab: 'standings' // 'standings' or 'fixtures' on mobile
};

/**
 * Realistic goal generator using weighted distribution
 */
export function generateRealisticScore(homeRank = 5, awayRank = 5) {
  // Home advantage factor + strength difference
  const rankDiff = awayRank - homeRank; // positive if home team has higher rank (1 is best)
  const homeStrength = 1.4 + 0.35 + rankDiff * 0.08;
  const awayStrength = 1.1 - rankDiff * 0.08;

  const lambdaHome = Math.max(0.5, Math.min(3.2, homeStrength));
  const lambdaAway = Math.max(0.3, Math.min(2.8, awayStrength));

  function samplePoisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L && k < 10);
    return Math.max(0, k - 1);
  }

  return {
    home: samplePoisson(lambdaHome),
    away: samplePoisson(lambdaAway)
  };
}

/**
 * Initialize simulation state from localStorage or pristine real data
 */
export function initSimulationState() {
  // 1. Capture baseline real standings
  if (state.standingsGroups && state.standingsGroups.length > 0) {
    state.standingsGroups.forEach((g) => {
      const gName = g.grup || 'Grup A';
      simState.baselineStandings[gName] = (g.klasemen || []).map((t) => ({ ...t }));
    });
  }

  // 2. Try loading from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        parsed.simMatches &&
        Array.isArray(parsed.simMatches['Grup A']) &&
        Array.isArray(parsed.simMatches['Grup B'])
      ) {
        simState.activeGroup = parsed.activeGroup === 'Grup B' ? 'Grup B' : 'Grup A';
        simState.simMatches = parsed.simMatches;
        simState.round3Meta = {
          'Grup A': parsed.round3Meta?.['Grup A'] || null,
          'Grup B': parsed.round3Meta?.['Grup B'] || null
        };
        simState.selectedWeek = Number(parsed.selectedWeek) || detectFirstUnplayedWeek(simState.activeGroup);
        return;
      }
    }
  } catch (err) {
    console.warn('[Simulator] Gagal memuat data tersimpan:', err);
  }

  // 3. Fallback: Initialize from fresh real fixturesData
  resetSimulationState(false);
}

/**
 * Save simulation state to localStorage
 */
export function saveSimulationState() {
  try {
    const payload = {
      activeGroup: simState.activeGroup,
      selectedWeek: simState.selectedWeek,
      simMatches: simState.simMatches,
      round3Meta: simState.round3Meta
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[Simulator] Gagal menyimpan ke localStorage:', err);
  }
}

/**
 * Automatically detect first unplayed week in the real schedule
 */
export function detectFirstUnplayedWeek(groupName = 'Grup A') {
  const weeks = simState.simMatches[groupName] || [];
  const unplayedWeek = weeks.find((w) =>
    w.pertandingan && w.pertandingan.some((m) => m.status !== 'FT' || m.skorHome === null || m.skorAway === null)
  );
  return unplayedWeek ? unplayedWeek.pekan : 10;
}

/**
 * Reset simulation state to original real data
 */
export function resetSimulationState(notify = true) {
  if (!state.fixturesData || state.fixturesData.length === 0) return;

  const baseMatchesA = [];
  const baseMatchesB = [];

  // Deep clone fixturesData
  state.fixturesData.forEach((week) => {
    const matchesA = (week.pertandingan || [])
      .filter((m) => m.grup && m.grup.toLowerCase() === 'grup a')
      .map((m) => ({ ...m }));
    const matchesB = (week.pertandingan || [])
      .filter((m) => m.grup && m.grup.toLowerCase() === 'grup b')
      .map((m) => ({ ...m }));

    baseMatchesA.push({
      pekan: week.pekan,
      pertandingan: matchesA
    });
    baseMatchesB.push({
      pekan: week.pekan,
      pertandingan: matchesB
    });
  });

  simState.simMatches = {
    'Grup A': baseMatchesA,
    'Grup B': baseMatchesB
  };
  simState.round3Meta = {
    'Grup A': null,
    'Grup B': null
  };
  simState.selectedWeek = detectFirstUnplayedWeek('Grup A');

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) { }

  if (notify) {
    const isEn = getLanguage() === 'en';
    showToast(
      isEn ? 'Reset Successful' : 'Reset Berhasil',
      isEn ? 'Simulation data has been reverted to initial state.' : 'Data simulasi telah dikembalikan ke kondisi awal.',
      '🔄',
      3500
    );
    renderSimulationView();
  }
}

const KNOWN_STADIUMS = {
  'PSPS': 'Kaharuddin Nasution',
  'PSMS': 'Stadion Utama Sumatera Utara',
  'PERSIKAD': 'Pakansari',
  'PSIS': 'Jatidiri',
  'SEMEN PADANG': 'Patriot Chandra Bhaga',
  'SUMSEL UNITED': 'Gelora Sriwijaya Jakabaring',
  'PERSIRAJA': 'H. Dimurthala',
  'ADHYAKSA': 'Patriot Chandra Bhaga',
  'PSGC': 'Stadion Galuh Ciamis',
  'PERSIKU': 'Sultan Agung',
  'KENDAL TORNADO': 'Sriwedari',
  'BARITO PUTERA': '17 Mei Banjarmasin',
  'RANS': 'Kanjuruhan',
  'PERSELA': 'Surajaya',
  'DELTRAS': 'Gelora Delta',
  'PERSIPURA': 'Lukas Enembe',
  'DE RED': 'Gelora 10 November',
  'PERSIS': 'Manahan',
  'PERSIBA': 'Batakan',
  'PSBS': 'Sriwedari'
};

function resolveKnownStadium(clubName) {
  if (!clubName) return 'Stadion Tuan Rumah';
  const upper = clubName.toUpperCase();
  for (const [k, std] of Object.entries(KNOWN_STADIUMS)) {
    if (upper.includes(k)) return std;
  }
  return 'Stadion Utama';
}

/**
 * Extract club metadata (logo, home stadium) from real data
 */
export function getClubMetadataMap() {
  const meta = {};
  if (state.standingsGroups) {
    state.standingsGroups.forEach((g) => {
      (g.klasemen || []).forEach((t) => {
        meta[t.klub] = {
          logo: t.logo,
          stadion: resolveKnownStadium(t.klub)
        };
      });
    });
  }

  if (state.fixturesData) {
    state.fixturesData.forEach((w) => {
      (w.pertandingan || []).forEach((m) => {
        if (m.timHome) {
          const matched = Object.keys(meta).find((c) => matchClubs(c, m.timHome));
          const targetKey = matched || m.timHome;
          if (!meta[targetKey]) {
            meta[targetKey] = { logo: m.logoHome || '', stadion: m.stadion || resolveKnownStadium(m.timHome) };
          } else if (m.stadion && (meta[targetKey].stadion === 'Stadion Utama' || meta[targetKey].stadion === 'Stadion Tuan Rumah')) {
            meta[targetKey].stadion = m.stadion;
          }
          if (m.logoHome && !meta[targetKey].logo) {
            meta[targetKey].logo = m.logoHome;
          }
          if (targetKey !== m.timHome) {
            meta[m.timHome] = meta[targetKey];
          }
        }

        if (m.timAway) {
          const matched = Object.keys(meta).find((c) => matchClubs(c, m.timAway));
          const targetKey = matched || m.timAway;
          if (!meta[targetKey]) {
            meta[targetKey] = { logo: m.logoAway || '', stadion: resolveKnownStadium(m.timAway) };
          }
          if (m.logoAway && !meta[targetKey].logo) {
            meta[targetKey].logo = m.logoAway;
          }
          if (targetKey !== m.timAway) {
            meta[m.timAway] = meta[targetKey];
          }
        }
      });
    });
  }

  return meta;
}

/**
 * Official PSSI Multi-Way Tie-Breaker Engine (Pasal 7 Ayat 5)
 * 1. Points
 * 2. Head-to-Head mini-table among tied teams:
 *    a) H2H Points
 *    b) H2H Goal Difference
 *    c) H2H Goals For
 *    (Applies when all teams in cohort have played equal meetings > 0)
 *    (Recursive tie-breaker if subset remains tied)
 *    (If still tied or cyclic, H2H is nullified and proceeds to next criteria)
 * 3. Overall Goal Difference (GD)
 * 4. Overall Goals For (GF)
 * 5. Penalty / Fair Play points
 * 6. Baseline position
 */
export function resolveOfficialStandingsTies(teams, playedMatches) {
  const pointsGroups = new Map();
  for (const t of teams) {
    const p = t.poin;
    if (!pointsGroups.has(p)) pointsGroups.set(p, []);
    pointsGroups.get(p).push(t);
  }

  const sortedPoints = Array.from(pointsGroups.keys()).sort((a, b) => b - a);

  const finalStandings = [];
  for (const p of sortedPoints) {
    const cohort = pointsGroups.get(p);
    if (cohort.length === 1) {
      finalStandings.push(cohort[0]);
    } else {
      const resolved = resolveTieCohort(cohort, playedMatches, true);
      finalStandings.push(...resolved);
    }
  }

  return finalStandings;
}

function resolveTieCohort(cohort, playedMatches, applyH2H = true) {
  if (cohort.length <= 1) return cohort;

  if (applyH2H) {
    const names = new Set(cohort.map((t) => t.klub));

    // Verify meetings count between each pair
    const pairCounts = [];
    for (let i = 0; i < cohort.length; i++) {
      for (let j = i + 1; j < cohort.length; j++) {
        const u = cohort[i].klub;
        const v = cohort[j].klub;
        const count = playedMatches.filter(
          (m) => (m.timHome === u && m.timAway === v) || (m.timHome === v && m.timAway === u)
        ).length;
        pairCounts.push(count);
      }
    }

    const firstCount = pairCounts[0] || 0;
    const allSameAndNonZero = firstCount > 0 && pairCounts.every((c) => c === firstCount);

    if (allSameAndNonZero) {
      // Build mini-table
      const h2hStats = new Map();
      cohort.forEach((t) => {
        h2hStats.set(t.klub, { pts: 0, gf: 0, ga: 0, gd: 0 });
      });

      playedMatches.forEach((m) => {
        if (names.has(m.timHome) && names.has(m.timAway)) {
          const hStat = h2hStats.get(m.timHome);
          const aStat = h2hStats.get(m.timAway);
          hStat.gf += m.skorHome;
          hStat.ga += m.skorAway;
          aStat.gf += m.skorAway;
          aStat.ga += m.skorHome;
          if (m.skorHome > m.skorAway) hStat.pts += 3;
          else if (m.skorHome < m.skorAway) aStat.pts += 3;
          else { hStat.pts += 1; aStat.pts += 1; }
        }
      });

      cohort.forEach((t) => {
        const s = h2hStats.get(t.klub);
        s.gd = s.gf - s.ga;
      });

      // Sort cohort by H2H stats
      const sortedByH2H = [...cohort].sort((a, b) => {
        const sa = h2hStats.get(a.klub);
        const sb = h2hStats.get(b.klub);
        if (sb.pts !== sa.pts) return sb.pts - sa.pts;
        if (sb.gd !== sa.gd) return sb.gd - sa.gd;
        return sb.gf - sa.gf;
      });

      // Group into clusters of identical H2H stats
      const clusters = [];
      let curCluster = [sortedByH2H[0]];
      for (let i = 1; i < sortedByH2H.length; i++) {
        const prevS = h2hStats.get(sortedByH2H[i - 1].klub);
        const curS = h2hStats.get(sortedByH2H[i].klub);
        if (curS.pts === prevS.pts && curS.gd === prevS.gd && curS.gf === prevS.gf) {
          curCluster.push(sortedByH2H[i]);
        } else {
          clusters.push(curCluster);
          curCluster = [sortedByH2H[i]];
        }
      }
      clusters.push(curCluster);

      // If progress was made (differentiated at least one team)
      if (clusters.length > 1) {
        const result = [];
        for (const cl of clusters) {
          result.push(...resolveTieCohort(cl, playedMatches, true));
        }
        return result;
      }
      // If clusters.length === 1, all teams in cohort are 100% tied on H2H!
      // Under Pasal 7 Ayat 5, H2H is nullified and we fall through to overall GD/GF.
    }
  }

  // Fallback / Next criteria: Overall GD, Overall GF, Penalty, Baseline
  return [...cohort].sort((a, b) => {
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (b.catatanPenalti !== a.catatanPenalti) return b.catatanPenalti - a.catatanPenalti;
    return (a.baselinePos || 99) - (b.baselinePos || 99);
  });
}

/**
 * Calculate simulated standings for a group up to a specific week
 */
export function calculateSimStandings(groupName, upToWeek = 27) {
  const weeks = simState.simMatches[groupName] || [];
  const baseList = simState.baselineStandings[groupName] || [];

  // Initialize team stats map
  const statsMap = {};
  const playedMatchesList = [];

  baseList.forEach((team, idx) => {
    statsMap[team.klub] = {
      posisi: idx + 1,
      baselinePos: team.posisi || idx + 1,
      klub: team.klub,
      logo: team.logo,
      catatanPenalti: Number(team.catatanPenalti) || 0,
      main: 0,
      menang: 0,
      seri: 0,
      kalah: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      poin: Number(team.catatanPenalti) || 0,
      form: []
    };
  });

  // If baseList is empty, seed from group clubs
  if (Object.keys(statsMap).length === 0) {
    weeks.forEach((w) => {
      (w.pertandingan || []).forEach((m) => {
        if (!statsMap[m.timHome]) {
          statsMap[m.timHome] = {
            posisi: 1,
            baselinePos: 99,
            klub: m.timHome,
            logo: m.logoHome,
            catatanPenalti: 0,
            main: 0,
            menang: 0,
            seri: 0,
            kalah: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            poin: 0,
            form: []
          };
        }
        if (!statsMap[m.timAway]) {
          statsMap[m.timAway] = {
            posisi: 1,
            baselinePos: 99,
            klub: m.timAway,
            logo: m.logoAway,
            catatanPenalti: 0,
            main: 0,
            menang: 0,
            seri: 0,
            kalah: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            poin: 0,
            form: []
          };
        }
      });
    });
  }

  const clubList = Object.keys(statsMap);

  // Helper resolve team name in statsMap
  function findClubKey(rawName) {
    if (statsMap[rawName]) return rawName;
    const found = clubList.find((c) => matchClubs(c, rawName));
    return found || rawName;
  }

  let totalPlayedMatches = 0;
  let totalScheduledMatches = 0;

  // Process all matches up to upToWeek
  const sortedWeeks = [...weeks].filter((w) => w.pekan <= upToWeek).sort((a, b) => a.pekan - b.pekan);

  sortedWeeks.forEach((w) => {
    (w.pertandingan || []).forEach((m) => {
      totalScheduledMatches++;
      const isFT = m.status === 'FT' && m.skorHome !== null && m.skorAway !== null && m.skorHome !== '' && m.skorAway !== '';
      if (!isFT) return;

      const homeKey = findClubKey(m.timHome);
      const awayKey = findClubKey(m.timAway);

      if (!statsMap[homeKey] || !statsMap[awayKey]) return;

      totalPlayedMatches++;
      const sH = Number(m.skorHome);
      const sA = Number(m.skorAway);

      statsMap[homeKey].main++;
      statsMap[awayKey].main++;
      statsMap[homeKey].gf += sH;
      statsMap[homeKey].ga += sA;
      statsMap[homeKey].gd = statsMap[homeKey].gf - statsMap[homeKey].ga;

      statsMap[awayKey].gf += sA;
      statsMap[awayKey].ga += sH;
      statsMap[awayKey].gd = statsMap[awayKey].gf - statsMap[awayKey].ga;

      if (sH > sA) {
        statsMap[homeKey].menang++;
        statsMap[homeKey].poin += 3;
        statsMap[awayKey].kalah++;
        statsMap[homeKey].form.push('W');
        statsMap[awayKey].form.push('L');
      } else if (sH < sA) {
        statsMap[awayKey].menang++;
        statsMap[awayKey].poin += 3;
        statsMap[homeKey].kalah++;
        statsMap[homeKey].form.push('L');
        statsMap[awayKey].form.push('W');
      } else {
        statsMap[homeKey].seri++;
        statsMap[awayKey].seri++;
        statsMap[homeKey].poin += 1;
        statsMap[awayKey].poin += 1;
        statsMap[homeKey].form.push('D');
        statsMap[awayKey].form.push('D');
      }

      playedMatchesList.push({
        pekan: w.pekan,
        timHome: homeKey,
        timAway: awayKey,
        skorHome: sH,
        skorAway: sA
      });
    });
  });

  // Sort standings with official PSSI multi-way tie-breaker (Pasal 7 Ayat 5)
  const sorted = resolveOfficialStandingsTies(Object.values(statsMap), playedMatchesList);

  // Assign updated positions
  sorted.forEach((team, idx) => {
    team.posisi = idx + 1;
  });

  return {
    standings: sorted,
    totalPlayedMatches,
    totalScheduledMatches,
    isSeasonComplete: sorted.every((t) => t.main === 27)
  };
}

// ==========================================================================
// ROUND 3 REGULATORY FIXTURES MODAL CONTROLLER
// ==========================================================================

let activeModalState = {
  groupName: 'Grup A',
  weeks: [],
  scenarioInfo: null,
  selectedPekan: 19
};

let modalEventsBound = false;

/**
 * Open the Round 3 Regulatory Fixtures Modal with legal reasons
 */
export function openRound3RegulatoryModal(groupName, weeks, scenarioInfo, initialPekan = 19) {
  const modalEl = document.getElementById('r3-regulatory-modal-backdrop');
  if (!modalEl) return;

  const lang = getLanguage();
  const isEn = lang === 'en';

  const targetGroup = groupName || simState.activeGroup;
  activeModalState = {
    groupName: targetGroup,
    weeks: (weeks && weeks.length > 0) ? weeks : ((simState.simMatches[targetGroup] || []).filter((w) => w.pekan >= 19)),
    scenarioInfo: scenarioInfo || simState.round3Meta[targetGroup]?.scenarioInfo || {},
    selectedPekan: initialPekan || 19
  };

  // 1. Group & Scenario Header Information
  const groupBadge = modalEl.querySelector('#r3-modal-group-badge');
  if (groupBadge) {
    groupBadge.textContent = isEn
      ? `ROUND 3 • ${activeModalState.groupName.toUpperCase()}`
      : `PUTARAN 3 • ${activeModalState.groupName.toUpperCase()}`;
  }

  const titleEl = modalEl.querySelector('#r3-modal-title');
  if (titleEl) {
    if (activeModalState.scenarioInfo?.title) {
      titleEl.textContent = isEn
        ? `Round 3 Fixture Results: ${translateScenarioTitle(activeModalState.scenarioInfo.title, 'en')}`
        : `Hasil Jadwal Putaran 3: ${activeModalState.scenarioInfo.title}`;
    } else {
      titleEl.textContent = isEn
        ? `Round 3 Regulatory Fixtures & Reasoning (${activeModalState.groupName})`
        : `Hasil Undian & Regulasi Putaran 3 (${activeModalState.groupName})`;
    }
  }

  const subtitleEl = modalEl.querySelector('#r3-modal-subtitle');
  if (subtitleEl) {
    let desc = activeModalState.scenarioInfo?.description;
    if (desc && isEn) {
      desc = desc
        .replace(/PERSIRAJA Banda Aceh memuncaki klasemen Putaran 2\. Bertandang di Pekan 19, 20, dan 21\./, 'PERSIRAJA Banda Aceh topped Round 2 standings. Away in Matchweeks 19, 20, and 21.')
        .replace(/PERSIRAJA Banda Aceh finis peringkat (\d+) di Putaran 2\. Bertandang di Pekan 19, 20, dan 21\./, 'PERSIRAJA Banda Aceh finished rank $1 in Round 2. Away in Matchweeks 19, 20, and 21.');
    }
    subtitleEl.textContent = desc
      ? desc
      : (isEn ? 'Fixture schedule and home/away allocation based on PSSI Regulations Article 7 Paragraphs 3 & 4.' : 'Penetapan jadwal pertandingan dan alokasi kandang/tandang berdasarkan Regulasi PSSI Pasal 7 Ayat 3 & 4.');
  }

  // 2. Summary briefing bar
  const summaryEl = modalEl.querySelector('#r3-modal-summary');
  if (summaryEl) {
    const isGroupA = activeModalState.groupName.toLowerCase().includes('grup a') || activeModalState.groupName.toLowerCase().includes('grup 1') || activeModalState.scenarioInfo?.isGroupA;
    const persirajaRank = activeModalState.scenarioInfo?.persirajaRank;
    const letter = activeModalState.scenarioInfo?.letter || 'a';

    let summaryHtml = `
      <div class="r3-summary-item">
        <span><strong>${isEn ? 'Top 5:' : 'Top 5:'}</strong> ${isEn ? '5 Home / 4 Away' : '5 Kandang / 4 Tandang'}</span>
      </div>
      <div class="r3-summary-item">
        <span><strong>${isEn ? 'Positions 6–10:' : 'Pos 6–10:'}</strong> ${isEn ? '4 Home / 5 Away' : '4 Kandang / 5 Tandang'}</span>
      </div>
    `;

    if (isGroupA) {
      summaryHtml += `
        <div class="r3-summary-item ramadhan">
          <span><strong>${isEn ? 'Ramadhan Clause (Article 7 Paragraph 4):' : 'Klausul Ramadhan (Pasal 7 Ayat 4):'}</strong> PERSIRAJA (${isEn ? 'Rank' : 'Peringkat'} #${persirajaRank || '7'}) ${isEn ? 'away in Matchweeks 19, 20, 21' : 'tandang di Pekan 19, 20, 21'} &bull; ${isEn ? 'Scenario' : 'Skenario'} (${letter})</span>
        </div>
      `;
    } else {
      summaryHtml += `
        <div class="r3-summary-item">
          <span><strong>${isEn ? 'Standard Matrix:' : 'Matriks Standar:'}</strong> ${isEn ? 'Preliminary Round 3 (Article 7 Paragraph 3 Section III)' : 'Babak Pendahuluan Putaran 3 (Pasal 7 Ayat 3 Bagian III)'}</span>
        </div>
      `;
    }

    summaryEl.innerHTML = summaryHtml;
  }

  // Update modal footer buttons and info
  const footerMatches = modalEl.querySelector('.r3-footer-pill');
  if (footerMatches) footerMatches.textContent = isEn ? 'Total 45 Matches' : 'Total 45 Pertandingan';
  const footerNote = modalEl.querySelector('.r3-footer-note');
  if (footerNote) footerNote.textContent = isEn ? 'Top 5: 5 Home / 4 Away • Positions 6–10: 4 Home / 5 Away' : 'Top 5: 5 Kandang / 4 Tandang • Posisi 6–10: 4 Kandang / 5 Tandang';
  const dismissBtnSpan = modalEl.querySelector('#btn-r3-modal-dismiss span');
  if (dismissBtnSpan) dismissBtnSpan.textContent = isEn ? 'Close' : 'Tutup';
  const proceedBtnSpan = modalEl.querySelector('#btn-r3-modal-proceed span');
  if (proceedBtnSpan) proceedBtnSpan.textContent = isEn ? 'Proceed to Simulation' : 'Lanjutkan ke Simulasi';

  // 3. Render Week Navigation Tabs (Pekan 19 - 27)
  renderRound3ModalWeekNav();

  // 4. Render Matches for the active week
  renderRound3ModalBody();

  // 5. Open modal
  modalEl.classList.add('show');
  modalEl.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // 6. Bind Modal Event Listeners
  bindRound3ModalEvents();
}

/**
 * Close the Round 3 Regulatory Modal
 */
export function closeRound3RegulatoryModal() {
  const modalEl = document.getElementById('r3-regulatory-modal-backdrop');
  if (!modalEl) return;
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
  document.body.style.overflow = '';
}

/**
 * Render Week Navigation Buttons in Modal
 */
function renderRound3ModalWeekNav() {
  const modalEl = document.getElementById('r3-regulatory-modal-backdrop');
  if (!modalEl) return;
  const navEl = modalEl.querySelector('#r3-week-nav');
  if (!navEl) return;

  const availableWeeks = activeModalState.weeks.map((w) => w.pekan);
  const weekList = availableWeeks.length > 0 ? availableWeeks : [19, 20, 21, 22, 23, 24, 25, 26, 27];

  // If buttons already exist matching weekList, update active state without replacing innerHTML to prevent horizontal scroll jump
  const existingBtns = navEl.querySelectorAll('.r3-week-btn');
  const isMatchList = existingBtns.length === weekList.length &&
    Array.from(existingBtns).every((btn, idx) => parseInt(btn.getAttribute('data-modal-pekan'), 10) === weekList[idx]);

  if (isMatchList) {
    existingBtns.forEach((btn) => {
      const p = parseInt(btn.getAttribute('data-modal-pekan'), 10);
      const isActive = p === activeModalState.selectedPekan;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    });
    return;
  }

  const isEn = getLanguage() === 'en';

  navEl.innerHTML = weekList
    .map(
      (p) => `
      <button
        type="button"
        class="r3-week-btn ${p === activeModalState.selectedPekan ? 'active' : ''}"
        data-modal-pekan="${p}"
        role="tab"
        aria-selected="${p === activeModalState.selectedPekan ? 'true' : 'false'}"
      >
        ${isEn ? 'Matchweek' : 'Pekan'} ${p}
      </button>
    `
    )
    .join('');

  // Attach tab click events
  navEl.querySelectorAll('[data-modal-pekan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pekan = parseInt(btn.getAttribute('data-modal-pekan'), 10);
      if (pekan && pekan !== activeModalState.selectedPekan) {
        activeModalState.selectedPekan = pekan;
        renderRound3ModalWeekNav();
        renderRound3ModalBody();
      }
    });
  });
}

/**
 * Render Matches and Regulatory Reasons in Modal Body
 */
function renderRound3ModalBody() {
  const modalEl = document.getElementById('r3-regulatory-modal-backdrop');
  if (!modalEl) return;
  const bodyEl = modalEl.querySelector('#r3-modal-body');
  if (!bodyEl) return;

  const lang = getLanguage();
  const isEn = lang === 'en';

  const currentWeekObj = activeModalState.weeks.find((w) => w.pekan === activeModalState.selectedPekan);
  if (!currentWeekObj || !currentWeekObj.pertandingan || currentWeekObj.pertandingan.length === 0) {
    bodyEl.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-dim, #64748b);">
        ${isEn ? `No scheduled matches for Matchweek ${activeModalState.selectedPekan}.` : `Tidak ada pertandingan terjadwal untuk Pekan ${activeModalState.selectedPekan}.`}
      </div>
    `;
    return;
  }

  const matchesHtml = currentWeekObj.pertandingan
    .map((m, idx) => {
      const rawReason =
        m.regulatoryReason ||
        getMatchRegulatoryReason(m, activeModalState.scenarioInfo || {});
      const reason = translateReason(rawReason, lang);

      const isHomeTop5 = m.seedHome && m.seedHome <= 5;
      const isAwayTop5 = m.seedAway && m.seedAway <= 5;
      const formattedDate = formatMatchDate(m.tanggal, lang);

      return `
        <div class="r3-match-row" data-pekan="${m.pekan}" data-match-idx="${idx}">
          <div class="r3-match-header">
            <div class="r3-match-meta">
              <span>${formattedDate || (isEn ? `Matchweek ${m.pekan}` : `Pekan ${m.pekan}`)}</span>
              <span>&bull;</span>
              <span>${m.waktu || '15:30'} WIB</span>
            </div>
            ${m.stadion ? `<span class="r3-match-venue">${m.stadion}</span>` : ''}
          </div>

          <div class="r3-match-teams">
            <!-- Home Team -->
            <div class="r3-team-side home">
              <span class="r3-team-name" title="${m.timHome}">${m.timHome}</span>
              ${m.seedHome
          ? `<span class="r3-seed-badge ${isHomeTop5 ? 'top5' : 'bottom5'}">#${m.seedHome}</span>`
          : ''
        }
              <img src="${m.logoHome}" class="r3-team-logo" alt="${m.timHome}" onerror="this.style.opacity='0.2'">
            </div>

            <!-- VS Pill -->
            <span class="r3-vs-pill">VS</span>

            <!-- Away Team -->
            <div class="r3-team-side away">
              <img src="${m.logoAway}" class="r3-team-logo" alt="${m.timAway}" onerror="this.style.opacity='0.2'">
              ${m.seedAway
          ? `<span class="r3-seed-badge ${isAwayTop5 ? 'top5' : 'bottom5'}">#${m.seedAway}</span>`
          : ''
        }
              <span class="r3-team-name" title="${m.timAway}">${m.timAway}</span>
            </div>
          </div>

          <!-- Regulatory Reasoning Box -->
          <div class="r3-reason-box ${reason.isRamadhan ? 'ramadhan' : ''}">
            <div class="r3-reason-header">
              <span class="r3-reason-tag">${reason.tag || (isEn ? 'PSSI Regulations' : 'Regulasi PSSI')}</span>
              <span class="r3-reason-rule">${reason.rule || (isEn ? 'Article 7 Paragraphs 3 & 4' : 'Pasal 7 Ayat 3 & 4')}</span>
            </div>
            <p class="r3-reason-text">${reason.text}</p>
          </div>
        </div>
      `;
    })
    .join('');

  bodyEl.innerHTML = matchesHtml;
}

/**
 * Bind Event Handlers for Round 3 Regulatory Modal
 */
function bindRound3ModalEvents() {
  if (modalEventsBound) return;
  modalEventsBound = true;

  const modalEl = document.getElementById('r3-regulatory-modal-backdrop');
  if (!modalEl) return;

  // 1. Close button (X)
  const closeBtn = modalEl.querySelector('#btn-close-r3-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeRound3RegulatoryModal());
  }

  // 2. Dismiss button (Tutup)
  const dismissBtn = modalEl.querySelector('#btn-r3-modal-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => closeRound3RegulatoryModal());
  }

  // 3. Proceed button (Lanjutkan ke Simulasi)
  const proceedBtn = modalEl.querySelector('#btn-r3-modal-proceed');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      const targetPekan = activeModalState?.selectedPekan || 19;
      closeRound3RegulatoryModal();
      simState.selectedWeek = targetPekan;
      renderSimulationView();
      // Smooth scroll to match cards list
      setTimeout(() => {
        const cardsList = document.getElementById('sim-match-cards-list');
        if (cardsList) {
          cardsList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    });
  }

  // 4. Click outside to dismiss
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closeRound3RegulatoryModal();
    }
  });

  // 5. ESC Key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('show')) {
      closeRound3RegulatoryModal();
    }
  });
}

/**
 * Trigger generation of Putaran 3 (Pekan 19 to 27)
 */
export function triggerGenerateRound3(groupName, force = false) {
  const standingsAfterR2 = calculateSimStandings(groupName, 18).standings;
  const clubMeta = getClubMetadataMap();

  try {
    const { weeks, scenarioInfo } = generateRound3Fixtures(standingsAfterR2, groupName, clubMeta);

    // Merge or replace weeks 19 to 27 in simState.simMatches[groupName]
    const currentWeeks = simState.simMatches[groupName] || [];
    const nonR3Weeks = currentWeeks.filter((w) => w.pekan < 19);

    simState.simMatches[groupName] = [...nonR3Weeks, ...weeks];
    simState.round3Meta[groupName] = {
      generated: true,
      generatedAt: new Date().toISOString(),
      scenarioInfo
    };

    saveSimulationState();
    showToast(
      'Putaran 3 Berhasil Dibuat!',
      `${scenarioInfo.title}. 45 Pertandingan Pekan 19–27 telah disusun sesuai Regulasi PSSI.`,
      '📅',
      5000
    );

    // Move view to Week 19
    simState.selectedWeek = 19;
    renderSimulationView();

    // Show clean post-generation regulatory modal popup
    openRound3RegulatoryModal(groupName, weeks, scenarioInfo, 19);
  } catch (err) {
    console.error('Error generating Round 3:', err);
    showToast('Gagal Generate Putaran 3', err.message, '⚠️', 4000);
  }
}

/**
 * Quick simulation: Simulate all unplayed matches in the currently selected week
 */
export function simulateCurrentWeek() {
  const groupName = simState.activeGroup;
  const weekNum = simState.selectedWeek;
  const weekObj = (simState.simMatches[groupName] || []).find((w) => w.pekan === weekNum);

  if (!weekObj || !weekObj.pertandingan || weekObj.pertandingan.length === 0) {
    if (weekNum >= 19 && !simState.round3Meta[groupName]?.generated) {
      showToast('Putaran 3 Belum Tersedia', 'Generate Putaran 3 terlebih dahulu setelah Pekan 18 selesai.', '⚠️', 4000);
    } else {
      showToast('Tidak Ada Pertandingan', `Pekan ${weekNum} tidak memiliki jadwal.`, 'ℹ️', 3000);
    }
    return;
  }

  // Get current ranks for realistic score generation
  const currentStandings = calculateSimStandings(groupName, 27).standings;
  const rankMap = {};
  currentStandings.forEach((t) => {
    rankMap[t.klub] = t.posisi;
  });

  let simulatedCount = 0;
  weekObj.pertandingan.forEach((m) => {
    if (m.status !== 'FT' || m.skorHome === null || m.skorAway === null) {
      const hRank = rankMap[m.timHome] || 5;
      const aRank = rankMap[m.timAway] || 5;
      const score = generateRealisticScore(hRank, aRank);
      m.skorHome = score.home;
      m.skorAway = score.away;
      m.status = 'FT';
      simulatedCount++;
    }
  });

  saveSimulationState();
  showToast(
    `Pekan ${weekNum} Selesai Disimulasikan`,
    `${simulatedCount} pertandingan berhasil disimulasikan dengan skor realistis.`,
    '🎲',
    3500
  );

  // If week 18 just finished and R3 not yet generated, prompt auto-generation
  if (weekNum === 18 && !simState.round3Meta[groupName]?.generated) {
    triggerGenerateRound3(groupName);
  } else {
    renderSimulationView();
  }
}

/**
 * Quick simulation: Simulate all unplayed matches up to Week 18, and auto-generate Putaran 3
 */
export function simulateThroughRound2() {
  const groupName = simState.activeGroup;
  const weeks = simState.simMatches[groupName] || [];

  let simulatedMatches = 0;
  weeks
    .filter((w) => w.pekan >= 10 && w.pekan <= 18)
    .forEach((w) => {
      // Re-evaluate rank mid-simulation for dynamic score adjustments
      const currentStandings = calculateSimStandings(groupName, w.pekan - 1).standings;
      const rankMap = {};
      currentStandings.forEach((t) => {
        rankMap[t.klub] = t.posisi;
      });

      (w.pertandingan || []).forEach((m) => {
        if (m.status !== 'FT' || m.skorHome === null || m.skorAway === null) {
          const hRank = rankMap[m.timHome] || 5;
          const aRank = rankMap[m.timAway] || 5;
          const score = generateRealisticScore(hRank, aRank);
          m.skorHome = score.home;
          m.skorAway = score.away;
          m.status = 'FT';
          simulatedMatches++;
        }
      });
    });

  saveSimulationState();

  // Generate Putaran 3
  triggerGenerateRound3(groupName);

  showToast(
    'Putaran 2 Tuntas!',
    `${simulatedMatches} laga Pekan 10–18 disimulasikan. Putaran 3 (Pekan 19–27) telah otomatis digenerate!`,
    '🚀',
    4500
  );
}

/**
 * Quick simulation: Simulate entire season through Week 27
 */
export function simulateEntireSeason() {
  const groupName = simState.activeGroup;

  // 1. Ensure Putaran 2 is complete with rank-weighted scores
  const weeks = simState.simMatches[groupName] || [];
  weeks
    .filter((w) => w.pekan >= 10 && w.pekan <= 18)
    .forEach((w) => {
      const currentStandings = calculateSimStandings(groupName, w.pekan - 1).standings;
      const rankMap = {};
      currentStandings.forEach((t) => {
        rankMap[t.klub] = t.posisi;
      });

      (w.pertandingan || []).forEach((m) => {
        if (m.status !== 'FT' || m.skorHome === null || m.skorAway === null) {
          const hRank = rankMap[m.timHome] || 5;
          const aRank = rankMap[m.timAway] || 5;
          const score = generateRealisticScore(hRank, aRank);
          m.skorHome = score.home;
          m.skorAway = score.away;
          m.status = 'FT';
        }
      });
    });

  // 2. Generate Round 3 if not yet generated
  if (!simState.round3Meta[groupName]?.generated) {
    const standingsAfterR2 = calculateSimStandings(groupName, 18).standings;
    const clubMeta = getClubMetadataMap();
    const { weeks: r3Weeks, scenarioInfo } = generateRound3Fixtures(standingsAfterR2, groupName, clubMeta);
    const nonR3 = (simState.simMatches[groupName] || []).filter((w) => w.pekan < 19);
    simState.simMatches[groupName] = [...nonR3, ...r3Weeks];
    simState.round3Meta[groupName] = {
      generated: true,
      generatedAt: new Date().toISOString(),
      scenarioInfo
    };
  }

  // 3. Simulate Putaran 3 (Pekan 19–27)
  const allWeeks = simState.simMatches[groupName] || [];
  allWeeks
    .filter((w) => w.pekan >= 19 && w.pekan <= 27)
    .forEach((w) => {
      (w.pertandingan || []).forEach((m) => {
        if (m.status !== 'FT' || m.skorHome === null || m.skorAway === null) {
          const score = generateRealisticScore(m.seedHome || 5, m.seedAway || 5);
          m.skorHome = score.home;
          m.skorAway = score.away;
          m.status = 'FT';
        }
      });
    });

  simState.selectedWeek = 27;
  saveSimulationState();

  showToast(
    'Simulasi Musim Tuntas!',
    'Seluruh 27 pekan pertandingan telah selesai disimulasikan. Cek hasil akhir juara dan degradasi.',
    '🏆',
    5000
  );

  renderSimulationView();
}

/**
 * Update a specific match score and immediately recalculate
 */
export function updateMatchScore(pekanNum, matchIdx, homeScoreVal, awayScoreVal) {
  const groupName = simState.activeGroup;
  const weekObj = (simState.simMatches[groupName] || []).find((w) => w.pekan === pekanNum);
  if (!weekObj || !weekObj.pertandingan || !weekObj.pertandingan[matchIdx]) return;

  const match = weekObj.pertandingan[matchIdx];

  const hasHome = homeScoreVal !== '' && homeScoreVal !== null && !isNaN(Number(homeScoreVal));
  const hasAway = awayScoreVal !== '' && awayScoreVal !== null && !isNaN(Number(awayScoreVal));

  if (hasHome && hasAway) {
    match.skorHome = Math.max(0, Math.floor(Number(homeScoreVal)));
    match.skorAway = Math.max(0, Math.floor(Number(awayScoreVal)));
    match.status = 'FT';
  } else if (!hasHome && !hasAway) {
    match.skorHome = null;
    match.skorAway = null;
    match.status = 'UPCOMING';
  } else {
    // Partial input: keep status UPCOMING until both are filled
    match.skorHome = hasHome ? Math.max(0, Math.floor(Number(homeScoreVal))) : null;
    match.skorAway = hasAway ? Math.max(0, Math.floor(Number(awayScoreVal))) : null;
    match.status = 'UPCOMING';
  }

  saveSimulationState();
  renderStandingsOnly();
  renderPayoffCardOnly();
  updateToolbarProgress();
}

/**
 * Dynamically update toolbar completion progress indicators
 */
export function updateToolbarProgress() {
  const groupName = simState.activeGroup;
  const weeks = simState.simMatches[groupName] || [];
  const r3Meta = simState.round3Meta[groupName];
  const isR3Generated = !!r3Meta?.generated;
  const lang = getLanguage();
  const isEn = lang === 'en';

  let ftCount = 0;
  let totalMatches = 0;
  weeks.forEach((w) => {
    (w.pertandingan || []).forEach((m) => {
      totalMatches++;
      if (m.status === 'FT') ftCount++;
    });
  });

  const isSeasonComplete = ftCount === totalMatches && totalMatches === 135;
  const isPekan18Done = weeks
    .filter((w) => w.pekan <= 18)
    .every((w) => (w.pertandingan || []).every((m) => m.status === 'FT'));

  const progressLabel = document.querySelector('.sim-progress-label');
  if (progressLabel) {
    progressLabel.innerHTML = isEn
      ? `<strong>${ftCount} / ${totalMatches || 135} Matches Completed</strong> ${isSeasonComplete ? '• 2026/27 Season Fully Completed (27 MWs)' : '• Active Simulation Mode'}`
      : `<strong>${ftCount} / ${totalMatches || 135} Pertandingan Selesai</strong> ${isSeasonComplete ? '• Musim 2026/27 Selesai Penuh (27 Pekan)' : '• Mode Simulasi Aktif'}`;
  }
  const progressDot = document.querySelector('.sim-progress-dot');
  if (progressDot) {
    progressDot.classList.toggle('completed', isSeasonComplete);
    progressDot.classList.toggle('in-progress', !isSeasonComplete);
  }

  const chips = document.querySelectorAll('.sim-putaran-chip');
  if (chips.length >= 3) {
    chips[1].className = `sim-putaran-chip ${isPekan18Done ? 'done' : 'active'}`;
    chips[1].textContent = isEn
      ? `Round 2: Matchweeks 10-18 ${isPekan18Done ? '(Finished)' : '(In Progress)'}`
      : `Putaran 2: Pekan 10-18 ${isPekan18Done ? '(Selesai)' : '(Sedang Berjalan)'}`;

    chips[2].className = `sim-putaran-chip ${isSeasonComplete ? 'done' : (isR3Generated ? 'active' : 'locked')}`;
    chips[2].textContent = isEn
      ? `Round 3: Matchweeks 19-27 ${isSeasonComplete ? '(Finished)' : (isR3Generated ? '(Available)' : '(Locked)')}`
      : `Putaran 3: Pekan 19-27 ${isSeasonComplete ? '(Selesai)' : (isR3Generated ? '(Tersedia)' : '(Terkunci)')}`;
  }

  const btnR2 = document.getElementById('btn-sim-r2');
  if (btnR2) {
    btnR2.disabled = isPekan18Done && isR3Generated;
  }
}

/**
 * Clear a specific match score
 */
export function clearMatchScore(pekanNum, matchIdx) {
  const groupName = simState.activeGroup;
  const weekObj = (simState.simMatches[groupName] || []).find((w) => w.pekan === pekanNum);
  if (!weekObj || !weekObj.pertandingan || !weekObj.pertandingan[matchIdx]) return;

  const match = weekObj.pertandingan[matchIdx];
  match.skorHome = null;
  match.skorAway = null;
  match.status = 'UPCOMING';

  saveSimulationState();
  renderSimulationView();
}

// ==========================================================================
// RENDERERS
// ==========================================================================

/**
 * Render the entire simulation view
 */
export function renderSimulationView() {
  const container = document.getElementById('view-simulation');
  if (!container) return;

  const groupName = simState.activeGroup;
  const r3Meta = simState.round3Meta[groupName];
  const { standings, isSeasonComplete } = calculateSimStandings(groupName, 27);

  // Check progress
  const weeks = simState.simMatches[groupName] || [];
  let ftCount = 0;
  let totalMatches = 0;
  weeks.forEach((w) => {
    (w.pertandingan || []).forEach((m) => {
      totalMatches++;
      if (m.status === 'FT') ftCount++;
    });
  });

  const lang = getLanguage();
  const isEn = lang === 'en';

  const isR3Generated = !!r3Meta?.generated;
  const isPekan18Done = weeks
    .filter((w) => w.pekan <= 18)
    .every((w) => (w.pertandingan || []).every((m) => m.status === 'FT'));

  container.innerHTML = `
    <!-- Top Subheader Bar -->
    <div class="page-subheader sim-header-wrapper">
      <div class="sim-header-left">
        <div class="competition-tag">
          <span class="competition-tag-text">SINGACALA HUB 2026/27 &bull; UNOFFICIAL FAN-MADE SIMULATOR</span>
        </div>
        <h1 class="page-title">${isEn ? 'League Simulator & Season Projection' : 'Simulator Liga & Proyeksi Musim'}</h1>
        <p class="page-subtitle">
          ${isEn ? 'Interactive 27-matchweek simulation. Real-time predictions for the final standings, Grand Final spots, Promotion Play-offs, and relegation zone.' : 'Simulasi interaktif 27 Pekan. Prediksi klasemen akhir, perebutan tiket Grand Final, Play-off Promosi, dan zona degradasi secara real-time.'}
        </p>
      </div>

      <!-- Header Actions (J.League Button Style) -->
      <div class="sim-header-actions">
        <div class="sim-btn sim-btn-group-indicator" title="${isEn ? 'Group A Simulation' : 'Simulasi Grup A'}">
          <span>Grup A</span>
        </div>
      </div>
    </div>

    <!-- Season Outcome / Payoff Card -->
    <div id="sim-payoff-wrapper">
      ${renderPayoffCardHtml(standings, isSeasonComplete)}
    </div>

    <!-- Mobile Subview Toggle Pills (visible only <= 768px) -->
    <div class="sim-mobile-view-toggle">
      <button class="sim-mobile-toggle-btn ${simState.activeMobileTab === 'standings' ? 'active' : ''}" data-mobile-tab="standings">
        ${isEn ? '🏆 Standings Table' : '🏆 Tabel Klasemen'}
      </button>
      <button class="sim-mobile-toggle-btn ${simState.activeMobileTab === 'fixtures' ? 'active' : ''}" data-mobile-tab="fixtures">
        ${isEn ? '📅 Fixtures & Score Input' : '📅 Jadwal & Input Skor'}
      </button>
    </div>

    <!-- Two-Column Interactive Simulation Layout -->
    <div class="sim-main-grid ${simState.activeMobileTab === 'fixtures' ? 'mobile-show-fixtures' : 'mobile-show-standings'}">
      <!-- Left Column: Simulated Standings Table -->
      <div class="sim-col-standings">
        <div class="sim-card sim-card-standings">
          <div class="sim-card-header">
            <div>
              <h2 class="sim-card-title">${isEn ? 'Live Simulated Standings' : 'Klasemen Simulasi Live'}</h2>
              <p class="sim-card-subtitle">${isEn ? 'Automatic calculation of points, GD, and official PSSI Head-to-Head rules.' : 'Perhitungan otomatis poin, GD, dan Head-to-Head resmi PSSI.'}</p>
            </div>
            ${simState.highlightClub ? `
              <button class="sim-clear-filter-btn" id="btn-clear-club-filter">
                ✕ ${isEn ? 'Clear Filter' : 'Hapus Filter'} (${simState.highlightClub})
              </button>
            ` : ''}
          </div>

          <div class="standings-table-container sim-table-container">
            <table class="standings-table sim-table" id="sim-standings-table">
              <thead>
                <tr>
                  <th class="col-pos">Pos</th>
                  <th class="col-club">${isEn ? 'Club' : 'Klub'}</th>
                  <th class="col-stat">${isEn ? 'Pts' : 'Poin'}</th>
                  <th class="col-stat">${isEn ? 'P' : 'Main'}</th>
                  <th class="col-stat">${isEn ? 'W' : 'M'}</th>
                  <th class="col-stat">${isEn ? 'D' : 'S'}</th>
                  <th class="col-stat">${isEn ? 'L' : 'K'}</th>
                  <th class="col-stat">${isEn ? 'GF' : 'GM'}</th>
                  <th class="col-stat">${isEn ? 'GA' : 'GK'}</th>
                  <th class="col-stat">${isEn ? 'GD' : 'SG'}</th>
                  <th class="col-form">${t('th_form', {}, lang)}</th>
                </tr>
              </thead>
              <tbody id="sim-table-body">
                ${renderStandingsRowsHtml(standings)}
              </tbody>
            </table>
          </div>

          <!-- Standings Legend Footer -->
          <div class="standings-legend-footer sim-legend">
            <div class="legend-item">
              <span class="legend-color-indicator grandfinal"></span>
              <span>${isEn ? 'Grand Final & Automatic Promotion (P1)' : 'Grand Final & Promosi Otomatis (P1)'}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-indicator playoff-promosi"></span>
              <span>${isEn ? 'Promotion Play-off (P2)' : 'Play-off Promosi (P2)'}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-indicator playoff-degradasi"></span>
              <span>${isEn ? 'Relegation Play-off (P9)' : 'Play-off Degradasi (P9)'}</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-indicator relegation"></span>
              <span>${isEn ? 'Direct Relegation (P10)' : 'Degradasi Langsung (P10)'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive Fixtures & Matchdays -->
      <div class="sim-col-fixtures">
        <!-- Quick Simulation Helpers Toolbar -->
        <div class="sim-toolbar-card">
          <div class="sim-toolbar-info">
            <div class="sim-progress-indicator">
              <span class="sim-progress-label">
                <strong>${ftCount} / ${totalMatches || 135} ${isEn ? 'Matches Completed' : 'Pertandingan Selesai'}</strong>
                ${isSeasonComplete ? (isEn ? '• 2026/27 Season Fully Completed (27 MWs)' : '• Musim 2026/27 Selesai Penuh (27 Pekan)') : (isEn ? '• Active Simulation Mode' : '• Mode Simulasi Aktif')}
              </span>
            </div>
            <div class="sim-putaran-chips">
              <span class="sim-putaran-chip done">${isEn ? 'Round 1: Matchweeks 1-9 (Finished)' : 'Putaran 1: Pekan 1-9 (Selesai)'}</span>
              <span class="sim-putaran-chip ${isPekan18Done ? 'done' : 'active'}">
                ${isEn ? `Round 2: Matchweeks 10-18 ${isPekan18Done ? '(Finished)' : '(In Progress)'}` : `Putaran 2: Pekan 10-18 ${isPekan18Done ? '(Selesai)' : '(Sedang Berjalan)'}`}
              </span>
              <span class="sim-putaran-chip ${isSeasonComplete ? 'done' : (isR3Generated ? 'active' : 'locked')}">
                ${isEn ? `Round 3: Matchweeks 19-27 ${isSeasonComplete ? '(Finished)' : (isR3Generated ? '(Available)' : '(Locked)')}` : `Putaran 3: Pekan 19-27 ${isSeasonComplete ? '(Selesai)' : (isR3Generated ? '(Tersedia)' : '(Terkunci)')}`}
              </span>
            </div>
          </div>

          <div class="sim-quick-actions">
            <button class="sim-btn sim-btn-secondary" id="btn-sim-week">
              <span>${isEn ? `Simulate Matchweek ${simState.selectedWeek}` : `Simulasikan Pekan ${simState.selectedWeek}`}</span>
            </button>
            <button class="sim-btn sim-btn-secondary" id="btn-sim-r2" ${isPekan18Done && isR3Generated ? 'disabled' : ''}>
              <span>${isEn ? 'Simulate through Matchweek 18' : 'Simulasikan s/d Pekan 18'}</span>
            </button>
            <button class="sim-btn sim-btn-secondary" id="btn-sim-all">
              <span>${isEn ? 'Simulate Entire Season (thru MW 27)' : 'Simulasikan Semua (s/d Pekan 27)'}</span>
            </button>
            <button class="sim-btn sim-btn-reset" id="btn-sim-reset" title="${isEn ? 'Reset all scores to initial state' : 'Kembalikan semua skor ke kondisi awal'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="sim-icon">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              <span>${isEn ? 'Reset Simulation' : 'Reset Simulasi'}</span>
            </button>
          </div>
        </div>

        <div class="sim-card sim-card-fixtures">
          <!-- Putaran Navigator Tabs -->
          <div class="sim-putaran-tabs">
            <button class="sim-putaran-tab ${simState.selectedWeek <= 9 ? 'active' : ''}" data-putaran="1">
              ${isEn ? 'Round 1 (1–9)' : 'Putaran 1 (1–9)'}
            </button>
            <button class="sim-putaran-tab ${simState.selectedWeek >= 10 && simState.selectedWeek <= 18 ? 'active' : ''}" data-putaran="2">
              ${isEn ? 'Round 2 (10–18)' : 'Putaran 2 (10–18)'}
            </button>
            <button class="sim-putaran-tab ${simState.selectedWeek >= 19 ? 'active' : ''}" data-putaran="3">
              ${isEn ? 'Round 3 (19–27)' : 'Putaran 3 (19–27)'}
            </button>
          </div>

          <!-- Week Stepper & Selector Bar -->
          <div class="sim-week-stepper-bar">
            <button class="stepper-arrow-btn" id="btn-sim-prev-week" ${simState.selectedWeek <= 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="sim-week-title-box">
              <span class="sim-week-badge">${isEn ? 'MATCHWEEK' : 'PEKAN'} ${simState.selectedWeek}</span>
              <span class="sim-week-round-tag">
                ${simState.selectedWeek <= 9 ? (isEn ? 'Round 1 (Official Data)' : 'Putaran 1 (Data Resmi)') : (simState.selectedWeek <= 18 ? (isEn ? 'Round 2 (Official Schedule)' : 'Putaran 2 (Jadwal Resmi)') : (isEn ? 'Round 3 (PSSI Regulations)' : 'Putaran 3 (Regulasi PSSI)'))}
              </span>
            </div>
            <button class="stepper-arrow-btn" id="btn-sim-next-week" ${simState.selectedWeek >= 27 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <!-- Round 3 Scenario Notice or Generator Banner -->
          <div id="sim-r3-notice-area">
            ${renderRound3NoticeHtml(groupName, isR3Generated, r3Meta, isPekan18Done)}
          </div>

          <!-- Match Cards Stream for Current Week -->
          <div class="sim-match-cards-list" id="sim-match-cards-list">
            ${renderMatchCardsHtml(groupName, simState.selectedWeek)}
          </div>
        </div>
      </div>
    </div>
  `;

  attachSimulationEvents(container);
  renderSimFloatingSummaryBar();
}

/**
 * Render only the standings tbody to avoid flickering on score input
 */
export function renderStandingsOnly() {
  const tbody = document.getElementById('sim-table-body');
  if (!tbody) return;
  const { standings } = calculateSimStandings(simState.activeGroup, 27);
  tbody.innerHTML = renderStandingsRowsHtml(standings);
  renderSimFloatingSummaryBar();
}

/**
 * Render only the payoff card to avoid flickering on score input
 */
export function renderPayoffCardOnly() {
  const wrapper = document.getElementById('sim-payoff-wrapper');
  if (!wrapper) return;
  const { standings, isSeasonComplete } = calculateSimStandings(simState.activeGroup, 27);
  wrapper.innerHTML = renderPayoffCardHtml(standings, isSeasonComplete);
  renderSimFloatingSummaryBar();
}

/**
 * Render floating summary bar for mobile in simulator
 */
export function renderSimFloatingSummaryBar() {
  const simView = document.getElementById('view-simulation');
  if (!simView) return;

  let floatBar = document.getElementById('sim-floating-summary');
  if (!floatBar) {
    floatBar = document.createElement('div');
    floatBar.id = 'sim-floating-summary';
    floatBar.className = 'sim-floating-summary';
    document.body.appendChild(floatBar);
  }

  // Only display when inside simulation view on mobile (<= 768px)
  const isMobile = window.innerWidth <= 768;
  if (!isMobile || state.currentView !== 'simulation') {
    floatBar.style.display = 'none';
    return;
  }
  floatBar.style.display = 'flex';

  const { standings } = calculateSimStandings(simState.activeGroup, 27);
  if (!standings || standings.length === 0) return;

  const targetTeam = standings.find((t) => t.klub && t.klub.toLowerCase().includes('psgc')) || standings[0];
  const lang = getLanguage();
  const isEn = lang === 'en';

  let statusBadgeClass = 'safe';
  let statusText = t('sim_float_safe', {}, lang);

  if (targetTeam.posisi === 1) {
    statusBadgeClass = 'promo';
    statusText = isEn ? 'Grand Final' : 'Grand Final';
  } else if (targetTeam.posisi === 2 || targetTeam.posisi === 3) {
    statusBadgeClass = 'promo';
    statusText = t('sim_float_playoff', {}, lang);
  } else if (targetTeam.posisi >= 8) {
    statusBadgeClass = 'danger';
    statusText = t('sim_float_danger', {}, lang);
  }

  floatBar.innerHTML = `
    <div class="sim-float-left">
      <img src="${targetTeam.logo || 'https://assets.ileague.id/uploads/images/logo/96/h/50/204.png'}" alt="${targetTeam.klub}" class="sim-float-team-emblem" onerror="this.style.opacity='0.2'">
      <div class="sim-float-info">
        <span class="sim-float-team-name">${targetTeam.klub}</span>
        <div class="sim-float-stat-line">
          <span>#${targetTeam.posisi}</span>
          <span>•</span>
          <span>${targetTeam.poin} ${isEn ? 'Pts' : 'Poin'}</span>
          <span class="sim-float-rank-badge ${statusBadgeClass}">${statusText}</span>
        </div>
      </div>
    </div>
    <div class="sim-float-right">
      <button type="button" class="sim-float-btn primary" id="btn-sim-float-scroll">
        ${t('sim_float_btn_table', {}, lang)}
      </button>
    </div>
  `;

  const scrollBtn = floatBar.querySelector('#btn-sim-float-scroll');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      const targetTable = document.getElementById('sim-standings-table-container');
      if (targetTable) {
        targetTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

/**
 * HTML for the Season Outcome / Payoff Card
 */
function renderPayoffCardHtml(standings, isSeasonComplete) {
  if (!standings || standings.length < 10) return '';

  const isEn = getLanguage() === 'en';
  const p1 = standings[0];
  const p2 = standings[1];
  const p9 = standings[8];
  const p10 = standings[9];

  return `
    <div class="sim-outcome-card ${isSeasonComplete ? 'season-finalized' : 'season-projected'}">
      <div class="sim-outcome-header">
        <div class="sim-outcome-title-group">
          <h3 class="sim-outcome-heading">
            ${isSeasonComplete
      ? (isEn ? 'Confirmed Promotion, Grand Final, and Relegation Tickets' : 'Konfirmasi Tiket Promosi, Grand Final, dan Degradasi')
      : (isEn ? 'Season Final Outcome (27-Matchweek Projection)' : 'Peta Persaingan Musim 2026/27 (Proyeksi 27 Pekan)')}
          </h3>
        </div>
        <div class="sim-outcome-group-label">${simState.activeGroup}</div>
      </div>

      <div class="sim-outcome-grid">
        <!-- P1: Grand Final & Auto Promotion -->
        <div class="outcome-box box-grandfinal">
          <div class="outcome-box-top">
            <span class="outcome-tag tag-grandfinal">${isEn ? 'P1 • GRAND FINAL & PROMOTION' : 'P1 • GRAND FINAL & PROMOSI'}</span>
            <span class="outcome-pts">${p1.poin} ${isEn ? 'Pts' : 'Poin'}</span>
          </div>
          <div class="outcome-team-row">
            <img src="${p1.logo}" class="outcome-team-logo" alt="${p1.klub}" onerror="this.style.opacity='0.2'">
            <div class="outcome-team-info">
              <strong class="outcome-team-name">${p1.klub}</strong>
              <small class="outcome-team-desc">${isEn ? 'Promotion to BRI Super League + Grand Final Qualification' : 'Promosi ke BRI Super League + Lolos ke Babak Grand Final'}</small>
            </div>
          </div>
        </div>

        <!-- P2: Play-off Promosi -->
        <div class="outcome-box box-playoff-promosi">
          <div class="outcome-box-top">
            <span class="outcome-tag tag-playoff-promosi">${isEn ? 'P2 • PROMOTION PLAY-OFF' : 'P2 • PLAY-OFF PROMOSI'}</span>
            <span class="outcome-pts">${p2.poin} ${isEn ? 'Pts' : 'Poin'}</span>
          </div>
          <div class="outcome-team-row">
            <img src="${p2.logo}" class="outcome-team-logo" alt="${p2.klub}" onerror="this.style.opacity='0.2'">
            <div class="outcome-team-info">
              <strong class="outcome-team-name">${p2.klub}</strong>
              <small class="outcome-team-desc">${isEn ? 'Promotion Play-off match vs other group P2 (3rd promotion spot)' : 'Tanding Play-off Promosi vs P2 Grup Lain (Tiket ke-3)'}</small>
            </div>
          </div>
        </div>

        <!-- P9: Play-off Degradasi -->
        <div class="outcome-box box-playoff-degradasi">
          <div class="outcome-box-top">
            <span class="outcome-tag tag-playoff-degradasi">${isEn ? 'P9 • RELEGATION PLAY-OFF' : 'P9 • PLAY-OFF DEGRADASI'}</span>
            <span class="outcome-pts">${p9.poin} ${isEn ? 'Pts' : 'Poin'}</span>
          </div>
          <div class="outcome-team-row">
            <img src="${p9.logo}" class="outcome-team-logo" alt="${p9.klub}" onerror="this.style.opacity='0.2'">
            <div class="outcome-team-info">
              <strong class="outcome-team-name">${p9.klub}</strong>
              <small class="outcome-team-desc">${isEn ? 'Do-or-die Relegation Play-off match vs other group P9' : 'Laga Hidup-Mati Play-off Degradasi vs P9 Grup Lain'}</small>
            </div>
          </div>
        </div>

        <!-- P10: Direct Relegation -->
        <div class="outcome-box box-relegation">
          <div class="outcome-box-top">
            <span class="outcome-tag tag-relegation">${isEn ? 'P10 • DIRECT RELEGATION' : 'P10 • DEGRADASI LANGSUNG'}</span>
            <span class="outcome-pts">${p10.poin} ${isEn ? 'Pts' : 'Poin'}</span>
          </div>
          <div class="outcome-team-row">
            <img src="${p10.logo}" class="outcome-team-logo" alt="${p10.klub}" onerror="this.style.opacity='0.2'">
            <div class="outcome-team-info">
              <strong class="outcome-team-name">${p10.klub}</strong>
              <small class="outcome-team-desc">${isEn ? 'Direct relegation to Liga Nusantara 2027/28' : 'Degradasi langsung ke Liga Nusantara 2027/28'}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * HTML for the Standings Table Rows
 */
function renderStandingsRowsHtml(standings) {
  const isEn = getLanguage() === 'en';

  return standings
    .map((team) => {
      const pos = team.posisi;
      let rowClass = '';
      if (pos === 1) rowClass = 'rank-grandfinal';
      else if (pos === 2) rowClass = 'rank-playoff-promosi';
      else if (pos === 9) rowClass = 'rank-playoff-degradasi';
      else if (pos === 10) rowClass = 'rank-relegation';

      // Pos trend compared to baseline
      const basePos = team.baselinePos || pos;
      let trendIcon = '';
      if (pos < basePos) {
        trendIcon = `<span class="rank-trend-icon up" title="${isEn ? `Up from rank #${basePos}` : `Naik dari peringkat #${basePos}`}">▲</span>`;
      } else if (pos > basePos) {
        trendIcon = `<span class="rank-trend-icon down" title="${isEn ? `Down from rank #${basePos}` : `Turun dari peringkat #${basePos}`}">▼</span>`;
      } else {
        trendIcon = `<span class="rank-trend-icon neutral"></span>`;
      }

      // Penalty badge
      const penaltyBadge =
        team.catatanPenalti < 0
          ? `<span class="penalty-tag" title="${isEn ? `Penalty deduction of ${Math.abs(team.catatanPenalti)} points` : `Sanksi pengurangan ${Math.abs(team.catatanPenalti)} poin`}">${team.catatanPenalti}</span>`
          : '';

      // Form badges (last 5)
      const last5 = (team.form || []).slice(-5);
      const formBadges = last5
        .map(
          (res) =>
            `<span class="form-badge form-${res.toLowerCase()}">${res}</span>`
        )
        .join('');

      const isHighlighted = simState.highlightClub === team.klub;
      const isPsgc = team.klub && team.klub.toLowerCase().includes('psgc');

      return `
        <tr class="standings-row ${rowClass} ${isPsgc ? 'psgc-row' : ''} ${isHighlighted ? 'row-highlighted' : ''}" data-club="${team.klub}">
          <td class="col-pos">
            <div class="pos-cell-wrap">
              <span class="pos-number">${pos}</span>
              ${trendIcon}
            </div>
          </td>
          <td class="col-club">
            <div class="club-cell-wrap">
              <img src="${team.logo}" class="club-table-logo" alt="${team.klub}" onerror="this.style.opacity='0.2'">
              <span class="club-table-name" title="${team.klub}">${team.klub}</span>
              ${penaltyBadge}
            </div>
          </td>
          <td class="col-stat font-bold text-accent">${team.poin}</td>
          <td class="col-stat">${team.main}</td>
          <td class="col-stat text-win">${team.menang}</td>
          <td class="col-stat text-draw">${team.seri}</td>
          <td class="col-stat text-loss">${team.kalah}</td>
          <td class="col-stat">${team.gf}</td>
          <td class="col-stat">${team.ga}</td>
          <td class="col-stat font-semibold ${team.gd > 0 ? 'text-win' : team.gd < 0 ? 'text-loss' : ''}">
            ${team.gd > 0 ? '+' : ''}${team.gd}
          </td>
          <td class="col-form">
            <div class="form-badges-container">
              ${formBadges || '<span class="text-muted">-</span>'}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

/**
 * HTML for the Round 3 Notice or Generator Banner
 */
function renderRound3NoticeHtml(groupName, isR3Generated, r3Meta, isPekan18Done) {
  const lang = getLanguage();
  const isEn = lang === 'en';

  if (simState.selectedWeek < 19) {
    if (isR3Generated) {
      return `
        <div class="sim-r3-banner generated">
          <div class="sim-r3-header-row">
            <div class="sim-r3-icon-badge">✓</div>
            <div class="sim-r3-title-block">
              <h4 class="sim-r3-title">${isEn ? 'Round 3 Is Available!' : 'Putaran 3 Telah Tersedia!'}</h4>
              <p class="sim-r3-desc">${isEn ? `${translateScenarioTitle(r3Meta?.scenarioInfo?.title, 'en') || 'Matchweeks 19–27 ready to play'}. You can switch to Round 3 anytime.` : `${r3Meta?.scenarioInfo?.title || 'Jadwal pekan 19–27 siap dimainkan'}. Anda dapat berpindah ke Putaran 3 kapan saja.`}</p>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }

  // Viewing Putaran 3 (weeks 19–27)
  if (isR3Generated) {
    const sc = r3Meta?.scenarioInfo;
    return `
      <div class="sim-r3-banner active-scenario">
        <div class="sim-r3-title-block">
          <h4 class="sim-r3-title">${isEn ? (translateScenarioTitle(sc?.title, 'en') || 'Round 3 Active') : (sc?.title || 'Putaran 3 Aktif')}</h4>
          <p class="sim-r3-desc">${isEn ? 'Schedule automatically arranged based on Matchweek 18 standings.' : (sc?.description || 'Jadwal telah disusun otomatis berdasarkan klasemen Pekan 18.')}</p>
        </div>
        <div class="sim-r3-banner-actions-row">
          <button class="sim-btn sim-btn-secondary" id="btn-view-r3-regulations" title="${isEn ? 'View schedule details & regulatory reasoning' : 'Lihat rincian jadwal lengkap & alasan regulasi Putaran 3'}">
            <span>${isEn ? 'Schedule Regulation Details' : 'Detail Regulasi Jadwal'}</span>
          </button>
          <button class="sim-btn sim-btn-secondary" id="btn-re-generate-r3" title="${isEn ? 'Regenerate based on latest standings' : 'Generate ulang berdasarkan klasemen terbaru'}">
            <span>Regenerate R3</span>
          </button>
        </div>
      </div>
    `;
  }

  // Not generated yet
  return `
    <div class="sim-r3-banner ungenerated">
      <div class="sim-r3-header-row">
        <div class="sim-r3-icon-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sim-r3-svg">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        </div>
        <div class="sim-r3-title-block">
          <h4 class="sim-r3-title">${isEn ? 'Round 3 (Matchweeks 19–27) Not Generated Yet' : 'Putaran 3 (Pekan 19–27) Belum Di-generate'}</h4>
          <span class="sim-r3-badge">${isEn ? 'PSSI Regulations &bull; Article 7 Paragraphs 3 &amp; 4' : 'Regulasi PSSI &bull; Pasal 7 Ayat 3 &amp; 4'}</span>
        </div>
      </div>

      <div class="sim-r3-body">
        <p class="sim-r3-desc">
          ${isEn ? 'Per Article 7 Paragraphs 3 &amp; 4 of Regulations, Round 3 fixtures are determined by standings after Round 2 (Matchweek 18).' : 'Sesuai Pasal 7 Ayat 3 &amp; 4 Regulasi, jadwal Putaran 3 ditentukan berdasarkan klasemen setelah Putaran 2 (Pekan 18).'}
          ${groupName === 'Grup A' ? (isEn ? '<br><span class="sim-r3-note">For <strong>PERSIRAJA Banda Aceh</strong>, Ramadhan clause applies (away in MW 19, 20, 21).</span>' : '<br><span class="sim-r3-note">Khusus <strong>PERSIRAJA Banda Aceh</strong>, berlaku klausul Ramadhan (main tandang di Pekan 19, 20, 21).</span>') : ''}
        </p>

        <div class="sim-r3-banner-actions">
          <button class="sim-btn sim-btn-secondary sim-btn-lg" id="btn-trigger-r3-now">
            <span>${isEn ? 'Generate Round 3 Based on Current Standings' : 'Generate Putaran 3 Berdasarkan Klasemen Sekarang'}</span>
          </button>
          ${!isPekan18Done ? `
            <button class="sim-btn sim-btn-secondary sim-btn-lg sim-btn-subtle" id="btn-r3-sim-r2-first">
              <span>${isEn ? 'Simulate through Matchweek 18 First' : 'Simulasikan Dulu s/d Pekan 18'}</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * HTML for the Match Cards for the selected week
 */
function renderMatchCardsHtml(groupName, weekNum) {
  const weekObj = (simState.simMatches[groupName] || []).find((w) => w.pekan === weekNum);
  const lang = getLanguage();
  const isEn = lang === 'en';

  if (!weekObj || !weekObj.pertandingan || weekObj.pertandingan.length === 0) {
    if (weekNum >= 19 && !simState.round3Meta[groupName]?.generated) {
      return '';
    }
    return `
      <div class="sim-empty-state">
        <div class="sim-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px; opacity: 0.6;">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3>${isEn ? 'No Scheduled Matches' : 'Tidak Ada Jadwal'}</h3>
        <p>${isEn ? `No matches scheduled for Matchweek ${weekNum}.` : `Tidak ada pertandingan yang dijadwalkan untuk Pekan ${weekNum}.`}</p>
      </div>
    `;
  }

  return weekObj.pertandingan
    .map((m, idx) => {
      const isFT = m.status === 'FT';
      const homeVal = m.skorHome !== null ? m.skorHome : '';
      const awayVal = m.skorAway !== null ? m.skorAway : '';

      const isHomeWin = isFT && m.skorHome > m.skorAway;
      const isAwayWin = isFT && m.skorAway > m.skorHome;
      const isDraw = isFT && m.skorHome === m.skorAway;

      const isMatchHighlighted =
        simState.highlightClub &&
        (matchClubs(simState.highlightClub, m.timHome) || matchClubs(simState.highlightClub, m.timAway));

      const homeTabIndex = idx * 2 + 1;
      const awayTabIndex = idx * 2 + 2;

      return `
        <div class="sim-match-card ${isFT ? 'match-ft' : 'match-upcoming'} ${isMatchHighlighted ? 'match-highlighted' : ''}" data-pekan="${weekNum}" data-match-index="${idx}">
          <!-- Match Meta Bar -->
          <div class="sim-match-header">
            <span class="sim-match-date">${formatMatchDate(m.tanggal, lang) || (isEn ? `Matchweek ${weekNum}` : `Pekan ${weekNum}`)} • ${m.waktu || 'WIB'}</span>
            <div class="sim-match-header-right">
              ${m.stadion ? `<span class="sim-match-stadium">📍 ${m.stadion}</span>` : ''}
              <span class="sim-status-badge ${isFT ? 'badge-ft' : 'badge-upcoming'}">
                ${isFT ? (isEn ? 'FT' : 'SELESAI') : (isEn ? 'UPCOMING' : 'TERJADWAL')}
              </span>
            </div>
          </div>

          <!-- Main Teams & Score Grid -->
          <div class="sim-match-body">
            <!-- Home Club -->
            <div class="sim-team-side home-side ${isHomeWin ? 'winner' : ''}">
              <span class="sim-team-name" title="${m.timHome}">${m.timHome}</span>
              <img src="${m.logoHome}" class="sim-match-logo" alt="${m.timHome}" onerror="this.style.opacity='0.2'">
            </div>

            <!-- Score Input Box -->
            <div class="sim-score-box">
              <input
                type="number"
                min="0"
                max="20"
                inputmode="numeric"
                autocomplete="off"
                class="sim-score-input score-home"
                value="${homeVal}"
                placeholder="-"
                data-pekan="${weekNum}"
                data-idx="${idx}"
                data-side="home"
                tabindex="${homeTabIndex}"
                aria-label="Skor Home ${m.timHome}"
              >
              <span class="sim-score-divider">:</span>
              <input
                type="number"
                min="0"
                max="20"
                inputmode="numeric"
                autocomplete="off"
                class="sim-score-input score-away"
                value="${awayVal}"
                placeholder="-"
                data-pekan="${weekNum}"
                data-idx="${idx}"
                data-side="away"
                tabindex="${awayTabIndex}"
                aria-label="Skor Away ${m.timAway}"
              >
            </div>

            <!-- Away Club -->
            <div class="sim-team-side away-side ${isAwayWin ? 'winner' : ''}">
              <img src="${m.logoAway}" class="sim-match-logo" alt="${m.timAway}" onerror="this.style.opacity='0.2'">
              <span class="sim-team-name" title="${m.timAway}">${m.timAway}</span>
            </div>
          </div>

          <!-- Match Quick Actions Footer -->
          <div class="sim-match-footer">
            <div class="sim-match-quick-buttons">
              <button class="sim-match-btn btn-random-match" data-pekan="${weekNum}" data-idx="${idx}">
                ${isEn ? 'Randomize' : 'Acak Skor'}
              </button>
              ${isFT ? `
                <button class="sim-match-btn btn-clear-match" data-pekan="${weekNum}" data-idx="${idx}">
                  ${isEn ? '✕ Clear' : '✕ Hapus'}
                </button>
              ` : ''}
            </div>
            ${m.seedHome && m.seedAway ? `
              <span class="sim-match-seed-info">Peringkat R2: #${m.seedHome} vs #${m.seedAway}</span>
            ` : ''}
          </div>
        </div>
      `;
    })
    .join('');
}

// ==========================================================================
// EVENT HANDLERS
// ==========================================================================

/**
 * Attach interactive events to simulator UI
 */
export function attachSimulationEvents(container) {
  // 1. Group Switcher Buttons
  container.querySelectorAll('[data-sim-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const g = btn.getAttribute('data-sim-group');
      if (g && g !== simState.activeGroup) {
        simState.activeGroup = g;
        simState.highlightClub = null;
        renderSimulationView();
      }
    });
  });

  // 2. Reset Button
  const resetBtn = container.querySelector('#btn-sim-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin mereset semua data simulasi ke kondisi awal?')) {
        resetSimulationState(true);
      }
    });
  }

  // 3. Quick Toolbar Buttons
  const btnSimWeek = container.querySelector('#btn-sim-week');
  if (btnSimWeek) {
    btnSimWeek.addEventListener('click', () => simulateCurrentWeek());
  }

  const btnSimR2 = container.querySelector('#btn-sim-r2');
  if (btnSimR2) {
    btnSimR2.addEventListener('click', () => simulateThroughRound2());
  }

  const btnSimAll = container.querySelector('#btn-sim-all');
  if (btnSimAll) {
    btnSimAll.addEventListener('click', () => simulateEntireSeason());
  }

  // 4. Mobile View Toggle Buttons
  container.querySelectorAll('[data-mobile-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-mobile-tab');
      simState.activeMobileTab = tab;
      const grid = container.querySelector('.sim-main-grid');
      if (grid) {
        if (tab === 'fixtures') {
          grid.classList.add('mobile-show-fixtures');
          grid.classList.remove('mobile-show-standings');
        } else {
          grid.classList.add('mobile-show-standings');
          grid.classList.remove('mobile-show-fixtures');
        }
      }
      container.querySelectorAll('[data-mobile-tab]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-mobile-tab') === tab);
      });
    });
  });

  // 5. Putaran Tabs
  container.querySelectorAll('[data-putaran]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const p = parseInt(tab.getAttribute('data-putaran'), 10);
      if (p === 1) simState.selectedWeek = 1;
      else if (p === 2) simState.selectedWeek = 10;
      else if (p === 3) simState.selectedWeek = 19;
      renderSimulationView();
    });
  });

  // 6. Week Stepper Buttons
  const btnPrev = container.querySelector('#btn-sim-prev-week');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (simState.selectedWeek > 1) {
        simState.selectedWeek--;
        renderSimulationView();
      }
    });
  }

  const btnNext = container.querySelector('#btn-sim-next-week');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (simState.selectedWeek < 27) {
        simState.selectedWeek++;
        renderSimulationView();
      }
    });
  }

  // 7. Putaran 3 Generation Triggers
  const btnTriggerR3 = container.querySelector('#btn-trigger-r3-now');
  if (btnTriggerR3) {
    btnTriggerR3.addEventListener('click', () => {
      triggerGenerateRound3(simState.activeGroup);
    });
  }

  const btnReGenR3 = container.querySelector('#btn-re-generate-r3');
  if (btnReGenR3) {
    btnReGenR3.addEventListener('click', () => {
      if (confirm('Generate ulang Putaran 3 berdasarkan klasemen Pekan 18 terbaru? Jadwal lama Putaran 3 akan diperbarui.')) {
        triggerGenerateRound3(simState.activeGroup);
      }
    });
  }

  const btnViewR3Reg = container.querySelector('#btn-view-r3-regulations');
  if (btnViewR3Reg) {
    btnViewR3Reg.addEventListener('click', () => {
      const r3Weeks = (simState.simMatches[simState.activeGroup] || []).filter((w) => w.pekan >= 19);
      const sc = simState.round3Meta[simState.activeGroup]?.scenarioInfo;
      openRound3RegulatoryModal(
        simState.activeGroup,
        r3Weeks,
        sc,
        simState.selectedWeek >= 19 ? simState.selectedWeek : 19
      );
    });
  }

  const btnR3SimR2 = container.querySelector('#btn-r3-sim-r2-first');
  if (btnR3SimR2) {
    btnR3SimR2.addEventListener('click', () => {
      simulateThroughRound2();
    });
  }

  // 8. Club filter from Standings table row click
  container.querySelectorAll('.standings-row[data-club]').forEach((row) => {
    row.addEventListener('click', () => {
      const club = row.getAttribute('data-club');
      if (simState.highlightClub === club) {
        simState.highlightClub = null;
      } else {
        simState.highlightClub = club;
      }
      renderSimulationView();
    });
  });

  const btnClearFilter = container.querySelector('#btn-clear-club-filter');
  if (btnClearFilter) {
    btnClearFilter.addEventListener('click', () => {
      simState.highlightClub = null;
      renderSimulationView();
    });
  }

  // 9. Interactive Score Inputs
  container.querySelectorAll('.sim-score-input').forEach((input) => {
    const handleInput = (e) => {
      const target = e.target;
      const pekan = parseInt(target.getAttribute('data-pekan'), 10);
      const idx = parseInt(target.getAttribute('data-idx'), 10);
      const parentCard = target.closest('.sim-match-card');
      if (!parentCard) return;

      const homeInp = parentCard.querySelector('.score-home');
      const awayInp = parentCard.querySelector('.score-away');
      if (!homeInp || !awayInp) return;

      const hVal = homeInp.value.trim();
      const aVal = awayInp.value.trim();

      updateMatchScore(pekan, idx, hVal, aVal);

      // Update card visual state
      const isFT = hVal !== '' && aVal !== '';
      parentCard.classList.toggle('match-ft', isFT);
      parentCard.classList.toggle('match-upcoming', !isFT);
      const badge = parentCard.querySelector('.sim-status-badge');
      if (badge) {
        const isEn = getLanguage() === 'en';
        badge.textContent = isFT ? (isEn ? 'FT' : 'SELESAI') : (isEn ? 'UPCOMING' : 'TERJADWAL');
        badge.classList.toggle('badge-ft', isFT);
        badge.classList.toggle('badge-upcoming', !isFT);
      }

      // Update winner styling on team names
      const homeSide = parentCard.querySelector('.home-side');
      const awaySide = parentCard.querySelector('.away-side');
      const sH = Number(hVal);
      const sA = Number(aVal);
      if (homeSide) homeSide.classList.toggle('winner', isFT && sH > sA);
      if (awaySide) awaySide.classList.toggle('winner', isFT && sA > sH);

      // Dynamically manage Clear button
      const quickBtns = parentCard.querySelector('.sim-match-quick-buttons');
      if (quickBtns) {
        let clearBtn = quickBtns.querySelector('.btn-clear-match');
        if (isFT && !clearBtn) {
          clearBtn = document.createElement('button');
          clearBtn.className = 'sim-match-btn btn-clear-match';
          clearBtn.setAttribute('data-pekan', String(pekan));
          clearBtn.setAttribute('data-idx', String(idx));
          clearBtn.textContent = '✕ Hapus';
          clearBtn.addEventListener('click', () => {
            clearMatchScore(pekan, idx);
          });
          quickBtns.appendChild(clearBtn);
        } else if (!isFT && clearBtn) {
          clearBtn.remove();
        }
      }
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('change', handleInput);
  });

  // 10. Randomize Match Button
  container.querySelectorAll('.btn-random-match').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pekan = parseInt(btn.getAttribute('data-pekan'), 10);
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const score = generateRealisticScore(5, 5);
      updateMatchScore(pekan, idx, score.home, score.away);
      renderSimulationView();
    });
  });

  // 11. Clear Match Button
  container.querySelectorAll('.btn-clear-match').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pekan = parseInt(btn.getAttribute('data-pekan'), 10);
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      clearMatchScore(pekan, idx);
    });
  });
}

