import { Page, expect } from '@playwright/test';

/**
 * Device categories for responsive testing
 */
export const DeviceCategories = {
  MOBILE_SMALL: { minWidth: 320, maxWidth: 374 },
  MOBILE_MEDIUM: { minWidth: 375, maxWidth: 424 },
  MOBILE_LARGE: { minWidth: 425, maxWidth: 767 },
  TABLET: { minWidth: 768, maxWidth: 1023 },
  DESKTOP_SMALL: { minWidth: 1024, maxWidth: 1439 },
  DESKTOP_LARGE: { minWidth: 1440, maxWidth: Infinity },
} as const;

/**
 * Common breakpoints used in Tailwind CSS
 */
export const Breakpoints = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * Get device category based on viewport width
 */
export function getDeviceCategory(width: number): keyof typeof DeviceCategories {
  for (const [category, range] of Object.entries(DeviceCategories)) {
    if (width >= range.minWidth && width <= range.maxWidth) {
      return category as keyof typeof DeviceCategories;
    }
  }
  return 'DESKTOP_LARGE';
}

/**
 * Check if element is visible in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Check if element has proper touch target size (minimum 44x44px for accessibility)
 */
export async function hasTouchTargetSize(page: Page, selector: string): Promise<boolean> {
  const MIN_TOUCH_SIZE = 44;
  
  return await page.evaluate(({ sel, minSize }) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return rect.width >= minSize && rect.height >= minSize;
  }, { sel: selector, minSize: MIN_TOUCH_SIZE });
}

/**
 * Check if text is readable (not too small on mobile)
 */
export async function hasReadableFontSize(page: Page, selector: string): Promise<boolean> {
  const MIN_FONT_SIZE = 16; // Minimum for mobile readability
  
  return await page.evaluate(({ sel, minSize }) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
    return fontSize >= minSize;
  }, { sel: selector, minSize: MIN_FONT_SIZE });
}

/**
 * Check if element has proper spacing on mobile
 */
export async function hasProperSpacing(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const margin = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    
    return (padding + margin) >= 8; // Minimum spacing
  }, selector);
}

/**
 * Simulate touch gesture (swipe)
 */
export async function swipe(
  page: Page,
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 200
) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Viewport not set');
  
  const startX = viewport.width / 2;
  const startY = viewport.height / 2;
  
  let endX = startX;
  let endY = startY;
  
  switch (direction) {
    case 'left':
      endX = startX - distance;
      break;
    case 'right':
      endX = startX + distance;
      break;
    case 'up':
      endY = startY - distance;
      break;
    case 'down':
      endY = startY + distance;
      break;
  }
  
  await page.touchscreen.tap(startX, startY);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY);
  await page.mouse.up();
}

/**
 * Check if navigation menu is mobile-friendly (hamburger menu on mobile)
 */
export async function hasMobileNavigation(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  if (!viewport) return false;
  
  const isMobile = viewport.width < Breakpoints.MD;
  
  if (isMobile) {
    // Check for hamburger menu button
    const hamburgerVisible = await page.locator('[aria-label*="menu" i], [aria-label*="navigation" i], button:has(svg)').first().isVisible().catch(() => false);
    return hamburgerVisible;
  }
  
  return true;
}

/**
 * Check if images are properly sized for mobile
 */
export async function hasResponsiveImages(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    
    return images.every(img => {
      const style = window.getComputedStyle(img);
      const maxWidth = style.maxWidth;
      const width = style.width;
      
      // Check if image has responsive sizing
      return maxWidth === '100%' || width === '100%' || img.hasAttribute('srcset');
    });
  });
}

/**
 * Check for horizontal scrolling (should not exist on mobile)
 */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

/**
 * Test orientation change
 */
export async function testOrientationChange(page: Page, callback: () => Promise<void>) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Viewport not set');
  
  // Switch to landscape
  await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await callback();
  
  // Switch back to portrait
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await callback();
}

/**
 * Check if form inputs are mobile-friendly
 */
export async function hasMobileFriendlyForms(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    
    return inputs.every(input => {
      const rect = input.getBoundingClientRect();
      const style = window.getComputedStyle(input);
      const fontSize = parseFloat(style.fontSize);
      
      // Check minimum height and font size
      return rect.height >= 44 && fontSize >= 16;
    });
  });
}

/**
 * Wait for page to be fully loaded and interactive
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for any animations to complete
  await page.waitForTimeout(500);
}

/**
 * Take screenshot with device name in filename
 */
export async function takeDeviceScreenshot(page: Page, name: string) {
  const viewport = page.viewportSize();
  const deviceInfo = viewport ? `${viewport.width}x${viewport.height}` : 'unknown';
  await page.screenshot({ 
    path: `screenshots/${name}-${deviceInfo}.png`,
    fullPage: true 
  });
}

/**
 * Assert element is visible and properly sized for touch
 */
export async function assertTouchFriendly(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
  const isTouchFriendly = await hasTouchTargetSize(page, selector);
  expect(isTouchFriendly).toBeTruthy();
}

/**
 * Assert no layout shift occurs
 */
export async function assertNoLayoutShift(page: Page, action: () => Promise<void>) {
  const initialLayout = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });
  });
  
  await action();
  
  const finalLayout = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    return elements.map(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });
  });
  
  // Allow small differences due to rendering
  const TOLERANCE = 2;
  const shifted = initialLayout.some((initial, i) => {
    const final = finalLayout[i];
    if (!final) return false;
    
    return (
      Math.abs(initial.top - final.top) > TOLERANCE ||
      Math.abs(initial.left - final.left) > TOLERANCE
    );
  });
  
  expect(shifted).toBeFalsy();
}
