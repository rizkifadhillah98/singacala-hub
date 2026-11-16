from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Inject fix
    page.evaluate('''() => {
        const tabs = document.querySelectorAll('.sim-putaran-tab');
        if (tabs[0]) tabs[0].textContent = 'Putaran 1 (1–9)';
        if (tabs[1]) tabs[1].textContent = 'Putaran 2 (10–18)';
        if (tabs[2]) tabs[2].textContent = 'Putaran 3 (19–27)';
        
        const style = document.createElement('style');
        style.innerHTML = `
            .sim-main-grid {
                grid-template-columns: minmax(0, 1.34fr) minmax(0, 1fr) !important;
                gap: 1.5rem !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }
            .sim-putaran-tabs {
                overflow: hidden !important;
            }
            .sim-putaran-tab {
                min-width: 0 !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                font-size: 0.8rem !important;
                padding: 0.5rem 0.4rem !important;
            }
            .sim-card-fixtures {
                padding: 1rem 1.15rem !important;
            }
            .sim-card-standings {
                padding: 1rem 1.15rem !important;
            }
            .sim-match-body {
                gap: 8px !important;
            }
            .sim-team-side {
                gap: 8px !important;
            }
            .sim-team-name {
                font-size: 0.82rem !important;
            }
            .sim-score-input {
                width: 38px !important;
                height: 36px !important;
            }
            .sim-table th, .sim-table td {
                padding: 0.55rem 0.32rem !important;
            }
            .form-badges-container {
                gap: 3px !important;
            }
            .form-badge {
                width: 17px !important;
                height: 17px !important;
                font-size: 9px !important;
            }
        `;
        document.head.appendChild(style);
    }''')
    page.wait_for_timeout(500)
    
    res = page.evaluate('''() => {
        const tableContainer = document.querySelector('.sim-table-container');
        const gridBox = document.querySelector('.sim-main-grid').getBoundingClientRect();
        const fixturesBox = document.querySelector('.sim-card-fixtures').getBoundingClientRect();
        
        return {
            tableHasScroll: tableContainer.scrollWidth > tableContainer.clientWidth,
            tableClientWidth: tableContainer.clientWidth,
            tableScrollWidth: tableContainer.scrollWidth,
            gridRight: gridBox.right,
            fixturesRight: fixturesBox.right,
            isGridAligned: Math.abs(gridBox.right - fixturesBox.right) < 1
        };
    }''')
    
    print(res)
    page.screenshot(path='scratch/fixed_both.png')
    browser.close()

