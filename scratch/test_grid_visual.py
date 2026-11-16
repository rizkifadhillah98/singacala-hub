from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Inject CSS
    page.evaluate('''() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .sim-main-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) !important;
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
    
    page.screenshot(path='scratch/test_grid_screenshot.png')
    browser.close()
    print("Screenshot taken")

