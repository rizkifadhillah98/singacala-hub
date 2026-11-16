// ==========================================================================
// REGULASI PEGADAIAN CHAMPIONSHIP 2026/27 - BABAK PENDAHULUAN ROUND ROBIN KE-3
// ==========================================================================
// Berdasarkan Pasal 7 Ayat 3 Bagian III & IV dan Lampiran Regulasi:
// - Peringkat 1-5 (Putaran 2): 5 Home, 4 Away.
// - Peringkat 6-10 (Putaran 2): 4 Home, 5 Away.
// - Grup 1 / Grup A: Klausul Khusus Ramadhan untuk PERSIRAJA Banda Aceh
//   (PERSIRAJA wajib tandang pada 3 pekan awal Putaran 3: Pekan 19, 20, 21).
//   Terdapat 10 skenario penentuan lawan (a s/d j).
// - Grup 2 / Grup B: Matriks Standar (Pasal 7 Ayat 3 Bagian III).
// ==========================================================================

export const STANDARD_MATRIX = {
  1: { H: [4, 5, 6, 9, 10], A: [2, 3, 7, 8] },
  2: { H: [1, 4, 7, 8, 10], A: [3, 5, 6, 9] },
  3: { H: [1, 2, 6, 7, 9], A: [4, 5, 8, 10] },
  4: { H: [3, 5, 7, 8, 10], A: [1, 2, 6, 9] },
  5: { H: [2, 3, 6, 8, 9], A: [1, 4, 7, 10] },
  6: { H: [2, 4, 7, 10], A: [1, 3, 5, 8, 9] },
  7: { H: [1, 5, 8, 10], A: [2, 3, 4, 6, 9] },
  8: { H: [1, 3, 6, 9], A: [2, 4, 5, 7, 10] },
  9: { H: [2, 4, 6, 7], A: [1, 3, 5, 8, 10] },
  10: { H: [3, 4, 7, 8], A: [1, 2, 5, 6, 9] }
};

