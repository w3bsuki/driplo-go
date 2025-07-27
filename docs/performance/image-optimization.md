# Image Optimization Migration Guide

## Quick Migration Examples

### Before (ResponsiveImage)
```svelte
<ResponsiveImage 
  src={listing.image_urls}
  alt={listing.title}
  class="aspect-square"
  preferredSize="medium"
/>
```

### After (OptimizedImage for Supabase URLs)
```svelte
<script>
  import OptimizedImage from '$lib/components/ui/OptimizedImage.svelte';
</script>

<!-- For Supabase storage URLs -->
<OptimizedImage 
  src={listing.image_urls.medium}
  alt={listing.title}
  class="aspect-square"
  widths={[400, 800, 1200]}
  quality={85}
/>

<!-- For hero/LCP images -->
<OptimizedImage 
  src={hero.image_url}
  alt="Hero banner"
  priority={true}
  widths={[640, 1280, 1920, 2560]}
  quality={90}
  sizes="100vw"
/>
```

## Component Usage Guide

### When to use OptimizedImage
- ✅ Supabase storage URLs (`/storage/v1/object/public/...`)
- ✅ Product images, user avatars, hero banners
- ✅ Any image that needs format optimization

### When to keep ResponsiveImage
- ✅ External URLs (not from Supabase storage)
- ✅ Images already optimized with responsive URLs object
- ✅ Legacy code that needs gradual migration

## Performance Benefits

1. **Modern Formats**: Automatic AVIF/WebP serving (60-70% smaller)
2. **On-demand Optimization**: No pre-processing needed
3. **Responsive Loading**: Perfect size for each viewport
4. **Priority Hints**: Better LCP for hero images

## Migration Checklist

- [ ] Replace hero images with `priority={true}`
- [ ] Update product listing images
- [ ] Migrate user avatars
- [ ] Update category images
- [ ] Add to new components going forward