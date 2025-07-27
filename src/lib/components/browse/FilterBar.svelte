<script lang="ts">
  import { Button } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  interface Props {
    category?: string;
    subcategory?: string;
    filters?: Record<string, string>;
  }
  
  let { category = '', subcategory = '', filters = {} }: Props = $props();
  
  const priceRanges = [
    { label: 'Any Price', value: '' },
    { label: 'Under $20', value: '0-20' },
    { label: '$20-$50', value: '20-50' },
    { label: '$50-$100', value: '50-100' },
    { label: '$100+', value: '100-' }
  ];
  
  const conditions = [
    { label: 'Any Condition', value: '' },
    { label: 'New with tags', value: 'new' },
    { label: 'Like new', value: 'likenew' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' }
  ];
  
  const sizes = [
    { label: 'Any Size', value: '' },
    { label: 'XS', value: 'xs' },
    { label: 'S', value: 's' },
    { label: 'M', value: 'm' },
    { label: 'L', value: 'l' },
    { label: 'XL', value: 'xl' },
    { label: 'XXL', value: 'xxl' }
  ];
  
  function updateFilter(filterType: string, value: string) {
    const params = new URLSearchParams($page.url.searchParams);
    
    if (value) {
      if (filterType === 'price' && value.includes('-')) {
        const [min, max] = value.split('-');
        params.set('min_price', min);
        if (max) params.set('max_price', max);
        else params.delete('max_price');
      } else {
        params.set(filterType, value);
      }
    } else {
      params.delete(filterType);
      if (filterType === 'price') {
        params.delete('min_price');
        params.delete('max_price');
      }
    }
    
    goto(`?${params.toString()}`, { replaceState: true });
  }
  
  function handleClearFilters() {
    goto($page.url.pathname, { replaceState: true });
  }
  
  const currentPriceRange = $derived(() => {
    const min = filters['min_price'];
    const max = filters['max_price'];
    if (min && max) return `${min}-${max}`;
    if (min) return `${min}-`;
    return '';
  });
</script>

<div class="space-y-3">
  <div>
    <h3 class="text-sm font-semibold text-gray-900 mb-2">Price Range</h3>
    <div class="space-y-1">
      {#each priceRanges as range}
        <label class="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            name="price"
            value={range.value}
            checked={currentPriceRange() === range.value}
            onchange={() => updateFilter('price', range.value)}
            class="text-purple-600 focus:ring-purple-500"
          />
          <span class="text-sm text-gray-700">{range.label}</span>
        </label>
      {/each}
    </div>
  </div>

  <div>
    <h3 class="text-sm font-semibold text-gray-900 mb-2">Condition</h3>
    <div class="space-y-1">
      {#each conditions as condition}
        <label class="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            name="condition"
            value={condition.value}
            checked={filters['condition'] === condition.value}
            onchange={() => updateFilter('condition', condition.value)}
            class="text-purple-600 focus:ring-purple-500"
          />
          <span class="text-sm text-gray-700">{condition.label}</span>
        </label>
      {/each}
    </div>
  </div>

  <div>
    <h3 class="text-sm font-semibold text-gray-900 mb-2">Size</h3>
    <div class="space-y-1">
      {#each sizes as size}
        <label class="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            name="size"
            value={size.value}
            checked={filters['size'] === size.value}
            onchange={() => updateFilter('size', size.value)}
            class="text-purple-600 focus:ring-purple-500"
          />
          <span class="text-sm text-gray-700">{size.label}</span>
        </label>
      {/each}
    </div>
  </div>

  <Button 
    onclick={handleClearFilters}
    variant="outline"
    size="sm"
    class="w-full"
  >
    Clear Filters
  </Button>
</div>