export const PERSIRAJA_SCENARIOS = {
  1: {
    letter: 'a',
    title: 'Skenario (a) - PERSIRAJA Peringkat 1',
    description: 'PERSIRAJA Banda Aceh memuncaki klasemen Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [4, 5, 6, 7, 10], A: [2, 3, 8, 9] },
      2: { H: [1, 3, 6, 7, 8], A: [4, 5, 9, 10] },
      3: { H: [1, 5, 6, 8, 9], A: [2, 4, 7, 10] },
      4: { H: [2, 3, 8, 9, 10], A: [1, 5, 6, 7] },
      5: { H: [2, 4, 7, 9, 10], A: [1, 3, 6, 8] },
      6: { H: [4, 5, 7, 10], A: [1, 2, 3, 8, 9] },
      7: { H: [3, 4, 8, 9], A: [1, 2, 5, 6, 10] },
      8: { H: [1, 5, 6, 10], A: [2, 3, 4, 7, 9] },
      9: { H: [1, 2, 6, 8], A: [3, 4, 5, 7, 10] },
      10: { H: [2, 3, 7, 9], A: [1, 4, 5, 6, 8] }
    }
  },
  2: {
    letter: 'b',
    title: 'Skenario (b) - PERSIRAJA Peringkat 2',
    description: 'PERSIRAJA Banda Aceh finis peringkat 2 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [2, 4, 6, 7, 8], A: [3, 5, 9, 10] },
      2: { H: [3, 4, 7, 8, 10], A: [1, 5, 6, 9] },
      3: { H: [1, 5, 7, 9, 10], A: [2, 4, 6, 8] },
      4: { H: [3, 5, 6, 8, 9], A: [1, 2, 7, 10] },
      5: { H: [1, 2, 6, 9, 10], A: [3, 4, 7, 8] },
      6: { H: [2, 3, 8, 10], A: [1, 4, 5, 7, 9] },
      7: { H: [4, 5, 6, 8], A: [1, 2, 3, 9, 10] },
      8: { H: [3, 5, 9, 10], A: [1, 2, 4, 6, 7] },
      9: { H: [1, 2, 6, 7], A: [3, 4, 5, 8, 10] },
      10: { H: [1, 4, 7, 9], A: [2, 3, 5, 6, 8] }
    }
  },
  3: {
    letter: 'c',
    title: 'Skenario (c) - PERSIRAJA Peringkat 3',
    description: 'PERSIRAJA Banda Aceh finis peringkat 3 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [2, 3, 7, 9, 10], A: [4, 5, 6, 8] },
      2: { H: [4, 5, 6, 9, 10], A: [1, 3, 7, 8] },
      3: { H: [2, 4, 6, 7, 8], A: [1, 5, 9, 10] },
      4: { H: [5, 7, 8, 9, 10], A: [1, 2, 3, 6] },
      5: { H: [1, 3, 6, 8, 9], A: [2, 4, 7, 10] },
      6: { H: [1, 4, 8, 9], A: [2, 3, 5, 7, 10] },
      7: { H: [2, 5, 6, 9], A: [1, 3, 4, 8, 10] },
      8: { H: [1, 2, 7, 10], A: [3, 4, 5, 6, 9] },
      9: { H: [3, 8, 10], A: [1, 2, 4, 5, 6, 7] },
      10: { H: [3, 5, 6, 7], A: [1, 2, 4, 8, 9] }
    }
  },
  4: {
    letter: 'd',
    title: 'Skenario (d) - PERSIRAJA Peringkat 4',
    description: 'PERSIRAJA Banda Aceh finis peringkat 4 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [4, 5, 8, 9, 10], A: [2, 3, 6, 7] },
      2: { H: [1, 3, 6, 7, 10], A: [4, 5, 8, 9] },
      3: { H: [1, 5, 6, 9, 10], A: [2, 4, 7, 8] },
      4: { H: [2, 3, 6, 7, 8], A: [1, 5, 9, 10] },
      5: { H: [2, 4, 7, 8, 9], A: [1, 3, 6, 10] },
      6: { H: [1, 5, 8, 10], A: [2, 3, 4, 7, 9] },
      7: { H: [1, 3, 6, 10], A: [2, 4, 5, 8, 9] },
      8: { H: [2, 3, 7, 9], A: [1, 4, 5, 6, 10] },
      9: { H: [2, 4, 6, 7], A: [1, 3, 5, 8, 10] },
      10: { H: [4, 5, 8, 9], A: [1, 2, 3, 6, 7] }
    }
  },
  5: {
    letter: 'e',
    title: 'Skenario (e) - PERSIRAJA Peringkat 5',
    description: 'PERSIRAJA Banda Aceh finis peringkat 5 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [3, 4, 6, 7, 9], A: [2, 5, 8, 10] },
      2: { H: [1, 3, 6, 8, 9], A: [4, 5, 7, 10] },
      3: { H: [4, 5, 7, 9, 10], A: [1, 2, 6, 8] },
      4: { H: [2, 5, 6, 8, 10], A: [1, 3, 7, 9] },
      5: { H: [1, 2, 7, 8, 10], A: [3, 4, 6, 9] },
      6: { H: [3, 5, 7, 10], A: [1, 2, 4, 8, 9] },
      7: { H: [2, 4, 8, 9], A: [1, 3, 5, 6, 10] },
      8: { H: [1, 3, 6, 9], A: [2, 4, 5, 7, 10] },
      9: { H: [4, 5, 6, 10], A: [1, 2, 3, 7, 8] },
      10: { H: [1, 2, 7, 8], A: [3, 4, 5, 6, 9] }
    }
  },
  6: {
    letter: 'f',
    title: 'Skenario (f) - PERSIRAJA Peringkat 6',
    description: 'PERSIRAJA Banda Aceh finis peringkat 6 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [2, 5, 7, 9, 10], A: [3, 4, 6, 8] },
      2: { H: [3, 5, 6, 8, 10], A: [1, 4, 7, 9] },
      3: { H: [1, 4, 7, 8, 9], A: [2, 5, 6, 10] },
      4: { H: [1, 2, 6, 7, 9], A: [3, 5, 8, 10] },
      5: { H: [3, 4, 6, 8, 10], A: [1, 2, 7, 9] },
      6: { H: [1, 3, 7, 9], A: [2, 4, 5, 8, 10] },
      7: { H: [2, 5, 8, 9], A: [1, 3, 4, 6, 10] },
      8: { H: [1, 4, 6, 10], A: [2, 3, 5, 7, 9] },
      9: { H: [2, 5, 8, 10], A: [1, 3, 4, 6, 7] },
      10: { H: [3, 4, 6, 8], A: [1, 2, 5, 7, 9] }
    }
  },
  7: {
    letter: 'g',
    title: 'Skenario (g) - PERSIRAJA Peringkat 7',
    description: 'PERSIRAJA Banda Aceh finis peringkat 7 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [2, 3, 6, 8, 9], A: [4, 5, 7, 10] },
      2: { H: [4, 5, 6, 7, 10], A: [1, 3, 8, 9] },
      3: { H: [2, 4, 6, 7, 9], A: [1, 5, 8, 10] },
      4: { H: [1, 5, 8, 9, 10], A: [2, 3, 6, 7] },
      5: { H: [1, 3, 7, 8, 10], A: [2, 4, 6, 9] },
      6: { H: [4, 5, 7, 10], A: [1, 2, 3, 8, 9] },
      7: { H: [1, 4, 8, 9], A: [2, 3, 5, 6, 10] },
      8: { H: [2, 3, 6, 9], A: [1, 4, 5, 7, 10] },
      9: { H: [2, 5, 6, 10], A: [1, 3, 4, 7, 8] },
      10: { H: [1, 3, 7, 8], A: [2, 4, 5, 6, 9] }
    }
  },
  8: {
    letter: 'h',
    title: 'Skenario (h) - PERSIRAJA Peringkat 8',
    description: 'PERSIRAJA Banda Aceh finis peringkat 8 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [3, 5, 6, 7, 9], A: [2, 4, 8, 10] },
      2: { H: [1, 3, 6, 8, 10], A: [4, 5, 7, 9] },
      3: { H: [4, 5, 7, 8, 9], A: [1, 2, 6, 10] },
      4: { H: [1, 2, 6, 8, 10], A: [3, 5, 7, 9] },
      5: { H: [2, 4, 7, 9, 10], A: [1, 3, 6, 8] },
      6: { H: [3, 5, 8, 10], A: [1, 2, 4, 7, 9] },
      7: { H: [2, 4, 6, 9], A: [1, 3, 5, 8, 10] },
      8: { H: [1, 5, 7, 9], A: [2, 3, 4, 6, 10] },
      9: { H: [2, 4, 6, 10], A: [1, 3, 5, 7, 8] },
      10: { H: [1, 3, 7, 8], A: [2, 4, 5, 6, 9] }
    }
  },
  9: {
    letter: 'i',
    title: 'Skenario (i) - PERSIRAJA Peringkat 9',
    description: 'PERSIRAJA Banda Aceh finis peringkat 9 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [3, 4, 7, 8, 9], A: [2, 5, 6, 10] },
      2: { H: [1, 5, 6, 8, 9], A: [3, 4, 7, 10] },
      3: { H: [2, 4, 7, 8, 9], A: [1, 5, 6, 10] },
      4: { H: [2, 5, 6, 7, 9], A: [1, 3, 8, 10] },
      5: { H: [1, 3, 6, 8, 10], A: [2, 4, 7, 9] },
      6: { H: [1, 2, 3, 10], A: [4, 5, 7, 8, 9] },
      7: { H: [2, 4, 5, 9], A: [1, 3, 6, 8, 10] },
      8: { H: [2, 4, 7, 10], A: [1, 3, 5, 6, 9] },
      9: { H: [4, 5, 6, 8], A: [1, 2, 3, 7, 10] },
      10: { H: [1, 3, 7, 9], A: [2, 4, 5, 6, 8] }
    }
  },
  10: {
    letter: 'j',
    title: 'Skenario (j) - PERSIRAJA Peringkat 10',
    description: 'PERSIRAJA Banda Aceh finis peringkat 10 di Putaran 2. Bertandang di Pekan 19, 20, dan 21.',
    matrix: {
      1: { H: [3, 4, 8, 9, 10], A: [2, 5, 6, 7] },
      2: { H: [1, 5, 7, 8, 9], A: [3, 4, 6, 10] },
      3: { H: [4, 6, 8, 9], A: [1, 2, 5, 7, 10] },
      4: { H: [5, 6, 7, 10], A: [1, 2, 3, 8, 9] },
      5: { H: [1, 3, 6, 7, 10], A: [2, 4, 8, 9] },
      6: { H: [1, 2, 8, 9], A: [3, 4, 5, 7, 10] },
      7: { H: [1, 3, 6, 10], A: [2, 4, 5, 8, 9] },
      8: { H: [4, 5, 7, 10], A: [1, 2, 3, 6, 9] },
      9: { H: [4, 5, 6, 7, 8], A: [1, 2, 3, 10] },
      10: { H: [2, 3, 6, 9], A: [1, 4, 5, 7, 8] }
    }
  }
};

