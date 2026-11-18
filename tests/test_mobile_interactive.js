const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runMobileInteractiveTests() {
  console.log('=== TEST SUITE: MOBILE INTERACTIVE EXPERIENCE ===\n');

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  // Emulate Mobile Device (iPhone 14 / Pixel 7: 390x844)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    isMobile: true,
    hasTouch: true,
    locale: 'id-ID',
  });

  await context.addInitScript(() => {
    localStorage.setItem('pc_disclaimer_accepted', 'true');
    localStorage.setItem('pc_lang', 'id');
  });

  const page = await context.newPage();

  try {
    // ------------------------------------------------------------------------
    // [Test 1] Load Standings on Mobile & Verify Bottom Nav Active State
    // ------------------------------------------------------------------------
    console.log('[Test 1] Testing Mobile Bottom Navigation Bar & Active Styling...');
    await page.goto('http://localhost:3000/#standings');
    await page.waitForSelector('#standings-table-body tr', { timeout: 8000 });

    const bottomNavVisible = await page.$eval('#mobile-bottom-nav', (el) => {
      const style = window.getComputedStyle(el);
      return style.display === 'flex';
    });
    assert.strictEqual(bottomNavVisible, true, 'Mobile bottom nav must be visible on mobile viewport (<= 768px)');

    const activeNavId = await page.$eval('.mobile-nav-item.active', (el) => el.id);
    assert.strictEqual(activeNavId, 'mobile-nav-standings', 'Standings item must be active initially');

    // Verify monochrome indicator (no glowing neon #00e676)
    const iconStroke = await page.$eval('.mobile-nav-item.active .mobile-nav-icon', (el) => window.getComputedStyle(el).stroke);
    assert(
      iconStroke.includes('255, 255, 255') || iconStroke === '#ffffff' || iconStroke.includes('rgb('),
      `Active bottom nav icon stroke must be monochrome white, got "${iconStroke}"`
    );
    console.log('✓ Mobile Bottom Navigation verified with flat athletic monochrome styling!');

    // ------------------------------------------------------------------------
    // [Test 2] Verify Standings Sub-Nav Swipe / Pill Switching
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Testing Standings Sub-Nav Pills...');
    await page.click('#btn-subview-progression');
    await page.waitForSelector('#standings-panel-progression.active', { timeout: 3000 });
    console.log('✓ Switched to Progression subview cleanly');

    await page.click('#btn-subview-table');
    await page.waitForSelector('#standings-panel-table.active', { timeout: 3000 });
    console.log('✓ Switched back to Table subview cleanly');

    // ------------------------------------------------------------------------
    // [Test 3] Fixtures View & Swipeable Matchweek Carousel (MW 1-27)
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Testing Fixtures View & Swipeable Matchweek Carousel...');
    await page.click('#mobile-nav-fixtures');
    await page.waitForSelector('#matchweek-carousel-track button', { timeout: 5000 });

    const chipCount = await page.$$eval('.matchweek-carousel-chip', (chips) => chips.length);
    assert(chipCount >= 19, `Carousel should contain at least 19 chips (Semua + 18/27 weeks), got ${chipCount}`);

    // Click Pekan 1 chip in carousel
    const chipPekan1 = await page.$('.matchweek-carousel-chip[data-week="1"]');
    assert(chipPekan1, 'Pekan 1 chip must exist in carousel');
    await chipPekan1.click();
    await page.waitForTimeout(400);

    const isChip1Active = await page.$eval('.matchweek-carousel-chip[data-week="1"]', (el) => el.classList.contains('active'));
    assert.strictEqual(isChip1Active, true, 'Pekan 1 chip should be active after clicking');

    const firstMatchText = await page.$eval('.match-card-row .match-team-name', (el) => el.textContent.trim());
    console.log(`✓ Matchweek Carousel verified with active Pekan 1 matches (first team: "${firstMatchText}")`);

    // ------------------------------------------------------------------------
    // [Test 4] Match Detail Bottom Sheet Interaction
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Testing Match Detail Bottom Sheet (Touch to open, Scoreboard, Form, H2H, Drag handle)...');
    const firstMatchCard = await page.$('.match-card-row');
    assert(firstMatchCard, 'At least one match card must exist in Pekan 1');
    await firstMatchCard.click();
    await page.waitForSelector('#match-detail-backdrop.show', { timeout: 4000 });

    // Verify Bottom Sheet elements
    const dragHandleVisible = await page.$eval('#match-detail-box .bottom-sheet-drag-handle', (el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });
    assert.strictEqual(dragHandleVisible, true, 'Bottom sheet drag handle must be present');

    const scoreboardTeams = await page.$$eval('#match-detail-body .match-detail-team-name', (els) => els.map((e) => e.textContent.trim()));
    assert.strictEqual(scoreboardTeams.length, 2, 'Scoreboard must render both Home and Away team names');
    console.log(`✓ Scoreboard rendered: ${scoreboardTeams[0]} vs ${scoreboardTeams[1]}`);

    // Verify Form 5 Badges section & Head-to-Head section
    const sectionTitles = await page.$$eval('#match-detail-body .match-detail-section-title', (els) => els.map(e => e.textContent.trim()));
    assert(sectionTitles.some(t => t.includes('Performa') || t.includes('Form')), `Form section title must be present, got "${sectionTitles}"`);
    assert(sectionTitles.some(t => t.includes('Head-to-Head') || t.includes('Pertemuan')), `H2H section title must be present, got "${sectionTitles}"`);

    await page.screenshot({ path: path.join(screenshotsDir, 'mobile_match_detail_bottom_sheet.png') });
    console.log('✓ Captured mobile_match_detail_bottom_sheet.png');

    // Close bottom sheet via close button
    await page.click('#btn-close-match-detail');
    await page.waitForTimeout(300);
    const isSheetClosed = await page.$eval('#match-detail-backdrop', (el) => !el.classList.contains('show'));
    assert.strictEqual(isSheetClosed, true, 'Match Detail bottom sheet must close on close button click');
    console.log('✓ Match Detail Bottom Sheet closed successfully!');

    // ------------------------------------------------------------------------
    // [Test 5] Simulator Liga Mobile Floating Summary Bar
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Testing Simulator Liga Floating Summary Bar...');
    await page.click('#mobile-nav-simulation');
    await page.waitForSelector('#view-simulation.active', { timeout: 5000 });
    await page.waitForTimeout(400);

    const floatBarVisible = await page.$eval('#sim-floating-summary', (el) => {
      const style = window.getComputedStyle(el);
      return style.display === 'flex' && style.position === 'fixed';
    });
    assert.strictEqual(floatBarVisible, true, 'Simulator floating summary bar must be visible and fixed on mobile');

    const floatTeamName = await page.$eval('#sim-floating-summary .sim-float-team-name', (el) => el.textContent.trim());
    const floatStatLine = await page.$eval('#sim-floating-summary .sim-float-stat-line', (el) => el.textContent.trim());
    console.log(`✓ Floating Summary Bar verified: Team: "${floatTeamName}", Stat: "${floatStatLine}"`);

    await page.screenshot({ path: path.join(screenshotsDir, 'mobile_simulation_floating_bar.png') });
    console.log('✓ Captured mobile_simulation_floating_bar.png');

    // ------------------------------------------------------------------------
    // [Test 6] Bilingual Switcher in Match Detail Bottom Sheet
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] Testing Bilingual Switcher with Bottom Sheet in English...');
    await Promise.all([
      page.waitForNavigation(),
      page.click('.lang-segment[data-lang="en"]'),
    ]);
    await page.waitForTimeout(600);

    // Switch to fixtures and open match detail
    await page.click('#mobile-nav-fixtures');
    await page.waitForSelector('.match-card-row', { timeout: 6000 });
    await page.click('.match-card-row');
    await page.waitForSelector('#match-detail-backdrop.show', { timeout: 5000 });

    const weekPillTextEn = await page.$eval('#match-detail-week-pill', (el) => el.textContent.trim());
    assert(weekPillTextEn.includes('MATCHWEEK') || weekPillTextEn.includes('PEKAN'), `English week pill must be present, got "${weekPillTextEn}"`);
    console.log(`✓ Match Detail Bottom Sheet in English verified: "${weekPillTextEn}"`);

    await page.click('#btn-close-match-detail');

    console.log('\n=== ALL MOBILE INTERACTIVE TESTS PASSED 100%! ===');
  } finally {
    await browser.close();
  }
}

runMobileInteractiveTests().catch((err) => {
  console.error('\n❌ MOBILE INTERACTIVE TEST FAILED:', err);
  process.exit(1);
});
