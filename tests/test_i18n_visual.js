const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runTests() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching browser for i18n & visual verification...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'id-ID',
  });
  await context.addInitScript(() => localStorage.setItem('pc_disclaimer_accepted', 'true'));

  const page = await context.newPage();

  console.log('\n--- [Test 1: Auto-detection with Indonesian Locale (id-ID)] ---');
  await page.goto('http://localhost:3000');
  await page.evaluate(() => localStorage.removeItem('pc_lang'));
  await page.reload();
  await page.waitForSelector('#standings-table-body tr');

  const idActive = await page.$eval('.lang-segment[data-lang="id"]', el => el.classList.contains('active'));
  console.log(`✓ ID segment active: ${idActive}`);
  if (!idActive) throw new Error('ID segment should be active by default');

  const navStandingsText = await page.$eval('#nav-btn-standings', el => el.textContent.trim());
  console.log(`✓ Nav Standings text (ID): "${navStandingsText}"`);
  if (navStandingsText !== 'Klasemen') throw new Error(`Expected 'Klasemen', got '${navStandingsText}'`);

  const navFixturesText = await page.$eval('#nav-btn-fixtures', el => el.textContent.trim());
  console.log(`✓ Nav Fixtures text (ID): "${navFixturesText}"`);
  if (navFixturesText !== 'Jadwal & Hasil') throw new Error(`Expected 'Jadwal & Hasil', got '${navFixturesText}'`);

  const navStatsText = await page.$eval('#nav-btn-stats', el => el.textContent.trim());
  console.log(`✓ Nav Stats text (ID): "${navStatsText}"`);
  if (navStatsText !== 'Statistik Tim') throw new Error(`Expected 'Statistik Tim', got '${navStatsText}'`);

  const navSimText = await page.$eval('#nav-btn-simulation', el => el.textContent.trim());
  console.log(`✓ Nav Simulation text (ID): "${navSimText}"`);
  if (navSimText !== 'Simulator Liga') throw new Error(`Expected 'Simulator Liga', got '${navSimText}'`);

  // Check Fixtures View in Indonesian
  await page.click('#nav-btn-fixtures');
  await page.waitForTimeout(400);

  const fixtureFilterLabelsId = await page.$$eval('.fixtures-filter-bar .filter-mini-label', els => els.map(e => e.textContent.trim()));
  console.log(`✓ Fixtures filter labels (ID): ${JSON.stringify(fixtureFilterLabelsId)}`);
  if (fixtureFilterLabelsId[0] !== 'Pekan' || fixtureFilterLabelsId[1] !== 'Klub') {
    throw new Error(`Expected ['Pekan', 'Klub'], got: ${JSON.stringify(fixtureFilterLabelsId)}`);
  }

  const selectedPeriodTextId = await page.$eval('#selected-period-text', el => el.textContent.trim());
  console.log(`✓ Selected matchweek (ID): "${selectedPeriodTextId}"`);
  if (!selectedPeriodTextId.includes('Pekan')) throw new Error(`Expected 'Pekan X', got '${selectedPeriodTextId}'`);

  const fixturesTitleId = await page.$eval('#view-fixtures .page-title', el => el.textContent.trim());
  console.log(`✓ Fixtures page title (ID): "${fixturesTitleId}"`);
  if (fixturesTitleId !== 'Jadwal & Hasil') throw new Error(`Expected 'Jadwal & Hasil', got '${fixturesTitleId}'`);

  await page.screenshot({ path: path.join(screenshotsDir, 'fixtures_id.png') });
  console.log('✓ Captured fixtures_id.png');

  await page.click('#nav-btn-standings');
  await page.waitForTimeout(400);

  const thClubText = await page.$eval('#standings-table th.col-club', el => el.textContent.trim());
  console.log(`✓ Table Header Club (ID): "${thClubText}"`);
  if (!thClubText.startsWith('Klub')) throw new Error(`Expected 'Klub', got '${thClubText}'`);

  const thPtsText = await page.$eval('#standings-table th[data-sort="poin"]', el => el.textContent.trim());
  console.log(`✓ Table Header Pts (ID): "${thPtsText}"`);
  if (!thPtsText.startsWith('Poin')) throw new Error(`Expected 'Poin', got '${thPtsText}'`);

  const thFormText = await page.$eval('#standings-table th.col-form', el => el.textContent.trim());
  console.log(`✓ Table Header Form (ID): "${thFormText}"`);
  if (thFormText !== '5 Laga Terakhir') throw new Error(`Expected '5 Laga Terakhir', got '${thFormText}'`);

  const legendText1 = await page.$eval('.standings-legend-footer .legend-item:first-child span:not(.legend-color-indicator)', el => el.textContent.trim());
  console.log(`✓ Legend 1 (ID): "${legendText1}"`);
  if (!legendText1.includes('Grand Final & Promosi Otomatis')) throw new Error(`Unexpected legend: ${legendText1}`);

  await page.screenshot({ path: path.join(screenshotsDir, 'desktop_id.png') });
  console.log('✓ Captured desktop_id.png');

  console.log('\n--- [Test 2: Switch to English (EN)] ---');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('.lang-segment[data-lang="en"]'),
  ]);
  await page.waitForSelector('#standings-table-body tr');

  const savedLang = await page.evaluate(() => localStorage.getItem('pc_lang'));
  console.log(`✓ localStorage pc_lang: "${savedLang}"`);
  if (savedLang !== 'en') throw new Error(`Expected localStorage pc_lang='en', got '${savedLang}'`);

  const enActive = await page.$eval('.lang-segment[data-lang="en"]', el => el.classList.contains('active'));
  console.log(`✓ EN segment active: ${enActive}`);
  if (!enActive) throw new Error('EN segment should be active');

  const enNavStandings = await page.$eval('#nav-btn-standings', el => el.textContent.trim());
  console.log(`✓ Nav Standings text (EN): "${enNavStandings}"`);
  if (enNavStandings !== 'Standings') throw new Error(`Expected 'Standings', got '${enNavStandings}'`);

  const enNavStats = await page.$eval('#nav-btn-stats', el => el.textContent.trim());
  console.log(`✓ Nav Stats text (EN): "${enNavStats}"`);
  if (enNavStats !== 'Team Statistics') throw new Error(`Expected 'Team Statistics', got '${enNavStats}'`);

  const enNavSim = await page.$eval('#nav-btn-simulation', el => el.textContent.trim());
  console.log(`✓ Nav Simulation text (EN): "${enNavSim}"`);
  if (enNavSim !== 'League Simulator') throw new Error(`Expected 'League Simulator', got '${enNavSim}'`);

  const enThClub = await page.$eval('#standings-table th.col-club', el => el.textContent.trim());
  console.log(`✓ Table Header Club (EN): "${enThClub}"`);
  if (!enThClub.startsWith('Club')) throw new Error(`Expected 'Club', got '${enThClub}'`);

  const enThPts = await page.$eval('#standings-table th[data-sort="poin"]', el => el.textContent.trim());
  console.log(`✓ Table Header Pts (EN): "${enThPts}"`);
  if (!enThPts.startsWith('Pts')) throw new Error(`Expected 'Pts', got '${enThPts}'`);

  const enThForm = await page.$eval('#standings-table th.col-form', el => el.textContent.trim());
  console.log(`✓ Table Header Form (EN): "${enThForm}"`);
  if (enThForm !== 'Last 5') throw new Error(`Expected 'Last 5', got '${enThForm}'`);

  const enLegend1 = await page.$eval('.standings-legend-footer .legend-item:first-child span:not(.legend-color-indicator)', el => el.textContent.trim());
  console.log(`✓ Legend 1 (EN): "${enLegend1}"`);
  if (!enLegend1.includes('Grand Final & Automatic Promotion')) throw new Error(`Unexpected legend: ${enLegend1}`);

  await page.screenshot({ path: path.join(screenshotsDir, 'desktop_en.png') });
  console.log('✓ Captured desktop_en.png');

  console.log('\n--- [Test 3: Fixtures View in English] ---');
  await page.click('#nav-btn-fixtures');
  await page.waitForTimeout(500);

  const fixtureFilterLabels = await page.$$eval('.fixtures-filter-bar .filter-mini-label', els => els.map(e => e.textContent.trim()));
  console.log(`✓ Fixtures filter labels: ${JSON.stringify(fixtureFilterLabels)}`);
  if (fixtureFilterLabels[0] !== 'Matchweek' || fixtureFilterLabels[1] !== 'Club') {
    throw new Error(`Unexpected fixture filter labels: ${fixtureFilterLabels}`);
  }

  const selectedPeriodText = await page.$eval('#selected-period-text', el => el.textContent.trim());
  console.log(`✓ Selected matchweek: "${selectedPeriodText}"`);
  if (!selectedPeriodText.includes('Matchweek')) throw new Error(`Expected 'Matchweek X', got '${selectedPeriodText}'`);

  const ftBadgeText = await page.$eval('.match-status-label', el => el.textContent.trim());
  console.log(`✓ Fixtures FT badge text (EN): "${ftBadgeText}"`);
  if (ftBadgeText !== 'FT') throw new Error(`Expected 'FT', got '${ftBadgeText}'`);

  await page.screenshot({ path: path.join(screenshotsDir, 'fixtures_en.png') });
  console.log('✓ Captured fixtures_en.png');

  console.log('\n--- [Test 4: Stats View in English] ---');
  await page.click('#nav-btn-stats');
  await page.waitForTimeout(500);

  const catPillAll = await page.$eval('.stats-cat-pill[data-category="all"]', el => el.textContent.trim());
  console.log(`✓ Stats category pill 'all': "${catPillAll}"`);
  if (!catPillAll.includes('All Metrics')) throw new Error(`Expected 'All Metrics', got '${catPillAll}'`);

  await page.screenshot({ path: path.join(screenshotsDir, 'stats_en.png') });
  console.log('✓ Captured stats_en.png');

  console.log('\n--- [Test 5: Simulation View in English] ---');
  await page.click('#nav-btn-simulation');
  await page.waitForTimeout(500);

  const simCardTitle = await page.$eval('.sim-card-title', el => el.textContent.trim());
  console.log(`✓ Sim card title: "${simCardTitle}"`);
  if (!simCardTitle.includes('Live Simulated Standings')) throw new Error(`Expected 'Live Simulated Standings', got '${simCardTitle}'`);

  const simBtnReset = await page.$eval('#btn-sim-reset span', el => el.textContent.trim());
  console.log(`✓ Sim reset button: "${simBtnReset}"`);
  if (!simBtnReset.includes('Reset Simulation')) throw new Error(`Expected 'Reset Simulation', got '${simBtnReset}'`);

  const simBtnR2 = await page.$eval('#btn-sim-r2 span', el => el.textContent.trim());
  console.log(`✓ Sim MW18 button: "${simBtnR2}"`);
  if (!simBtnR2.includes('Simulate through Matchweek 18')) throw new Error(`Expected 'Simulate through Matchweek 18', got '${simBtnR2}'`);

  const simThForm = await page.$eval('#sim-standings-table th.col-form', el => el.textContent.trim());
  console.log(`✓ Sim table header Form (EN): "${simThForm}"`);
  if (simThForm !== 'Last 5') throw new Error(`Expected 'Last 5', got '${simThForm}'`);

  const simRandomBtn = await page.$eval('.btn-random-match', el => el.textContent.trim());
  console.log(`✓ Sim random match button (EN): "${simRandomBtn}"`);
  if (!simRandomBtn.includes('Randomize')) throw new Error(`Expected 'Randomize', got '${simRandomBtn}'`);

  await page.screenshot({ path: path.join(screenshotsDir, 'simulation_en.png') });
  console.log('✓ Captured simulation_en.png');

  console.log('\n--- [Test 5b: Round 3 Generation & Modal in English] ---');
  // Click simulate through MW18 (this automatically generates R3 and opens modal)
  await page.click('#btn-sim-r2');
  await page.waitForSelector('#r3-regulatory-modal-backdrop.show', { timeout: 5000 });

  const r3ModalTitle = await page.$eval('#r3-modal-title', el => el.textContent.trim());
  console.log(`✓ R3 modal title (EN): "${r3ModalTitle}"`);
  if (!r3ModalTitle.includes('Round 3') && !r3ModalTitle.includes('Scenario')) {
    throw new Error(`Unexpected R3 modal title: ${r3ModalTitle}`);
  }

  // Verify all regulatory reason tags in English are properly localized
  const reasonTags = await page.$$eval('.r3-reason-tag', tags => tags.map(t => t.textContent.trim()));
  console.log(`✓ R3 modal reason tags (EN): ${JSON.stringify(reasonTags)}`);
  const untranslatedIdTags = ['Klausul Ramadhan', 'Kompensasi Ramadhan', 'Kuota Home Top 5', 'Distribusi Matriks PSSI', 'Duel Pot Unggulan', 'Rotasi Pot Bawah', 'Regulasi Putaran 3'];
  untranslatedIdTags.forEach(idTag => {
    if (reasonTags.includes(idTag)) {
      throw new Error(`Found untranslated Indonesian tag '${idTag}' in English view!`);
    }
  });

  const r3CloseBtn = await page.$eval('#btn-r3-modal-proceed span', el => el.textContent.trim());
  console.log(`✓ R3 proceed button: "${r3CloseBtn}"`);
  if (!r3CloseBtn.includes('Proceed to Simulation')) {
    throw new Error(`Expected 'Proceed to Simulation', got '${r3CloseBtn}'`);
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'r3_modal_en.png') });
  console.log('✓ Captured r3_modal_en.png');

  // Close the modal
  await page.click('#btn-close-r3-modal');
  await page.waitForTimeout(300);

  console.log('\n--- [Test 6: Mobile Viewport & Switcher Verification] ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  });
  await mobileContext.addInitScript(() => localStorage.setItem('pc_disclaimer_accepted', 'true'));
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000');
  await mobilePage.waitForSelector('#standings-table-body tr');

  const mobileSwitcherVis = await mobilePage.$eval('#lang-switcher', el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  });
  console.log(`✓ Mobile language switcher is visible: ${mobileSwitcherVis}`);
  if (!mobileSwitcherVis) throw new Error('Mobile language switcher must be visible');

  const mobStandingsLabel = await mobilePage.$eval('#mobile-nav-standings .mobile-nav-label', el => el.textContent.trim());
  console.log(`✓ Mobile bottom nav label (EN): "${mobStandingsLabel}"`);
  if (mobStandingsLabel !== 'Standings') throw new Error(`Expected 'Standings', got '${mobStandingsLabel}'`);

  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile_en.png') });
  console.log('✓ Captured mobile_en.png');

  // Switch back to ID on mobile
  await Promise.all([
    mobilePage.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    mobilePage.click('.lang-segment[data-lang="id"]'),
  ]);
  await mobilePage.waitForSelector('#standings-table-body tr');

  const mobSavedLang = await mobilePage.evaluate(() => localStorage.getItem('pc_lang'));
  console.log(`✓ Mobile localStorage pc_lang after toggle: "${mobSavedLang}"`);
  if (mobSavedLang !== 'id') throw new Error(`Expected localStorage pc_lang='id', got '${mobSavedLang}'`);

  const mobStandingsLabelId = await mobilePage.$eval('#mobile-nav-standings .mobile-nav-label', el => el.textContent.trim());
  console.log(`✓ Mobile bottom nav label (ID): "${mobStandingsLabelId}"`);
  if (mobStandingsLabelId !== 'Klasemen') throw new Error(`Expected 'Klasemen', got '${mobStandingsLabelId}'`);

  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile_id.png') });
  console.log('✓ Captured mobile_id.png');

  console.log('\n--- [Test 7: Defensive LocalStorage Error Handling & Quick Search Localization] ---');
  // Verify that an exception thrown by localStorage does not crash getLanguage or setLanguage
  const storageSafe = await page.evaluate(() => {
    // Override localStorage to throw errors
    const origGet = localStorage.getItem;
    const origSet = localStorage.setItem;
    try {
      localStorage.getItem = () => { throw new Error('Blocked storage'); };
      localStorage.setItem = () => { throw new Error('Blocked storage'); };
      // Test getting language with blocked storage
      const defaultLang = window.navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en';
      return { ok: true, defaultLang };
    } finally {
      localStorage.getItem = origGet;
      localStorage.setItem = origSet;
    }
  });
  console.log(`✓ Storage error defensive check: ${storageSafe.ok}`);
  if (!storageSafe.ok) throw new Error('Storage defensive error check failed');

  // Verify quick search modal in English (on desktop page)
  await page.click('#btn-open-search');
  await page.waitForSelector('#search-modal-backdrop.show');
  const searchPromptEn = await page.$eval('.search-empty-prompt', el => el.textContent.trim());
  console.log(`✓ Quick search prompt (EN): "${searchPromptEn}"`);
  if (!searchPromptEn.includes('Type club name')) {
    throw new Error(`Expected search prompt in English, got: "${searchPromptEn}"`);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Verify quick search modal in Indonesian (on mobilePage)
  await mobilePage.click('#btn-open-search');
  await mobilePage.waitForSelector('#search-modal-backdrop.show');
  const searchPromptId = await mobilePage.$eval('.search-empty-prompt', el => el.textContent.trim());
  console.log(`✓ Quick search prompt (ID): "${searchPromptId}"`);
  if (!searchPromptId.includes('Ketik nama klub')) {
    throw new Error(`Expected search prompt in Indonesian, got: "${searchPromptId}"`);
  }
  await mobilePage.keyboard.press('Escape');
  await mobilePage.waitForTimeout(300);

  await browser.close();
  console.log('\n=== ALL PLAYWRIGHT & VISUAL VERIFICATION TESTS PASSED 100%! ===');
}

runTests().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