/**
 * Extract the 45 directed match pairings from the matrix
 */
export function getMatchPairs(isGroupA, persirajaRank) {
  let mat;
  let letter = 'standar';
  let scenarioMeta = null;

  if (isGroupA && persirajaRank && PERSIRAJA_SCENARIOS[persirajaRank]) {
    scenarioMeta = PERSIRAJA_SCENARIOS[persirajaRank];
    mat = scenarioMeta.matrix;
    letter = scenarioMeta.letter;
  } else {
    mat = STANDARD_MATRIX;
  }

  const pairs = [];
  for (let i = 1; i <= 9; i++) {
    for (let j = i + 1; j <= 10; j++) {
      const iHome = mat[i] && mat[i].H && mat[i].H.includes(j);
      const iAway = mat[i] && mat[i].A && mat[i].A.includes(j);
      let homeRank, awayRank;

      if (iHome && !iAway) {
        homeRank = i; awayRank = j;
      } else if (iAway && !iHome) {
        homeRank = j; awayRank = i;
      } else if (mat[j] && mat[j].H && mat[j].H.includes(i)) {
        homeRank = j; awayRank = i;
      } else {
        homeRank = i; awayRank = j;
      }
      pairs.push({ homeRank, awayRank });
    }
  }

  return { pairs, letter, scenarioMeta };
}

