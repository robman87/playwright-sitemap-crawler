import Path from 'node:path'
import filenamifyUrl from 'filenamify-url'
import {
    sitemapUrl,
    concurrency,
    screenshotDestination,
    userAgent
} from './src/args.js'

import { chromium } from '@playwright/test'
import { URL } from 'node:url'
import { fetchSitemapUrls } from './src/sitemap.js'
import { maybeAbortRequests } from './src/optimisations.js'

main(sitemapUrl, screenshotDestination, concurrency, userAgent)
    .catch((error) => {
        console.error(error)
    })

async function main(sitemapUrl, screenshotDestination, concurrency, userAgent) {
    const browser = await chromium.launch({ headless: true }) // Configure Playwright to run in headless mode
    const context = await browser.newContext({ userAgent })

    let urls = []

    if (`${sitemapUrl}`.endsWith('.xml')) {
        console.log(`Fetching sitemap ${sitemapUrl}`)
        console.log('---------------------------------')

        urls = await fetchSitemapUrls(sitemapUrl)
    } else {
        urls = sitemapUrl
            .split(',')
            .map((url) => `${url}`.trim()) // just urls
    }

    console.log(`Starting to take full-page screenshots of ${urls.length} urls with concurrency of ${concurrency}`)

    // create several pages, open urls in them concurrently

    const promises = []
    for (const url of urls) {
        const path = Path.resolve(screenshotDestination, `${filenamifyUrl(url)}.png`)
        promises.push(takeScreenshot(url, path, context))
        if (promises.length >= concurrency) {
            await Promise.allSettled(promises)
            promises.length = 0
        }
    }

    await Promise.allSettled(promises)
    await context.close()
    await browser.close()
}

async function takeScreenshot(url, path, context, fullPage = true, page = null) {
    page = page || await context.newPage()
    const pageLog = [
        `*** Screenshot of page ${url} ***`,
        '---------------------------------'
    ]

    await page.goto(url)
    await page.waitForLoadState('networkidle')

    // TODO: destination path
    await page.screenshot({ fullPage, path })

    await page.close()
    pageLog.push(
        `*** Closed page ${url} ***`,
        '---------------------------------\n'
    )
    console.log(pageLog.join('\n'))
}