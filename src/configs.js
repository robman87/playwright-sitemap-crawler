import { devices } from '@playwright/test'
export function generatePlaywrightProjectConfigs(config = {}) {
    const projects = []

    // Make sure browsers are specified
    const browsers = getBrowserArray(config.browsers)
    const resolutions = getResolutionsArray(config.resolutions)

    if (browsers.length) {
        projects.push(
            ...browsers.flatMap((browserName) =>
                createDesktopConfig(browserName, resolutions)
            )
        )
    }

    const devices = getDevicesArray(config.devices)
    const orientations = getOrientationArray(config.orientations)

    if (devices.length) {
        projects.push(
            ...devices.flatMap((deviceName) =>
                createDeviceConfig(deviceName, orientations)
            )
        )
    }

    return projects
}

function getBrowserArray(browsers) {
    if (!browsers) {
        return []
    }

    if (!Array.isArray(browsers)) {
        browsers = [browsers]
    }

    return browsers
        .map((browser) => `${browser}`.toLowerCase())
        .filter((browser) =>
            ['chromium', 'firefox', 'webkit'].includes(browser)
        )
}
function getResolutionsArray(resolutions) {
    if (!resolutions) {
        return []
    }

    if (!Array.isArray(resolutions)) {
        resolutions = [resolutions]
    }

    resolutions = resolutions
        .map(({ width, height }) =>
            ({
                width: parseInt(width),
                height: parseInt(height)
            })
        ).filter(({ width, height }) => width > 0 && height > 0)

    return resolutions
}
function getDevicesArray(devices) {
    return (
        Array.isArray(devices)
            ? devices
            : [devices]
        )
        .filter(isNonEmptyString)
        .map((device) => device.trim())
}
function getOrientationArray(orientations) {
    return isNonEmptyArray(orientations)
        ? orientations
            .map((orientation) => `${orientation}`.toLowerCase())
            .filter((orientation) => ['landscape', 'portrait'].includes(orientation))
        : []
}

function createDesktopConfig(browserName, resolutions) {
    if (!isNonEmptyArray(resolutions)) {
        return {
            name: `${browserName}`,
            use: {browserName},
        }
    }
    return resolutions.map((resolution) => (
        {
            name: `${browserName} - ${resolution.width}x${resolution.height}`,
            use: {
                browserName,
                viewport: { width: resolution.width, height: resolution.height },
            },
        }
    ))
}
// Utility function to generate mobile/tablet device configs
function createDeviceConfig(deviceName, orientations) {
    if (!isNonEmptyArray(orientations)) {
        orientations = ['portrait']
    }
    return orientations.map((orientation) => (
        {
            name: `${deviceName} (${orientation})`,
            use: {
                ...devices[`${deviceName}${orientation === 'landscape' ? ' landscape' : ''}`],
            }
        }
    ))
}

function isNonEmptyArray(value) {
    return value &&
        Array.isArray(value) &&
        value.length
}
function isNonEmptyString(value) {
    return value &&
        typeof value === 'string' &&
        value !== ''
}