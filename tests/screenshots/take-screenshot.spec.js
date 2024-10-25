import Path from 'node:path'
import filenamifyUrl from 'filenamify-url'
import filenamify from 'filenamify'
import slugify from '@sindresorhus/slugify'
import {
    sitemapUrl,
    screenshotUrl,
    stripHostFromFileNames,
    screenshotDestination,
    pageImagesDestination
} from '../../src/args.js'
import {
    compressAndSaveImage,
    saveOptimizedImagesWhileLoadingPage
} from '../../src/images.js'
import { loadFullPage } from '../../src/helpers.js'

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
            if (typeof pageImagesDestination === 'string' && pageImagesDestination.trim().length) {
                await saveOptimizedImagesWhileLoadingPage(
                    page,
                    Path.resolve(pageImagesDestination, new URL(url).hostname),
                    'webp',
                    { maxWidth: 1920 }
                )
            }

            await loadFullPage(page, url, 500)

            // Save image to buffer in memory, no need to write unoptimized image to disk
            const imgBuffer = await page.screenshot({ fullPage: true })

            // Close page early, free up resources
            await page.close()

            const fileName = slugify(`${filenamifyUrl(path)}-${filenamify(workerInfo.project.name)}`.toLowerCase())

            const result = await compressAndSaveImage(imgBuffer, screenshotDestination, fileName, ['webp', 'jpg'])

            expect(result.error).toBeUndefined()
            expect(result.size).toBeLessThan(imgBuffer.length)
        })
    }
}
