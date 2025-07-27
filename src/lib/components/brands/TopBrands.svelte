<script lang="ts">
	import { Star, TrendingUp, ShieldCheck, ExternalLink } from 'lucide-svelte';

	interface Brand {
		user_id: string;
		username: string;
		avatar_url: string | null;
		brand_name: string;
		brand_description: string | null;
		brand_logo_url: string | null;
		total_sales: number;
		seller_rating: number;
		seller_rating_count: number;
		is_verified: boolean;
		badges: string[] | null;
	}

	interface Props {
		brands?: Brand[];
		loading?: boolean;
		error?: string | null;
	}

	let { brands = [], loading = false, error = null }: Props = $props();

	function getAvatarUrl(brand: Brand): string {
		if (brand.brand_logo_url) return brand.brand_logo_url;
		if (brand.avatar_url) return brand.avatar_url;
		return `https://api.dicebear.com/7.x/avataaars/svg?seed=${brand.username}`;
	}

	function formatSales(sales: number): string {
		if (sales >= 1000) {
			return `${(sales / 1000).toFixed(1)}k`;
		}
		return sales.toString();
	}

	function getBrandBadge(brand: Brand): string | null {
		if (brand.badges?.includes('top_seller')) return 'Top Seller';
		if (brand.badges?.includes('trending')) return 'Trending';
		if (brand.total_sales > 1000) return 'Established';
		if (brand.total_sales > 100) return 'Rising Star';
		return null;
	}
</script>

<div class="py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="flex items-center justify-between mb-8">
			<div>
				<h2 class="text-3xl font-bold text-gray-900">Top Brands</h2>
				<p class="mt-2 text-gray-600">Discover verified brands on Driplo</p>
			</div>
			<a 
				href="/brands"
				class="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
			>
				View All
				<ExternalLink class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
			</a>
		</div>

		{#if loading}
			<!-- Loading skeleton -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each Array(8) as _, i (i)}
					<div class="bg-white rounded-xl shadow-sm p-6 animate-pulse">
						<div class="flex items-center gap-4 mb-4">
							<div class="w-16 h-16 bg-gray-200 rounded-full"></div>
							<div class="flex-1">
								<div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
								<div class="h-4 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
						<div class="h-4 bg-gray-200 rounded mb-2"></div>
						<div class="h-4 bg-gray-200 rounded w-5/6"></div>
					</div>
				{/each}
			</div>
		{:else if error}
			<div class="text-center py-12">
				<p class="text-red-600">Error loading brands: {error}</p>
			</div>
		{:else if brands.length === 0}
			<div class="text-center py-12 bg-gray-50 rounded-lg">
				<ShieldCheck class="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-gray-900 mb-2">No Verified Brands Yet</h3>
				<p class="text-gray-600">Be the first to create a verified brand account!</p>
				<a href="/onboarding" class="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium">
					Create Brand Account →
				</a>
			</div>
		{:else}
			<!-- Brands grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each brands as brand (brand.user_id || brand.username)}
					<a 
						href="/profile/{brand.username}"
						class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 
							overflow-hidden group"
					>
						<!-- Brand header -->
						<div class="p-6">
							<div class="flex items-center gap-4 mb-4">
								<div class="relative">
									<img 
										src={getAvatarUrl(brand)} 
										alt="{brand.brand_name} logo"
										class="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
									/>
									{#if brand.is_verified}
										<div class="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full 
											flex items-center justify-center">
											<ShieldCheck class="w-4 h-4 text-white" />
										</div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-gray-900 truncate group-hover:text-blue-600 
										transition-colors">
										{brand.brand_name}
									</h3>
									<p class="text-sm text-gray-500">@{brand.username}</p>
								</div>
							</div>

							{#if brand.brand_description}
								<p class="text-sm text-gray-600 line-clamp-2 mb-4">
									{brand.brand_description}
								</p>
							{/if}

							<!-- Stats -->
							<div class="grid grid-cols-2 gap-4 pt-4 border-t">
								<div>
									<p class="text-xs text-gray-500 mb-1">Sales</p>
									<p class="font-semibold text-gray-900">{formatSales(brand.total_sales)}</p>
								</div>
								<div>
									<p class="text-xs text-gray-500 mb-1">Rating</p>
									<div class="flex items-center gap-1">
										<Star class="w-4 h-4 text-yellow-500 fill-current" />
										<span class="font-semibold text-gray-900">
											{brand.seller_rating.toFixed(1)}
										</span>
										<span class="text-xs text-gray-500">({brand.seller_rating_count})</span>
									</div>
								</div>
							</div>

							<!-- Badge -->
							{#if getBrandBadge(brand)}
								<div class="mt-4 pt-4 border-t">
									<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs 
										font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
										<TrendingUp class="w-3 h-3" />
										{getBrandBadge(brand)}
									</span>
								</div>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>