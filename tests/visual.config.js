import { defineConfig, devices } from '@playwright/test'
import {
    concurrency,
    userAgent
} from '../src/args.js'

export default defineConfig({
    testDir: './visual-regression',

    timeout: 30 * 1000,
    expect: {
        timeout: 10000
    },
    reporter: 'html',
    fullyParallel: true,
    workers: concurrency,

    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        video: 'off',
        screenshot: 'off',
        trace: 'off',
        userAgent: userAgent === 'browser' ? undefined : userAgent
    },

    projects: [
        {
            name: 'Chromium',
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'Firefox',
            use: { ...devices['Desktop Firefox'] }
        },
        {
            name: 'Webkit',
            use: { ...devices['Desktop Safari'] }
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 11'] }
        }
    ]
})