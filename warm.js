import {
    proxyCacheHeaderName,
    sitemapUrl,
    concurrency,
    warmFilesWithExtensions
} from './src/args.js'

import { request, chromium } from '@playwright/test'
import { URL } from 'node:url'
import { fetchSitemapUrls } from './src/sitemap.js'
import { maybeAbortRequests } from './src/optimisations.js'

main(sitemapUrl, concurrency)
    .catch((error) => {
        console.error(error)
    })

async function main(sitemapUrl, concurrency) {
    const browser = await chromium.launch({ headless: true }) // Configure Playwright to run in headless mode
    const context = await browser.newContext()

    // Optimization, skips previously downloaded files
    await context.route('**/*', maybeAbortRequests(sitemapUrl, warmFilesWithExtensions))

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

    console.log(`Starting warming of ${urls.length} urls with concurrency of ${concurrency}`)

    const promises = []
    for (const url of urls) {
        promises.push(warmPageCache(url, context))
        if (promises.length >= concurrency) {
            await Promise.allSettled(promises)
            promises.length = 0
        }
    }

    await Promise.allSettled(promises)
    await context.close()
    await browser.close()
}

async function warmPageCache(url, context) {
    const page = await context.newPage()
    const pageLog = [
        `*** Warming cache for ${url} ***`,
        '---------------------------------'
    ]

    page.on('response', getOnResponseHandler(new URL(url).origin, pageLog, await request.newContext()))

    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.close()
    pageLog.push(
        `*** Closed page ${url} ***`,
        '---------------------------------\n'
    )
    console.log(pageLog.join('\n'))
}

function getOnResponseHandler(origin, pageLog, fetch) {
    return async (response) => {
        // Only successful requests from origin
        if (
            response.status() !== 200 ||
            !response.url().startsWith(origin)
        ) {
            return
        }

        const headers = response.headers()
        const contentType = headers['content-type']

        if (
            contentType &&
            (
                contentType.includes('text/html') ||
                contentType.includes('text/css') ||
                contentType.includes('application/javascript') ||
                contentType.includes('image')
            )
        ) {
            const responseLog = [
                `URL: ${response.url()}`
            ]

            const proxyCacheStatus = headers[proxyCacheHeaderName]
            const cfCacheStatus = headers['cf-cache-status']

            // Log headers if they exist
            if (proxyCacheStatus) {
                const hName = proxyCacheHeaderName
                responseLog.push(`1. ${hName}: ${proxyCacheStatus}`)
                if (!cfCacheStatus && proxyCacheStatus === 'MISS') { // no need to check origin if cloudflare is caching in front of it
                    // Check if cache status is HIT on next request
                    const res = await fetch.get(response.url())
                    responseLog.push(`2. ${hName}: ${res.headers()[hName]}`)
                }
            }

            if (cfCacheStatus) {
                const hName = 'cf-cache-status'
                responseLog.push(`1. ${hName}: ${cfCacheStatus}`)
                if (['MISS', 'REVALIDATED'].includes(cfCacheStatus)) {
                    // Check if cache status is HIT on next request
                    const res = await fetch.get(response.url())
                    responseLog.push(`2. ${hName}: ${res.headers()[hName]}`)
                }
            }

            responseLog.push('---------------------------------')

            pageLog.push(...responseLog)
        }
    }
}