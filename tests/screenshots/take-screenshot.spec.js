import Path from 'node:path'
import filenamifyUrl from 'filenamify-url'
import filenamify from 'filenamify'
import slugify from '@sindresorhus/slugify'
import {
    sitemapUrl,
    screenshotUrl,
    stripHostFromFileNames,
    screenshotDestination,
} from '../../src/args.js'

import { URL } from 'node:url'
import { test, expect } from '@playwright/test'
import { fetchSitemapUrls } from '../../src/sitemap.js'

await main()

async function main() {
    const urls = `${sitemapUrl}`.endsWith('.xml')
        ? await fetchSitemapUrls(sitemapUrl)
        : screenshotUrl
            .split(',')
            .map((url) => `${url}`.trim()) // just urls

    for (const url of urls) {
        const urlObj = new URL(url)
        const path = stripHostFromFileNames
            ? urlObj.href.replace(urlObj.origin + '/', '') || 'home'
            : url
        test(`${path}`, async ({ page, context}, workerInfo) => {
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

                await page.waitForTimeout(500) // Wait for lazy-loaded content to load
                await page.waitForLoadState('networkidle')

                // Update the current scroll position
                currentPosition = await page.evaluate(() => window.scrollY)
            }

            const fileName = slugify(`${filenamifyUrl(path)}-${filenamify(workerInfo.project.name)}`.toLowerCase())
            const filePath = Path.resolve(screenshotDestination,  `${fileName}.png`)
            await page.screenshot({ fullPage: true, path: filePath })

            await page.close()

            expect(true).toBe(true)
        })
    }
}
