# Baseline Screenshots Required for V4 Migration

## Before Making ANY Changes

Take screenshots of these critical pages to ensure no visual regressions during migration:

### 1. Homepage (/)
- Full page view
- Mobile responsive view (375px width)
- Focus on:
  - Header styling
  - Hero search component
  - Category grid
  - Product listings
  - Footer

### 2. Browse Page (/browse)
- Full page with product grid
- Mobile view
- Focus on:
  - Filter sidebar
  - Product cards (ListingCard components)
  - Pagination
  - Quick filters

### 3. Product Detail Page (/listings/[any-id])
- Complete product view
- Mobile view
- Focus on:
  - Image gallery
  - Product info section
  - Price and buttons
  - Seller information
  - Related products

### 4. User Profile Page (/profile/[any-username])
- Profile header
  - Listings grid
  - Mobile view
  - Focus on:
    - Avatar and user info
    - Stats display
    - Listing cards

### 5. Login Page (/login)
- Form styling
- Mobile view
- Focus on:
  - Input fields
  - Buttons
  - Link colors
  - Background styling

## Screenshot Tool Recommendations
- Browser DevTools (F12) > Device Toolbar for mobile views
- Full Page Screen Capture extension
- Name files: `[page-name]-before-[date].png`

## Critical Elements to Watch
- Button colors (especially bg-primary)
- Text colors (text-destructive, text-secondary)
- Border radius values
- Spacing/padding
- Shadow effects
- Hover states
- Focus rings