import { defineConfig } from '@playwright/test'
import { concurrency } from '../src/args.js'
import { generatePlaywrightProjectConfigs } from '../src/configs.js'

// Define configurations
const browsers = ['chromium'] // Chrome, Firefox, Safari
const resolutions = [
    { width: 3840, height: 2160 }, // 4K
    { width: 1920, height: 1080 }, // Full HD
    { width: 1280, height: 720 },  // HD
]
const mobileDevices = ['iPhone 14 Pro Max', 'iPhone SE']
const tabletDevices = ['iPad Pro 11']
const devices = tabletDevices.concat(mobileDevices)
const orientations = ['portrait', 'landscape']

const projects = generatePlaywrightProjectConfigs({
    browsers,
    resolutions,
    devices,
    orientations
})

export default defineConfig({
    testDir: './screenshots',

    timeout: 60 * 1000,
    expect: {
        timeout: 10000
    },
    reporter: 'html',
    fullyParallel: true,
    workers: concurrency,

    use: {
        headless: true,
        //viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        video: 'off',
        screenshot: 'off', // take screenshot for each test
        trace: 'off',
        //userAgent: userAgent === 'browser' ? undefined : userAgent
    },

    projects
})