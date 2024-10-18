import Path from 'node:path'
import filenamifyUrl from 'filenamify-url'
import filenamify from 'filenamify'
import slugify from '@sindresorhus/slugify'
import {
    sitemapUrl,
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
        : sitemapUrl
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
            await page.waitForTimeout(1000)

            const fileName = slugify(`${filenamifyUrl(path)}-${filenamify(workerInfo.project.name)}`.toLowerCase())
            const filePath = Path.resolve(screenshotDestination,  `${fileName}.png`)
            await page.screenshot({ fullPage: true, path: filePath })

            await page.close()

            expect(true).toBe(true)
        })
    }
}
