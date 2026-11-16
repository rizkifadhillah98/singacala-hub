from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    page.evaluate('''() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .sim-main-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) !important;
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
            .sim-table th, .sim-table td {
                padding: 0.6rem 0.38rem !important;
            }
        `;
        document.head.appendChild(style);
    }''')
    page.wait_for_timeout(500)
    
    # Check table overflow
    table_overflow = page.evaluate('''() => {
        const container = document.querySelector('.sim-table-container');
        return {
            clientWidth: container.clientWidth,
            scrollWidth: container.scrollWidth,
            hasScroll: container.scrollWidth > container.clientWidth
        };
    }''')
    print("Table overflow info:", table_overflow)
    
    elements = [
        '.sim-toolbar-card',
        '.sim-outcome-card',
        '.sim-main-grid',
        '.sim-col-standings',
        '.sim-col-fixtures',
        '.sim-card-fixtures',
    ]
    for sel in elements:
        loc = page.locator(sel)
        box = loc.bounding_box()
        right = box['x'] + box['width']
        print(f"{sel:<22} | X: {box['x']:<6.1f} | W: {box['width']:<6.1f} | Right: {right:<6.1f}")
        
    page.screenshot(path='scratch/perfect_grid.png')
    browser.close()