/**
 * Partition 45 matches into 9 rounds of 5 matches each.
 * Constraint: If persirajaRank is specified, Persiraja MUST NOT play home in rounds 0, 1, 2 (Pekan 19, 20, 21).
 */
export function partitionMatchesIntoWeeks(pairs, persirajaRank = null) {
  const rounds = Array.from({ length: 9 }, () => []);
  const teamInRound = Array.from({ length: 9 }, () => new Set());

  // Prioritize matches involving Persiraja: away matches first, then normal, then home matches
  const sortedPairs = [...pairs].sort((a, b) => {
    if (!persirajaRank) return 0;
    const aIsP_Away = a.awayRank === persirajaRank ? 1 : 0;
    const bIsP_Away = b.awayRank === persirajaRank ? 1 : 0;
    if (aIsP_Away !== bIsP_Away) return bIsP_Away - aIsP_Away;
    const aIsP_Home = a.homeRank === persirajaRank ? 1 : 0;
    const bIsP_Home = b.homeRank === persirajaRank ? 1 : 0;
    return aIsP_Home - bIsP_Home;
  });

  function backtrack(matchIdx) {
    if (matchIdx === sortedPairs.length) return true;

    for (let r = 0; r < 9; r++) {
      if (rounds[r].length >= 5) continue;
      const m = sortedPairs[matchIdx];

      // In rounds 0, 1, 2 (Pekan 19, 20, 21), Persiraja cannot play home
      if (persirajaRank && r < 3) {
        if (m.homeRank === persirajaRank) continue;
      }

      if (teamInRound[r].has(m.homeRank) || teamInRound[r].has(m.awayRank)) continue;

      rounds[r].push(m);
      teamInRound[r].add(m.homeRank);
      teamInRound[r].add(m.awayRank);

      if (backtrack(matchIdx + 1)) return true;

      rounds[r].pop();
      teamInRound[r].delete(m.homeRank);
      teamInRound[r].delete(m.awayRank);
    }
    return false;
  }

  const success = backtrack(0);
  if (!success) {
    console.error('[Regulasi R3] Gagal menyusun jadwal 9 pekan secara otomatis.');
    return null;
  }
  return rounds;
}

