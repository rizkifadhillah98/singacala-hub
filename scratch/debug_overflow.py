from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:3000/#simulation')
    page.wait_for_timeout(1000)
    
    # Check elements inside sim-col-fixtures
    res = page.evaluate('''() => {
        const col = document.querySelector('.sim-col-fixtures');
        const elements = col.querySelectorAll('*');
        const report = [];
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > 1248) {
                report.push({
                    tag: el.tagName,
                    class: el.className,
                    width: rect.width,
                    right: rect.right,
                    overflow: rect.right - 1248
                });
            }
        });
        return report;
    }''')
    
    print("Elements overflowing > 1248:")
    for r in res[:20]:
        print(r)
        
    browser.close()

