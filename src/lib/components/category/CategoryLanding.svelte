<script lang="ts">
  import type { Category } from '$lib/types';
  import HeroSearch from '$lib/components/home/HeroSearch.svelte';
  import ListingGrid from '$lib/components/listings/ListingGrid.svelte';
  import ReusableFilters from '$lib/components/shared/ReusableFilters.svelte';
  import { cn } from '$lib/utils';
  import { ChevronRight } from 'lucide-svelte';
  import type { SupabaseClient } from '@supabase/supabase-js';
  import type { Database } from '$lib/types/database.types';
  import { getFiltersForCategory } from '$lib/config/categoryFilters';
  
  interface Props {
    category: Category;
    subcategories: Category[];
    products?: any[];
    topSellers?: any[];
    supabase?: SupabaseClient<Database>;
    theme?: 'blue' | 'pink';
  }
  
  let { category, subcategories, products = [], topSellers = [], supabase, theme = 'blue' }: Props = $props();
  
  // State for filtering
  let selectedSubcategory = $state('all');
  let searchQuery = $state('');
  let sortBy = $state('newest');
  
  // Get dynamic filters based on category
  const filterGroups = $derived(getFiltersForCategory(category.slug));
  
  // Selected filters state - dynamic based on filter types
  const selectedFilters = $state<Record<string, string | string[]>>({});
  
  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First', field: 'created_at', order: 'desc' as const },
    { value: 'price-low', label: 'Price: Low to High', field: 'price', order: 'asc' as const },
    { value: 'price-high', label: 'Price: High to Low', field: 'price', order: 'desc' as const },
    { value: 'popular', label: 'Most Popular', field: 'favorites_count', order: 'desc' as const },
    { value: 'rating', label: 'Best Rated', field: 'seller_rating', order: 'desc' as const }
  ];
  
  // Filtered products
  const filteredProducts = $derived(() => {
    let filtered = products;
    
    // Subcategory filter
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(p => p.subcategory_id === selectedSubcategory);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query)
      );
    }
    
    // Apply all dynamic filters
    Object.entries(selectedFilters).forEach(([filterType, filterValue]) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return;
      
      switch (filterType) {
        case 'price':
          if (typeof filterValue === 'string') {
            const [min, max] = filterValue.split('-').map(Number);
            filtered = filtered.filter(p => {
              if (max) {
                return p.price >= min && p.price <= max;
              } else {
                return p.price >= min;
              }
            });
          }
          break;
          
        case 'size':
          if (Array.isArray(filterValue)) {
            filtered = filtered.filter(p => filterValue.includes(p.size));
          }
          break;
          
        case 'color':
          if (Array.isArray(filterValue)) {
            filtered = filtered.filter(p => filterValue.includes(p.color));
          }
          break;
          
        case 'brand':
          if (Array.isArray(filterValue)) {
            filtered = filtered.filter(p => filterValue.includes(p.brand?.toLowerCase().replace(/\s+/g, '-')));
          }
          break;
          
        case 'condition':
          if (Array.isArray(filterValue)) {
            filtered = filtered.filter(p => filterValue.includes(p.condition));
          }
          break;
          
        case 'style':
          if (Array.isArray(filterValue)) {
            filtered = filtered.filter(p => filterValue.includes(p.style));
          }
          break;
          
        case 'material':
          if (Array.isArray(filterValue)) {
            filtered = filtered.filter(p => filterValue.includes(p.material));
          }
          break;
          
        case 'type':
          if (Array.isArray(filterValue)) {
            filtered = filtered.filter(p => filterValue.includes(p.type));
          }
          break;
      }
    });
    
    // Apply sorting
    const currentSort = sortOptions.find(s => s.value === sortBy);
    if (currentSort) {
      filtered = filtered.sort((a, b) => {
        const aVal = a[currentSort.field] || 0;
        const bVal = b[currentSort.field] || 0;
        return currentSort.order === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    
    return filtered;
  });
  
  function handleFilterChange(type: string, value: string | string[]) {
    selectedFilters[type] = value;
  }
  
  function handleSubcategoryChange(subcategory: string) {
    selectedSubcategory = subcategory;
  }
  
  function handleClearFilters() {
    selectedSubcategory = 'all';
    Object.keys(selectedFilters).forEach(key => {
      selectedFilters[key] = Array.isArray(selectedFilters[key]) ? [] : '';
    });
    searchQuery = '';
    sortBy = 'newest';
  }
  
  const hasActiveFilters = $derived(() => {
    if (selectedSubcategory !== 'all' || searchQuery !== '') return true;
    
    return Object.entries(selectedFilters).some(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== '';
    });
  });
</script>


