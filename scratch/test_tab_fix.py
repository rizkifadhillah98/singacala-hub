from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Inject fix
    page.evaluate('''() => {
        // Fix tab text in HTML
        const tabs = document.querySelectorAll('.sim-putaran-tab');
        if (tabs[0]) tabs[0].textContent = 'Putaran 1 (1–9)';
        if (tabs[1]) tabs[1].textContent = 'Putaran 2 (10–18)';
        if (tabs[2]) tabs[2].textContent = 'Putaran 3 (19–27)';
        
        const style = document.createElement('style');
        style.innerHTML = `
            .sim-main-grid {
                grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) !important;
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
        `;
        document.head.appendChild(style);
    }''')
    page.wait_for_timeout(500)
    
    res = page.evaluate('''() => {
        const report = [];
        const tabsBox = document.querySelector('.sim-putaran-tabs');
        const tabsRect = tabsBox.getBoundingClientRect();
        tabsBox.querySelectorAll('.sim-putaran-tab').forEach((tab, i) => {
            const rect = tab.getBoundingClientRect();
            report.push({
                name: `Tab ${i+1}: ${tab.textContent.trim()}`,
                width: rect.width,
                right: rect.right,
                containerRight: tabsRect.right,
                isOverflowing: rect.right > tabsRect.right + 1
            });
        });
        
        document.querySelectorAll('.sim-team-name').forEach(el => {
            report.push({
                team: el.textContent,
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                isTruncated: el.scrollWidth > el.clientWidth
            });
        });
        
        const tableContainer = document.querySelector('.sim-table-container');
        report.push({
            tableHasScroll: tableContainer.scrollWidth > tableContainer.clientWidth,
            tableClientWidth: tableContainer.clientWidth,
            tableScrollWidth: tableContainer.scrollWidth
        });
        
        const gridBox = document.querySelector('.sim-main-grid').getBoundingClientRect();
        const fixturesBox = document.querySelector('.sim-card-fixtures').getBoundingClientRect();
        report.push({
            gridRight: gridBox.right,
            fixturesRight: fixturesBox.right,
            isGridAligned: Math.abs(gridBox.right - fixturesBox.right) < 1
        });
        
        return report;
    }''')
    
    for r in res:
        print(r)
        
    page.screenshot(path='scratch/fixed_tab_overflow.png')
    browser.close()

