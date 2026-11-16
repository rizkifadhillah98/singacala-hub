from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    elements = [
        '.page-container',
        '.sim-header-wrapper',
        '.sim-toolbar-card',
        '.sim-outcome-card',
        '.sim-main-grid',
        '.sim-col-standings',
        '.sim-card-standings',
        '.sim-col-fixtures',
        '.sim-card-fixtures',
    ]
    
    print(f"{'Element':<25} | {'X':<6} | {'Width':<8} | {'Right (X+W)':<11}")
    print("-" * 55)
    for sel in elements:
        loc = page.locator(sel)
        if loc.count() > 0:
            box = loc.bounding_box()
            right = box['x'] + box['width']
            print(f"{sel:<25} | {box['x']:<6.1f} | {box['width']:<8.1f} | {right:<11.1f}")
        else:
            print(f"{sel:<25} | NOT FOUND")
            
    browser.close()

