import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for mobile-specific testing with device emulation
 * Tests responsive design across multiple screen sizes and devices
 */
export default defineConfig({
  testDir: './tests/mobile',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Mobile devices - Chromium only
    {
      name: 'Mobile Chrome (iPhone 12)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Mobile Chrome (iPhone SE)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 393, height: 851 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Mobile Chrome (Galaxy S9+)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 658 },
        isMobile: true,
        hasTouch: true,
      },
    },
    
    // Tablets
    {
      name: 'Tablet (iPad)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Tablet (iPad Pro)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 834, height: 1194 },
        isMobile: true,
        hasTouch: true,
      },
    },
    
    // Desktop breakpoints
    {
      name: 'Desktop (1024px)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'Desktop (1440px)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Desktop (1920px)',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
