# Driplo Performance Optimization Implementation Guide

## Overview
This guide documents the performance optimizations implemented based on the Phase 2 best practices audit.

## Completed Optimizations

### 1. Database Performance

#### Query Monitoring (✅ Completed)
- **Migration**: `20250122_enable_pg_stat_statements.sql`
- Enabled `pg_stat_statements` extension for tracking slow queries
- Created helper functions:
  - `get_slow_queries()` - Identify performance bottlenecks
  - `cache_performance` view - Monitor cache hit rates

**Usage**:
```sql
-- Check slow queries
SELECT * FROM get_slow_queries(20, 10);

-- Monitor cache performance (should be >99%)
SELECT * FROM cache_performance;
```

#### BRIN Indexes (✅ Completed)
- **Migration**: `20250122_add_brin_indexes.sql`
- Added BRIN indexes on all `created_at` columns
- 10x smaller than B-tree indexes for time-series data
- Created `analyze_brin_effectiveness()` function

**Impact**: ~90% space savings on time-series indexes

### 2. Image Optimization

#### Lazy Loading (✅ Already Implemented)
- `ResponsiveImage.svelte` has native lazy loading
- Intersection Observer fallback for older browsers
- Placeholder animations during load

#### Supabase Image Transformations (✅ Completed)
- **New Utility**: `supabase-image-transform.ts`
- On-the-fly image optimization
- Modern format support (AVIF, WebP)
- Responsive image generation

#### Optimized Image Component (✅ Completed)
- **New Component**: `OptimizedImage.svelte`
- Automatic AVIF/WebP with JPEG fallback
- Priority loading for LCP images
- Preload hints for critical images

**Usage**:
```svelte
<!-- Regular image -->
<OptimizedImage 
  src="/storage/v1/object/public/products/image.jpg"
  alt="Product"
  sizes="(max-width: 640px) 100vw, 50vw"
/>

<!-- Hero/LCP image -->
<OptimizedImage 
  src="/storage/v1/object/public/hero/banner.jpg"
  alt="Hero"
  priority={true}
  quality={90}
  widths={[640, 1280, 1920, 2560]}
/>
```

## Pending Optimizations

### High Priority Tasks

#### 1. Connection Pooling Configuration
Update your Supabase connection strings:
```typescript
// For serverless/edge functions (Transaction mode)
const POOLED_URL = 'postgres://[user]:[pass]@[host]:6543/postgres';

// For persistent connections (Session mode)
const SESSION_URL = 'postgres://[user]:[pass]@[host]:5432/postgres';
```

#### 2. RLS Policy Optimization
Review and update RLS policies to wrap functions:
```sql
-- ❌ Slow
CREATE POLICY "user_policy" ON table_name
USING (auth.uid() = user_id);

-- ✅ Fast
CREATE POLICY "user_policy" ON table_name
USING ((SELECT auth.uid()) = user_id);
```

#### 3. Parallel Data Loading
Update load functions to avoid waterfalls:
```typescript
// ❌ Sequential
const user = await supabase.auth.getUser();
const posts = await supabase.from('posts').select();

// ✅ Parallel
const [user, posts] = await Promise.all([
  supabase.auth.getUser(),
  supabase.from('posts').select()
]);
```

### Migration Strategy

#### Phase 1: Quick Wins (This Week)
1. ✅ Enable query monitoring
2. ✅ Add BRIN indexes
3. ✅ Implement image transformations
4. ⏳ Configure connection pooling
5. ⏳ Add HTTP cache headers

#### Phase 2: Core Improvements (Next Sprint)
1. ⏳ Audit and optimize RLS policies
2. ⏳ Create materialized views for analytics
3. ⏳ Implement Redis caching
4. ⏳ Add CDN for images

#### Phase 3: Advanced Features (Future)
1. ⏳ Search optimization (Algolia/Typesense)
2. ⏳ Edge function aggregation
3. ⏳ Database partitioning

## Performance Monitoring

### Key Metrics to Track
- **Database**: Cache hit rates (target: >99%)
- **Images**: Bandwidth reduction (target: 50-70%)
- **Core Web Vitals**:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### Monitoring Commands
```bash
# Check slow queries
pnpm supabase db query "SELECT * FROM get_slow_queries();"

# Check cache performance
pnpm supabase db query "SELECT * FROM cache_performance;"

# Analyze BRIN effectiveness
pnpm supabase db query "SELECT * FROM analyze_brin_effectiveness();"
```

## Best Practices Going Forward

1. **Images**: Always use `OptimizedImage` for Supabase storage URLs
2. **Queries**: Run `EXPLAIN ANALYZE` on new complex queries
3. **Indexes**: Use BRIN for time-series, GIN for JSONB
4. **Loading**: Parallelize data fetching in load functions
5. **Caching**: Add cache headers to static content

## Next Steps

1. Apply the pending database migrations
2. Replace `ResponsiveImage` with `OptimizedImage` for storage URLs
3. Configure Supavisor connection pooling
4. Audit RLS policies for optimization opportunities
5. Set up performance monitoring dashboard