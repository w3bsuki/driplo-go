# OKLCH Color Conversion Preview

## Why OKLCH?
- **Perceptually uniform**: Equal numerical changes create equal visual changes
- **Better gradients**: No muddy colors in the middle of gradients
- **Wider gamut**: Can represent more vibrant colors on modern displays
- **Future-proof**: Works with HDR and P3 displays
- **2025 standard**: Supported by all modern browsers

## Conversion Table

### Brand Colors
| Current HEX | OKLCH Value | Notes |
|-------------|-------------|-------|
| #f0f9ff (brand-50) | oklch(98.36% 0.011 224.89) | Very light baby blue |
| #e0f2fe (brand-100) | oklch(95.97% 0.022 222.78) | |
| #bae6fd (brand-200) | oklch(90.54% 0.049 218.04) | |
| #7dd3fc (brand-300) | oklch(82.67% 0.089 214.25) | |
| #38bdf8 (brand-400) | oklch(73.67% 0.135 211.24) | |
| #87ceeb (brand-500) | oklch(81.24% 0.086 210.97) | Main baby blue |
| #6bb6d8 (brand-600) | oklch(73.52% 0.094 210.16) | |
| #4f9fc5 (brand-700) | oklch(65.56% 0.101 209.35) | |
| #3a88ae (brand-800) | oklch(57.73% 0.104 208.84) | |
| #1e5a7e (brand-900) | oklch(42.17% 0.088 212.89) | Deep blue |

### Neutrals (Grays)
| Current HEX | OKLCH Value | Notes |
|-------------|-------------|-------|
| #ffffff (gray-0) | oklch(100% 0 0) | Pure white |
| #f8fafc (gray-50) | oklch(98.47% 0.004 247.86) | |
| #f1f5f9 (gray-100) | oklch(96.58% 0.007 249.37) | |
| #e2e8f0 (gray-200) | oklch(92.27% 0.011 252.37) | |
| #cbd5e1 (gray-300) | oklch(86.29% 0.014 252.61) | |
| #94a3b8 (gray-400) | oklch(69.72% 0.021 252.26) | |
| #64748b (gray-500) | oklch(52.87% 0.022 252.59) | |
| #475569 (gray-600) | oklch(41.05% 0.022 254.56) | |
| #334155 (gray-700) | oklch(32.18% 0.021 254.15) | |
| #1e293b (gray-800) | oklch(23.51% 0.019 252.89) | |
| #0f172a (gray-900) | oklch(15.85% 0.015 257.28) | |
| #020617 (gray-950) | oklch(9.52% 0.012 265.75) | Near black |

### Semantic Colors
| Current HEX | OKLCH Value | Notes |
|-------------|-------------|-------|
| #f0fdf4 (success-50) | oklch(98.24% 0.019 156.94) | Light green |
| #22c55e (success-500) | oklch(74.89% 0.204 153.94) | Success green |
| #16a34a (success-600) | oklch(64.09% 0.187 155.63) | |
| #fffbeb (warning-50) | oklch(98.87% 0.019 91.2) | Light yellow |
| #f59e0b (warning-500) | oklch(72.42% 0.173 74.95) | Warning amber |
| #d97706 (warning-600) | oklch(61.74% 0.177 64.38) | |
| #fef2f2 (error-50) | oklch(97.67% 0.012 17.08) | Light red |
| #ef4444 (error-500) | oklch(62.8% 0.237 25.34) | Error red |
| #dc2626 (error-600) | oklch(55.8% 0.244 26.64) | |
| #eff6ff (info-50) | oklch(97.61% 0.014 254.6) | Light blue |
| #3b82f6 (info-500) | oklch(61.42% 0.209 252.42) | Info blue |
| #2563eb (info-600) | oklch(53.24% 0.241 252.44) | |

### Additional Colors
| Current HEX | OKLCH Value | Notes |
|-------------|-------------|-------|
| #ffffff (white) | oklch(100% 0 0) | Pure white |
| #ef4444 (red-500) | oklch(62.8% 0.237 25.34) | Red utility |

## Benefits of OKLCH Migration
1. **Consistent lightness**: All colors at same L value appear equally bright
2. **Predictable color mixing**: Gradients between colors look natural
3. **Accessibility**: Easier to maintain contrast ratios
4. **Modern standard**: Better performance in CSS calculations
5. **Color manipulation**: Can adjust lightness/chroma/hue independently

## Browser Support
- Chrome 111+ ✅
- Firefox 113+ ✅
- Safari 15.4+ ✅
- Edge 111+ ✅

All modern browsers fully support OKLCH color space!