from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Inject CSS test
    page.evaluate('''() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .sim-main-grid {
                grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr) !important;
                max-width: 100% !important;
                width: 100% !important;
            }
            .sim-col-standings, .sim-col-fixtures {
                min-width: 0 !important;
                max-width: 100% !important;
            }
            .sim-card {
                box-sizing: border-box !important;
                max-width: 100% !important;
            }
        `;
        document.head.appendChild(style);
    }''')
    page.wait_for_timeout(500)
    
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
            
    browser.close()

