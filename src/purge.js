import { cloudflare_api_key, cloudflare_email, cloudflare_zone_id } from './args.js'

export async function purge_cloudflare(url) {
    logger.debug('  🗑️ Purging', {
        method: 'DELETE',
        url: url
    })

    if (!Array.isArray(url)) {
        url = [url]
    }

    return got(`https://api.cloudflare.com/client/v4/zones/${cloudflare_zone_id}/purge_cache`, {
        method: 'DELETE',
        headers: {
            'User-Agent': 'Playwright Sitemap Warmer',
            'X-Auth-Email': cloudflare_email,
            'X-Auth-Key': cloudflare_api_key,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            files: url,
        }),
    })
}

export async function purge_proxy(url, accept_encoding = '') {
    const headers = Object.assign(
        this.custom_headers,
        {accept_encoding}
    )
    const method = this.settings.purge_url ? "GET" : "PURGE"

    const purge_url = this.settings.purge_url
        ? url.replace(this.settings.domain, this.settings.purge_url)
        : url

    logger.debug('  🗑️ Purging', {
        method,
        url: purge_url,
        accept_encoding: headers.accept_encoding
    })

    const options = {
        headers: Object.assign(
            {
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "user-agent": 'Playwright Sitemap Warmer'
            },
            headers
        ),
        body: null,
        method,
        mode: "cors"
    }
}