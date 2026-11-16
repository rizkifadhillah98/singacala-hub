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

def test_r3_gen():
    with sync_playwright() as p:
        browser = launch_browser(p)

        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.goto('http://localhost:3000/#simulation')
        page.wait_for_timeout(1000)
        
        # Click Putaran 3 tab
        page.click("button[data-putaran='3']")
        page.wait_for_timeout(1000)
        
        # Click Generate Putaran 3
        page.click('#btn-trigger-r3-now')
        page.wait_for_timeout(1500)
        
        # Check that matches for Pekan 19 are rendered
        match_count = page.locator('.sim-match-card').count()
        print('Match cards rendered for Pekan 19:', match_count)
        assert match_count == 5, f'Expected 5 match cards, got {match_count}'
        
        # Dismiss regulatory popup if open
        r3_modal = page.locator('#r3-regulatory-modal-backdrop')
        if r3_modal.is_visible():
            page.locator('#btn-r3-modal-proceed').click()
            page.wait_for_timeout(500)
        
        # Reset back to real baseline
        page.on('dialog', lambda d: d.accept())
        page.click('#btn-sim-reset')
        page.wait_for_timeout(1000)
        print('Reset successful')
        browser.close()

if __name__ == '__main__':
    test_r3_gen()