<!-- Hero Section with Top Sellers and Search -->
<section class={cn(
  "relative py-6 md:py-8",
  theme === 'pink' ? "bg-gradient-to-b from-pink-50 to-white" : "bg-gradient-to-b from-blue-50 to-white"
)}>
  <div class="container px-4">
    <div class="max-w-3xl mx-auto">
      
      <!-- Top Sellers Section - Compact -->
      {#if topSellers.length > 0}
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2 text-center">Top sellers in {category.name}</p>
          <div class="flex justify-center gap-3">
            {#each topSellers.slice(0, 3) as seller, index}
              <a href="/profile/{seller.username}" class="group relative">
                <div class="relative">
                  {#if index === 0}
                    <div class="absolute -top-1 -right-1 text-sm z-10">👑</div>
                  {/if}
                  <div class={cn(
                    "relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-2 ring-white transition-all duration-100",
                    "group-hover:scale-105",
                    theme === 'pink' ? "group-hover:ring-pink-300" : "group-hover:ring-blue-300"
                  )}>
                    <img 
                      src={seller.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.username}`} 
                      alt={seller.username || seller.full_name}
                      class="w-full h-full object-cover bg-gray-100"
                    />
                  </div>
                  {#if seller.is_verified}
                    <div class="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white w-4 h-4 rounded-sm flex items-center justify-center">
                      <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  {/if}
                </div>
                <!-- Tooltip on hover -->
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none z-20">
                  <div class="bg-gray-900 text-white text-xs rounded-sm px-3 py-2 whitespace-nowrap shadow-md">
                    <p class="font-medium">{seller.full_name || seller.username}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="flex items-center gap-0.5">
                        ⭐ {seller.category_rating?.toFixed(1) || '4.5'}
                      </span>
                      <span class="text-gray-300">•</span>
                      <span>{seller.category_sales || 0} sales</span>
                    </div>
                  </div>
                  <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Search Bar -->
      <div class="relative group">
        <div class={cn(
          "absolute inset-0 rounded-sm blur-xl opacity-20 transition-all duration-100 group-focus-within:opacity-30 group-focus-within:blur-2xl",
          theme === 'pink' ? "bg-gradient-to-r from-pink-400 to-pink-600" : "bg-gradient-to-r from-blue-400 to-blue-600"
        )}></div>
        
        <div class="relative bg-white rounded-sm border border-gray-100 transition-all duration-100">
          <div class="flex items-center">
            <div class="pl-6 pr-3">
              <span class="text-lg">🔍</span>
            </div>
            
            <input
              type="search"
              placeholder="Search {category.name.toLowerCase()} fashion..."
              bind:value={searchQuery}
              class="flex-1 py-3 md:py-3.5 pr-4 text-sm placeholder:text-gray-400 focus:outline-none bg-transparent"
            />
            
            <button
              onclick={() => {}}
              class={cn(
                "mr-2 px-4 md:px-5 py-2 text-white font-medium rounded-sm text-sm transition-all duration-100 active:scale-95",
                theme === 'pink' 
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700" 
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              )}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</section>

<!-- Category Filters -->
<ReusableFilters 
  filters={filterGroups}
  {selectedFilters}
  {subcategories}
  showSubcategories={true}
  {selectedSubcategory}
  onFilterChange={handleFilterChange}
  onSubcategoryChange={handleSubcategoryChange}
  onClearFilters={handleClearFilters}
  {theme}
/>

<!-- Sort Bar -->
<div class="bg-white border-b">
  <div class="container mx-auto px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-600">
        {hasActiveFilters() ? `${filteredProducts().length} results` : `${products.length} products`}
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Sort by:</span>
        <div class="relative">
          <select
            bind:value={sortBy}
            class="w-full text-sm border border-gray-200 rounded-sm pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-blue-200 bg-white hover:border-gray-300 transition-all duration-100 font-medium text-gray-700"
            style="appearance: none; -webkit-appearance: none; -moz-appearance: none;"
          >
            {#each sortOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
          <!-- Chevron Icon -->
          <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Products Grid -->
<div class="container mx-auto px-4 py-8">
  {#if filteredProducts().length > 0}
    <ListingGrid 
      listings={filteredProducts()}
      showLoading={false}
      {supabase}
    />
  {:else}
    <div class="text-center py-12">
      <p class="text-gray-500 text-sm mb-4">No items found</p>
      {#if hasActiveFilters}
        <button
          onclick={handleClearFilters}
          class="text-primary hover:text-primary/80 font-medium"
        >
          Clear filters and show all
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Custom select styling */
  select {
    background-image: none;
  }
  
  /* Remove default arrow in IE */
  select::-ms-expand {
    display: none;
  }
</style>