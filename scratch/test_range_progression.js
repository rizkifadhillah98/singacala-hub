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

function testCompute(groupName, selectedWeekRange) {
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

  const allWeeks = fixturesData.map((w) => w.pekan).sort((a, b) => a - b);

  // Active weeks with FT matches
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

  const playedWeekNumbers = activeWeeks.map((w) => w.pekan);
  const latestPlayedWeek = playedWeekNumbers.length > 0 ? playedWeekNumbers[playedWeekNumbers.length - 1] : 0;

  // Determine target weeks for the selected range
  let targetWeeks = [];
  if (selectedWeekRange === 'ALL') {
    targetWeeks = allWeeks.length > 0 ? allWeeks : Array.from({ length: 27 }, (_, i) => i + 1);
  } else if (selectedWeekRange === 'R1') {
    targetWeeks = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  } else if (selectedWeekRange === 'R2') {
    targetWeeks = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  } else if (selectedWeekRange === 'R3') {
    targetWeeks = [19, 20, 21, 22, 23, 24, 25, 26, 27];
  } else {
    // Default: 'CURRENT' (only played weeks)
    targetWeeks = [...playedWeekNumbers];
  }

  // Check if range has played matches
  const playedInRange = playedWeekNumbers.filter((p) => targetWeeks.includes(p));
  if (playedInRange.length === 0) {
    return {
      groupName,
      clubs: clubList,
      logoMap,
      emptyRange: true,
      rangeMode: selectedWeekRange,
      weeks: targetWeeks,
      playedWeekNumbers,
      latestPlayedWeek,
      trajectory: {},
    };
  }

  // Track cumulative stats
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
    const weeklyMatches = {};
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

        let homeRes = 'D';
        let awayRes = 'D';

        if (m.skorHome > m.skorAway) {
          home.w++;
          home.pts += 3;
          away.l++;
          homeRes = 'W';
          awayRes = 'L';
        } else if (m.skorHome < m.skorAway) {
          away.w++;
          away.pts += 3;
          home.l++;
          homeRes = 'L';
          awayRes = 'W';
        } else {
          home.d++;
          home.pts += 1;
          away.d++;
          away.pts += 1;
          homeRes = 'D';
          awayRes = 'D';
        }

        weeklyMatches[homeClub] = {
          opponent: awayClub,
          logoOpponent: logoMap[awayClub] || m.logoAway,
          isHome: true,
          score: `${m.skorHome} - ${m.skorAway}`,
          result: homeRes,
          stadion: m.stadion,
        };

        weeklyMatches[awayClub] = {
          opponent: homeClub,
          logoOpponent: logoMap[homeClub] || m.logoHome,
          isHome: false,
          score: `${m.skorAway} - ${m.skorHome}`,
          result: awayRes,
          stadion: m.stadion,
        };
      }
    });

    const sorted = Object.values(stats).sort((a, b) => {
      if (isLastWeek && officialPosMap[a.klub] && officialPosMap[b.klub]) {
        return officialPosMap[a.klub] - officialPosMap[b.klub];
      }
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return (officialPosMap[a.klub] || 0) - (officialPosMap[b.klub] || 0);
    });

    sorted.forEach((team, index) => {
      const match = weeklyMatches[team.klub] || null;
      trajectory[team.klub].push({
        pekan: w.pekan,
        rank: index + 1,
        pts: team.pts,
        gd: team.gd,
        gf: team.gf,
        ga: team.ga,
        p: team.p,
        match,
      });
    });
  });

  return {
    groupName,
    clubs: clubList,
    logoMap,
    weeks: targetWeeks,
    playedWeekNumbers,
    latestPlayedWeek,
    trajectory,
    rangeMode: selectedWeekRange,
    emptyRange: false,
  };
}

console.log('CURRENT:', testCompute('Grup A', 'CURRENT').weeks);
console.log('ALL:', testCompute('Grup A', 'ALL').weeks.length, 'weeks');
console.log('R1:', testCompute('Grup A', 'R1').weeks);
console.log('R2:', testCompute('Grup A', 'R2').emptyRange);
console.log('R3:', testCompute('Grup A', 'R3').emptyRange);

const allRes = testCompute('Grup A', 'ALL'); const pts = allRes.trajectory['PSPS PEKANBARU'].filter(i => allRes.weeks.includes(i.pekan)).map(i => ({ wIdx: allRes.weeks.indexOf(i.pekan), pekan: i.pekan, rank: i.rank })); console.log('PSPS points in ALL:', pts);