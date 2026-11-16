from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Check elements overflowing or having ellipsis
    res = page.evaluate('''() => {
        const report = [];
        // Check putaran tabs
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
        
        // Check team names
        document.querySelectorAll('.sim-team-name').forEach(el => {
            report.push({
                team: el.textContent,
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                isTruncated: el.scrollWidth > el.clientWidth
            });
        });
        return report;
    }''')
    
    for r in res:
        print(r)
        
    browser.close()

