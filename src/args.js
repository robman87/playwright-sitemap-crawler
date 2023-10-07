import 'dotenv/config'
import os from 'node:os'
import physicalCoreCount from 'physical-cpu-count-async'

// TODO: add CLI-args and env vars
const proxyCacheHeaderName = process.env.PROXY_CACHE_STATUS_HEADER || 'x-cache-status' // can vary between servers
const purgeProxyCache = process.env.PROXY_PURGE_CACHE || false
const purgeCloudflareCache = process.env.CLOUDFLARE_PURGE_CACHE || false
const cloudflare_email = process.env.CLOUDFLARE_EMAIL || ''
const cloudflare_zone_id = process.env.CLOUDFLARE_ZONE_ID || ''
const cloudflare_api_key = process.env.CLOUDFLARE_API_KEY || ''
// TODO: split up into images, js, css, fonts and custom
const warmFilesWithExtensions = typeof process.env.WARM_FILE_EXTENSIONS  === 'string'
    ? process.env.WARM_FILE_EXTENSIONS.split(',').map((value) => value.trim())
    : ['js', 'css', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'woff', 'woff2', 'pdf'] // default

const sitemapUrl = process.env.SITEMAP_URL

const desiredConcurrency = parseInt(process.env.CONCURRENCY) || physicalCoreCount
const concurrency = Math.min(physicalCoreCount, desiredConcurrency)

const maxDiffPixels = parseInt(process.env.MAX_DIFF_PIXELS) || 0
const stripHostFromFileNames = process.env.STRIP_HOST_FROM_FILENAMES

const userAgent = process.env.USER_AGENT || 'Playwright Sitemap Warmer (https://github.com/robman87/playwright-sitemap-crawler)'

export {
    // Shared
    sitemapUrl,
    concurrency,
    // Cache warming
    proxyCacheHeaderName,
    purgeProxyCache,
    purgeCloudflareCache,
    cloudflare_email,
    cloudflare_zone_id,
    cloudflare_api_key,
    warmFilesWithExtensions,
    // Visual regression testing
    maxDiffPixels,
    stripHostFromFileNames,
    userAgent
}