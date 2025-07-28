# /common-patterns - Code Examples

## Component Pattern
```svelte
<!-- Always check ui/ folder first! -->
<script lang="ts">
  import { Image } from '$lib/components/ui'
  import type { Listing } from '$lib/types'
  
  export let listing: Listing
</script>

<Image src={listing.image_url} alt={listing.title} />
```

## Server Data Loading
```typescript
// +page.server.ts
export async function load({ locals: { supabase } }) {
  const { data, error } = await supabase
    .from('listings')
    .select('*, brand:brands(name)')
    .eq('status', 'active')
    
  if (error) throw error
  return { listings: data }
}
```

## Error Handling
```typescript
// Always destructure and check
const { data, error } = await supabase.from('table').select()
if (error) {
  console.error('Operation failed:', error)
  throw error
}
```

## Store Pattern
```typescript
// src/lib/stores/cart.ts
import { writable, derived } from 'svelte/store'

function createCartStore() {
  const items = writable([])
  const total = derived(items, $items => 
    $items.reduce((sum, item) => sum + item.price, 0)
  )
  
  return {
    subscribe: items.subscribe,
    total,
    add: (item) => items.update(i => [...i, item])
  }
}

export const cart = createCartStore()
```