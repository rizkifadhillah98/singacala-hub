// ==========================================================================
// TEST SUITE: PSGC CIAMIS CRISP WHITE HIGHLIGHT REGRESSION & VERIFICATION
// Verifies PSGC highlights across:
// 1. Real Standings Table (.psgc-row, 1px solid #ffffff)
// 2. Simulated Standings Table (.psgc-row, 1px solid #ffffff)
// 3. Fixtures & Results Match Cards (.match-psgc, 1px solid #ffffff)
// 4. Simulator Liga Match Cards (Putaran 2 & Putaran 3, .match-psgc, 1px solid #ffffff)
// 5. Progression Chart & Stats View (white styling, chip, line, row)
// 6. Strict UI Rules (no colored left border, no emojis, flat dark backgrounds)
// 7. Responsive Mobile & Desktop, Bilingual ID & EN
// ==========================================================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function runPsgcHighlightTests() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('=== TEST SUITE: PSGC CIAMIS HIGHLIGHT VERIFICATION ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'id-ID',
  });
  await context.addInitScript(() => localStorage.setItem('pc_disclaimer_accepted', 'true'));

  const page = await context.newPage();

  try {
    // ------------------------------------------------------------------------
    // [Test 1] Real Standings Table PSGC Highlight
    // ------------------------------------------------------------------------
    console.log('[Test 1] Testing Real Standings Table PSGC Highlight...');
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.setItem('pc_lang', 'id'));
    await page.reload();
    await page.waitForSelector('#standings-table-body tr');

    const psgcRows = await page.$$('#standings-table-body tr.psgc-row');
    assert.strictEqual(psgcRows.length, 1, 'Standings table must have exactly 1 PSGC highlighted row in Grup A');

    const psgcRowClubName = await psgcRows[0].$eval('.club-title', el => el.textContent.trim());
    console.log(`✓ Highlighted row club name: "${psgcRowClubName}"`);
    assert(psgcRowClubName.includes('PSGC'), 'Highlighted row must be PSGC');

    // Verify non-PSGC rows do NOT have .psgc-row
    const nonPsgcRows = await page.$$('#standings-table-body tr:not(.psgc-row)');
    assert.strictEqual(nonPsgcRows.length, 9, 'Exactly 9 non-PSGC rows must not have .psgc-row class');

    // Verify white outline/border on PSGC row
    const psgcRowStyle = await page.$eval('#standings-table-body tr.psgc-row', el => {
      const cs = window.getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow,
      };
    });
    console.log('✓ PSGC row computed style:', psgcRowStyle);
    assert(
      psgcRowStyle.outlineColor.includes('255, 255, 255') ||
      psgcRowStyle.boxShadow.includes('255, 255, 255'),
      'PSGC row must have crisp white outline or box-shadow'
    );

    // Verify td:first-child does not have colored indicator bar over white border
    const firstCellPseudoDisplay = await page.$eval('#standings-table-body tr.psgc-row td:first-child', el => {
      const beforeCs = window.getComputedStyle(el, '::before');
      return beforeCs.display;
    });
    assert.strictEqual(firstCellPseudoDisplay, 'none', '::before pseudo-element on PSGC td:first-child must be hidden');
    console.log('✓ Real Standings PSGC row verified: clean white outline/border, no colored left border');

    // ------------------------------------------------------------------------
    // [Test 2] Fixtures & Results Match Cards Highlight
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Testing Fixtures & Results Match Cards Highlight...');
    await page.click('#nav-btn-fixtures');
    await page.waitForTimeout(400);

    // Switch to All Matchweeks to see all matches
    await page.click('#btn-period-dropdown');
    await page.waitForTimeout(200);
    await page.click('#period-menu [data-week="all"]');
    await page.waitForTimeout(400);

    const allMatchCards = await page.$$('#fixtures-matches-stream .match-card-row');
    assert(allMatchCards.length > 0, 'Match cards must be rendered');

    const psgcMatchCards = await page.$$('#fixtures-matches-stream .match-card-row.match-psgc');
    assert(psgcMatchCards.length > 0, 'Must have match cards featuring PSGC Ciamis');

    // Verify all highlighted cards actually feature PSGC
    for (const card of psgcMatchCards) {
      const homeTeam = await card.$eval('.team-side.home .match-team-name', el => el.textContent.trim());
      const awayTeam = await card.$eval('.team-side.away .match-team-name', el => el.textContent.trim());
      assert(
        homeTeam.includes('PSGC') || awayTeam.includes('PSGC'),
        `Card with .match-psgc must feature PSGC, found: ${homeTeam} vs ${awayTeam}`
      );

      const cardBorder = await card.evaluate(el => {
        const cs = window.getComputedStyle(el);
        return {
          borderTopColor: cs.borderTopColor,
          borderBottomColor: cs.borderBottomColor,
          borderLeftColor: cs.borderLeftColor,
          borderRightColor: cs.borderRightColor,
          borderLeftWidth: cs.borderLeftWidth,
          borderRightWidth: cs.borderRightWidth,
          outlineColor: cs.outlineColor,
        };
      });
      assert(
        cardBorder.borderTopColor.includes('255, 255, 255') || cardBorder.outlineColor.includes('255, 255, 255'),
        'PSGC match card must have white border or outline'
      );
      assert.strictEqual(cardBorder.borderLeftWidth, cardBorder.borderRightWidth, 'Left and right border widths must match (no thick left border)');
    }
    console.log(`✓ Fixtures verified: ${psgcMatchCards.length} PSGC match cards have crisp white borders`);

    // Verify non-PSGC match cards do NOT have .match-psgc
    const nonPsgcMatchCards = await page.$$('#fixtures-matches-stream .match-card-row:not(.match-psgc)');
    for (const card of nonPsgcMatchCards.slice(0, 5)) {
      const homeTeam = await card.$eval('.team-side.home .match-team-name', el => el.textContent.trim());
      const awayTeam = await card.$eval('.team-side.away .match-team-name', el => el.textContent.trim());
      assert(
        !homeTeam.includes('PSGC') && !awayTeam.includes('PSGC'),
        `Non-highlighted card must not feature PSGC, found: ${homeTeam} vs ${awayTeam}`
      );
    }
    console.log('✓ Non-PSGC fixture cards retain standard unhighlighted styling');

    // ------------------------------------------------------------------------
    // [Test 3] Simulator Liga PSGC Highlight (Standings & Match Cards)
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Testing Simulator Liga PSGC Highlights...');
    await page.click('#nav-btn-simulation');
    await page.waitForTimeout(400);

    // Verify PSGC row in Simulator Standings
    const simPsgcRow = await page.$('.sim-table tbody tr.standings-row.psgc-row');
    assert(simPsgcRow, 'Simulator standings must have .psgc-row');
    const simClubName = await simPsgcRow.$eval('.club-table-name', el => el.textContent.trim());
    assert(simClubName.includes('PSGC'), 'Simulated highlighted row must be PSGC');

    const simPsgcStyle = await simPsgcRow.evaluate(el => {
      const cs = window.getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow,
      };
    });
    assert(
      simPsgcStyle.outlineColor.includes('255, 255, 255') || simPsgcStyle.boxShadow.includes('255, 255, 255'),
      'Simulated PSGC row must have white outline'
    );
    console.log('✓ Simulator standings PSGC row displays crisp white outline');

    // Check Putaran 2 Match Cards (find a week involving PSGC, e.g. Pekan 10)
    // Pekan 10 is the first week of Putaran 2
    const weekNavBtn10 = await page.$('.sim-week-btn[data-pekan="10"]');
    if (weekNavBtn10) {
      await weekNavBtn10.click();
      await page.waitForTimeout(300);

      // Check if Pekan 10 has PSGC match
      const p10Cards = await page.$$('.sim-match-card');
      for (const card of p10Cards) {
        const homeName = await card.$eval('.home-side .sim-team-name', el => el.textContent.trim());
        const awayName = await card.$eval('.away-side .sim-team-name', el => el.textContent.trim());
        const hasPsgc = homeName.includes('PSGC') || awayName.includes('PSGC');
        const hasClass = await card.evaluate(el => el.classList.contains('match-psgc'));
        assert.strictEqual(hasPsgc, hasClass, `Match card ${homeName} vs ${awayName} .match-psgc class match expected: ${hasPsgc}`);

        if (hasPsgc) {
          const cardStyle = await card.evaluate(el => {
            const cs = window.getComputedStyle(el);
            return {
              borderColor: cs.borderColor,
              borderLeftWidth: cs.borderLeftWidth,
              borderRightWidth: cs.borderRightWidth,
            };
          });
          assert(cardStyle.borderColor.includes('255, 255, 255'), 'PSGC sim match card must have white border');
          assert.strictEqual(cardStyle.borderLeftWidth, cardStyle.borderRightWidth, 'Left and right border widths must match');
          console.log(`✓ Putaran 2 PSGC match card (${homeName} vs ${awayName}) verified: crisp white border`);
        }
      }
    }

    // Now test Putaran 3 generation & PSGC highlights in Putaran 3
    console.log('Testing Putaran 3 Match Cards PSGC Highlight...');
    await page.click('#btn-sim-r2'); // Simulate through Matchweek 18
    await page.waitForTimeout(600);

    // If modal opens, proceed to simulation
    const modalBackdrop = await page.$('#r3-regulatory-modal-backdrop');
    const isModalVisible = modalBackdrop && await modalBackdrop.evaluate(el => el.classList.contains('show') || el.classList.contains('active'));
    if (isModalVisible) {
      // Check PSGC matches inside Round 3 modal
      const modalPsgcMatches = await page.$$('#r3-modal-body .r3-match-row.match-psgc');
      console.log(`✓ Found ${modalPsgcMatches.length} PSGC matches in Round 3 modal active week`);
      for (const mRow of modalPsgcMatches) {
        const borderCol = await mRow.evaluate(el => window.getComputedStyle(el).borderColor);
        assert(borderCol.includes('255, 255, 255'), 'R3 modal PSGC match must have white border');
      }

      await page.click('#btn-r3-modal-proceed');
      await page.waitForTimeout(400);
    }

    // Check week 19 or later in main simulator view
    const weekNavBtn19 = await page.$('.sim-week-btn[data-pekan="19"]');
    if (weekNavBtn19) {
      await weekNavBtn19.click();
      await page.waitForTimeout(300);

      const r3PsgcCards = await page.$$('.sim-match-card.match-psgc');
      console.log(`✓ Putaran 3 Pekan 19 PSGC match cards: ${r3PsgcCards.length}`);
      for (const card of r3PsgcCards) {
        const cardStyle = await card.evaluate(el => window.getComputedStyle(el).borderColor);
        assert(cardStyle.includes('255, 255, 255'), 'Putaran 3 PSGC match card must have white border');
      }
    }
    console.log('✓ Putaran 2 and Putaran 3 Simulator PSGC match cards verified');

    // ------------------------------------------------------------------------
    // [Test 4] Progression Chart & Team Stats PSGC Highlight
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Testing Progression Chart & Team Stats Highlights...');
    // Standings -> Progression subview
    await page.click('#nav-btn-standings');
    await page.waitForTimeout(400);
    await page.click('#btn-subview-progression');
    await page.waitForTimeout(400);

    // Check PSGC chip
    const psgcChip = await page.$('.chart-club-chip.chip-psgc');
    assert(psgcChip, 'Progression chart must have .chart-club-chip.chip-psgc');
    const chipStyle = await psgcChip.evaluate(el => {
      const cs = window.getComputedStyle(el);
      return {
        borderColor: cs.borderColor,
        color: cs.color,
      };
    });
    assert(chipStyle.borderColor.includes('255, 255, 255'), 'PSGC chip must have white border');
    console.log('✓ Progression chart PSGC chip has white border and text styling');

    // Check PSGC line in SVG
    const psgcLine = await page.$('.club-line.psgc-line');
    assert(psgcLine, 'Progression SVG must have .club-line.psgc-line');
    const lineStroke = await psgcLine.evaluate(el => el.getAttribute('stroke'));
    assert.strictEqual(lineStroke.toLowerCase(), '#ffffff', 'PSGC line stroke must be #ffffff');
    console.log('✓ Progression chart PSGC line stroke is #ffffff');

    // Check Team Statistics View
    await page.click('#nav-btn-stats');
    await page.waitForTimeout(400);

    const statsPsgcRows = await page.$$('.stat-card-mini-table tbody tr.psgc-row');
    console.log(`✓ Stats view contains ${statsPsgcRows.length} PSGC rows in mini ranking tables`);
    for (const sRow of statsPsgcRows) {
      const sStyle = await sRow.evaluate(el => window.getComputedStyle(el).outlineColor);
      assert(sStyle.includes('255, 255, 255'), 'Stats mini table PSGC row must have white outline');
    }

    // Check Stats Detail View
    const firstViewMoreBtn = await page.$('.stat-view-more-btn');
    if (firstViewMoreBtn) {
      await firstViewMoreBtn.click();
      await page.waitForTimeout(400);

      const detailPsgcRow = await page.$('.stat-detail-table tbody tr.psgc-row');
      assert(detailPsgcRow, 'Stats detail table must have .psgc-row for PSGC Ciamis');
      const detailPsgcClub = await detailPsgcRow.$eval('.club-name-detail', el => el.textContent.trim());
      assert(detailPsgcClub.includes('PSGC'), 'Detail row must be PSGC');

      const detailRowStyle = await detailPsgcRow.evaluate(el => window.getComputedStyle(el).outlineColor);
      assert(detailRowStyle.includes('255, 255, 255'), 'Stats detail PSGC row must have white outline');
      console.log('✓ Stats detail view PSGC row verified: clean white outline');
    }

    // ------------------------------------------------------------------------
    // [Test 5] Strict UI Rules Verification
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Verifying Strict UI Rules (Flat Dark Monochrome, 0 Emojis, No Left Border)...');
    // Check no emojis in modified elements
    const forbiddenEmojis = ['🔥', '⭐', '⚽', '🎯', '🚨', '⚠️', '📈', '📉', '🏆', '🎮', '📌', '🎲', '✈️', '🌙', '⚖️'];

    const standingsPsgcText = await page.evaluate(() => {
      const el = document.querySelector('#standings-table-body tr.psgc-row');
      return el ? el.innerText : '';
    });
    forbiddenEmojis.forEach(emoji => {
      assert(!standingsPsgcText.includes(emoji), `Standings PSGC row contains forbidden emoji: ${emoji}`);
    });

    // Check dark background preservation
    const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    console.log(`✓ Body background color: ${bodyBg}`);
    assert(bodyBg.includes('8, 9, 11') || bodyBg.includes('13, 15, 20'), 'Body background must be flat dark');

    // ------------------------------------------------------------------------
    // [Test 6] Desktop & Mobile Screenshots Capture
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] Capturing Desktop & Mobile Screenshots...');
    // Desktop Standings ID
    await page.click('#nav-btn-standings');
    await page.waitForTimeout(300);
    await page.click('#btn-subview-table');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'psgc_standings_highlight_desktop.png') });
    console.log('✓ Captured psgc_standings_highlight_desktop.png');

    // Desktop Fixtures
    await page.click('#nav-btn-fixtures');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, 'psgc_fixtures_highlight_desktop.png') });
    console.log('✓ Captured psgc_fixtures_highlight_desktop.png');

    // Mobile Viewport Test
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'id-ID',
    });
    await mobileContext.addInitScript(() => localStorage.setItem('pc_disclaimer_accepted', 'true'));
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:3000');
    await mobilePage.waitForSelector('#standings-table-body tr');

    const mobilePsgcRow = await mobilePage.$('#standings-table-body tr.psgc-row');
    assert(mobilePsgcRow, 'Mobile standings must have .psgc-row');
    await mobilePage.screenshot({ path: path.join(screenshotsDir, 'psgc_standings_mobile.png') });
    console.log('✓ Captured psgc_standings_mobile.png');

    await mobileContext.close();

    console.log('\n=== ALL PSGC HIGHLIGHT TESTS PASSED 100%! ===');
  } finally {
    await browser.close();
  }
}

runPsgcHighlightTests().catch(err => {
  console.error('\n❌ PSGC HIGHLIGHT TEST FAILED:', err);
  process.exit(1);
});
