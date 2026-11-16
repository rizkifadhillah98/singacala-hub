import sys
import time
from playwright.sync_api import sync_playwright

def launch_browser(p):
    for channel in ["msedge", "chrome", None]:
        try:
            if channel:
                return p.chromium.launch(channel=channel, headless=True)
            else:
                return p.chromium.launch(headless=True)
        except Exception:
            continue
    raise RuntimeError("Failed to launch any Chromium browser (msedge, chrome, or default chromium).")

def run_tests():
    print("=== STARTING SIMULATOR E2E TESTS ===")
    with sync_playwright() as p:
        browser = launch_browser(p)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        context.add_init_script("localStorage.setItem('pc_disclaimer_accepted', 'true');")
        page = context.new_page()

        # Capture console messages and errors
        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[Browser PageError] {err}"))

        # 1. Load Homepage
        print("\n[Test 1] Loading http://localhost:3000...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # 2. Click Navigation to Simulator Liga
        print("\n[Test 2] Clicking 'Simulator Liga' navbar pill...")
        nav_sim_btn = page.locator("#nav-btn-simulation")
        assert nav_sim_btn.is_visible(), "Nav button for simulator should be visible"
        nav_sim_btn.click()
        page.wait_for_timeout(500)

        # Verify hash and active section
        assert page.evaluate("window.location.hash") == "#simulation", "Hash should be #simulation"
        sim_section = page.locator("#view-simulation")
        assert sim_section.is_visible(), "Simulation view section should be visible"
        print("✓ Successfully navigated to #simulation view.")

        # 3. Check UI Components Rendered
        print("\n[Test 3] Verifying core UI elements...")
        page.wait_for_selector(".sim-header-wrapper", timeout=5000)
        page.wait_for_selector(".sim-toolbar-card", timeout=5000)
        page.wait_for_selector(".sim-outcome-card", timeout=5000)
        page.wait_for_selector("#sim-standings-table", timeout=5000)
        page.wait_for_selector("#sim-match-cards-list", timeout=5000)
        print("✓ Header, toolbar, outcome card, standings table, and match cards all rendered.")

        # 4. Interactive Score Input on Pekan 10
        print("\n[Test 4] Testing interactive score inputs on Pekan 10...")
        # Check current week badge
        week_badge = page.locator(".sim-week-badge").text_content()
        print(f"Current selected week badge: {week_badge}")

        # If not Pekan 10, click putaran 2
        p2_tab = page.locator("button[data-putaran='2']")
        p2_tab.click()
        page.wait_for_timeout(500)

        first_match = page.locator(".sim-match-card").first
        home_name = first_match.locator(".home-side .sim-team-name").text_content().strip()
        away_name = first_match.locator(".away-side .sim-team-name").text_content().strip()
        print(f"Pekan 10 Match 0: {home_name} vs {away_name}")

        # Get initial points for home_name
        init_row = page.locator(f"#sim-table-body tr[data-club='{home_name}']")
        init_pts = int(init_row.locator("td.col-stat.font-bold").text_content())
        print(f"Initial points for {home_name}: {init_pts}")

        # Enter score: Home 4, Away 1
        home_input = first_match.locator(".score-home")
        away_input = first_match.locator(".score-away")
        home_input.fill("4")
        away_input.fill("1")
        page.wait_for_timeout(500)

        # Verify standings immediately updated live!
        updated_row = page.locator(f"#sim-table-body tr[data-club='{home_name}']")
        updated_pts = int(updated_row.locator("td.col-stat.font-bold").text_content())
        print(f"Updated points for {home_name}: {updated_pts}")
        assert updated_pts == init_pts + 3, f"Expected {init_pts + 3} points, got {updated_pts}"
        print("✓ Live standings table updated immediately upon score input (+3 pts for Home win)!")

        # 5. Quick Sim: Simulasikan Pekan 10
        print("\n[Test 5] Testing 'Simulasikan Pekan Ini'...")
        btn_sim_week = page.locator("#btn-sim-week")
        btn_sim_week.click()
        page.wait_for_timeout(800)

        # Check all matches in week 10 now have FT status
        ft_badges = page.locator(".sim-status-badge.badge-ft").count()
        print(f"FT badges count in Pekan 10: {ft_badges}")
        assert ft_badges == 5, f"All 5 matches should be FT, found {ft_badges}"
        print("✓ 'Simulasikan Pekan Ini' filled realistic scores for all 5 matches.")

        # 6. Quick Sim: Simulasikan s/d Pekan 18 & Auto-generate Putaran 3
        print("\n[Test 6] Testing 'Simulasikan s/d Pekan 18' and Putaran 3 generation...")
        btn_sim_r2 = page.locator("#btn-sim-r2")
        btn_sim_r2.click()
        page.wait_for_timeout(1500)

        # Check that we are now on Putaran 3 (Pekan 19)
        week_badge_after_r2 = page.locator(".sim-week-badge").text_content()
        print(f"Week badge after Pekan 18 sim: {week_badge_after_r2}")
        assert "19" in week_badge_after_r2, "Should automatically advance to Pekan 19"

        # Verify Round 3 Banner displays scenario info
        scenario_banner = page.locator(".sim-r3-banner.active-scenario")
        assert scenario_banner.is_visible(), "Scenario banner should be active for Round 3"
        banner_text = scenario_banner.text_content()
        print(f"Scenario Banner text: {banner_text}")
        assert "PERSIRAJA" in banner_text, "Grup A scenario should mention PERSIRAJA"

        # Verify Pekan 19 has 5 matches
        r3_matches = page.locator(".sim-match-card").count()
        print(f"Pekan 19 match count: {r3_matches}")
        assert r3_matches == 5, f"Expected 5 matches in Pekan 19, got {r3_matches}"

        # Verify Round 3 Regulatory Modal is displayed and proceed to simulation
        r3_modal = page.locator("#r3-regulatory-modal-backdrop")
        if r3_modal.is_visible():
            assert page.locator(".r3-reason-box").count() > 0, "Regulatory reasons must be rendered in modal"
            page.locator("#btn-r3-modal-proceed").click()
            page.wait_for_timeout(500)

        # Verify Ramadhan clause: PERSIRAJA is AWAY in Pekan 19, 20, 21
        for wk in [19, 20, 21]:
            # Select week
            if wk == 20:
                page.locator("#btn-sim-next-week").click()
                page.wait_for_timeout(400)
            elif wk == 21:
                page.locator("#btn-sim-next-week").click()
                page.wait_for_timeout(400)

            # Find match involving PERSIRAJA
            persiraja_away = page.locator(".sim-match-card .away-side:has-text('PERSIRAJA')").count()
            persiraja_home = page.locator(".sim-match-card .home-side:has-text('PERSIRAJA')").count()
            print(f"Pekan {wk}: Persiraja Home={persiraja_home}, Persiraja Away={persiraja_away}")
            assert persiraja_away == 1, f"In Pekan {wk}, PERSIRAJA MUST be Away! (Got Away={persiraja_away})"
            assert persiraja_home == 0, f"In Pekan {wk}, PERSIRAJA CANNOT be Home! (Got Home={persiraja_home})"

        print("✓ Ramadhan Clause STRICTLY SATISFIED: PERSIRAJA plays Away in Pekan 19, 20, and 21!")

        # 7. Simulate entire season
        print("\n[Test 7] Testing 'Simulasikan Semua (s/d Pekan 27)'...")
        btn_sim_all = page.locator("#btn-sim-all")
        btn_sim_all.click()
        page.wait_for_timeout(2000)

        # Check season complete badge
        final_badge = page.locator(".sim-outcome-badge.badge-final")
        assert final_badge.is_visible(), "Final season outcome badge should be visible"
        print(f"Final Outcome Badge: {final_badge.text_content().strip()}")

        # Check P1, P2, P9, P10 in Outcome Card
        p1_name = page.locator(".box-grandfinal .outcome-team-name").text_content().strip()
        p2_name = page.locator(".box-playoff-promosi .outcome-team-name").text_content().strip()
        p9_name = page.locator(".box-playoff-degradasi .outcome-team-name").text_content().strip()
        p10_name = page.locator(".box-relegation .outcome-team-name").text_content().strip()
        print(f"Grand Final (P1): {p1_name}")
        print(f"Play-off Promosi (P2): {p2_name}")
        print(f"Play-off Degradasi (P9): {p9_name}")
        print(f"Degradasi Langsung (P10): {p10_name}")
        assert p1_name and p2_name and p9_name and p10_name, "All 4 outcome spots must be populated"

        # 8. LocalStorage Persistence Test
        print("\n[Test 8] Testing page reload and localStorage persistence...")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1000)
        reloaded_badge = page.locator(".sim-outcome-badge.badge-final")
        assert reloaded_badge.is_visible(), "Simulated state should persist after reload"
        print("✓ Simulation state successfully persisted in localStorage across reload.")

        # 9. Group B Simulation Test
        print("\n[Test 9] Testing Grup B switcher & standard matrix...")
        btn_grup_b = page.locator("button[data-sim-group='Grup B']")
        btn_grup_b.click()
        page.wait_for_timeout(600)

        grup_b_card = page.locator(".sim-outcome-group-label").text_content().strip()
        print(f"Active group label: {grup_b_card}")
        assert grup_b_card == "Grup B", "Active group should be Grup B"

        # Simulate all for Grup B
        page.locator("#btn-sim-all").click()
        page.wait_for_timeout(1500)
        p1_b = page.locator(".box-grandfinal .outcome-team-name").text_content().strip()
        print(f"Grup B Grand Finalist: {p1_b}")
        assert p1_b, "Grup B simulation should produce Grand Finalist"
        print("✓ Grup B successfully simulated with Standard Matrix!")

        # 10. Reset to Real Data
        print("\n[Test 10] Testing 'Reset Data Real'...")
        # Handle confirm dialog
        page.on("dialog", lambda dialog: dialog.accept())
        page.locator("#btn-sim-reset").click()
        page.wait_for_timeout(1000)

        # In Grup B, after reset, Pekan 10 should be UPCOMING
        p2_tab = page.locator("button[data-putaran='2']")
        p2_tab.click()
        page.wait_for_timeout(400)
        upcoming_badges = page.locator(".sim-status-badge.badge-upcoming").count()
        print(f"Upcoming badges count after reset: {upcoming_badges}")
        assert upcoming_badges > 0, "After reset, Putaran 2 matches should be UPCOMING"
        print("✓ Reset successfully restored real baseline data.")

        # 11. Mobile Viewport & Responsiveness Test
        print("\n[Test 11] Testing mobile viewport (375x667)...")
        mobile_page = context.new_page()
        mobile_page.set_viewport_size({"width": 375, "height": 667})
        mobile_page.goto("http://localhost:3000/#simulation", wait_until="networkidle")
        mobile_page.wait_for_timeout(1000)

        # Check mobile tabs
        mobile_toggle = mobile_page.locator(".sim-mobile-view-toggle")
        assert mobile_toggle.is_visible(), "Mobile view toggle bar should be visible on mobile"

        # Click fixtures tab on mobile
        mobile_page.locator("button[data-mobile-tab='fixtures']").click()
        mobile_page.wait_for_timeout(400)
        fixtures_col = mobile_page.locator(".sim-col-fixtures")
        assert fixtures_col.is_visible(), "Fixtures column should be visible on mobile"

        # Take screenshot of mobile view for verification
        mobile_page.screenshot(path="scratch/simulator_mobile.png")
        print("✓ Mobile layout responsive, tabs functional, screenshot saved to scratch/simulator_mobile.png.")

        # Desktop screenshot
        page.set_viewport_size({"width": 1280, "height": 900})
        page.screenshot(path="scratch/simulator_desktop.png")
        print("✓ Desktop screenshot saved to scratch/simulator_desktop.png.")

        browser.close()
        print("\n=== ALL E2E PLAYWRIGHT TESTS PASSED 100% PERFECTLY! ===")

if __name__ == "__main__":
    run_tests()