// Approximate weekend match dates for Putaran 3 (Feb-Apr 2027)
const ROUND3_WEEK_DATES = {
  19: { tanggal: 'Jumat, 05 Februari 2027', hariTambahan: ['Sabtu, 06 Februari 2027', 'Minggu, 07 Februari 2027'] },
  20: { tanggal: 'Jumat, 12 Februari 2027', hariTambahan: ['Sabtu, 13 Februari 2027', 'Minggu, 14 Februari 2027'] },
  21: { tanggal: 'Jumat, 19 Februari 2027', hariTambahan: ['Sabtu, 20 Februari 2027', 'Minggu, 21 Februari 2027'] },
  22: { tanggal: 'Jumat, 26 Februari 2027', hariTambahan: ['Sabtu, 27 Februari 2027', 'Minggu, 28 Februari 2027'] },
  23: { tanggal: 'Jumat, 05 Maret 2027', hariTambahan: ['Sabtu, 06 Maret 2027', 'Minggu, 07 Maret 2027'] },
  24: { tanggal: 'Jumat, 12 Maret 2027', hariTambahan: ['Sabtu, 13 Maret 2027', 'Minggu, 14 Maret 2027'] },
  25: { tanggal: 'Jumat, 19 Maret 2027', hariTambahan: ['Sabtu, 20 Maret 2027', 'Minggu, 21 Maret 2027'] },
  26: { tanggal: 'Jumat, 09 April 2027', hariTambahan: ['Sabtu, 10 April 2027', 'Minggu, 11 April 2027'] },
  27: { tanggal: 'Minggu, 18 April 2027', hariTambahan: ['Minggu, 18 April 2027'] } // Pekan penutup serentak
};

/**
 * Determine the official regulatory reason for a Putaran 3 match pairing
 * based on Pasal 7 Ayat 3 & 4 Regulasi PSSI & Lampiran Skenario.
 *
 * @param {Object} match - { pekan, grup, timHome, timAway, seedHome, seedAway }
 * @param {Object} scenarioInfo - { isGroupA, persirajaRank, letter, title, description }
 * @returns {Object} { tag, rule, text, isRamadhan }
 */
