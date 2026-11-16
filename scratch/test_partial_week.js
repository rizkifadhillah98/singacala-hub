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

function simulateWeek10Saturday(groupName) {
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

  // Clone fixtures and simulate 1 FT match in week 10 for Grup A on Saturday afternoon
  const fixturesClone = JSON.parse(JSON.stringify(fixturesData));
  const week10 = fixturesClone.find(w => w.pekan === 10);
  
  // Set the first Grup A match in week 10 to FT:
  // e.g. SEMEN PADANG FC 2 - 0 PSIS SEMARANG
  const match1 = week10.pertandingan.find(m => m.grup.toLowerCase() === groupName.toLowerCase());
  match1.status = 'FT';
  match1.skorHome = '2';
  match1.skorAway = '0';

  console.log('Simulating 1 match finished on Saturday:');
  console.log(`${match1.timHome} vs ${match1.timAway} -> ${match1.skorHome} - ${match1.skorAway} (FT)`);
  console.log('Other matches in week 10 remain UPCOMING.\n');

  // Active weeks with FT matches
  const activeWeeks = fixturesClone
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

  console.log('Active weeks count now:', activeWeeks.length);
  console.log('Latest active week:', activeWeeks[activeWeeks.length - 1].pekan);

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

        if (Number(m.skorHome) > Number(m.skorAway)) {
          home.w++;
          home.pts += 3;
          away.l++;
          homeRes = 'W';
          awayRes = 'L';
        } else if (Number(m.skorHome) < Number(m.skorAway)) {
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
          isHome: true,
          score: `${m.skorHome} - ${m.skorAway}`,
          result: homeRes,
        };

        weeklyMatches[awayClub] = {
          opponent: homeClub,
          isHome: false,
          score: `${m.skorAway} - ${m.skorHome}`,
          result: awayRes,
        };
      }
    });

    // Dynamic ranking: Pts -> GD -> GF -> tiebreaker with officialPosMap
    const sorted = Object.values(stats).sort((a, b) => {
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

  console.log('\n--- Standings at Week 10 (After Saturday 1 Match) ---');
  const week10Standings = clubList.map(c => {
    const t = trajectory[c].find(x => x.pekan === 10);
    return { klub: c, rank: t.rank, pts: t.pts, gd: t.gd, p: t.p, match: t.match };
  }).sort((a,b) => a.rank - b.rank);

  week10Standings.forEach(t => {
    const matchInfo = t.match ? `[Played: ${t.match.score} vs ${t.match.opponent} (${t.match.result})]` : '[Belum main]';
    console.log(`${t.rank}. ${t.klub.padEnd(20)} Pts: ${String(t.pts).padStart(2)} | P: ${t.p} | GD: ${String(t.gd).padStart(2)} | ${matchInfo}`);
  });
}

simulateWeek10Saturday('Grup A');

