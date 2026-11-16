from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Inject CSS test with 1.55fr 1fr
    page.evaluate('''() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .sim-main-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr) !important;
                gap: 1.5rem !important;
                align-items: start !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .sim-col-standings, .sim-col-fixtures {
                min-width: 0 !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
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
            
    # Check if table scrollWidth == clientWidth (no horizontal scroll)
    table_overflow = page.evaluate('''() => {
        const container = document.querySelector('.sim-table-container');
        return {
            clientWidth: container.clientWidth,
            scrollWidth: container.scrollWidth,
            hasScroll: container.scrollWidth > container.clientWidth
        };
    }''')
    print("Table overflow info:", table_overflow)
    
    page.screenshot(path='scratch/test_grid_155.png')
    browser.close()

