// ==========================================================================
// TEST SUITE: PSGC ODDS VISUAL & PLAYWRIGHT E2E REGRESSION
// Verifies Sub-nav Pill, Panel Display, All 4 Sections, Strict UI Rules
// (0 colored left borders, 0 emojis, monochrome palette), Bilingual Switching,
// and Screenshot Captures.
// ==========================================================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function runVisualTests() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('=== TEST SUITE: PSGC ODDS VISUAL & PLAYWRIGHT E2E ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'id-ID',
  });

  const page = await context.newPage();

  try {
    // ------------------------------------------------------------------------
    // [Test 1] Load Application & Navigate to Standings View
    // ------------------------------------------------------------------------
    console.log('[Test 1] Loading Standings View and Initial State (ID)...');
    await page.goto('http://localhost:3000');
    // Ensure Indonesian language is active
    await page.evaluate(() => localStorage.setItem('pc_lang', 'id'));
    await page.reload();
    await page.waitForSelector('#standings-table-body tr');

    // Verify sub-nav pill exists
    const pillPsgc = await page.$('#btn-subview-psgc');
    assert(pillPsgc, 'Sub-nav pill #btn-subview-psgc must exist in DOM');
    const pillTextId = await pillPsgc.innerText();
    console.log(`✓ Sub-nav pill text (ID): "${pillTextId.trim()}"`);
    assert.strictEqual(pillTextId.trim(), 'Peluang PSGC', 'Pill text in ID must be "Peluang PSGC"');

    // ------------------------------------------------------------------------
    // [Test 2] 3-Way Subview Pill Switching
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Testing 3-Way Subview Switching (Table <-> Progression <-> PSGC)...');
    // Click PSGC pill
    await page.click('#btn-subview-psgc');
    await page.waitForTimeout(300);

    const isPsgcActive = await page.$eval('#btn-subview-psgc', el => el.classList.contains('active'));
    assert(isPsgcActive, '#btn-subview-psgc must have .active class');

    const panelPsgcVisible = await page.$eval('#standings-panel-psgc', el => el.style.display !== 'none');
    assert(panelPsgcVisible, '#standings-panel-psgc must be visible');

    const panelTableHidden = await page.$eval('#standings-panel-table', el => el.style.display === 'none');
    assert(panelTableHidden, '#standings-panel-table must be hidden');

    const panelProgHidden = await page.$eval('#standings-panel-progression', el => el.style.display === 'none');
    assert(panelProgHidden, '#standings-panel-progression must be hidden');
    console.log('✓ Switching to PSGC subview hides Table and Progression panels');

    // Switch back to Table
    await page.click('#btn-subview-table');
    await page.waitForTimeout(200);
    const panelPsgcHiddenAgain = await page.$eval('#standings-panel-psgc', el => el.style.display === 'none');
    assert(panelPsgcHiddenAgain, '#standings-panel-psgc must be hidden when switching back to Table');

    // Return to PSGC panel for in-depth inspection
    await page.click('#btn-subview-psgc');
    await page.waitForTimeout(300);
    console.log('✓ 3-Way toggle works cleanly in both directions');

    // ------------------------------------------------------------------------
    // [Test 3] Verify All 4 Sections Rendered Correctly
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Verifying All 4 Sections Rendered in #standings-panel-psgc...');
    const cards = await page.$$('#standings-panel-psgc .psgc-card');
    assert.strictEqual(cards.length, 4, 'Must render exactly 4 .psgc-card container sections');

    // Section 1: Hero Metrics
    const heroTitle = await page.$eval('#standings-panel-psgc .psgc-card:nth-child(1) .psgc-card-title', el => el.textContent.trim());
    console.log(`✓ Section 1 Title: "${heroTitle}"`);
    assert(heroTitle.includes('PSGC'), 'Section 1 must display PSGC Hero Title');

    const statBoxes = await page.$$('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box');
    assert.strictEqual(statBoxes.length, 6, 'Must render 6 hero metric stat boxes');

    const rankVal = await page.$eval('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box:nth-child(1) .psgc-stat-value', el => el.textContent.trim());
    assert.strictEqual(rankVal, 'P9', 'Current rank must be P9');

    const ptsVal = await page.$eval('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box:nth-child(2) .psgc-stat-value', el => el.textContent.trim());
    assert.strictEqual(ptsVal, '7', 'Current points must be 7');

    const matchesVal = await page.$eval('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box:nth-child(3) .psgc-stat-value', el => el.textContent.trim());
    assert.strictEqual(matchesVal, '18', 'Matches remaining must be 18');

    const maxPtsVal = await page.$eval('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box:nth-child(4) .psgc-stat-value', el => el.textContent.trim());
    assert.strictEqual(maxPtsVal, '61', 'Max possible points must be 61');

    console.log('✓ Section 1 verified: P9, 7 Pts, 18 Matches Left, 61 Max Pts');

    // Section 2: Probability Matrix
    const probCards = await page.$$('#standings-panel-psgc .psgc-matrix-grid .psgc-prob-card');
    assert.strictEqual(probCards.length, 4, 'Must render 4 probability cards in Section 2');

    const probVals = await page.$$eval('#standings-panel-psgc .psgc-prob-val', els => els.map(el => el.textContent.trim()));
    assert.strictEqual(probVals.length, 4, 'Must have 4 probability percentage values');
    probVals.forEach(val => {
      assert(val.endsWith('%'), `Probability value must end with %, got "${val}"`);
    });
    console.log(`✓ Section 2 Probability Matrix verified: [${probVals.join(', ')}]`);

    // Section 3: Win Requirements Roadmap
    const roadmapItems = await page.$$('#standings-panel-psgc .psgc-roadmap-item');
    assert.strictEqual(roadmapItems.length, 3, 'Must render 3 roadmap target items in Section 3');
    console.log('✓ Section 3 Roadmap verified: 3 critical milestones rendered');

    // Section 4: Putaran 2 Fixtures Cards (Jadwal Liga Match Card Format)
    const fixtureCards = await page.$$('#standings-panel-psgc .psgc-fixture-card');
    assert.strictEqual(fixtureCards.length, 9, 'Must render exactly 9 fixture match cards in Section 4');

    const sixPointerBadges = await page.$$('#standings-panel-psgc .psgc-badge-sixpointer');
    assert.strictEqual(sixPointerBadges.length, 3, 'Must render exactly 3 six-pointer rivalry badges');

    const tacticalFooters = await page.$$('#standings-panel-psgc .psgc-match-tactical-footer');
    assert.strictEqual(tacticalFooters.length, 9, 'Must render 9 tactical footers with Klasifikasi Laga, Head to Head & Catatan Strategis');

    const h2hRows = await page.$$('#standings-panel-psgc .psgc-h2h-row');
    assert.strictEqual(h2hRows.length, 9, 'Must render 9 Head to Head rows across Section 4 match cards');

    const h2hFirstRecordId = await page.$eval('#standings-panel-psgc .psgc-fixture-card:nth-child(1) .psgc-badge-h2h', el => el.textContent.trim());
    assert.strictEqual(h2hFirstRecordId, '1M - 0S - 0K', `First fixture H2H record in ID must be "1M - 0S - 0K", got "${h2hFirstRecordId}"`);

    const h2hFirstScoreline = await page.$eval('#standings-panel-psgc .psgc-fixture-card:nth-child(1) .psgc-h2h-scoreline', el => el.textContent.trim());
    assert(h2hFirstScoreline.includes('1 - 2'), `First fixture H2H scoreline must show "1 - 2", got "${h2hFirstScoreline}"`);
    console.log('✓ Section 4 Fixtures Match Cards verified: 9 match cards in Jadwal Liga format with tactical analysis, Head to Head rows, 3 six-pointer badges');

    // ------------------------------------------------------------------------
    // [Test 4] Strict Negative UI Constraints Verification
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Verifying Strict UI System Rules (Flat Dark Monochrome)...');
    // 1. Container card colors
    const cardBg = await page.$eval('#standings-panel-psgc .psgc-card', el => window.getComputedStyle(el).backgroundColor);
    console.log(`✓ Card background color: ${cardBg}`);
    assert(cardBg.includes('17, 20, 26') || cardBg.includes('17, 19, 24'), `Card background must be #11141a, got ${cardBg}`);

    // 2. ZERO Colored Left Borders
    const leftBorderWidths = await page.$$eval(
      '#standings-panel-psgc .psgc-card, #standings-panel-psgc .psgc-stat-box, #standings-panel-psgc .psgc-prob-card, #standings-panel-psgc .psgc-roadmap-item, #standings-panel-psgc .psgc-fixture-card',
      els => els.map(el => {
        const cs = window.getComputedStyle(el);
        return {
          left: cs.borderLeftWidth,
          right: cs.borderRightWidth,
          leftColor: cs.borderLeftColor,
          rightColor: cs.borderRightColor
        };
      })
    );

    leftBorderWidths.forEach((b, idx) => {
      assert.strictEqual(b.left, b.right, `Element ${idx} border-left-width must match border-right-width (no thick left border)`);
      assert.strictEqual(b.leftColor, b.rightColor, `Element ${idx} border-left-color must match border-right-color (no colored left border)`);
    });
    console.log('✓ ZERO colored left borders verified across all cards and sub-boxes');

    // 2b. Verify Section 4 fixture cards have NO white outline
    const fixtureCardOutline = await page.$eval('#standings-panel-psgc .psgc-fixture-card', el => {
      const cs = window.getComputedStyle(el);
      return {
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        borderColor: cs.borderColor
      };
    });
    assert(fixtureCardOutline.outlineStyle === 'none' || fixtureCardOutline.outlineWidth === '0px', 'Section 4 match cards must not have outline');
    console.log('✓ Section 4 match cards verified: NO white outline (clean dark border #242934)');

    // 2c. Verify Match Class badges use Flat Monochrome Styling (no colorful green/amber/red tags)
    const matchClassStyles = await page.$$eval(
      '#standings-panel-psgc .psgc-badge-win, #standings-panel-psgc .psgc-badge-tight, #standings-panel-psgc .psgc-badge-tough',
      els => els.map(el => {
        const cs = window.getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor };
      })
    );
    assert.strictEqual(matchClassStyles.length, 9, 'Must inspect all 9 Match Class badges');
    matchClassStyles.forEach((s, idx) => {
      assert.strictEqual(s.bg, 'rgb(30, 36, 48)', `Match Class badge ${idx} must have flat monochrome bg #1e2430, got ${s.bg}`);
      assert.strictEqual(s.color, 'rgb(226, 232, 240)', `Match Class badge ${idx} must have flat monochrome text #e2e8f0, got ${s.color}`);
    });
    console.log('✓ Match Class badges verified: 100% Flat Dark Monochrome style');

    // 3. ZERO Emojis in Panel
    const forbiddenEmojis = ['🔥', '⭐', '⚽', '🎯', '🚨', '⚠️', '📈', '📉', '🏆', '🎮', '📌', '🎲', '✈️', '🌙', '⚖️'];
    const panelFullText = await page.$eval('#standings-panel-psgc', el => el.innerText);
    forbiddenEmojis.forEach(emoji => {
      assert(!panelFullText.includes(emoji), `Forbidden emoji "${emoji}" detected inside #standings-panel-psgc!`);
    });
    console.log('✓ ZERO emojis verified across entire PSGC odds panel');

    // ------------------------------------------------------------------------
    // [Test 5] Screenshot Capture (Desktop ID)
    // ------------------------------------------------------------------------
    const screenshotPathId = path.join(screenshotsDir, 'psgc_panel_id.png');
    await page.screenshot({ path: screenshotPathId, fullPage: true });
    console.log(`✓ Captured ${screenshotPathId}`);

    // ------------------------------------------------------------------------
    // [Test 6] Bilingual Switching to English (EN)
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] Testing Bilingual Switching to English (EN)...');
    await page.click('.lang-segment[data-lang="en"]');
    await page.waitForTimeout(500);
    await page.waitForSelector('#standings-table-body tr');

    // Navigate to PSGC tab in EN
    await page.click('#btn-subview-psgc');
    await page.waitForTimeout(300);

    const pillTextEn = await page.$eval('#btn-subview-psgc', el => el.innerText.trim());
    console.log(`✓ Sub-nav pill text (EN): "${pillTextEn}"`);
    assert.strictEqual(pillTextEn, 'PSGC Odds', 'Pill text in EN must be "PSGC Odds"');

    const heroTitleEn = await page.$eval('#standings-panel-psgc .psgc-card:nth-child(1) .psgc-card-title', el => el.textContent.trim());
    console.log(`✓ Section 1 Title (EN): "${heroTitleEn}"`);
    assert.strictEqual(heroTitleEn, 'PSGC Ciamis Odds & Position Map', 'Hero Title in EN must be "PSGC Ciamis Odds & Position Map"');

    const matrixTitleEn = await page.$eval('#standings-panel-psgc .psgc-card:nth-child(2) .psgc-card-title', el => el.textContent.trim());
    assert.strictEqual(matrixTitleEn, 'Season Outcome Probability Matrix', 'Matrix Title in EN must match');

    const roadmapTitleEn = await page.$eval('#standings-panel-psgc .psgc-card:nth-child(3) .psgc-card-title', el => el.textContent.trim());
    assert.strictEqual(roadmapTitleEn, 'Win Requirements & Magic Numbers Roadmap', 'Roadmap Title in EN must match');

    const fixturesTitleEn = await page.$eval('#standings-panel-psgc .psgc-card:nth-child(4) .psgc-card-title', el => el.textContent.trim());
    assert.strictEqual(fixturesTitleEn, 'Round 2 Remaining Fixtures & Target Points Analysis', 'Fixtures Title in EN must match');

    const h2hFirstRecordEn = await page.$eval('#standings-panel-psgc .psgc-fixture-card:nth-child(1) .psgc-badge-h2h', el => el.textContent.trim());
    assert.strictEqual(h2hFirstRecordEn, '1W - 0D - 0L', `First fixture H2H record in EN must be "1W - 0D - 0L", got "${h2hFirstRecordEn}"`);

    const screenshotPathEn = path.join(screenshotsDir, 'psgc_panel_en.png');
    await page.screenshot({ path: screenshotPathEn, fullPage: true });
    console.log(`✓ Captured ${screenshotPathEn}`);

    // ------------------------------------------------------------------------
    // [Test 7] Mobile Viewport & Switcher Verification (Mobile ID)
    // ------------------------------------------------------------------------
    console.log('\n[Test 7] Testing Mobile Viewport (390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'id-ID',
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:3000');
    await mobilePage.evaluate(() => localStorage.setItem('pc_lang', 'id'));
    await mobilePage.reload();
    await mobilePage.waitForSelector('#standings-table-body tr');

    // Switch to PSGC subview on mobile
    await mobilePage.click('#btn-subview-psgc');
    await mobilePage.waitForTimeout(300);

    const mobilePanelVisible = await mobilePage.$eval('#standings-panel-psgc', el => el.style.display !== 'none');
    assert(mobilePanelVisible, 'PSGC panel must be visible on mobile viewport');

    const mobileMetrics = await mobilePage.evaluate(() => {
      const docOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      const subnavHeights = Array.from(document.querySelectorAll('.subnav-pill-btn')).map(el => el.getBoundingClientRect().height);
      const matrixCols = window.getComputedStyle(document.querySelector('#standings-panel-psgc .psgc-matrix-grid')).gridTemplateColumns.split(' ').length;
      return { docOverflow, subnavHeights, matrixCols };
    });
    assert.strictEqual(mobileMetrics.docOverflow, false, 'Mobile PSGC panel must have zero horizontal overflow');
    mobileMetrics.subnavHeights.forEach((h, i) => {
      assert(h <= 38, `Mobile sub-nav pill ${i} height (${h}px) must stay compact single-line`);
    });
    assert.strictEqual(mobileMetrics.matrixCols, 2, 'Mobile probability matrix must use 2-column grid');
    console.log('✓ Mobile layout verified: 0 horizontal overflow, single-line sub-nav pills, 2x2 probability grid');

    const screenshotPathMobile = path.join(screenshotsDir, 'psgc_panel_mobile_id.png');
    await mobilePage.screenshot({ path: screenshotPathMobile, fullPage: true });
    console.log(`✓ Captured ${screenshotPathMobile}`);

    await mobileContext.close();

    // ------------------------------------------------------------------------
    // [Test 8] Admin In-Memory Dummy Weekly Update & Reset E2E
    // ------------------------------------------------------------------------
    console.log('\n[Test 8] Testing Admin Dummy Weekly Update (+1 Week) & Reset...');
    const adminPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'id-ID' });
    await adminPage.goto('http://localhost:3000/?admin=admin123');
    await adminPage.waitForSelector('#standings-table-body tr');
    await adminPage.click('#btn-subview-psgc');
    await adminPage.waitForTimeout(300);

    // Open side drawer & verify dummy testing controls
    await adminPage.click('#btn-open-menu');
    await adminPage.waitForTimeout(250);
    const dummyBoxVisible = await adminPage.$eval('#drawer-dummy-box', el => window.getComputedStyle(el).display !== 'none');
    assert(dummyBoxVisible, 'Admin #drawer-dummy-box must be visible when authenticated');

    // Trigger Pekan 10 dummy update with PSGC Win
    await adminPage.selectOption('#dummy-psgc-outcome', 'win');
    await adminPage.click('#btn-dummy-next-week');
    await adminPage.waitForTimeout(350);

    const dummyStatusText = await adminPage.$eval('#dummy-status-label', el => el.textContent.trim());
    assert(dummyStatusText.includes('Pekan 10'), `Dummy status must show Pekan 10, got "${dummyStatusText}"`);

    const updatedPts = await adminPage.$eval('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box:nth-child(2) .psgc-stat-value', el => el.textContent.trim());
    assert.strictEqual(updatedPts, '10', `After MW10 PSGC win, points must be 10, got "${updatedPts}"`);

    const updatedMatchesLeft = await adminPage.$eval('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box:nth-child(3) .psgc-stat-value', el => el.textContent.trim());
    assert.strictEqual(updatedMatchesLeft, '17', `After MW10, matches left must be 17, got "${updatedMatchesLeft}"`);

    const remainingCardsCount = await adminPage.$$eval('#standings-panel-psgc .psgc-fixture-card', els => els.length);
    assert.strictEqual(remainingCardsCount, 8, `After MW10 FT, remaining cards must drop from 9 to 8, got ${remainingCardsCount}`);

    const firstRemainingPekan = await adminPage.$eval('#standings-panel-psgc .psgc-fixture-card:first-child', el => el.getAttribute('data-pekan'));
    assert.strictEqual(firstRemainingPekan, '11', `First remaining card must be Pekan 11, got "${firstRemainingPekan}"`);
    console.log('✓ Dummy Pekan 10 Win verified: Pts=10, Left=17, Remaining Cards=8 (starts at Pekan 11)');

    // Reset back to official baseline
    await adminPage.click('#btn-dummy-reset');
    await adminPage.waitForTimeout(350);

    const restoredPts = await adminPage.$eval('#standings-panel-psgc .psgc-hero-grid .psgc-stat-box:nth-child(2) .psgc-stat-value', el => el.textContent.trim());
    assert.strictEqual(restoredPts, '7', `After reset, points must restore to 7, got "${restoredPts}"`);
    const restoredCards = await adminPage.$$eval('#standings-panel-psgc .psgc-fixture-card', els => els.length);
    assert.strictEqual(restoredCards, 9, `After reset, remaining cards must restore to 9, got ${restoredCards}`);
    console.log('✓ Dummy Reset verified: restored cleanly to Official Pekan 9 baseline (7 Pts, 9 Cards)');

    await adminPage.close();
    console.log('\n=== ALL PLAYWRIGHT VISUAL & FUNCTIONAL TESTS PASSED 100%! ===');
  } finally {
    await browser.close();
  }
}

runVisualTests().catch(err => {
  console.error('\n❌ PLAYWRIGHT TEST FAILED:', err);
  process.exit(1);
});
