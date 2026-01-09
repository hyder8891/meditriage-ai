# Mobile-Specific Testing with Device Emulation

This directory contains comprehensive mobile-specific tests using Playwright to verify responsive design across different screen sizes and devices.

## Overview

The mobile testing suite includes:

- **Device Emulation**: Tests across 9 different viewport sizes (mobile, tablet, desktop)
- **Touch Interactions**: Verification of touch-friendly UI elements
- **Responsive Design**: Layout adaptation at different breakpoints
- **Form Usability**: Mobile-optimized form inputs and interactions
- **Navigation**: Mobile menu, gestures, and navigation patterns
- **Performance**: Load times and optimization on mobile devices
- **Accessibility**: Mobile-specific accessibility requirements

## Test Files

### `helpers.ts`
Utility functions and helpers for mobile testing:
- Device category detection
- Touch target size validation
- Viewport visibility checks
- Touch gesture simulation
- Mobile navigation verification
- Responsive image validation
- Horizontal scroll detection
- Form usability checks

### `responsive.spec.ts`
Comprehensive responsive design tests:
- **Home Page**: Layout, navigation, images, CTA buttons
- **Assessment Page**: Form display, chat interface, input sizing
- **Dashboard**: Card stacking, sidebar behavior
- **Emergency Features**: Emergency buttons, location services
- **Touch Interactions**: Button responses, link spacing
- **Viewport Breakpoints**: 768px, 1024px transitions
- **Performance**: Load times, lazy loading
- **Accessibility**: Labels, focus indicators
- **RTL Support**: Arabic content display

### `navigation.spec.ts`
Mobile navigation and interaction tests:
- **Mobile Menu**: Open/close, navigation, outside clicks
- **Bottom Navigation**: Display, touch-friendliness
- **Mobile Gestures**: Pull-to-refresh, swipe navigation
- **Sidebar**: Hidden by default, overlay behavior
- **Breadcrumbs**: Responsive display
- **Search**: Expand behavior
- **Tabs**: Scrollable tabs on mobile

### `forms.spec.ts`
Mobile form and input tests:
- **Assessment Forms**: Input sizing, font size, labels, submit buttons
- **Login/Register**: Mobile-friendly forms, password toggle, keyboard types
- **Chat Interface**: Input sizing, send button, scrolling, keyboard visibility
- **Select Inputs**: Touch-friendly dropdowns
- **Radio/Checkbox**: Proper touch targets
- **File Upload**: Touch-friendly buttons, camera access

## Device Configurations

### Mobile Devices
- **iPhone 12**: 390x844px
- **iPhone SE**: 375x667px
- **Pixel 5**: 393x851px
- **Galaxy S9+**: 320x658px

### Tablets
- **iPad**: 768x1024px
- **iPad Pro**: 834x1194px

### Desktop Breakpoints
- **Small Desktop**: 1024x768px
- **Medium Desktop**: 1440x900px
- **Large Desktop**: 1920x1080px

## Running Tests

### Run all mobile tests
```bash
pnpm test:mobile
```

### Run tests in headed mode (visible browser)
```bash
pnpm test:mobile:headed
```

### Run tests in debug mode
```bash
pnpm test:mobile:debug
```

### Run tests with UI
```bash
pnpm test:mobile:ui
```

### Run specific test file
```bash
pnpm test:mobile tests/mobile/responsive.spec.ts
```

### Run tests for specific device
```bash
pnpm test:mobile --project="Mobile Chrome (iPhone 12)"
```

### View test report
```bash
pnpm test:mobile:report
```

## Key Testing Areas

### 1. Touch Target Sizes
All interactive elements must meet minimum touch target size of **44x44px** for accessibility and usability.

### 2. Font Sizes
Text inputs must have minimum font size of **16px** to prevent auto-zoom on iOS devices.

### 3. Viewport Constraints
No horizontal scrolling should occur on any device. All content must fit within viewport width.

