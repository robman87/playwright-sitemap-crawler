import {
    sitemapUrl,
    maxDiffPixels,
    stripHostFromFileNames
} from '../src/args.js'

import { URL } from 'node:url'
import { test, expect } from '@playwright/test'
import { fetchSitemapUrls } from '../src/sitemap.js'

await main()

async function main() {
    const urls = await fetchSitemapUrls(sitemapUrl)

    for (const url of urls) {
        const urlObj = new URL(url)
        const path = stripHostFromFileNames
            ? urlObj.href.replace(urlObj.origin + '/', '') || 'home'
            : url
        test(`${path}`, async ({ page}) => {

            await page.goto(url)
            await page.waitForLoadState('networkidle')

            expect(await page.screenshot({ fullPage: true })).toMatchSnapshot({ maxDiffPixels })

            await page.close()
        })
    }
}
