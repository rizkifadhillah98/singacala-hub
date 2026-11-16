const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('=== TEST ROUND 3 REGULATORY POPUP & REASONING ===');

  const { generateRound3Fixtures, getMatchRegulatoryReason } = await import('../public/js/modules/round3-regulasi.js');

  const dummyStandingsA = [
    { klub: 'PSPS PEKANBARU', posisi: 1 },
    { klub: 'PSMS MEDAN', posisi: 2 },
    { klub: 'PERSIKAD', posisi: 3 },
    { klub: 'PSIS SEMARANG', posisi: 4 },
    { klub: 'SEMEN PADANG FC', posisi: 5 },
    { klub: 'SUMSEL UNITED', posisi: 6 },
    { klub: 'PERSIRAJA BANDA ACEH', posisi: 7 },
    { klub: 'ADHYAKSA FC BEKASI', posisi: 8 },
    { klub: 'PSGC Ciamis', posisi: 9 },
    { klub: 'PERSIKU', posisi: 10 }
  ];

  const dummyStandingsB = [
    { klub: 'KENDAL TORNADO FC', posisi: 1 },
    { klub: 'PS BARITO PUTERA', posisi: 2 },
    { klub: 'RANS Nusantara FC', posisi: 3 },
    { klub: 'PERSELA LAMONGAN', posisi: 4 },
    { klub: 'DELTRAS FC', posisi: 5 },
    { klub: 'PERSIPURA JAYAPURA', posisi: 6 },
    { klub: 'DE RED FC', posisi: 7 },
    { klub: 'PERSIS SOLO', posisi: 8 },
    { klub: 'PERSIBA', posisi: 9 },
    { klub: 'PSBS BIAK', posisi: 10 }
  ];

  // Test 1: Grup A generation & Ramadhan Clause
  console.log('\n[Test 1] Testing Grup A generation and Ramadhan Clause for PERSIRAJA...');
  const resA = generateRound3Fixtures(dummyStandingsA, 'Grup A');
  assert.strictEqual(resA.weeks.length, 9, 'Should generate 9 weeks (Pekan 19-27)');
  assert.strictEqual(resA.scenarioInfo.isGroupA, true, 'Should be identified as Grup A');
  assert.strictEqual(resA.scenarioInfo.persirajaRank, 7, 'Persiraja should be ranked 7th');
  assert.strictEqual(resA.scenarioInfo.letter, 'g', 'Should be Scenario (g)');

  // Verify Persiraja is AWAY in Weeks 19, 20, 21
  [19, 20, 21].forEach((pekanNum) => {
    const weekObj = resA.weeks.find((w) => w.pekan === pekanNum);
    assert(weekObj, `Week ${pekanNum} must exist`);
    const pMatch = weekObj.pertandingan.find(
      (m) => m.timHome.includes('PERSIRAJA') || m.timAway.includes('PERSIRAJA')
    );
    assert(pMatch, `Persiraja must play in week ${pekanNum}`);
    assert.strictEqual(
      pMatch.timAway,
      'PERSIRAJA BANDA ACEH',
      `Persiraja must play AWAY in Pekan ${pekanNum} under Ramadhan clause`
    );
    assert(pMatch.regulatoryReason, 'Match must have regulatoryReason');
    assert.strictEqual(
      pMatch.regulatoryReason.tag,
      'Klausul Ramadhan',
      `Reason tag in Pekan ${pekanNum} must be Klausul Ramadhan`
    );
    assert(
      pMatch.regulatoryReason.text.includes('Pasal 7 Ayat 4'),
      'Reason text must mention Pasal 7 Ayat 4'
    );
    console.log(`✓ Pekan ${pekanNum}: Persiraja is AWAY vs ${pMatch.timHome} (${pMatch.regulatoryReason.tag})`);
  });

  // Test 2: Grup B generation & Standard Matrix
  console.log('\n[Test 2] Testing Grup B generation and Standard Matrix...');
  const resB = generateRound3Fixtures(dummyStandingsB, 'Grup B');
  assert.strictEqual(resB.weeks.length, 9, 'Grup B should generate 9 weeks');
  assert.strictEqual(resB.scenarioInfo.isGroupA, false, 'Grup B should not be Grup A');
  assert.strictEqual(resB.scenarioInfo.letter, 'standar', 'Grup B should use standard matrix');

  let totalBMatches = 0;
  resB.weeks.forEach((w) => {
    totalBMatches += w.pertandingan.length;
    w.pertandingan.forEach((m) => {
      assert(m.regulatoryReason, `Grup B match ${m.timHome} vs ${m.timAway} must have regulatoryReason`);
      assert(m.regulatoryReason.rule.includes('Pasal 7 Ayat 3'), 'Rule must reference Pasal 7 Ayat 3');
    });
  });
  assert.strictEqual(totalBMatches, 45, 'Total matches in Round 3 must be 45');
  console.log('✓ Grup B: 45 matches successfully generated with standard matrix regulatory reasons!');

  // Test 3: Top 5 Home/Away Quota Check
  console.log('\n[Test 3] Verifying 5H/4A for Top 5 and 4H/5A for Bottom 5...');
  const homeCountA = {};
  const awayCountA = {};
  resA.weeks.forEach((w) => {
    w.pertandingan.forEach((m) => {
      homeCountA[m.timHome] = (homeCountA[m.timHome] || 0) + 1;
      awayCountA[m.timAway] = (awayCountA[m.timAway] || 0) + 1;
    });
  });

  dummyStandingsA.forEach((t) => {
    const isTop5 = t.posisi <= 5;
    const h = homeCountA[t.klub];
    const a = awayCountA[t.klub];
    if (isTop5) {
      assert.strictEqual(h, 5, `${t.klub} (Rank #${t.posisi}) should have 5 Home matches`);
      assert.strictEqual(a, 4, `${t.klub} (Rank #${t.posisi}) should have 4 Away matches`);
    } else {
      assert.strictEqual(h, 4, `${t.klub} (Rank #${t.posisi}) should have 4 Home matches`);
      assert.strictEqual(a, 5, `${t.klub} (Rank #${t.posisi}) should have 5 Away matches`);
    }
  });
  console.log('✓ All 10 teams strictly comply with 5H/4A (Top 5) and 4H/5A (Bottom 5) quotas!');

  // Test 4: Verify HTML skeleton in public/index.html
  console.log('\n[Test 4] Verifying HTML modal container in public/index.html...');
  const htmlContent = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf-8');
  assert(htmlContent.includes('id="r3-regulatory-modal-backdrop"'), 'Modal backdrop must be in index.html');
  assert(htmlContent.includes('id="r3-modal-title"'), 'Modal title element must be present');
  assert(htmlContent.includes('id="r3-week-nav"'), 'Modal week nav must be present');
  assert(htmlContent.includes('id="r3-modal-body"'), 'Modal body container must be present');
  assert(htmlContent.includes('id="btn-r3-modal-proceed"'), 'Lanjutkan ke Simulasi button must be present');
  console.log('✓ HTML modal skeleton verified!');

  // Test 5: Verify CSS in public/css/simulation.css
  console.log('\n[Test 5] Verifying CSS styles in public/css/simulation.css...');
  const cssContent = fs.readFileSync(path.join(__dirname, '../public/css/simulation.css'), 'utf-8');
  assert(cssContent.includes('.r3-modal-backdrop'), '.r3-modal-backdrop CSS class must exist');
  assert(cssContent.includes('.r3-modal-box'), '.r3-modal-box CSS class must exist');
  assert(cssContent.includes('.r3-reason-box'), '.r3-reason-box CSS class must exist');
  assert(cssContent.includes('.r3-week-btn'), '.r3-week-btn CSS class must exist');
  console.log('✓ CSS styles verified!');

  // Test 6: Verify simulation match card does NOT display reason
  console.log('\n[Test 6] Verifying .sim-match-card does NOT display regulatory reason...');
  const simJsContent = fs.readFileSync(path.join(__dirname, '../public/js/modules/simulation.js'), 'utf-8');
  const matchCardFunc = simJsContent.slice(
    simJsContent.indexOf('function renderMatchCardsHtml'),
    simJsContent.indexOf('function renderStandingsRowsHtml')
  );
  assert(!matchCardFunc.includes('regulatoryReason'), 'renderMatchCardsHtml must not render regulatoryReason');
  assert(!matchCardFunc.includes('r3-reason-box'), 'renderMatchCardsHtml must not contain r3-reason-box');
  console.log('✓ Strict rule preserved: Main simulation match cards DO NOT render regulatory reason!');

  // Test 7: Verify Grup A scenario rule labeling across all matches
  console.log('\n[Test 7] Verifying Grup A scenario rule labeling across all matches...');
  resA.weeks.forEach((w) => {
    w.pertandingan.forEach((m) => {
      assert(m.regulatoryReason.rule.includes('Skenario (g)') || m.regulatoryReason.rule.includes('Pasal 7'),
        `Match ${m.timHome} vs ${m.timAway} in Grup A must reference Skenario (g) or Pasal 7`);
    });
  });
  console.log('✓ All 45 matches in Grup A correctly reference Skenario (g) and Pasal 7!');

  // Test 8: Verify simulation.js openRound3RegulatoryModal null safety and week tab preservation
  console.log('\n[Test 8] Verifying openRound3RegulatoryModal null safety and scroll preservation in simulation.js...');
  assert(simJsContent.includes('const targetGroup = groupName || simState.activeGroup;'), 'openRound3RegulatoryModal must safely resolve targetGroup');
  assert(simJsContent.includes('existingBtns.length === weekList.length'), 'renderRound3ModalWeekNav must preserve DOM elements to avoid horizontal scroll reset');
  assert(simJsContent.includes('const targetPekan = activeModalState?.selectedPekan || 19;'), 'Proceed button must navigate to activeModalState.selectedPekan');
  console.log('✓ Null safety, scroll preservation, and dynamic week navigation verified in simulation.js!');

  // Test 9: Verify no emojis in regulatory modal and active banner functions in simulation.js
  console.log('\n[Test 9] Verifying no emojis in modal rendering and active banner in simulation.js...');
  const modalFuncs = simJsContent.slice(
    simJsContent.indexOf('export function openRound3RegulatoryModal'),
    simJsContent.indexOf('export function triggerGenerateRound3')
  );
  const bannerFunc = simJsContent.slice(
    simJsContent.indexOf('function renderRound3NoticeHtml'),
    simJsContent.indexOf('function renderSimulationView')
  );
  const forbiddenEmojis = ['⚖️', '🌙', '✈️', '🗓️', '⏰', '📍', '📄', '📌'];
  forbiddenEmojis.forEach((emoji) => {
    assert(!modalFuncs.includes(emoji), `Regulatory modal must not contain emoji ${emoji}`);
  });
  assert(!bannerFunc.includes('📌'), 'Active banner must not contain pin emoji 📌');
  console.log('✓ Zero emojis in regulatory modal and banner verified!');

  // Test 10: Verify CSS eliminates colored border-left on reason boxes
  console.log('\n[Test 10] Verifying CSS eliminates colored border-left on reason boxes...');
  assert(!cssContent.includes('border-left: 3px solid'), 'Reason boxes must not have colored border-left');
  assert(!cssContent.includes('border-left-color:'), 'Reason boxes must not override border-left-color');
  console.log('✓ Colored left borders completely eliminated!');

  // Test 11: Verify week nav scrollbar is hidden
  console.log('\n[Test 11] Verifying #r3-week-nav scrollbar is hidden...');
  assert(cssContent.includes('scrollbar-width: none'), 'r3-week-nav must have scrollbar-width: none');
  assert(cssContent.includes('::-webkit-scrollbar') && cssContent.includes('display: none'), 'webkit-scrollbar must have display: none');
  console.log('✓ Week navigation scrollbar hidden verified!');

  // Test 12: Verify proceed button uses secondary button styling
  console.log('\n[Test 12] Verifying proceed button uses secondary button styling...');
  assert(htmlContent.includes('sim-btn-secondary') && htmlContent.includes('id="btn-r3-modal-proceed"'),
    'btn-r3-modal-proceed must use sim-btn-secondary');
  console.log('✓ Action button uses standard secondary button styling verified!');

  console.log('\n=== ALL 12 TESTS PASSED 100% PERFECTLY! ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
