import Path from 'node:path'
import { promises as Fs } from 'node:fs'
import Sharp from 'sharp'
import { ensureDirectoryExists } from './helpers.js'

// In-memory cache to track processed image URLs
const processedImagesCache = new Set()

export async function saveOptimizedImagesWhileLoadingPage(page, destinationDir, preferredFormat = 'webp', formatOptions = {}) {
    const originalImagePath = Path.join(destinationDir, 'original')
    const optimizedImagePath = Path.join(destinationDir, 'optimized')
    await Promise.all([
        ensureDirectoryExists(originalImagePath),
        ensureDirectoryExists(optimizedImagePath)
    ])

    // Intercept network requests to capture images (case-insensitive, handles query params)
    await page.route(/\.(png|jpe?g)(\?.*)?$/i, async (route) => {
        const url = new URL(route.request().url())

        if (await isImageProcessed(url.href, optimizedImagePath, preferredFormat)) {
            return route.continue() // Skip processing and continue the request
        }

        // Fetch the image data
        const response = await page.request.fetch(route.request())

        // Continue with the request
        route.fulfill({ response })

        const buffer = await response.body()
        const originalSize = buffer.length

        // Save the image in preferred or original format
        const [savedImage] = await Promise.all([
            saveImage(buffer, optimizedImagePath, url.pathname, preferredFormat, formatOptions),
            Fs.writeFile(Path.join(originalImagePath, Path.parse(url.pathname).base), buffer)
        ])

        if (savedImage.error) {
            console.error(`Failed to convert image ${url.href}: ${savedImage.error}`)
        } else {
            const fileSizeSavings = (1 - savedImage.size / originalSize) * 100
            console.log(`Saved: ${savedImage.path}, saved ${fileSizeSavings.toFixed(1)}%, ${originalSize} => ${savedImage.size} bytes`)
        }
    })
}

// Check if the image has already been processed or exists on disk
async function isImageProcessed(imageUrl, destinationDir, preferredFormat) {
    if (processedImagesCache.has(imageUrl)) {
        console.log(`Skipping: ${imageUrl} (already processed in memory)`)
        return true // Already processed in memory
    }

    const parsedPath = Path.parse(new URL(imageUrl).pathname)
    const formatsToTry = [preferredFormat, parsedPath.ext.replace('.', '').toLowerCase()]

    for (const format of formatsToTry) {
        const destinationPath = Path.resolve(destinationDir, `${parsedPath.name}.${format}`)
        try {
            await Fs.access(destinationPath) // Check if file exists
            console.log(`Skipping: ${destinationPath} (already exists on disk)`)
            processedImagesCache.add(imageUrl) // Add to cache
            return true // Found existing file
        } catch {
            // File does not exist, continue checking other formats
        }
    }

    processedImagesCache.add(imageUrl) // Add to cache to prevent future checks
    return false // Image needs processing
}

// Save the image in preferred and original formats
async function saveImage(buffer, destinationDir, pathname, preferredFormat, formatOptions) {
    const parsedPath = Path.parse(pathname)
    const fileName = parsedPath.name
    const formatsToTry = [preferredFormat, parsedPath.ext.replace('.', '').toLowerCase()]

    return compressAndSaveImage(buffer, destinationDir, fileName, formatsToTry, formatOptions)
}

// Compress and save the image in multiple formats
export async function compressAndSaveImage(buffer, basePath, fileName, formatsToTry = ['webp', 'jpg', 'png'], formatOptions = {}) {
    await ensureDirectoryExists(basePath)

    const sharp = Sharp(buffer)
    for (const format of formatsToTry) {
        const imgFormat = format === 'jpg' ? 'jpeg' : format
        try {
            const img = await sharp.toFormat(
                imgFormat,
                getFormatOptions(imgFormat, formatOptions)
            )

            const destination = Path.resolve(basePath, `${fileName}.${format}`)
            const info = await img.toFile(destination)
            info.path = destination

            return info // Return information about saved image
        } catch (err) {
            console.warn(err.message)
        }
    }
    return { error: 'Failed converting image to suitable format' } // Return error if all attempts fail
}

// Get format options for the specified image format
export function getFormatOptions(format, options = {}) {
    const defaultOptions = {
        jpeg: {
            quality: 60, // 0-100
            progressive: false,
            mozjpeg: true, // lower filesize
            force: true
        },
        png: {
            quality: 60, // requires libvips compiled with support for libimagequant
            progressive: false,
            palette: true,
            compressionLevel: 8, // 0-9
            effort: 8,
            force: true
        },
        webp: {
            quality: 60, // 0-100
            lossless: false,
            nearLossless: false,
            smartSubsample: false,
            effort: 4, // 0-6, effort 6 takes very, very long time
            force: true
        },
        avif: {
            quality: 50, // 0-100
            effort: 5, // effort 8 takes really really long time, 5 is fast enough
            lossless: false,
            force: true
        }
    }
    defaultOptions.jpg = defaultOptions.jpeg

    return Object.assign(
        {},
        defaultOptions[format],
        options
    )
}