export function getMatchRegulatoryReason(match, scenarioInfo = {}) {
  const { pekan, seedHome, seedAway, timHome, timAway, grup } = match;
  const isGroupA = (grup && (grup.toLowerCase().includes('grup a') || grup.toLowerCase().includes('grup 1'))) || scenarioInfo?.isGroupA;
  const isPersirajaHome = timHome && timHome.toUpperCase().includes('PERSIRAJA');
  const isPersirajaAway = timAway && timAway.toUpperCase().includes('PERSIRAJA');
  const letter = scenarioInfo?.letter || 'standar';
  const persirajaRank = scenarioInfo?.persirajaRank || 7;

  // 1. Klausul Khusus Ramadhan (Pasal 7 Ayat 4 - Pekan 19, 20, 21 untuk PERSIRAJA di Grup A)
  if (isGroupA && (isPersirajaHome || isPersirajaAway) && pekan >= 19 && pekan <= 21) {
    if (isPersirajaAway) {
      return {
        tag: 'Klausul Ramadhan',
        rule: `Pasal 7 Ayat 4 & Skenario (${letter})`,
        text: `Klausul Khusus Ramadhan (Pasal 7 Ayat 4): PERSIRAJA Banda Aceh (Seed #${seedAway}) wajib bertanding tandang pada 3 pekan awal (Pekan 19–21). Berdasarkan Skenario (${letter}), ${timHome} (Seed #${seedHome}) bertindak sebagai tuan rumah.`,
        isRamadhan: true
      };
    }
  }

  // 2. Persiraja Home setelah Ramadhan (Pekan 22-27)
  if (isGroupA && isPersirajaHome && pekan > 21) {
    const quotaHome = persirajaRank <= 5 ? 5 : 4;
    return {
      tag: 'Kompensasi Ramadhan',
      rule: `Pasal 7 Ayat 4 & Skenario (${letter})`,
      text: `Skenario (${letter}) Pasal 7 Ayat 4: Setelah menyelesaikan kewajiban 3 laga tandang pembuka Ramadhan, PERSIRAJA (Seed #${seedHome}) memperoleh alokasi kandang di Pekan ${pekan} guna menggenapi kuota ${quotaHome} laga home Putaran 3 melawan ${timAway} (Seed #${seedAway}).`,
      isRamadhan: true
    };
  }

  // 3. Hak Tuan Rumah Top 5 (Seed 1-5 vs Seed 6-10)
  if (seedHome <= 5 && seedAway >= 6) {
    const ruleLabel = isGroupA ? `Pasal 7 Ayat 3 & Skenario (${letter})` : 'Pasal 7 Ayat 3 Bagian III';
    return {
      tag: 'Kuota Home Top 5',
      rule: ruleLabel,
      text: `Pasal 7 Ayat 3: ${timHome} (Seed #${seedHome}, Top 5 Putaran 2) berhak atas alokasi 5 laga kandang. Status tuan rumah diberikan pada pertemuan ke-3 melawan tim peringkat bawah ${timAway} (Seed #${seedAway}) setelah berbagi 1H & 1A di Putaran 1 & 2.`,
      isRamadhan: false
    };
  }

  // 4. Distribusi Matriks untuk Bottom 5 (Seed 6-10 vs Seed 1-5)
  if (seedHome >= 6 && seedAway <= 5) {
    const ruleLabel = isGroupA ? `Pasal 7 Ayat 3 & Skenario (${letter})` : 'Pasal 7 Ayat 3 Matriks Standar';
    return {
      tag: 'Distribusi Matriks PSSI',
      rule: ruleLabel,
      text: `Matriks Regulasi Babak Pendahuluan: ${timHome} (Seed #${seedHome}) dialokasikan sebagai tuan rumah atas tim unggulan ${timAway} (Seed #${seedAway}) guna menggenapi kuota 4 laga kandang klub peringkat 6–10 sesuai jadwal baku PSSI.`,
      isRamadhan: false
    };
  }

  // 5. Duel Sesama Top 5 (Seed 1-5 vs Seed 1-5)
  if (seedHome <= 5 && seedAway <= 5) {
    const ruleLabel = isGroupA ? `Pasal 7 Ayat 3 & Skenario (${letter})` : 'Pasal 7 Ayat 3 Bagian III';
    return {
      tag: 'Duel Pot Unggulan',
      rule: ruleLabel,
      text: `Duel Pot Unggulan: Pertemuan sesama Top 5 antara ${timHome} (Seed #${seedHome}) vs ${timAway} (Seed #${seedAway}). Hak tuan rumah ditentukan oleh matriks regulasi Babak Pendahuluan untuk menjaga keseimbangan 5 laga kandang kedua tim.`,
      isRamadhan: false
    };
  }

  // 6. Duel Sesama Bottom 5 (Seed 6-10 vs Seed 6-10)
  if (seedHome >= 6 && seedAway >= 6) {
    const ruleLabel = isGroupA ? `Pasal 7 Ayat 3 & Skenario (${letter})` : 'Pasal 7 Ayat 3 Bagian III';
    return {
      tag: 'Rotasi Pot Bawah',
      rule: ruleLabel,
      text: `Rotasi Pot Bawah: Pertemuan peringkat 6–10 antara ${timHome} (Seed #${seedHome}) vs ${timAway} (Seed #${seedAway}). Status kandang ditentukan matriks regulasi guna menjamin kuota 4 laga kandang kedua tim.`,
      isRamadhan: false
    };
  }

  return {
    tag: 'Regulasi Putaran 3',
    rule: 'Pasal 7 Ayat 3 & 4',
    text: `Penetapan tuan rumah ${timHome} (Seed #${seedHome}) vs ${timAway} (Seed #${seedAway}) berdasarkan Matriks Regulasi Babak Pendahuluan Putaran 3.`,
    isRamadhan: false
  };
}

/**
 * Generate full Putaran 3 fixture data structure (Pekan 19 to 27)
 * based on standings after Week 18.
 *
 * @param {Array} standingsAfterWeek18 - Array of club objects sorted by rank 1..10
 * @param {string} groupName - 'Grup A' or 'Grup B'
 * @param {Object} clubMetaMap - { [clubName]: { logo, stadion } }
 * @returns {Object} { weeks: Array, scenarioInfo: Object }
 */
