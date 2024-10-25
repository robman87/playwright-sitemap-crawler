import { promises as Fs } from 'node:fs'

// Ensure the directory exists
export async function ensureDirectoryExists(directory) {
    try {
        await Fs.mkdir(directory, { recursive: true })
    } catch (err) {
        console.error(`Error creating directory: ${err.message}`)
        throw err // Re-throw to let the caller handle it
    }
}

export async function loadFullPage(page, url, scroll_delay = 500) {
    await page.goto(url)

    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle')

    // Get the height of the viewport dynamically from the browser
    const viewportHeight = await page.evaluate(() => window.innerHeight)

    let currentPosition = 0
    let previousPosition = -1

    // Scroll down by viewport height until no more content is loaded
    while (previousPosition !== currentPosition) {
        previousPosition = currentPosition

        // Scroll down by the viewport height
        await page.evaluate((viewportHeight) => {
            window.scrollBy(0, viewportHeight)
        }, viewportHeight)

        await page.waitForTimeout(scroll_delay || 500) // Wait for lazy-loaded content to load
        await page.waitForLoadState('networkidle')

        // Update the current scroll position
        currentPosition = await page.evaluate(() => window.scrollY)
    }

    return currentPosition
}