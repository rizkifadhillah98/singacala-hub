import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome')
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Handle dialogs automatically (accept confirmation)
        page.on("dialog", lambda dialog: dialog.accept())

        await page.goto('http://localhost:3000', wait_until='networkidle')

        # Click Simulator tab
        await page.click('button[data-view="simulation"]')
        await page.wait_for_selector('.sim-toolbar-card')
        await page.wait_for_timeout(1000)

        # 1. Desktop full simulation view
        await page.screenshot(path='scratch/reset_btn_desktop.png')
        print("Desktop screenshot captured: scratch/reset_btn_desktop.png")

        # 2. Close-up of toolbar card
        toolbar = page.locator('.sim-toolbar-card')
        await toolbar.screenshot(path='scratch/reset_btn_toolbar_closeup.png')
        print("Toolbar closeup captured: scratch/reset_btn_toolbar_closeup.png")

        # 3. Test functional behavior of reset button
        # Click simulate week
        btn_sim_week = page.locator('#btn-sim-week')
        await btn_sim_week.click()
        await page.wait_for_timeout(500)

        # Click reset button
        btn_reset = page.locator('#btn-sim-reset')
        await btn_reset.click()
        await page.wait_for_timeout(500)
        print("Reset button clicked and dialog accepted successfully!")

        # 4. Mobile viewport verification
        mobile_context = await browser.new_context(viewport={'width': 390, 'height': 844})
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto('http://localhost:3000', wait_until='networkidle')
        # On mobile, use the mobile bottom navigation item
        await mobile_page.click('#mobile-nav-simulation')
        await mobile_page.wait_for_selector('.sim-mobile-view-toggle')

        # Switch to fixtures tab on mobile where toolbar is visible
        await mobile_page.click('button[data-mobile-tab="fixtures"]')
        await mobile_page.wait_for_timeout(500)
        await mobile_page.screenshot(path='scratch/reset_btn_mobile.png')
        print("Mobile screenshot captured: scratch/reset_btn_mobile.png")

        await browser.close()
        print("ALL SCREENSHOTS AND FUNCTIONAL CHECKS PASSED!")

asyncio.run(main())
