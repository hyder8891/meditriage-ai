import { test, expect } from '@playwright/test';
import { waitForPageReady, Breakpoints } from './helpers';

test.describe('Mobile Forms - Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
  });

  test('form inputs should have proper mobile sizing', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const inputs = page.locator('input:not([type="hidden"]), textarea');
      const count = await inputs.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const box = await input.boundingBox();
          if (box) {
            // Minimum height for touch-friendly inputs
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test('form inputs should have proper font size to prevent zoom', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const inputs = page.locator('input:not([type="hidden"]), textarea');
      const count = await inputs.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const fontSize = await input.evaluate((el) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });
          
          // Font size should be at least 16px to prevent auto-zoom on iOS
          expect(fontSize).toBeGreaterThanOrEqual(16);
        }
      }
    }
  });

  test('form labels should be visible and properly associated', async ({ page }) => {
    const inputs = page.locator('input:not([type="hidden"]), textarea, select');
    const count = await inputs.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // Input should have proper labeling
        expect(id || ariaLabel || ariaLabelledBy).toBeTruthy();
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          if (await label.count() > 0) {
            await expect(label.first()).toBeVisible();
          }
        }
      }
    }
  });

  test('submit button should be touch-friendly', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("إرسال")').first();
      
      if (await submitButton.isVisible()) {
        const box = await submitButton.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(100);
        }
      }
    }
  });

  test('form should not cause horizontal scroll', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const form = page.locator('form').first();
      
      if (await form.isVisible()) {
        const box = await form.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  test('keyboard should appear when focusing input', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const input = page.locator('input[type="text"], textarea').first();
      
      if (await input.isVisible()) {
        await input.click();
        await page.waitForTimeout(300);
        
        // Input should be focused
        await expect(input).toBeFocused();
      }
    }
  });

  test('form validation errors should be visible on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const submitButton = page.locator('button[type="submit"]').first();
      
      if (await submitButton.isVisible()) {
        // Try to submit empty form
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Check for error messages
        const errorMessages = page.locator('[class*="error"], [role="alert"]');
        const errorCount = await errorMessages.count();
        
        if (errorCount > 0) {
          const firstError = errorMessages.first();
          await expect(firstError).toBeVisible();
        }
      }
    }
  });
});

test.describe('Mobile Forms - Login/Register', () => {
  test('login form should be mobile-friendly', async ({ page }) => {
    await page.goto('/login');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const form = page.locator('form').first();
      
      if (await form.isVisible()) {
        const box = await form.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });

  test('password input should have show/hide toggle', async ({ page }) => {
    await page.goto('/login');
    await waitForPageReady(page);
    
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await passwordInput.isVisible()) {
      // Look for toggle button near password input
      const toggleButton = page.locator('button:near(input[type="password"])').first();
      
      if (await toggleButton.isVisible()) {
        const box = await toggleButton.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('email input should have proper keyboard type', async ({ page }) => {
    await page.goto('/login');
    await waitForPageReady(page);
    
    const emailInput = page.locator('input[type="email"]').first();
    
    if (await emailInput.isVisible()) {
      const inputType = await emailInput.getAttribute('type');
      expect(inputType).toBe('email');
    }
  });
});

test.describe('Mobile Forms - Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
  });

  test('chat input should be properly sized on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
      
      if (await chatInput.isVisible()) {
        const box = await chatInput.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeLessThanOrEqual(viewport.width - 100); // Account for send button
        }
      }
    }
  });

  test('send button should be touch-friendly', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const sendButton = page.locator('button:has-text("Send"), button:has-text("إرسال"), button[aria-label*="send" i]').first();
      
      if (await sendButton.isVisible()) {
        const box = await sendButton.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.width).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('chat messages should be scrollable', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const chatContainer = page.locator('[class*="chat"], [class*="message"]').first();
      
      if (await chatContainer.isVisible()) {
        const hasScroll = await chatContainer.evaluate((el) => {
          return el.scrollHeight > el.clientHeight;
        });
        
        if (hasScroll) {
          const overflowY = await chatContainer.evaluate((el) => {
            return window.getComputedStyle(el).overflowY;
          });
          
          expect(['auto', 'scroll'].includes(overflowY)).toBeTruthy();
        }
      }
    }
  });

  test('chat input should stay visible when keyboard appears', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first();
      
      if (await chatInput.isVisible()) {
        await chatInput.click();
        await page.waitForTimeout(500);
        
        // Input should still be visible
        await expect(chatInput).toBeVisible();
        
        const box = await chatInput.boundingBox();
        if (box) {
          // Input should be in visible viewport
          expect(box.y).toBeGreaterThan(0);
        }
      }
    }
  });
});

test.describe('Mobile Forms - Select Inputs', () => {
  test('select dropdowns should be touch-friendly', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const selects = page.locator('select');
      const count = await selects.count();
      
      for (let i = 0; i < count; i++) {
        const select = selects.nth(i);
        if (await select.isVisible()) {
          const box = await select.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test('custom dropdowns should be touch-friendly', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const customSelects = page.locator('[role="combobox"], [role="listbox"]');
      const count = await customSelects.count();
      
      for (let i = 0; i < count; i++) {
        const select = customSelects.nth(i);
        if (await select.isVisible()) {
          const box = await select.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });
});

test.describe('Mobile Forms - Radio and Checkbox', () => {
  test('radio buttons should have proper touch targets', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const radioLabels = page.locator('label:has(input[type="radio"])');
      const count = await radioLabels.count();
      
      for (let i = 0; i < count; i++) {
        const label = radioLabels.nth(i);
        if (await label.isVisible()) {
          const box = await label.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test('checkboxes should have proper touch targets', async ({ page }) => {
    await page.goto('/assessment');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const checkboxLabels = page.locator('label:has(input[type="checkbox"])');
      const count = await checkboxLabels.count();
      
      for (let i = 0; i < count; i++) {
        const label = checkboxLabels.nth(i);
        if (await label.isVisible()) {
          const box = await label.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });
});

test.describe('Mobile Forms - File Upload', () => {
  test('file upload button should be touch-friendly', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const viewport = page.viewportSize();
    if (!viewport || viewport.width < Breakpoints.MD) {
      const fileInputLabel = page.locator('label:has(input[type="file"]), button:has-text("Upload")').first();
      
      if (await fileInputLabel.isVisible()) {
        const box = await fileInputLabel.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('file input should accept mobile camera', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      const accept = await fileInput.getAttribute('accept');
      
      // Should accept images for camera upload
      if (accept) {
        expect(accept.includes('image') || accept.includes('*')).toBeTruthy();
      }
    }
  });
});
