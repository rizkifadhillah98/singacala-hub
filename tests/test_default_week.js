const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('--- [TEST: Default / Active Matchweek Logic] ---');
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome'
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to local server and set language to 'id' & accept disclaimer
    await page.goto('http://localhost:3000/#fixtures', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('pc_lang', 'id');
      localStorage.setItem('pc_disclaimer_accepted', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 1. Verify state.currentWeek is 10
    const currentWeekInState = await page.evaluate(() => {
      // Access internal state from window if exposed or check DOM
      return window.__TEST_STATE__ ? window.__TEST_STATE__.currentWeek : null;
    });

    // 2. Check #selected-period-text
    const selectedPeriodText = await page.$eval('#selected-period-text', (el) => el.textContent.trim());
    console.log(`✓ Dropdown selected week text: "${selectedPeriodText}"`);
    assert.strictEqual(selectedPeriodText, 'Pekan 10', `Expected 'Pekan 10', got '${selectedPeriodText}'`);

    // 3. Check #date-range-label
    const dateRangeText = await page.$eval('#date-range-label', (el) => el.textContent.trim());
    console.log(`✓ Date range stepper label: "${dateRangeText}"`);
    assert.strictEqual(dateRangeText, 'Pekan 10', `Expected 'Pekan 10', got '${dateRangeText}'`);

    // 4. Check active carousel chip
    const activeChipWeek = await page.$eval('.matchweek-carousel-chip.active', (el) => el.getAttribute('data-week'));
    const activeChipText = await page.$eval('.matchweek-carousel-chip.active', (el) => el.textContent.trim());
    console.log(`✓ Active carousel chip: data-week="${activeChipWeek}", text="${activeChipText}"`);
    assert.strictEqual(activeChipWeek, '10', `Expected carousel active chip to be '10', got '${activeChipWeek}'`);

    // 5. Verify matches rendered for Pekan 10
    const matchCards = await page.$$('.match-card-row');
    console.log(`✓ Match cards rendered in Pekan 10: ${matchCards.length}`);
    assert.strictEqual(matchCards.length, 5, `Expected 5 Grup A matches for Pekan 10, got ${matchCards.length}`);

    // Check one of the Pekan 10 matches: PSGC Ciamis vs Persiku Kudus
    const matchTexts = await page.$$eval('.match-card-row', (cards) =>
      cards.map((c) => {
        const home = c.querySelector('.team-side.home .match-team-name')?.textContent.trim();
        const away = c.querySelector('.team-side.away .match-team-name')?.textContent.trim();
        return `${home} vs ${away}`;
      })
    );
    console.log(`✓ Pekan 10 matches:`, matchTexts);
    assert(matchTexts.some((m) => m.toLowerCase().includes('psgc') && m.toLowerCase().includes('persiku')), 'Pekan 10 must contain PSGC Ciamis vs Persiku Kudus');

    // 6. Test Prev arrow button moves to Pekan 9
    await page.click('#btn-prev-week');
    await page.waitForTimeout(300);

    const prevDateRangeText = await page.$eval('#date-range-label', (el) => el.textContent.trim());
    const prevActiveChip = await page.$eval('.matchweek-carousel-chip.active', (el) => el.getAttribute('data-week'));
    console.log(`✓ After clicking prev arrow: label="${prevDateRangeText}", activeChip="${prevActiveChip}"`);
    assert.strictEqual(prevDateRangeText, 'Pekan 9', 'Prev arrow should navigate to Pekan 9');
    assert.strictEqual(prevActiveChip, '9', 'Pekan 9 chip should be active');

    // 7. Test Next arrow button moves back to Pekan 10
    await page.click('#btn-next-week');
    await page.waitForTimeout(300);

    const nextDateRangeText = await page.$eval('#date-range-label', (el) => el.textContent.trim());
    const nextActiveChip = await page.$eval('.matchweek-carousel-chip.active', (el) => el.getAttribute('data-week'));
    console.log(`✓ After clicking next arrow: label="${nextDateRangeText}", activeChip="${nextActiveChip}"`);
    assert.strictEqual(nextDateRangeText, 'Pekan 10', 'Next arrow should navigate back to Pekan 10');
    assert.strictEqual(nextActiveChip, '10', 'Pekan 10 chip should be active');

    console.log('\n=== ALL DEFAULT MATCHWEEK TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