### 4. Mobile Navigation
- Hamburger menu on screens < 768px
- Bottom navigation for key actions
- Collapsible sidebar with overlay

### 5. Form Usability
- Proper keyboard types (email, tel, number)
- Visible labels and error messages
- Touch-friendly submit buttons
- Keyboard doesn't obscure inputs

### 6. Performance
- Page load < 5 seconds on mobile
- Lazy loading for images
- Optimized bundle sizes

### 7. Responsive Images
- Images use `max-width: 100%` or `srcset`
- Proper aspect ratios maintained
- No image overflow

### 8. RTL Support
- Proper direction for Arabic content
- Mirrored layouts where appropriate
- Text alignment

## Breakpoints

The application uses Tailwind CSS breakpoints:

- **SM**: 640px
- **MD**: 768px (tablet)
- **LG**: 1024px (desktop)
- **XL**: 1280px
- **2XL**: 1536px

## Test Coverage

### Pages Tested
- ✅ Home page
- ✅ Assessment page
- ✅ Dashboard
- ✅ Emergency page
- ✅ Login/Register
- ✅ Medical Literature (requires auth)

### Features Tested
- ✅ Responsive layouts
- ✅ Mobile navigation
- ✅ Touch interactions
- ✅ Form inputs
- ✅ Chat interface
- ✅ Emergency features
- ✅ File uploads
- ✅ Search functionality
- ✅ Tabs and navigation
- ✅ Accessibility
- ✅ Performance
- ✅ RTL support

## Common Issues to Watch For

1. **Horizontal Scroll**: Often caused by fixed-width elements or negative margins
2. **Small Touch Targets**: Buttons and links < 44px are hard to tap
3. **Font Size**: Inputs with font < 16px trigger auto-zoom on iOS
4. **Keyboard Overlap**: Fixed position elements can be obscured by keyboard
5. **Image Overflow**: Images without max-width can break layouts
6. **Menu Behavior**: Mobile menu should overlay, not push content
7. **Form Validation**: Error messages must be visible on mobile
8. **Loading States**: Important for slower mobile connections

## Best Practices

1. **Mobile-First Development**: Design for mobile first, then scale up
2. **Touch-Friendly UI**: Minimum 44x44px touch targets with adequate spacing
3. **Readable Text**: Minimum 16px font size for body text
4. **Optimized Images**: Use responsive images and lazy loading
5. **Minimal Scrolling**: Keep important content above the fold
6. **Fast Loading**: Optimize for 3G/4G networks
7. **Accessible Forms**: Proper labels, keyboard types, and error handling
8. **Gesture Support**: Implement common mobile gestures where appropriate

## Debugging Tips

1. Use `--headed` mode to see browser interactions
2. Use `--debug` mode to step through tests
3. Check screenshots in `test-results/` directory on failures
4. Use `page.pause()` to inspect state during test
5. Check browser console logs for JavaScript errors
6. Verify network requests in browser DevTools

## Continuous Integration

These tests are designed to run in CI environments:
- Tests run in headless mode by default
- Automatic retries on failure (2 retries in CI)
- HTML report generation
- Screenshots on failure
- Traces on first retry

## Future Enhancements

- [ ] Add visual regression testing
- [ ] Test on real mobile devices (BrowserStack/Sauce Labs)
- [ ] Add network throttling tests (3G, 4G)
- [ ] Test offline functionality
- [ ] Add performance budgets
- [ ] Test with screen readers
- [ ] Add gesture recording and playback
- [ ] Test orientation changes
- [ ] Add multi-touch gesture tests

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/design-and-ux/principles)
- [Touch Target Sizes](https://web.dev/accessible-tap-targets/)
- [Responsive Design](https://web.dev/responsive-web-design-basics/)
- [Mobile Form Best Practices](https://www.smashingmagazine.com/2018/08/best-practices-for-mobile-form-design/)
