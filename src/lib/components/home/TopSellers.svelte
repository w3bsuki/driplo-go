<script lang="ts">
	import { Star, TrendingUp, Award } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { Profile } from '$lib/types/unified';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		topSellers: Profile[];
		onSellerClick?: (seller: Profile) => void;
	}

	let { topSellers = [], onSellerClick }: Props = $props();

	function handleSellerClick(seller: Profile) {
		onSellerClick?.(seller);
	}

	function formatRating(rating: number | null): string {
		if (!rating) return '0.0';
		return rating.toFixed(1);
	}

	function formatSalesCount(count: number | null): string {
		if (!count) return '0';
		if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
		return count.toString();
	}

	function getSellerBadge(seller: Profile): { icon: any; color: string; text: string } | null {
		const badges = seller.verification_badges as string[] || [];
		if (badges.includes('verified')) {
			return { icon: Award, color: 'text-blue-500', text: 'Verified' };
		}
		if ((seller.seller_rating || 0) >= 4.8) {
			return { icon: Star, color: 'text-yellow-500', text: 'Top Rated' };
		}
		if ((seller.total_sales || 0) >= 100) {
			return { icon: TrendingUp, color: 'text-green-500', text: 'Top Seller' };
		}
		return null;
	}
</script>

<div class="px-3 py-2">
	<div class="max-w-3xl mx-auto">
		<!-- Header -->
		<div class="flex items-center justify-center gap-2 mb-4">
			<TrendingUp class="h-4 w-4 text-blue-500" />
			<span class="text-sm font-medium text-gray-700">{m.home_top_sellers_title()}</span>
		</div>

		<!-- Top Sellers Avatars -->
		<div class="flex items-center justify-center gap-3">
			{#each topSellers.slice(0, 3) as seller, index}
				<button
					onclick={() => handleSellerClick(seller)}
					class={cn(
						"group relative flex flex-col items-center gap-2 p-2 rounded-sm transition-all duration-100 hover:scale-105 active:scale-95",
						"bg-white hover:bg-gradient-to-b hover:from-blue-50 hover:to-blue-100",
						"border border-blue-200 hover:border-blue-300"
					)}
				>
					<!-- Ranking Badge -->
					<div class={cn(
						"absolute -top-2 -left-2 w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold text-white",
						index === 0 && "bg-gradient-to-r from-yellow-400 to-yellow-500",
						index === 1 && "bg-gradient-to-r from-gray-400 to-gray-500", 
						index === 2 && "bg-gradient-to-r from-blue-400 to-blue-500"
					)}>
						{index + 1}
					</div>

					<!-- Avatar -->
					<div class="relative">
						<div class="w-12 h-12 rounded-sm bg-gradient-to-br from-blue-400 to-blue-600 p-[2px] group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-100">
							<img 
								src={seller.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.username)}&background=f97316&color=fff&size=48`}
								alt={seller.username}
								class="w-full h-full rounded-sm object-cover"
							/>
						</div>
						
						<!-- Status Badge -->
						{#if getSellerBadge(seller)}
							{@const badge = getSellerBadge(seller)}
							<div class="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-sm flex items-center justify-center border border-gray-200">
								<svelte:component this={badge.icon} class="h-3 w-3 {badge.color}" />
							</div>
						{/if}
					</div>

					<!-- Seller Info -->
					<div class="flex flex-col items-center gap-1 min-w-0">
						<span class="text-xs font-medium text-gray-900 truncate max-w-[4rem]">
							{seller.username}
						</span>
						
						<!-- Quick Stats -->
						<div class="flex items-center gap-1 text-xs text-gray-500">
							<Star class="h-3 w-3 text-yellow-500 fill-current" />
							<span>{formatRating(seller.seller_rating)}</span>
							<span class="text-gray-300">•</span>
							<span>{formatSalesCount(seller.total_sales)} sales</span>
						</div>
					</div>

					<!-- Hover Effect -->
					<div class="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none" />
				</button>
			{/each}
		</div>

		<!-- Subtle Description -->
		<div class="text-center mt-3">
			<p class="text-xs text-gray-500">{m.home_top_sellers_description()}</p>
		</div>
	</div>
</div>