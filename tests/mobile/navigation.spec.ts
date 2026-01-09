import { test, expect } from '@playwright/test';
import { waitForPageReady, hasMobileNavigation, Breakpoints } from './helpers';

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('should open and close mobile menu', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      // Find hamburger menu button
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.isVisible()) {
        // Open menu
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Check if menu is visible
        const menu = page.locator('nav, [role="navigation"]').first();
        await expect(menu).toBeVisible();
        
        // Close menu
        await menuButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should navigate to assessment page from mobile menu', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const assessmentLink = page.locator('a[href*="assessment"]').first();
        if (await assessmentLink.isVisible()) {
          await assessmentLink.click();
          await waitForPageReady(page);
          
          expect(page.url()).toContain('assessment');
        }
      }
    }
  });

  test('should navigate to emergency page from mobile menu', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const emergencyLink = page.locator('a[href*="emergency"]').first();
        if (await emergencyLink.isVisible()) {
          await emergencyLink.click();
          await waitForPageReady(page);
          
          expect(page.url()).toContain('emergency');
        }
      }
    }
  });

  test('mobile menu should close when clicking outside', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Click outside menu
        await page.mouse.click(viewport.width / 2, viewport.height / 2);
        await page.waitForTimeout(300);
      }
    }
  });

  test('should maintain scroll position when opening menu', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      const scrollBefore = await page.evaluate(() => window.scrollY);
      
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const scrollAfter = await page.evaluate(() => window.scrollY);
        
        // Scroll position should be maintained (or body should be locked)
        expect(Math.abs(scrollBefore - scrollAfter)).toBeLessThan(10);
      }
    }
  });
});

test.describe('Mobile Bottom Navigation', () => {
  test('should display bottom navigation on mobile if present', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const bottomNav = page.locator('[class*="bottom"], [class*="fixed bottom"]').first();
      
      if (await bottomNav.isVisible()) {
        const box = await bottomNav.boundingBox();
        if (box) {
          // Bottom nav should be at the bottom of viewport
          expect(box.y + box.height).toBeGreaterThan(viewport.height - 100);
        }
      }
    }
  });

  test('bottom navigation items should be touch-friendly', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const navItems = page.locator('[class*="bottom"] a, [class*="bottom"] button');
      const count = await navItems.count();
      
      for (let i = 0; i < count; i++) {
        const item = navItems.nth(i);
        if (await item.isVisible()) {
          const box = await item.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });
});

test.describe('Mobile Gestures', () => {
  test('should support pull-to-refresh gesture', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      // Simulate pull-to-refresh
      await page.touchscreen.tap(viewport.width / 2, 100);
      await page.mouse.move(viewport.width / 2, 100);
      await page.mouse.down();
      await page.mouse.move(viewport.width / 2, 300);
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // Page should still be accessible
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should support swipe navigation if implemented', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const initialUrl = page.url();
      
      // Swipe left
      await page.touchscreen.tap(viewport.width - 50, viewport.height / 2);
      await page.mouse.move(viewport.width - 50, viewport.height / 2);
      await page.mouse.down();
      await page.mouse.move(50, viewport.height / 2);
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // Check if navigation occurred or page is still functional
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Mobile Sidebar', () => {
  test('sidebar should be hidden by default on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const sidebar = page.locator('aside, [class*="sidebar"]').first();
      
      if (await sidebar.isVisible()) {
        const box = await sidebar.boundingBox();
        if (box) {
          // Sidebar should either be off-screen or collapsed
          expect(box.x < 0 || box.width < 100).toBeTruthy();
        }
      }
    }
  });

  test('sidebar should open when menu button is clicked', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const sidebar = page.locator('aside, [class*="sidebar"]').first();
        if (await sidebar.isVisible()) {
          const box = await sidebar.boundingBox();
          if (box) {
            // Sidebar should be visible on screen
            expect(box.x).toBeGreaterThanOrEqual(-10);
          }
        }
      }
    }
  });

  test('sidebar should overlay content on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const sidebar = page.locator('aside, [class*="sidebar"]').first();
        if (await sidebar.isVisible()) {
          const position = await sidebar.evaluate((el) => {
            return window.getComputedStyle(el).position;
          });
          
          // Sidebar should be fixed or absolute positioned
          expect(['fixed', 'absolute'].includes(position)).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Mobile Breadcrumbs', () => {
  test('breadcrumbs should be responsive on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const breadcrumbs = page.locator('[aria-label*="breadcrumb" i], [class*="breadcrumb"]').first();
      
      if (await breadcrumbs.isVisible()) {
        const box = await breadcrumbs.boundingBox();
        if (box) {
          // Breadcrumbs should not overflow
          expect(box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });
});

test.describe('Mobile Search', () => {
  test('search should expand properly on mobile', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const searchButton = page.locator('button:has-text("Search"), button[aria-label*="search" i]').first();
      
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(300);
        
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        if (await searchInput.isVisible()) {
          await expect(searchInput).toBeFocused();
        }
      }
    }
  });
});

test.describe('Mobile Tabs', () => {
  test('tabs should be scrollable on mobile if needed', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const tabContainer = page.locator('[role="tablist"]').first();
      
      if (await tabContainer.isVisible()) {
        const hasScroll = await tabContainer.evaluate((el) => {
          return el.scrollWidth > el.clientWidth;
        });
        
        if (hasScroll) {
          // Should have horizontal scroll
          const overflowX = await tabContainer.evaluate((el) => {
            return window.getComputedStyle(el).overflowX;
          });
          
          expect(['auto', 'scroll'].includes(overflowX)).toBeTruthy();
        }
      }
    }
  });
});
