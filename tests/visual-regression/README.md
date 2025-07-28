# Visual Regression Testing

This directory contains visual regression tests to ensure UI changes don't break the existing design.

## Usage

### 1. Capture Baseline (Before Making Changes)
```bash
npm run test:visual:baseline
```
This captures screenshots of all key pages and components in their current state.

### 2. Compare After Changes
```bash
npm run test:visual:compare
```
This compares the current state against the baseline screenshots.

## What's Tested

### Pages
- Home page
- Browse/listings page
- Login page
- Register page
- Profile page
- Create listing page
- Checkout page
- Messages page

### Viewports
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1920x1080)

### Components
- Header
- Listing Card
- Button variants

## Configuration

- **Max Diff Pixels**: 100 pixels (allows small differences)
- **Threshold**: 0.2 (20% difference threshold)
- **Screenshots Location**: `/tests/visual-regression/baseline/`

## Tips

1. Always capture baseline before starting refactoring
2. Run comparison tests after each major change
3. Review failed tests carefully - some changes might be intentional
4. Update baseline when design changes are approved