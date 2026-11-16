const fs = require('fs');

const fixturesData = JSON.parse(fs.readFileSync('data/jadwal_dan_hasil.json'));
const standingsAll = JSON.parse(fs.readFileSync('data/klasemen.json'));

const CLUB_NAME_CANONICAL = {
  'PERSIKU KUDUS': 'PERSIKU',
  'PERSIBA BALIKPAPAN': 'PERSIBA',
};

function matchClubs(name1, name2) {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim().replace(/fc|city/g, '').trim();
  const n2 = name2.toLowerCase().trim().replace(/fc|city/g, '').trim();
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

function resolveClubName(rawName, clubList = []) {
  if (!rawName) return '';
  if (clubList.includes(rawName)) return rawName;
  if (CLUB_NAME_CANONICAL[rawName]) return CLUB_NAME_CANONICAL[rawName];
  const matched = clubList.find((c) => matchClubs(c, rawName));
  return matched || rawName;
}

['Grup A', 'Grup B'].forEach(groupName => {
  const currentGroupStandingsObj = standingsAll.find(g => g.grup.toLowerCase() === groupName.toLowerCase());
  const currentGroupStandings = currentGroupStandingsObj.klasemen;
  const clubList = currentGroupStandings.map((t) => t.klub);
  const logoMap = {};
  const penaltyMap = {};
  const officialPosMap = {};

  currentGroupStandings.forEach((t) => {
    logoMap[t.klub] = t.logo;
    penaltyMap[t.klub] = Number(t.catatanPenalti) || 0;
    officialPosMap[t.klub] = Number(t.posisi) || 99;
  });

  const activeWeeks = fixturesData
    .filter((w) =>
      w.pertandingan &&
      w.pertandingan.some(
        (m) =>
          m.status === 'FT' &&
          m.grup &&
          m.grup.toLowerCase() === groupName.toLowerCase()
      )
    )
    .sort((a, b) => a.pekan - b.pekan);

  const stats = {};
  const trajectory = {};
  clubList.forEach((c) => {
    stats[c] = {
      klub: c,
      pts: penaltyMap[c] || 0,
      p: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
    };
    trajectory[c] = [];
  });

  activeWeeks.forEach((w, wIdx) => {
    const isLastWeek = wIdx === activeWeeks.length - 1;

    w.pertandingan.forEach((m) => {
      if (m.status !== 'FT') return;
      if (!m.grup || m.grup.toLowerCase() !== groupName.toLowerCase()) return;

      const homeClub = resolveClubName(m.timHome, clubList);
      const awayClub = resolveClubName(m.timAway, clubList);
      const home = stats[homeClub];
      const away = stats[awayClub];

      if (home && away) {
        home.p++;
        away.p++;
        home.gf += Number(m.skorHome) || 0;
        home.ga += Number(m.skorAway) || 0;
        home.gd = home.gf - home.ga;

        away.gf += Number(m.skorAway) || 0;
        away.ga += Number(m.skorHome) || 0;
        away.gd = away.gf - away.ga;

        if (Number(m.skorHome) > Number(m.skorAway)) {
          home.w++; home.pts += 3;
          away.l++;
        } else if (Number(m.skorHome) < Number(m.skorAway)) {
          away.w++; away.pts += 3;
          home.l++;
        } else {
          home.d++; home.pts += 1;
          away.d++; away.pts += 1;
        }
      }
    });

    const sorted = Object.values(stats).sort((a, b) => {
      // 1. Higher points always takes precedence
      if (b.pts !== a.pts) return b.pts - a.pts;

      // 2. When points are tied, if final week use official league tiebreaker / head-to-head
      if (isLastWeek && officialPosMap[a.klub] && officialPosMap[b.klub]) {
        return officialPosMap[a.klub] - officialPosMap[b.klub];
      }

      // 3. Otherwise Goal Difference & Goals For
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return (officialPosMap[a.klub] || 0) - (officialPosMap[b.klub] || 0);
    });

    sorted.forEach((team, index) => {
      trajectory[team.klub].push({
        pekan: w.pekan,
        rank: index + 1,
        pts: team.pts,
      });
    });
  });

  console.log('=== ' + groupName + ' ===');
  let allMatch = true;
  clubList.forEach(c => {
    const t = trajectory[c].find(x => x.pekan === 9);
    const expected = currentGroupStandings.find(s => s.klub === c);
    const isSame = t && expected && t.rank === expected.posisi;
    if (!isSame) allMatch = false;
    console.log(c.padEnd(22) + ' -> Chart Rank: ' + (t ? t.rank : '?') + ' | Official Pos: ' + (expected ? expected.posisi : '?') + ' | ' + (isSame ? 'MATCH' : 'MISMATCH'));
  });
  console.log('Group Match All:', allMatch);
});
