import { URL } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
import filenamifyUrl from 'filenamify-url'

// Used for visual regerssion tests
const cachedFiles = new Set()
// Used for cache warming
const downloadedFiles = new Set()

export function maybeAbortRequests(sitemapUrl, warmFilesWithExtensions = []) {
    const baseSitemapOrigin = new URL(sitemapUrl).origin

    return (route) => {
        const requestUrl = new URL(route.request().url())
        const fileExtension = requestUrl.pathname.split('.').pop().toLowerCase()

        if (
            route.request().method().toUpperCase() === 'GET' && // only GET requests
            requestUrl.origin === baseSitemapOrigin && // only urls from origin
            !downloadedFiles.has(requestUrl.pathname)  && // only files that have not been previously downloaded
            (
                requestUrl.pathname.endsWith('/') ||
                warmFilesWithExtensions.includes(fileExtension) // only allowed file extensions
            )
        ) {
            downloadedFiles.add(requestUrl.pathname)
            //console.log(`Requesting ${route.request().url()}`)
            route.continue()
        } else {
            route.abort()
        }
    }
}

export function saveFileFromResponseToCache(downloadedFiles) {
    return async function(response) {
        if (!downloadedFiles.has(response.url())) {
            const filePath = filenamifyUrl(response.url())
            try {
                await writeFile(filePath)
                downloadedFiles.add(response.url())
            } catch(e) {}
        }
        response.continue()
    }
}

export async function serveUnchangedFilesFromDisk(route) {
    if (
        route.request().method().toUpperCase() !== 'GET'
        // TODO: check if no file extension in path
    ) {
        return route.continue()
    }

    // TODO: clone request
    // TODO: stop request

    const requestUrl = route.request().url()
    const file = await getCachedFileFromUrl(requestUrl)
    const response = await isFileModifiedOnServer(route.request())
    if (!file || response.status() === 200) {
        const buffer = await response.body()
        const fileName = filenamifyUrl(requestUrl)
        // TODO: add base path
        await writeFile(fileName, buffer)
        // TODO: return response with buffer
        route.continue(response)
    }
    // TODO: return response with file from disk
}

async function getCachedFileFromUrl(url) {
    try {
        return await readFile(filenamifyUrl(url))
    } catch (e) {
        return false
    }
}

async function isFileModifiedOnServer(request){
    // TODO: get last modified date of file
    // TODO: add If-Modified-Since header, to request
    request.headers()['If-Modified-Since'] = Date.now()
    // wait for request to finish
    const response = await request
    return response.status() === 304
}