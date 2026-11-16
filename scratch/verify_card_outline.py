import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome')
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Handle dialogs automatically
        page.on("dialog", lambda dialog: dialog.accept())

        await page.goto('http://localhost:3000', wait_until='networkidle')

        # Click Simulator tab
        await page.click('#nav-btn-simulation')
        await page.wait_for_selector('.sim-toolbar-card')

        # Click simulate all matches
        await page.click('#btn-sim-all')
        await page.wait_for_timeout(1000)

        # Close any modal if open
        modal_close = page.locator('#btn-close-r3-modal')
        if await modal_close.is_visible():
            await modal_close.click()
            await page.wait_for_timeout(500)

        # Take screenshot of the outcome card
        outcome_card = page.locator('.sim-outcome-card')
        await outcome_card.screenshot(path='scratch/outcome_card_finalized.png')
        print("Captured outcome card screenshot: scratch/outcome_card_finalized.png")

        # Full page screenshot
        await page.screenshot(path='scratch/full_page_finalized.png')
        print("Captured full page screenshot: scratch/full_page_finalized.png")

        await browser.close()
        print("Verification complete!")

asyncio.run(main())

