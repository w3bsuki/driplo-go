<script lang="ts">
  import type { Category, Product } from '$lib/types';
  import ListingGrid from '$lib/components/listings/ListingGrid.svelte';
  import FilterBar from '$lib/components/browse/FilterBar.svelte';
  import { Button } from '$lib/components/ui';
  import { ChevronRight } from 'lucide-svelte';
  import type { SupabaseClient } from '@supabase/supabase-js';
  import type { Database } from '$lib/types/database.types';
  
  interface Props {
    category: Category;
    subcategory: Category;
    products: Product[];
    totalCount?: number;
    filters?: any;
    supabase?: SupabaseClient<Database>;
  }
  
  let { category, subcategory, products, totalCount = 0, filters = {}, supabase }: Props = $props();
  let showFilters = $state(false);
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Breadcrumb -->
  <nav class="bg-white border-b">
    <div class="container mx-auto px-4 py-3">
      <ol class="flex items-center gap-2 text-sm">
        <li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
        <li><ChevronRight class="w-4 h-4 text-gray-400" /></li>
        <li><a href="/{category.slug}" class="text-gray-500 hover:text-gray-900">{category.name}</a></li>
        <li><ChevronRight class="w-4 h-4 text-gray-400" /></li>
        <li class="text-gray-900 font-medium">{subcategory?.name || ''}</li>
      </ol>
    </div>
  </nav>

  <!-- Header -->
  <div class="bg-white border-b">
    <div class="container mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">
            {subcategory?.name || ''}
          </h1>
          <p class="text-gray-600 mt-1">
            {totalCount} items available
          </p>
        </div>
        <Button 
          onclick={() => showFilters = !showFilters}
          variant="outline"
          class="sm:hidden"
        >
          Filters
        </Button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="container mx-auto px-4 py-6">
    <div class="flex gap-3">
      <!-- Filters Sidebar -->
      <aside class="hidden sm:block w-64 flex-shrink-0">
        <FilterBar 
          category={category.slug}
          subcategory={subcategory.slug}
          {filters}
        />
      </aside>

      <!-- Products Grid -->
      <main class="flex-1">
        {#if products.length > 0}
          <ListingGrid 
            listings={products}
            showLoading={false}
            {supabase}
          />
        {:else}
          <div class="text-center py-12">
            <p class="text-gray-500 text-sm mb-4">
              No items found in {subcategory?.name || ''}
            </p>
            <Button href="/{category.slug}" variant="outline">
              Browse all {category.name}
            </Button>
          </div>
        {/if}
      </main>
    </div>
  </div>

  <!-- Mobile Filters -->
  {#if showFilters}
    <div class="sm:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onclick={() => showFilters = false}>
      <div class="absolute right-0 top-0 h-full w-80 bg-white p-4" onclick={(e) => e.stopPropagation()}>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold">Filters</h2>
          <Button variant="ghost" size="sm" onclick={() => showFilters = false}>
            Close
          </Button>
        </div>
        <FilterBar 
          category={category.slug}
          subcategory={subcategory.slug}
          {filters}
        />
      </div>
    </div>
  {/if}
</div>