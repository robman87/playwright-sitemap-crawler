import { userAgent } from './args.js'
import { request } from '@playwright/test'

export async function fetchSitemapUrls(sitemapUrl, context = null) {
    const ctx = await (context || request.newContext());

    // Create a repository.
    const response = await ctx.get(sitemapUrl, {
        headers: {
            'Accept': 'application/xml',
            'User-Agent': userAgent
        }
    });
    const sitemapXML = await response.text()
    let urls = []

    const regex = /<loc>(.*?)<\/loc>/g
    let match
    const subSitemaps = []
    while ((match = regex.exec(sitemapXML)) !== null) {
        const url = match[1]
        if (url.toLowerCase().endsWith('.xml')) {
            subSitemaps.push(url)
        } else {
            urls.push(url)
        }
    }
    // add sitemaps recursively
    for (const url of subSitemaps) {
        urls = urls.concat(await fetchSitemapUrls(url))
    }

    return urls
}