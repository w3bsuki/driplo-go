# Data Loading Patterns

## Server-Side Data Fetching
All data loading in Driplo happens server-side using SvelteKit's `+page.server.ts` pattern.

### Basic Pattern
```typescript
// +page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error loading listings:', error);
    throw error;
  }
  
  return {
    listings: data ?? []
  };
};
```

### With Authentication
```typescript
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession();
  
  if (!session) {
    throw redirect(303, '/login');
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  return {
    profile: data
  };
};
```

### With Pagination
```typescript
export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });
    
  return {
    listings: data ?? [],
    totalPages: Math.ceil((count ?? 0) / limit),
    currentPage: page
  };
};
```

### With Related Data
```typescript
export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      seller:profiles!seller_id(*),
      category:categories(*)
    `)
    .eq('id', params.id)
    .single();
    
  if (error || !listing) {
    throw error(404, 'Listing not found');
  }
  
  return {
    listing
  };
};
```

## Key Principles
1. **Always use server-side loading** - Never fetch data client-side
2. **Handle errors properly** - Either throw or return error state
3. **Return default values** - Use `data ?? []` for arrays
4. **Use proper typing** - Import types from `./$types`
5. **Leverage Supabase relationships** - Use select with joins