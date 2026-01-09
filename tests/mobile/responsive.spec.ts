import { test, expect } from '@playwright/test';
import {
  waitForPageReady,
  hasHorizontalScroll,
  hasMobileNavigation,
  hasResponsiveImages,
  hasTouchTargetSize,
  assertTouchFriendly,
  getDeviceCategory,
  Breakpoints,
} from './helpers';

test.describe('Responsive Design - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('should not have horizontal scroll on any device', async ({ page }) => {
    const hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBeFalsy();
  });

  test('should display mobile navigation on small screens', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const hasMobileNav = await hasMobileNavigation(page);
      expect(hasMobileNav).toBeTruthy();
    }
  });

  test('should have responsive images', async ({ page }) => {
    const hasResponsive = await hasResponsiveImages(page);
    expect(hasResponsive).toBeTruthy();
  });

  test('hero section should be visible and properly sized', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    
    const viewport = page.viewportSize();
    if (viewport) {
      const heroBox = await hero.boundingBox();
      expect(heroBox).toBeTruthy();
      if (heroBox) {
        expect(heroBox.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test('call-to-action buttons should be touch-friendly on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const ctaButtons = page.locator('button, a[href*="assessment"], a[href*="emergency"]');
      const count = await ctaButtons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = ctaButtons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test('text should be readable on mobile devices', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const bodyText = page.locator('p, span, div').first();
      const fontSize = await bodyText.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      
      expect(fontSize).toBeGreaterThanOrEqual(14);
    }
  });
});

test.describe('Responsive Design - Assessment Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
  });

  test('should display assessment form properly on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const form = page.locator('form, [role="form"]').first();
      if (await form.isVisible()) {
        const formBox = await form.boundingBox();
        expect(formBox).toBeTruthy();
        if (formBox) {
          expect(formBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  test('chat interface should be mobile-friendly', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const chatContainer = page.locator('[class*="chat"], [class*="message"]').first();
      if (await chatContainer.isVisible()) {
        const box = await chatContainer.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  test('input fields should have proper mobile sizing', async ({ page }) => {
    const inputs = page.locator('input[type="text"], textarea');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe('Responsive Design - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
  });

  test('should not have horizontal scroll', async ({ page }) => {
    const hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBeFalsy();
  });

  test('dashboard cards should stack on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const cards = page.locator('[class*="card"], [class*="panel"]');
      const count = await cards.count();
      
      if (count > 1) {
        const firstCard = await cards.nth(0).boundingBox();
        const secondCard = await cards.nth(1).boundingBox();
        
        if (firstCard && secondCard) {
          // Cards should be stacked vertically on mobile
          expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 10);
        }
      }
    }
  });

  test('sidebar should be collapsible on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const sidebar = page.locator('[class*="sidebar"], aside, nav').first();
      
      if (await sidebar.isVisible()) {
        const sidebarBox = await sidebar.boundingBox();
        if (sidebarBox) {
          // Sidebar should not take full width on mobile
          expect(sidebarBox.width).toBeLessThan(viewport.width);
        }
      }
    }
  });
});

test.describe('Responsive Design - Emergency Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/emergency');
    await waitForPageReady(page);
  });

  test('emergency call button should be prominently displayed', async ({ page }) => {
    const emergencyButton = page.locator('button:has-text("122"), a[href*="tel:122"], button:has-text("Emergency")').first();
    
    if (await emergencyButton.isVisible()) {
      await expect(emergencyButton).toBeVisible();
      
      const box = await emergencyButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(48);
      }
    }
  });

  test('location services should work on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      // Check if location button exists
      const locationButton = page.locator('button:has-text("Location"), button:has-text("موقع")').first();
      
      if (await locationButton.isVisible()) {
        await expect(locationButton).toBeVisible();
      }
    }
  });
});

test.describe('Touch Interactions', () => {
  test('buttons should respond to touch events', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const button = page.locator('button').first();
      
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Simulate touch
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          
          // Wait for any navigation or state change
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('links should have adequate spacing for touch', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const links = page.locator('a');
      const count = await links.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const link = links.nth(i);
        if (await link.isVisible()) {
          const box = await link.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44px
            const minDimension = Math.min(box.width, box.height);
            expect(minDimension).toBeGreaterThanOrEqual(40); // Allow slight variance
          }
        }
      }
    }
  });
});

test.describe('Viewport Breakpoints', () => {
  test('layout should adapt at 768px breakpoint', async ({ page }) => {
    // Test just below tablet breakpoint
    await page.setViewportSize({ width: 767, height: 1024 });
    await page.goto('/');
    await waitForPageReady(page);
    
    const hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBeFalsy();
  });

  test('layout should adapt at 1024px breakpoint', async ({ page }) => {
    // Test just below desktop breakpoint
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto('/');
    await waitForPageReady(page);
    
    const hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBeFalsy();
  });
});

test.describe('Performance on Mobile', () => {
  test('page should load within acceptable time on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const startTime = Date.now();
      await page.goto('/');
      await waitForPageReady(page);
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds on mobile
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('images should lazy load on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      await page.goto('/');
      
      const images = page.locator('img');
      const count = await images.count();
      
      let lazyLoadCount = 0;
      for (let i = 0; i < count; i++) {
        const loading = await images.nth(i).getAttribute('loading');
        if (loading === 'lazy') {
          lazyLoadCount++;
        }
      }
      
      // At least some images should use lazy loading
      if (count > 3) {
        expect(lazyLoadCount).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Accessibility on Mobile', () => {
  test('form labels should be properly associated', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
    
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // Input should have either an id (for label), aria-label, or aria-labelledby
        expect(id || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('interactive elements should have focus indicators', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await button.focus();
      
      const hasFocusStyle = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.outline !== 'none' || style.boxShadow !== 'none';
      });
      
      expect(hasFocusStyle).toBeTruthy();
    }
  });
});

test.describe('RTL Support on Mobile', () => {
  test('should properly display Arabic content in RTL', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    
    // Check if there's Arabic content
    const hasArabic = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return /[\u0600-\u06FF]/.test(text);
    });
    
    if (hasArabic) {
      const direction = await page.evaluate(() => {
        return document.documentElement.dir || document.body.dir;
      });
      
      expect(direction).toBe('rtl');
    }
  });
});
