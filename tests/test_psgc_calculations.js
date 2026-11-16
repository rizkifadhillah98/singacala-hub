// ==========================================================================
// TEST SUITE: PSGC CIAMIS ODDS & MATHEMATICAL CALCULATIONS
// Verifies Monte Carlo 1,000 runs, Magic Numbers, Fixtures Classification,
// 6-Pointer Rivalries, and Immutability of Official Data.
// ==========================================================================

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('=== TEST SUITE: PSGC ODDS & MATHEMATICAL CALCULATIONS ===\n');

  // Load official data directly for test fixture
  const klasemenData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/klasemen.json'), 'utf8'));
  const fixturesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/jadwal_dan_hasil.json'), 'utf8'));
  const grupAKlasemen = klasemenData.find(g => g.grup === 'Grup A').klasemen;

  // Import target module
  const { calculatePsgcOdds } = await import('../public/js/modules/psgc-odds.js');

  // --------------------------------------------------------------------------
  // [Test 1] Hero Metrics & Standings Accuracy
  // --------------------------------------------------------------------------
  console.log('[Test 1] Testing Hero Metrics & Standings Baseline...');
  const odds = calculatePsgcOdds(grupAKlasemen, fixturesData);
  const { hero, probabilities, magicNumbers, fixtures } = odds;

  assert.strictEqual(hero.currentRank, 9, 'PSGC rank must be 9');
  assert.strictEqual(hero.currentPoints, 7, 'PSGC points must be 7');
  assert.strictEqual(hero.currentGd, -7, 'PSGC GD must be -7');
  assert.strictEqual(hero.matchesPlayed, 9, 'PSGC matches played must be 9');
  assert.strictEqual(hero.matchesRemaining, 18, 'PSGC matches remaining must be 18');
  assert.strictEqual(hero.round2MatchesRemaining, 9, 'Round 2 matches remaining must be 9');
  assert.strictEqual(hero.round3MatchesRemaining, 9, 'Round 3 matches remaining must be 9');
  assert.strictEqual(hero.maxPossiblePoints, 61, 'PSGC max achievable points must be 7 + (18 * 3) = 61');
  assert.strictEqual(hero.gapToSafeZone, 1, 'Deficit to P8 (Adhyaksa FC, 8 pts) must be 1 pt');
  assert.strictEqual(hero.leadOverDirectRelegation, 8, 'Lead over P10 (Persiku, -1 pt) must be +8 pts');
  assert.deepStrictEqual(hero.record, { w: 2, d: 1, l: 6 }, 'PSGC record must be 2W 1D 6L');
  console.log('✓ Hero metrics match official data exactly (P9, 7 pts, GD -7, max 61 pts, -1 to P8, +8 to P10)');

  // --------------------------------------------------------------------------
  // [Test 2] Mathematical Magic Numbers
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Testing Mathematical Magic Numbers...');
  // Direct Relegation (P10) Elimination
  assert.strictEqual(magicNumbers.directSafety.targetPoints, 54, 'P10 Elimination target must be 54 pts (-1 + 18*3 + 1)');
  assert.strictEqual(magicNumbers.directSafety.ptsNeeded, 47, 'Points needed for P10 elimination must be 47 (54 - 7)');
  assert.strictEqual(magicNumbers.directSafety.winsNeeded, 16, 'Wins needed for P10 elimination must be 16 (Math.ceil(47 / 3))');
  assert.strictEqual(magicNumbers.directSafety.cushion, 8, 'Safety cushion over P10 must be +8 pts');

  // Safe Zone (P8) Lock
  assert.strictEqual(magicNumbers.fullSafety.targetPoints, 28, 'Safe zone benchmark target must be 28 pts');
  assert.strictEqual(magicNumbers.fullSafety.ptsNeeded, 21, 'Points needed for safe zone must be 21 (28 - 7)');
  assert.strictEqual(magicNumbers.fullSafety.winsNeeded, 7, 'Wins needed for safe zone must be 7 (Math.ceil(21 / 3))');

  // Promotion (P2) Challenge
  assert.strictEqual(magicNumbers.promotion.targetPoints, 53, 'Promotion benchmark target must be 53 pts');
  assert.strictEqual(magicNumbers.promotion.ptsNeeded, 46, 'Points needed for promotion must be 46 (53 - 7)');
  assert.strictEqual(magicNumbers.promotion.winsNeeded, 16, 'Wins needed for promotion must be 16 (Math.ceil(46 / 3))');
  console.log('✓ Magic numbers verified: P10 safety = 54 pts (need 47 pts/16 wins), Full safety = 28 pts (need 21 pts/7 wins)');

  // --------------------------------------------------------------------------
  // [Test 3] Putaran 2 Fixtures Integrity & Classification
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Testing Putaran 2 Fixtures Schedule & Tactical Classification...');
  assert.strictEqual(fixtures.length, 9, 'Must have exactly 9 Putaran 2 fixtures for PSGC');

  const homeMatches = fixtures.filter(f => f.isHome);
  const awayMatches = fixtures.filter(f => !f.isHome);
  assert.strictEqual(homeMatches.length, 5, 'Must have 5 home matches');
  assert.strictEqual(awayMatches.length, 4, 'Must have 4 away matches');

  // Verify all 5 home venues are Stadion Galuh Ciamis
  homeMatches.forEach(m => {
    assert.strictEqual(m.venue, 'Stadion Galuh Ciamis', `Home match Pekan ${m.pekan} venue must be Stadion Galuh Ciamis`);
  });

  // Verify classifications
  const calcWins = fixtures.filter(f => f.classification === 'calculated_win');
  const tightMatches = fixtures.filter(f => f.classification === 'tight');
  const toughMatches = fixtures.filter(f => f.classification === 'tough');

  assert.strictEqual(calcWins.length, 2, 'Must have 2 Calculated Win target matches');
  assert.deepStrictEqual(calcWins.map(f => f.pekan), [10, 17], 'Calculated wins must be Pekan 10 (Persiku) and Pekan 17 (Adhyaksa FC)');

  assert.strictEqual(tightMatches.length, 3, 'Must have 3 Tight (50-50) matches');
  assert.deepStrictEqual(tightMatches.map(f => f.pekan), [13, 15, 16], 'Tight matches must be Pekan 13 (Persiraja), Pekan 15 (Sumsel), Pekan 16 (Persikad)');

  assert.strictEqual(toughMatches.length, 4, 'Must have 4 Tough Away / Leader matches');
  assert.deepStrictEqual(toughMatches.map(f => f.pekan), [11, 12, 14, 18], 'Tough matches must be Pekan 11 (PSIS), Pekan 12 (PSPS), Pekan 14 (Semen Padang), Pekan 18 (PSMS)');

  // Verify 6-pointer rivalry matches
  const sixPointers = fixtures.filter(f => f.isSixPointer);
  assert.strictEqual(sixPointers.length, 3, 'Must have exactly 3 six-pointer rivalry matches');
  assert.deepStrictEqual(sixPointers.map(f => f.pekan), [10, 13, 17], 'Six-pointers must be Pekan 10 (Persiku), Pekan 13 (Persiraja), Pekan 17 (Adhyaksa FC)');
  // Crucial tactical property: All 3 six-pointers are home games!
  sixPointers.forEach(m => {
    assert.strictEqual(m.isHome, true, `Six-pointer match Pekan ${m.pekan} against ${m.opponent} must be a HOME match`);
  });
  console.log('✓ Fixture classification verified: 2 Calculated Wins, 3 Tight, 4 Tough; All 3 six-pointers are HOME at Galuh');

  // Verify Head-to-Head computation from Putaran 1 completed fixtures
  fixtures.forEach(f => {
    assert.ok(f.h2h, `Fixture Pekan ${f.pekan} must include h2h summary`);
    assert.strictEqual(f.h2h.played, 1, `Fixture Pekan ${f.pekan} vs ${f.opponent} must have 1 Putaran 1 H2H meeting`);
  });
  const persikuH2h = fixtures.find(f => f.pekan === 10).h2h;
  assert.deepStrictEqual(
    { wins: persikuH2h.wins, draws: persikuH2h.draws, losses: persikuH2h.losses, gf: persikuH2h.gf, ga: persikuH2h.ga },
    { wins: 1, draws: 0, losses: 0, gf: 2, ga: 1 },
    'H2H vs Persiku Kudus must be 1W-0D-0L (2-1)'
  );
  const psisH2h = fixtures.find(f => f.pekan === 11).h2h;
  assert.deepStrictEqual(
    { wins: psisH2h.wins, draws: psisH2h.draws, losses: psisH2h.losses, gf: psisH2h.gf, ga: psisH2h.ga },
    { wins: 0, draws: 1, losses: 0, gf: 0, ga: 0 },
    'H2H vs PSIS Semarang must be 0W-1D-0L (0-0)'
  );
  console.log('✓ Head-to-Head Putaran 1 records verified across all 9 Putaran 2 fixtures');

  // --------------------------------------------------------------------------
  // [Test 4] Monte Carlo 1,000 Runs & Probability Bounds
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] Testing Monte Carlo Simulation Engine (1,000 Runs)...');
  const t0 = performance.now();
  // Force a fresh run
  const freshOdds = calculatePsgcOdds(grupAKlasemen, fixturesData);
  const runtime = performance.now() - t0;
  console.log(`✓ 1,000 Monte Carlo runs executed in ${runtime.toFixed(1)} ms`);
  assert.ok(runtime < 500, `Execution time must be under 500ms, took ${runtime.toFixed(1)}ms`);

  const p = freshOdds.probabilities;
  assert.strictEqual(p.runs, 1000, 'Must record 1,000 runs');
  const sum = +(p.promotion + p.survival + p.playoff + p.directRelegation).toFixed(1);
  assert.strictEqual(sum, 100.0, `Sum of probabilities must equal 100.0%, got ${sum}%`);

  // Reasonable statistical bounds based on 7 pts in 9 matches:
  // Direct Relegation risk is low due to Persiku (-1 pt)
  assert.ok(p.directRelegation <= 15.0, `Direct relegation prob (${p.directRelegation}%) must be <= 15.0%`);
  // Promotion is low due to PSPS (22 pts) and PSMS (20 pts)
  assert.ok(p.promotion <= 5.0, `Promotion prob (${p.promotion}%) must be <= 5.0%`);
  // Survival + Playoff account for majority of outcomes
  assert.ok(p.survival + p.playoff >= 80.0, `Survival + Playoff (${p.survival + p.playoff}%) must be >= 80.0%`);
  console.log(`✓ Probabilities verified: Promo ${p.promotion}%, Survival ${p.survival}%, Playoff ${p.playoff}%, DirectReleg ${p.directRelegation}% (Sum: ${sum}%)`);

  // --------------------------------------------------------------------------
  // [Test 5] Immutability of Official Standings & Data Isolation
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Testing Immutability of Standings Data...');
  const psgcBefore = grupAKlasemen.find(c => /psgc/i.test(c.klub));
  assert.strictEqual(psgcBefore.poin, 7, 'Official PSGC points must remain untouched at 7');
  assert.strictEqual(psgcBefore.gf, 8, 'Official PSGC GF must remain untouched at 8');
  assert.strictEqual(psgcBefore.ga, 15, 'Official PSGC GA must remain untouched at 15');
  console.log('✓ Official standings data remained completely immutable');

  // --------------------------------------------------------------------------
  // [Test 6] Dynamic Update When Pekan 10 Becomes FT
  // --------------------------------------------------------------------------
  console.log('\n[Test 6] Testing Dynamic Update When Putaran 2 Match Becomes FT...');
  const clonedStandings = grupAKlasemen.map(t => ({ ...t }));
  const clonedFixtures = JSON.parse(JSON.stringify(fixturesData));
  const week10 = clonedFixtures.find(w => w.pekan === 10);
  week10.pertandingan.forEach(m => {
    if (m.grup === 'Grup A') {
      m.status = 'FT';
      if (/psgc/i.test(m.timHome)) {
        m.skorHome = 3;
        m.skorAway = 0;
      } else {
        m.skorHome = 1;
        m.skorAway = 1;
      }
    }
  });
  const psgcClone = clonedStandings.find(t => /psgc/i.test(t.klub));
  psgcClone.main = 10;
  psgcClone.menang = 3;
  psgcClone.gf += 3;
  psgcClone.gd += 3;
  psgcClone.poin = 10;
  psgcClone.posisi = 7;

  const updatedOdds = calculatePsgcOdds(clonedStandings, clonedFixtures);
  assert.strictEqual(updatedOdds.hero.matchesPlayed, 10, 'Updated matchesPlayed must be 10');
  assert.strictEqual(updatedOdds.hero.matchesRemaining, 17, 'Updated matchesRemaining must be 17');
  assert.strictEqual(updatedOdds.hero.round2MatchesRemaining, 8, 'Updated round2MatchesRemaining must be 8');
  assert.strictEqual(updatedOdds.hero.round3MatchesRemaining, 9, 'Updated round3MatchesRemaining must be 9');
  assert.strictEqual(updatedOdds.hero.maxPossiblePoints, 61, 'Max points after 3-0 win at MW10 must stay 61 (10 + 17*3)');
  assert.strictEqual(updatedOdds.fixtures.length, 8, 'Finished Pekan 10 must be removed from remaining fixtures list');
  assert.strictEqual(updatedOdds.fixtures[0].pekan, 11, 'First remaining fixture must now be Pekan 11');
  console.log('✓ Dynamic Pekan 10 FT update verified: 17 left (8 R2 + 9 R3), 8 remaining fixture cards');

  console.log('\n=== ALL PSGC CALCULATION UNIT TESTS PASSED 100%! ===');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
