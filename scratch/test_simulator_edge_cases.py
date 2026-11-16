import sys
import time
from playwright.sync_api import sync_playwright

def test_edge_cases():
    print("=== STARTING SIMULATOR DEEP EDGE CASE TESTS ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Load simulator
        page.goto("http://localhost:3000/#simulation", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # 1. Reset simulator to ensure clean slate
        page.on("dialog", lambda dialog: dialog.accept())
        page.locator("#btn-sim-reset").click()
        page.wait_for_timeout(800)

        # 2. Test Tabindex on score inputs
        print("[Edge Test 1] Testing tabindex order on score inputs...")
        p2_tab = page.locator("button[data-putaran='2']")
        p2_tab.click()
        page.wait_for_timeout(400)

        inputs = page.locator(".sim-score-input")
        input_count = inputs.count()
        print(f"Total score inputs in Pekan 10: {input_count}")
        assert input_count == 10, f"Expected 10 score inputs for 5 matches, got {input_count}"

        for i in range(input_count):
            tab_val = inputs.nth(i).get_attribute("tabindex")
            assert tab_val == str(i + 1), f"Input {i} should have tabindex {i + 1}, got {tab_val}"
        print("✓ Tabindex order verified: consecutive 1..10 across all 5 matches!")

        # 3. Test dynamic winner styling and '✕ Hapus' button reveal on typing
        print("\n[Edge Test 2] Testing dynamic winner class and '✕ Hapus' button reveal...")
        first_match = page.locator(".sim-match-card").first
        home_side = first_match.locator(".home-side")
        away_side = first_match.locator(".away-side")
        home_name = home_side.locator(".sim-team-name").text_content().strip()
        away_name = away_side.locator(".sim-team-name").text_content().strip()
        print(f"Testing match: {home_name} vs {away_name}")

        # Check initial state: no winner, no hapus button
        assert "winner" not in (home_side.get_attribute("class") or ""), "Initial home should not be winner"
        assert "winner" not in (away_side.get_attribute("class") or ""), "Initial away should not be winner"
        assert first_match.locator(".btn-clear-match").count() == 0, "Initial should not have Hapus button"

        # Check toolbar progress before input
        init_progress = page.locator(".sim-progress-label").text_content()
        print(f"Initial progress: {init_progress.strip()}")

        # Type Home win: 3 - 0
        first_match.locator(".score-home").fill("3")
        first_match.locator(".score-away").fill("0")
        page.wait_for_timeout(500)

        # Check winner class
        assert "winner" in (home_side.get_attribute("class") or ""), "Home should have winner class!"
        assert "winner" not in (away_side.get_attribute("class") or ""), "Away should not have winner class!"
        assert first_match.locator(".btn-clear-match").is_visible(), "✕ Hapus button should now be visible!"
        print("✓ Home side gained .winner class and '✕ Hapus' button appeared dynamically!")

        # Check toolbar progress updated
        updated_progress = page.locator(".sim-progress-label").text_content()
        print(f"Updated progress: {updated_progress.strip()}")
        assert "46 /" in updated_progress, f"Expected 46 completed matches, got {updated_progress}"
        print("✓ Toolbar progress indicator updated immediately (+1 completed match)!")

        # 4. Test click on dynamic '✕ Hapus' button
        print("\n[Edge Test 3] Testing dynamic '✕ Hapus' button click...")
        first_match.locator(".btn-clear-match").click()
        page.wait_for_timeout(500)
        re_first = page.locator(".sim-match-card").first
        assert re_first.locator(".score-home").input_value() == "", "Score home should be cleared"
        assert re_first.locator(".score-away").input_value() == "", "Score away should be cleared"
        assert re_first.locator(".btn-clear-match").count() == 0, "Hapus button should be gone after clear"
        print("✓ '✕ Hapus' button successfully reset the match back to UPCOMING.")

        # 5. Test Putaran 3 Stadium names for PERSIKU (Grup A) and PERSIBA (Grup B)
        print("\n[Edge Test 4] Testing Putaran 3 Stadium names for PERSIKU & PERSIBA...")
        # Simulate R2 to generate R3
        page.locator("#btn-sim-r2").click()
        page.wait_for_timeout(1500)

        # Navigate through weeks 19-27 in Grup A and find PERSIKU home matches
        persiku_stadiums = []
        for wk in range(19, 28):
            if wk > 19:
                page.locator("#btn-sim-next-week").click()
                page.wait_for_timeout(200)
            
            cards = page.locator(".sim-match-card")
            card_count = cards.count()
            for c_idx in range(card_count):
                card = cards.nth(c_idx)
                h_name = card.locator(".home-side .sim-team-name").text_content().strip()
                if "PERSIKU" in h_name.upper():
                    std = card.locator(".sim-match-stadium").text_content().strip()
                    persiku_stadiums.append(std)

        print(f"PERSIKU Home Match stadiums found: {persiku_stadiums}")
        assert len(persiku_stadiums) > 0, "Should find PERSIKU home matches in Putaran 3"
        for std in persiku_stadiums:
            assert "Sultan Agung" in std, f"PERSIKU stadium must be Sultan Agung, got {std}"
        print("✓ PERSIKU home matches in Putaran 3 correctly mapped to 'Sultan Agung'!")

        # Switch to Grup B and check PERSIBA
        page.locator("button[data-sim-group='Grup B']").click()
        page.wait_for_timeout(600)
        page.locator("#btn-sim-r2").click()
        page.wait_for_timeout(1500)

        persiba_stadiums = []
        for wk in range(19, 28):
            if wk > 19:
                page.locator("#btn-sim-next-week").click()
                page.wait_for_timeout(200)
            
            cards = page.locator(".sim-match-card")
            card_count = cards.count()
            for c_idx in range(card_count):
                card = cards.nth(c_idx)
                h_name = card.locator(".home-side .sim-team-name").text_content().strip()
                if "PERSIBA" in h_name.upper():
                    std = card.locator(".sim-match-stadium").text_content().strip()
                    persiba_stadiums.append(std)

        print(f"PERSIBA Home Match stadiums found: {persiba_stadiums}")
        assert len(persiba_stadiums) > 0, "Should find PERSIBA home matches in Putaran 3"
        for std in persiba_stadiums:
            assert "Batakan" in std, f"PERSIBA stadium must be Batakan, got {std}"
        print("✓ PERSIBA home matches in Putaran 3 correctly mapped to 'Batakan'!")

        browser.close()
        print("\n=== ALL DEEP EDGE CASE TESTS PASSED 100% PERFECTLY! ===")

if __name__ == "__main__":
    test_edge_cases()
