import 'dotenv/config'
import physicalCoreCount from 'physical-cpu-count-async'

// TODO: add CLI-args and env vars
const proxyCacheHeaderName = process.env.PROXY_CACHE_STATUS_HEADER || 'x-cache-status' // can vary between servers
// TODO: split up into images, js, css, fonts and custom
const warmFilesWithExtensions = typeof process.env.WARM_FILE_EXTENSIONS  === 'string'
    ? process.env.WARM_FILE_EXTENSIONS.split(',').map((value) => value.trim())
    : ['js', 'css', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'woff', 'woff2', 'pdf'] // default

const sitemapUrl = process.env.SITEMAP_URL

const desiredConcurrency = parseInt(process.env.CONCURRENCY) || physicalCoreCount
const concurrency = Math.min(physicalCoreCount, desiredConcurrency)

const maxDiffPixels = parseInt(process.env.MAX_DIFF_PIXELS) || 0
const stripHostFromFileNames = process.env.STRIP_HOST_FROM_FILENAMES

const screenshotUrl = process.env.SCREENSHOT_URL
const screenshotDestination = process.env.SCREENSHOT_DESTINATION

const pageImagesDestination = process.env.PAGE_IMAGES_DESTINATION

const userAgent = process.env.USER_AGENT || 'Playwright Sitemap Warmer (https://github.com/robman87/playwright-sitemap-crawler)'

export {
    // Shared
    concurrency,
    userAgent,
    // Sitemaps
    sitemapUrl,
    // Cache warming
    proxyCacheHeaderName,
    warmFilesWithExtensions,
    // Visual regression testing
    maxDiffPixels,
    stripHostFromFileNames,
    // Screenshots
    screenshotUrl,
    screenshotDestination,
    // Page image optimization
    pageImagesDestination
}