export function generateRound3Fixtures(standingsAfterWeek18, groupName, clubMetaMap = {}) {
  const isGroupA = groupName.toLowerCase().includes('grup a') || groupName.toLowerCase().includes('grup 1');
  
  // 1. Identify ranks 1..10
  // Index 0 -> Rank 1, Index 9 -> Rank 10
  const rankMap = {};
  let persirajaRank = null;

  standingsAfterWeek18.slice(0, 10).forEach((t, idx) => {
    const rank = idx + 1;
    rankMap[rank] = t;
    if (t.klub && t.klub.toUpperCase().includes('PERSIRAJA')) {
      persirajaRank = rank;
    }
  });

  // Default persirajaRank fallback if not found in list
  if (isGroupA && !persirajaRank) {
    persirajaRank = 7; // Fallback to current real ranking
  }

  // 2. Fetch match pairs according to official regulation
  const { pairs, letter, scenarioMeta } = getMatchPairs(isGroupA, persirajaRank);

  // 3. Prepare scenario metadata
  let scenarioInfo = null;
  if (isGroupA) {
    scenarioInfo = {
      isGroupA: true,
      persirajaRank,
      letter,
      title: scenarioMeta ? scenarioMeta.title : `Skenario (${letter})`,
      description: scenarioMeta
        ? scenarioMeta.description
        : `PERSIRAJA Banda Aceh (Peringkat ${persirajaRank}) bermain tandang di Pekan 19, 20, dan 21.`
    };
  } else {
    scenarioInfo = {
      isGroupA: false,
      persirajaRank: null,
      letter: 'standar',
      title: 'Matriks Standar Babak Pendahuluan',
      description: 'Penentuan jadwal Putaran 3 berdasarkan Pasal 7 Ayat 3 Bagian III Regulasi PSSI (5H/4A untuk Top 5, 4H/5A untuk Bottom 5).'
    };
  }

  // 4. Partition 45 matches into 9 matchweeks (Pekan 19..27)
  const partitionedRounds = partitionMatchesIntoWeeks(pairs, isGroupA ? persirajaRank : null);
  if (!partitionedRounds) {
    throw new Error('Gagal menyusun penjadwalan Putaran 3 sesuai regulasi.');
  }

  // 5. Construct fixture objects matching the existing data structure
  const generatedWeeks = [];

  partitionedRounds.forEach((roundMatches, rIdx) => {
    const pekanNum = 19 + rIdx;
    const dateConfig = ROUND3_WEEK_DATES[pekanNum] || { tanggal: `Pekan ${pekanNum} 2027`, hariTambahan: [] };
    const dateList = [dateConfig.tanggal, ...(dateConfig.hariTambahan || [])];

    const matchesForPekan = roundMatches.map((m, mIdx) => {
      const homeTeam = rankMap[m.homeRank];
      const awayTeam = rankMap[m.awayRank];

      const homeName = homeTeam ? homeTeam.klub : `Peringkat ${m.homeRank}`;
      const awayName = awayTeam ? awayTeam.klub : `Peringkat ${m.awayRank}`;

      const homeMeta = clubMetaMap[homeName] || {};
      const awayMeta = clubMetaMap[awayName] || {};

      const matchDate = dateList[mIdx % dateList.length];
      const matchTime = pekanNum === 27 ? '15:30' : (mIdx % 2 === 0 ? '15:30' : '19:00');

      const matchObj = {
        pekan: pekanNum,
        grup: groupName,
        tanggal: matchDate,
        waktu: matchTime,
        status: 'UPCOMING',
        timHome: homeName,
        logoHome: homeMeta.logo || (homeTeam && homeTeam.logo) || '',
        skorHome: null,
        skorAway: null,
        timAway: awayName,
        logoAway: awayMeta.logo || (awayTeam && awayTeam.logo) || '',
        stadion: homeMeta.stadion || 'Stadion Tuan Rumah',
        siaran: 'Vidio / Indosiar',
        urlDetail: null,
        isSimulated: true,
        putaran: 3,
        seedHome: m.homeRank,
        seedAway: m.awayRank
      };

      // Attach regulatory reasoning for post-generation modal display
      matchObj.regulatoryReason = getMatchRegulatoryReason(matchObj, scenarioInfo);

      return matchObj;
    });

    generatedWeeks.push({
      pekan: pekanNum,
      pertandingan: matchesForPekan
    });
  });

  return {
    weeks: generatedWeeks,
    scenarioInfo
  };
}

