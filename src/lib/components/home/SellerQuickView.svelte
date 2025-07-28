<script lang="ts">
	import { X, Star, MapPin, Calendar, TrendingUp, Award, ShoppingBag, Users, ExternalLink, UserPlus } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { Profile, Listing } from '$lib/types/unified';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		seller: Profile | null;
		topListings: Listing[];
		isOpen: boolean;
		onClose?: () => void;
		onViewStore?: (seller: Profile) => void;
		onFollowSeller?: (seller: Profile) => void;
	}

	let { seller, topListings = [], isOpen = false, onClose, onViewStore, onFollowSeller }: Props = $props();

	function close() {
		onClose?.();
	}

	function viewStore() {
		if (seller) {
			onViewStore?.(seller);
		}
	}

	function followSeller() {
		if (seller) {
			onFollowSeller?.(seller);
		}
	}

	function formatRating(rating: number | null): string {
		if (!rating) return '0.0';
		return rating.toFixed(1);
	}

	function formatNumber(num: number | null): string {
		if (!num) return '0';
		if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
		return num.toString();
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(price);
	}

	function getSellerLevel(seller: Profile): { level: string; color: string } {
		const totalSales = seller.total_sales || 0;
		const rating = seller.seller_rating || 0;
		
		if (totalSales >= 500 && rating >= 4.8) {
			return { level: 'Elite', color: 'text-purple-600' };
		} else if (totalSales >= 100 && rating >= 4.5) {
			return { level: 'Pro', color: 'text-blue-600' };
		} else if (totalSales >= 20 && rating >= 4.0) {
			return { level: 'Rising', color: 'text-green-600' };
		}
		return { level: 'New', color: 'text-gray-600' };
	}

	function formatMemberSince(date: string | null): string {
		if (!date) return 'Recently';
		const memberDate = new Date(date);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - memberDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays < 30) return 'New member';
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return `${Math.floor(diffDays / 365)} years ago`;
	}
</script>

{#if isOpen && seller}
	<!-- Modal Backdrop -->
	<div 
		class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4 md:items-center"
		onclick={close}
	>
		<!-- Modal Content -->
		<div 
			class="bg-white rounded-t-sm md:rounded-sm w-full max-w-md max-h-[80vh] overflow-hidden shadow-lg"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="relative bg-gradient-to-r from-blue-50 to-blue-100 p-6 pb-4">
				<button 
					onclick={close}
					class="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-sm transition-colors"
				>
					<X class="h-5 w-5 text-gray-600" />
				</button>

				<!-- Seller Avatar & Basic Info -->
				<div class="flex items-center gap-4">
					<div class="relative">
						<div class="w-16 h-16 rounded-sm bg-gradient-to-br from-blue-400 to-blue-600 p-[2px]">
							<img 
								src={seller.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.username)}&background=f97316&color=fff&size=64`}
								alt={seller.username}
								class="w-full h-full rounded-sm object-cover"
							/>
						</div>
						
						{#if seller.is_verified}
							<div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-sm flex items-center justify-center border border-gray-200">
								<Award class="h-4 w-4 text-blue-500" />
							</div>
						{/if}
					</div>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h2 class="text-lg font-semibold text-gray-900 truncate">{seller.username}</h2>
							{#if seller}
								{@const level = getSellerLevel(seller)}
								<span class="text-xs px-2 py-1 rounded-sm bg-white/70 {level.color} font-medium">
									{level.level}
								</span>
							{/if}
						</div>
						
						<div class="flex items-center gap-1 text-sm text-gray-600 mb-2">
							<Star class="h-4 w-4 text-yellow-500 fill-current" />
							<span class="font-medium">{formatRating(seller.seller_rating)}</span>
							<span class="text-gray-400">({formatNumber(seller.seller_rating_count)} reviews)</span>
						</div>

						<div class="flex items-center gap-3 text-xs text-gray-500">
							{#if seller.location}
								<div class="flex items-center gap-1">
									<MapPin class="h-3 w-3" />
									<span>{seller.location}</span>
								</div>
							{/if}
							<div class="flex items-center gap-1">
								<Calendar class="h-3 w-3" />
								<span>{formatMemberSince(seller.created_at)}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-6 overflow-y-auto">
				<!-- Achievements -->
				<div class="grid grid-cols-3 gap-4">
					<div class="text-center">
						<div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-sm mb-2 mx-auto">
							<ShoppingBag class="h-5 w-5 text-blue-600" />
						</div>
						<div class="text-lg font-semibold text-gray-900">{formatNumber(seller.total_sales)}</div>
						<div class="text-xs text-gray-500">Sales</div>
					</div>
					
					<div class="text-center">
						<div class="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-sm mb-2 mx-auto">
							<Users class="h-5 w-5 text-blue-600" />
						</div>
						<div class="text-lg font-semibold text-gray-900">{formatNumber(seller.followers_count || 0)}</div>
						<div class="text-xs text-gray-500">Followers</div>
					</div>
					
					<div class="text-center">
						<div class="flex items-center justify-center w-10 h-10 bg-green-100 rounded-sm mb-2 mx-auto">
							<TrendingUp class="h-5 w-5 text-green-600" />
						</div>
						<div class="text-lg font-semibold text-gray-900">{formatNumber(seller.profile_views || 0)}</div>
						<div class="text-xs text-gray-500">Views</div>
					</div>
				</div>

				<!-- Bio -->
				{#if seller.bio}
					<div>
						<h3 class="text-sm font-medium text-gray-900 mb-2">About</h3>
						<p class="text-sm text-gray-600 line-clamp-3">{seller.bio}</p>
					</div>
				{/if}

				<!-- Top Listings -->
				{#if topListings.length > 0}
					<div>
						<h3 class="text-sm font-medium text-gray-900 mb-3">Featured Items</h3>
						<div class="grid grid-cols-2 gap-3">
							{#each topListings.slice(0, 3) as listing}
								<div class="bg-gray-50 rounded-sm p-3 hover:bg-gray-100 transition-colors cursor-pointer">
									<div class="aspect-square bg-gray-200 rounded-sm mb-2 overflow-hidden">
										{#if listing.images && Array.isArray(listing.images) && listing.images.length > 0}
											<img 
												src={listing.images[0]} 
												alt={listing.title}
												class="w-full h-full object-cover"
											/>
										{/if}
									</div>
									<div class="text-xs font-medium text-gray-900 truncate">{listing.title}</div>
									<div class="text-xs text-blue-600 font-semibold">{formatPrice(listing.price)}</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="p-6 pt-0 space-y-3">
				<button 
					onclick={viewStore}
					class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
				>
					<ExternalLink class="h-4 w-4" />
					{m.seller_view_store()}
				</button>
				
				<button 
					onclick={followSeller}
					class="w-full bg-white border border-blue-200 text-blue-600 py-3 rounded-sm font-medium hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
				>
					<UserPlus class="h-4 w-4" />
					{m.seller_follow()}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>