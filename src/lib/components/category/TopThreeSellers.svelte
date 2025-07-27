<script lang="ts">
  import { Avatar } from '$lib/components/ui';
  import { Star } from 'lucide-svelte';
  import type { Category } from '$lib/types';
  
  interface TopSeller {
    id: string;
    username: string;
    avatar_url: string | null;
    category_rating: number;
    category_sales: number;
    active_items: number;
  }
  
  interface Props {
    sellers: TopSeller[];
    category: Category;
  }
  
  let { sellers = [], category }: Props = $props();
</script>

{#if sellers.length > 0}
  <div class="bg-white p-4 border-b">
    <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
      <span>🏆</span> Top Sellers in {category.name}
    </h3>
    <div class="grid grid-cols-3 gap-4">
      {#each sellers.slice(0, 3) as seller, index}
        <a href="/profile/{seller.username}" class="text-center group">
          <div class="relative">
            {#if index === 0}
              <div class="absolute -top-1 -right-1 text-xs">👑</div>
            {/if}
            <Avatar.Avatar class="w-12 h-12 mx-auto mb-1 ring-2 ring-transparent group-hover:ring-purple-200 transition-all">
              {#if seller.avatar_url}
                <Avatar.AvatarImage src={seller.avatar_url} alt={seller.username} />
              {/if}
              <Avatar.AvatarFallback class="text-sm font-medium text-gray-600">
                {seller.username[0].toUpperCase()}
              </Avatar.AvatarFallback>
            </Avatar.Avatar>
          </div>
          <p class="text-xs font-medium truncate">{seller.username.split('_')[0]}</p>
          <div class="flex items-center justify-center gap-0.5 text-xs">
            <Star class="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{seller.category_rating?.toFixed(1) || '5.0'}</span>
          </div>
          <!-- Only show on larger screens -->
          <p class="text-xs text-gray-500 hidden sm:block">
            {seller.category_sales || 0} sales
          </p>
        </a>
      {/each}
      
      {#if sellers.length < 3}
        {#each Array(3 - sellers.length) as _, i}
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-1 rounded-full bg-gray-100 flex items-center justify-center">
              <span class="text-xs text-gray-400">?</span>
            </div>
            <p class="text-xs font-medium text-gray-400">Available</p>
            <p class="text-xs text-gray-400">Be next!</p>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}