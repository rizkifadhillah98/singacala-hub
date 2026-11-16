from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
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
    
    # Reset back to real baseline
    page.on('dialog', lambda d: d.accept())
    page.click('#btn-sim-reset')
    page.wait_for_timeout(1000)
    print('Reset successful')
    browser.close()

