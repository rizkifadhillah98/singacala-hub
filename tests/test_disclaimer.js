const { chromium } = require('playwright');
const assert = require('assert');

async function runDisclaimerTests() {
  console.log('=== TEST SUITE: OPENING DISCLAIMER MODAL ===\n');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'id-ID',
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // 1. First visit: modal visible and locked, single paragraph summary
    const isVisible = await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show'));
    assert.strictEqual(isVisible, true, 'Disclaimer modal should be visible on first visit');
    assert.strictEqual(await page.locator('#disclaimer-modal-backdrop').getAttribute('data-locked'), 'true');
    assert.strictEqual(await page.locator('#btn-close-disclaimer').isHidden(), true);
    assert.strictEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
    assert.strictEqual(await page.locator('#disclaimer-modal-body .disclaimer-item').count(), 0);
    const idSummary = (await page.locator('#disclaimer-summary-text').textContent()).trim();
    assert(idSummary.includes('ileague.id') && idSummary.includes('Simulator Liga'), 'ID summary paragraph should render');

    // Verify UNOFFICIAL FAN-MADE is text-only without box (no background box, no border, bold text)
    const badgeStyle = await page.locator('#disclaimer-badge-unofficial').evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        borderStyle: cs.borderStyle,
        paddingLeft: cs.paddingLeft,
        fontWeight: cs.fontWeight,
        textTransform: cs.textTransform,
      };
    });
    assert.strictEqual(badgeStyle.borderStyle, 'none', 'Badge must have no border box');
    assert.strictEqual(badgeStyle.paddingLeft, '0px', 'Badge must have no padding box');
    assert(Number(badgeStyle.fontWeight) >= 800, 'Badge must have bold title font-weight (>=800)');
    console.log('✓ [Test 1] First visit shows locked disclaimer modal with text-only UNOFFICIAL FAN-MADE title and summary');

    // 2. ESC and backdrop click do not close locked modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      true
    );
    await page.mouse.click(10, 10);
    await page.waitForTimeout(150);
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      true
    );
    console.log('✓ [Test 2] Escape and backdrop click do not dismiss before acceptance');

    // 3. In-modal language switch (ID -> EN -> ID)
    await page.click('#disclaimer-lang-switcher .lang-segment[data-lang="en"]');
    await page.waitForLoadState('networkidle');
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      true
    );
    assert.strictEqual((await page.locator('#disclaimer-modal-title').textContent()).trim(), 'Welcome to Singacala Hub');
    assert.strictEqual((await page.locator('#btn-accept-disclaimer').textContent()).trim(), 'Understand & Continue');
    const enSummary = (await page.locator('#disclaimer-summary-text').textContent()).trim();
    assert(enSummary.includes('League Simulator') && enSummary.includes('PSGC Odds'), 'EN summary paragraph should render');

    await page.click('#disclaimer-lang-switcher .lang-segment[data-lang="id"]');
    await page.waitForLoadState('networkidle');
    assert.strictEqual((await page.locator('#disclaimer-modal-title').textContent()).trim(), 'Selamat Datang di Singacala Hub');
    assert.strictEqual((await page.locator('#btn-accept-disclaimer').textContent()).trim(), 'Mengerti & Lanjutkan');
    console.log('✓ [Test 3] In-modal ID/EN toggle works without losing modal state');

    // 4. Accept disclaimer
    await page.click('#btn-accept-disclaimer');
    await page.waitForTimeout(200);
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      false
    );
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('pc_disclaimer_accepted')), 'true');
    assert.strictEqual(await page.evaluate(() => document.body.style.overflow), '');
    console.log('✓ [Test 4] Accept button closes modal and saves pc_disclaimer_accepted');

    // 5. Reload does not re-open
    await page.reload({ waitUntil: 'networkidle' });
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      false
    );
    console.log('✓ [Test 5] Reload does not re-open disclaimer');

    // 6. Footer button opens review mode + language switch + ESC close
    await page.locator('#btn-open-disclaimer').scrollIntoViewIfNeeded();
    await page.click('#btn-open-disclaimer');
    await page.waitForTimeout(200);
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      true
    );
    assert.strictEqual(await page.locator('#disclaimer-modal-backdrop').getAttribute('data-locked'), 'false');
    assert.strictEqual(await page.locator('#btn-close-disclaimer').isVisible(), true);
    assert.strictEqual((await page.locator('#btn-accept-disclaimer').textContent()).trim(), 'Tutup');

    await page.click('#disclaimer-lang-switcher .lang-segment[data-lang="en"]');
    await page.waitForLoadState('networkidle');
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      true
    );
    assert.strictEqual((await page.locator('#btn-accept-disclaimer').textContent()).trim(), 'Close');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    assert.strictEqual(
      await page.locator('#disclaimer-modal-backdrop').evaluate((el) => el.classList.contains('show')),
      false
    );
    console.log('✓ [Test 6] Footer reopen review mode, language switch, and ESC close verified');

    // 7. Mobile viewport check (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => localStorage.removeItem('pc_disclaimer_accepted'));
    await page.reload({ waitUntil: 'networkidle' });
    const box = await page.locator('.disclaimer-modal-box').boundingBox();
    assert(box && box.width <= 390 && box.height <= 844, `Mobile modal fits viewport: ${JSON.stringify(box)}`);
    const zBackdrop = await page.locator('#disclaimer-modal-backdrop').evaluate((el) => Number(getComputedStyle(el).zIndex));
    const zMobNav = await page.locator('#mobile-bottom-nav').evaluate((el) => Number(getComputedStyle(el).zIndex));
    assert(zBackdrop > zMobNav, `Disclaimer z-index (${zBackdrop}) must exceed mobile nav (${zMobNav})`);
    console.log(`✓ [Test 7] Mobile layout verified (${Math.round(box.width)}x${Math.round(box.height)}, z=${zBackdrop} > ${zMobNav})`);

    assert.strictEqual(errors.length, 0, `Unexpected page errors: ${errors.join('; ')}`);
    console.log('\n=== ALL DISCLAIMER TESTS PASSED 100%! ===');
  } finally {
    await browser.close();
  }
}

runDisclaimerTests().catch((err) => {
  console.error('\n❌ DISCLAIMER TEST FAILED:', err);
  process.exit(1);
});
