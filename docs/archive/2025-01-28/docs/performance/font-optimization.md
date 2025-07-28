# Font Loading Optimization Guide

## Overview
We've optimized font loading in Driplo by switching to variable fonts, reducing the font payload by approximately 300KB.

## What Changed

### Before Optimization
- **Inter**: 4 separate font files (400, 500, 600, 700 weights) = ~400KB total
- **Plus Jakarta Sans**: 2 separate font files (600, 700 weights) = ~160KB total  
- **JetBrains Mono**: 1 font file (400 weight) = ~60KB
- **Total**: 7 font files, ~620KB

### After Optimization
- **Inter Variable**: 1 file supporting weights 100-900 = ~150KB
- **Plus Jakarta Sans Variable**: 1 file supporting weights 200-800 = ~120KB
- **JetBrains Mono Variable**: 1 file supporting weights 100-800 = ~50KB
- **Total**: 3 font files, ~320KB

**Savings: ~300KB (48% reduction)**

## Implementation Details

### 1. Package Updates
```json
// Before
"@fontsource/inter": "^5.2.6",
"@fontsource/jetbrains-mono": "^5.2.6",
"@fontsource/plus-jakarta-sans": "^5.2.6",

// After  
"@fontsource-variable/inter": "^5.2.6",
"@fontsource-variable/jetbrains-mono": "^5.2.6",
"@fontsource-variable/plus-jakarta-sans": "^5.2.6",
```

### 2. CSS Import Updates
```css
/* Before - app.css */
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';

/* After - app.css */
@import '@fontsource-variable/inter/latin.css';
```

### 3. Font Family Updates
```css
/* tokens.css */
--font-sans: 'Inter Variable', Inter, system-ui, -apple-system, sans-serif;
--font-display: 'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', var(--font-sans);
--font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', 'SF Mono', monospace;
```

### 4. Font Display Optimization
Added `font-display: swap` declarations to prevent invisible text during font loading:
```css
@font-face {
  font-family: 'Inter Variable';
  font-display: swap;
}
```

## Benefits

1. **Reduced Network Requests**: From 7 font files to 3
2. **Smaller Total Size**: ~300KB reduction in font payload
3. **Better Flexibility**: Variable fonts support any weight from 100-900
4. **Improved Performance**: Faster initial page load
5. **Better UX**: `font-display: swap` shows fallback fonts immediately

## Browser Support
Variable fonts are supported in all modern browsers:
- Chrome 66+
- Firefox 62+
- Safari 11+
- Edge 17+

## Future Optimizations

1. **Subset Further**: Could reduce to only needed characters if not supporting multiple languages
2. **Self-Host**: Fonts are already self-hosted via npm packages
3. **System Font Stack**: Consider using system fonts for non-brand text
4. **Font Loading API**: Implement JavaScript Font Loading API for fine control
5. **Preload Critical**: Add `<link rel="preload">` for Inter Variable as it's used most

## Monitoring
Track these metrics to verify improvements:
- First Contentful Paint (FCP)
- Cumulative Layout Shift (CLS) 
- Total font payload size in Network tab
- Number of font requests