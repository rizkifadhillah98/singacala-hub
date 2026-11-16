from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Click Putaran 3 tab
    page.click("button[data-putaran='3']")
    page.wait_for_timeout(1000)
    
    banner = page.locator('.sim-r3-banner')
    banner.screenshot(path='scratch/r3_banner_updated.png')
    page.screenshot(path='scratch/r3_page_updated.png')
    browser.close()
    print('Screenshots taken successfully')

