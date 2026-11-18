const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('--- [TEST: Floating Summary Bar Tab Isolation] ---');
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome'
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('http://localhost:3000/#standings', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('pc_lang', 'id');
      localStorage.setItem('pc_disclaimer_accepted', 'true');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    async function checkVisibility(viewName, shouldBeVisible) {
      const isVisible = await page.$eval('#sim-floating-summary', (el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const parentStyle = window.getComputedStyle(el.parentElement);
        return style.display !== 'none' && parentStyle.display !== 'none' && rect.height > 0 && rect.width > 0;
      }).catch(() => false);

      console.log(`✓ Tab [${viewName}] -> Floating Bar Visible: ${isVisible} (Expected: ${shouldBeVisible})`);
      assert.strictEqual(isVisible, shouldBeVisible, `Visibility mismatch on tab ${viewName}`);
    }

    // 1. Initial on Standings
    await checkVisibility('standings (initial)', false);

    // 2. Go to Fixtures
    await page.click('#mobile-nav-fixtures');
    await page.waitForTimeout(400);
    await checkVisibility('fixtures', false);

    // 3. Go to Stats
    await page.click('#mobile-nav-stats');
    await page.waitForTimeout(400);
    await checkVisibility('stats', false);

    // 4. Go to Simulation
    await page.click('#mobile-nav-simulation');
    await page.waitForTimeout(600);
    await checkVisibility('simulation', true);

    // 5. Back to Standings
    await page.click('#mobile-nav-standings');
    await page.waitForTimeout(400);
    await checkVisibility('standings (after sim)', false);

    // 6. Back to Fixtures
    await page.click('#mobile-nav-fixtures');
    await page.waitForTimeout(400);
    await checkVisibility('fixtures (after sim)', false);

    // 7. Back to Stats
    await page.click('#mobile-nav-stats');
    await page.waitForTimeout(400);
    await checkVisibility('stats (after sim)', false);

    console.log('\n=== ALL FLOATING SUMMARY BAR TAB ISOLATION TESTS PASSED 100%! ===');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
