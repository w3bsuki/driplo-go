<script lang="ts">
	import { 
		Users, 
		Building2, 
		Store,
		Star,
		TrendingUp,
		Award,
		ChevronRight,
		MapPin,
		Package,
		Heart,
		ShoppingBag,
		Sparkles,
		Crown,
		Flame,
		Filter,
		Search
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import * as m from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	let activeTab = $state<'sellers' | 'brands' | 'stores'>('sellers');
	let searchQuery = $state('');
	let sortBy = $state<'rating' | 'sales' | 'recent'>('rating');
	
	// Badge configuration
	const badgeConfig: Record<string, { emoji: string; label: string }> = {
		brand: { emoji: '🏪', label: 'Brand' },
		top_seller: { emoji: '⭐', label: 'Top Seller' },
		verified: { emoji: '✅', label: 'Verified' },
		power_seller: { emoji: '🔥', label: 'Power Seller' },
		rising_star: { emoji: '🌟', label: 'Rising Star' },
		admin: { emoji: '👑', label: 'Admin' }
	};
	
	// Mock data for all sellers (in startup phase, show all)
	const allSellers = $derived.by(() => {
		// For now, use the top sellers data but imagine this would be all sellers
		const sellers = data.topSellers || [];
		
		// Filter by search
		const filtered = searchQuery 
			? sellers.filter(s => 
				s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: sellers;
		
		// Sort
		return filtered.sort((a, b) => {
			switch (sortBy) {
				case 'sales':
					return (b.total_sales || 0) - (a.total_sales || 0);
				case 'recent':
					return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
				default: // rating
					return (b.average_rating || 0) - (a.average_rating || 0);
			}
		});
	});
	
	// Mock data for brands
	const allBrands = $derived.by(() => {
		const brands = data.topBrands || [];
		
		// Filter by search
		const filtered = searchQuery 
			? brands.filter(b => 
				b.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.brand_slug?.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: brands;
		
		// Sort
		return filtered.sort((a, b) => {
			switch (sortBy) {
				case 'sales':
					return (b.total_sales || 0) - (a.total_sales || 0);
				case 'recent':
					return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
				default: // rating
					return (b.average_rating || 0) - (a.average_rating || 0);
			}
		});
	});
	
	// Mock data for stores (physical stores)
	const allStores = $derived.by(() => {
		// For now, filter sellers/brands that might have physical stores
		// In real app, this would be a separate query
		const stores = [...(data.topSellers || []), ...(data.topBrands || [])]
			.filter(() => Math.random() > 0.5) // Mock: randomly select some as having stores
			.map(s => ({
				...s,
				hasPhysicalStore: true,
				storeLocation: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'][Math.floor(Math.random() * 5)]
			}));
		
		// Filter by search
		const filtered = searchQuery 
			? stores.filter(s => 
				s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.brand_name?.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: stores;
		
		// Sort
		return filtered.sort((a, b) => {
			switch (sortBy) {
				case 'sales':
					return (b.total_sales || 0) - (a.total_sales || 0);
				case 'recent':
					return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
				default: // rating
					return (b.average_rating || 0) - (a.average_rating || 0);
			}
		});
	});
	
	function getRankBadge(rank: number) {
		if (rank === 1) return { emoji: '🥇', class: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' };
		if (rank === 2) return { emoji: '🥈', class: 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' };
		if (rank === 3) return { emoji: '🥉', class: 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' };
		return { emoji: rank.toString(), class: 'bg-gray-100 text-gray-700' };
	}
	
	function formatNumber(num: number) {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
		return num.toString();
	}
</script>

<svelte:head>
	<title>{m.nav_sellers()} - Driplo</title>
	<meta name="description" content="Discover top-rated sellers, brands, and stores on Driplo" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Sticky Header -->
	<div class="bg-white sticky top-0 z-20 shadow-sm">
		<div class="container mx-auto px-4">
			<!-- Title Section -->
			<div class="py-4 border-b border-gray-100">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="relative">
							<div class="absolute inset-0 bg-blue-200 rounded-xl blur-lg opacity-40"></div>
							<div class="relative bg-gradient-to-br from-blue-400 to-blue-600 p-2.5 rounded-xl">
								<Award class="w-5 h-5 text-white" />
							</div>
						</div>
						<div>
							<h1 class="text-xl font-bold text-gray-900">{m.nav_sellers()}</h1>
							<p class="text-sm text-gray-500">Discover amazing sellers on our platform</p>
						</div>
					</div>
					
					<!-- Search -->
					<div class="hidden md:block">
						<div class="relative">
							<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="search"
								bind:value={searchQuery}
								placeholder="Search sellers..."
								class="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
							/>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Tabs -->
			<div class="py-2">
				<div class="flex gap-1 bg-gray-100 p-1 rounded-lg">
					<button
						onclick={() => activeTab = 'sellers'}
						class={cn(
							"flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200",
							activeTab === 'sellers' 
								? "bg-white text-gray-900 shadow-sm" 
								: "text-gray-600 hover:text-gray-900"
						)}
					>
						<Users class="w-4 h-4" />
						<span>Sellers</span>
						<span class={cn(
							"text-xs px-2 py-0.5 rounded-full",
							activeTab === 'sellers' ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
						)}>
							{allSellers.length}
						</span>
					</button>
					
					<button
						onclick={() => activeTab = 'brands'}
						class={cn(
							"flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200",
							activeTab === 'brands' 
								? "bg-white text-gray-900 shadow-sm" 
								: "text-gray-600 hover:text-gray-900"
						)}
					>
						<Building2 class="w-4 h-4" />
						<span>Brands</span>
						<span class={cn(
							"text-xs px-2 py-0.5 rounded-full",
							activeTab === 'brands' ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
						)}>
							{allBrands.length}
						</span>
					</button>
					
					<button
						onclick={() => activeTab = 'stores'}
						class={cn(
							"flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200",
							activeTab === 'stores' 
								? "bg-white text-gray-900 shadow-sm" 
								: "text-gray-600 hover:text-gray-900"
						)}
					>
						<Store class="w-4 h-4" />
						<span>Stores</span>
						<span class={cn(
							"text-xs px-2 py-0.5 rounded-full",
							activeTab === 'stores' ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
						)}>
							{allStores.length}
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Mobile Search -->
	<div class="md:hidden container mx-auto px-4 py-3">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search..."
				class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
			/>
		</div>
	</div>
	
	<!-- Content -->
	<div class="container mx-auto px-4 py-6">
		<!-- Sort Controls -->
		<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
			<div class="flex items-center justify-between">
				<p class="text-sm text-gray-600">
					Showing all {activeTab === 'sellers' ? 'sellers' : activeTab === 'brands' ? 'brands' : 'stores with physical locations'}
				</p>
				
				<select
					bind:value={sortBy}
					class="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
				>
					<option value="rating">Highest Rated</option>
					<option value="sales">Most Sales</option>
					<option value="recent">Recently Joined</option>
				</select>
			</div>
		</div>
		
		<!-- Sellers Tab -->
		{#if activeTab === 'sellers'}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each allSellers as seller, index (seller.user_id || seller.username)}
					{@const rank = getRankBadge(index + 1)}
					<a 
						href="/profile/{seller.username}"
						class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group"
					>
						<!-- Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-center gap-3">
								<!-- Avatar -->
								<div class="relative">
									<img 
										src={seller.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.username}`} 
										alt={seller.full_name || seller.username}
										class="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
									/>
									{#if seller.badges?.length}
										<div class="absolute -bottom-1 -right-1 bg-white rounded-full px-0.5 shadow-sm border border-gray-200">
											<span class="text-sm" title={badgeConfig[seller.badges[0]]?.label}>
												{badgeConfig[seller.badges[0]]?.emoji}
											</span>
										</div>
									{/if}
								</div>
								
								<!-- Info -->
								<div>
									<h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
										{seller.full_name || seller.username}
									</h3>
									<p class="text-sm text-gray-500">@{seller.username}</p>
									{#if seller.badges?.length > 1}
										<div class="flex gap-1 mt-1">
											{#each seller.badges.slice(1) as badge}
												{#if badgeConfig[badge]}
													<span class="text-xs" title={badgeConfig[badge].label}>
														{badgeConfig[badge].emoji}
													</span>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							</div>
							
							<!-- Rank -->
							<div class={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold", rank.class)}>
								{rank.emoji}
							</div>
						</div>
						
						<!-- Stats Grid -->
						<div class="grid grid-cols-3 gap-3 mb-4">
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-gray-900">{formatNumber(seller.total_sales || 0)}</p>
								<p class="text-xs text-gray-500">Sales</p>
							</div>
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-yellow-600">
									{seller.average_rating ? seller.average_rating.toFixed(1) : '0.0'}
								</p>
								<p class="text-xs text-gray-500">Rating</p>
							</div>
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-green-600">
									${formatNumber(seller.total_revenue || 0)}
								</p>
								<p class="text-xs text-gray-500">Revenue</p>
							</div>
						</div>
						
						<!-- Action -->
						<div class="flex items-center justify-between pt-3 border-t border-gray-100">
							<div class="flex items-center gap-1 text-sm text-gray-500">
								<Package class="w-4 h-4" />
								<span>{seller.listings_count || 0} listings</span>
							</div>
							<ChevronRight class="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
						</div>
					</a>
				{/each}
			</div>
			
			{#if allSellers.length === 0}
				<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
					<Users class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No sellers found</h3>
					<p class="text-sm text-gray-500">Try adjusting your search criteria</p>
				</div>
			{/if}
		{/if}
		
		<!-- Brands Tab -->
		{#if activeTab === 'brands'}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each allBrands as brand, index (brand.brand_id || brand.brand_slug)}
					{@const rank = getRankBadge(index + 1)}
					<a 
						href="/profile/{brand.username || brand.brand_slug}"
						class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group"
					>
						<!-- Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-center gap-3">
								<!-- Logo -->
								<div class="relative">
									<img 
										src={brand.brand_logo_url || brand.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${brand.brand_name}`} 
										alt={brand.brand_name}
										class="w-14 h-14 rounded-xl object-cover border-2 border-gray-100"
									/>
									{#if brand.verification_status === 'verified'}
										<div class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
											<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
											</svg>
										</div>
									{/if}
								</div>
								
								<!-- Info -->
								<div>
									<h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
										{brand.brand_name}
									</h3>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
											🏪 Brand
										</span>
										{#if brand.verification_status === 'verified'}
											<span class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
												✅ Verified
											</span>
										{/if}
									</div>
								</div>
							</div>
							
							<!-- Rank -->
							<div class={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold", rank.class)}>
								{rank.emoji}
							</div>
						</div>
						
						<!-- Stats Grid -->
						<div class="grid grid-cols-3 gap-3 mb-4">
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-gray-900">{formatNumber(brand.total_sales || 0)}</p>
								<p class="text-xs text-gray-500">Sales</p>
							</div>
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-yellow-600">
									{brand.average_rating ? brand.average_rating.toFixed(1) : '0.0'}
								</p>
								<p class="text-xs text-gray-500">Rating</p>
							</div>
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-green-600">
									${formatNumber(brand.total_revenue || 0)}
								</p>
								<p class="text-xs text-gray-500">Revenue</p>
							</div>
						</div>
						
						<!-- Action -->
						<div class="flex items-center justify-between pt-3 border-t border-gray-100">
							<div class="flex items-center gap-1 text-sm text-gray-500">
								<Heart class="w-4 h-4" />
								<span>{brand.followers_count || 0} followers</span>
							</div>
							<ChevronRight class="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
						</div>
					</a>
				{/each}
			</div>
			
			{#if allBrands.length === 0}
				<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
					<Building2 class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
					<p class="text-sm text-gray-500">Try adjusting your search criteria</p>
				</div>
			{/if}
		{/if}
		
		<!-- Stores Tab -->
		{#if activeTab === 'stores'}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each allStores as store, index (store.user_id || store.username || store.brand_id)}
					{@const rank = getRankBadge(index + 1)}
					<a 
						href={store.brand_slug ? `/brands/${store.brand_slug}` : `/profile/${store.username}`}
						class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group"
					>
						<!-- Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-center gap-3">
								<!-- Avatar/Logo -->
								<div class="relative">
									<img 
										src={store.avatar_url || store.brand_logo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${store.username || store.brand_name}`} 
										alt={store.full_name || store.brand_name || store.username}
										class="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
									/>
									<div class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-200">
										<Store class="w-4 h-4 text-blue-600" />
									</div>
								</div>
								
								<!-- Info -->
								<div>
									<h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
										{store.brand_name || store.full_name || store.username}
									</h3>
									<div class="flex items-center gap-1 text-sm text-gray-500">
										<MapPin class="w-3 h-3" />
										<span>{store.storeLocation}</span>
									</div>
									<div class="flex gap-1 mt-1">
										<span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
											🏬 Physical Store
										</span>
									</div>
								</div>
							</div>
							
							<!-- Rank -->
							<div class={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold", rank.class)}>
								{rank.emoji}
							</div>
						</div>
						
						<!-- Stats Grid -->
						<div class="grid grid-cols-3 gap-3 mb-4">
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-gray-900">{formatNumber(store.total_sales || 0)}</p>
								<p class="text-xs text-gray-500">Sales</p>
							</div>
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-yellow-600">
									{store.average_rating ? store.average_rating.toFixed(1) : '0.0'}
								</p>
								<p class="text-xs text-gray-500">Rating</p>
							</div>
							<div class="text-center p-2 bg-gray-50 rounded-lg">
								<p class="text-lg font-bold text-green-600">
									${formatNumber(store.total_revenue || 0)}
								</p>
								<p class="text-xs text-gray-500">Revenue</p>
							</div>
						</div>
						
						<!-- Action -->
						<div class="flex items-center justify-between pt-3 border-t border-gray-100">
							<div class="flex items-center gap-1 text-sm text-blue-600">
								<MapPin class="w-4 h-4" />
								<span>Visit Store</span>
							</div>
							<ChevronRight class="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
						</div>
					</a>
				{/each}
			</div>
			
			{#if allStores.length === 0}
				<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
					<Store class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No physical stores found</h3>
					<p class="text-sm text-gray-500">Check back later as more sellers open physical locations</p>
				</div>
			{/if}
		{/if}
		
		<!-- Note for startup phase -->
		<div class="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
			<div class="flex gap-3">
				<Sparkles class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
				<div>
					<h4 class="font-medium text-blue-900 mb-1">Welcome to our growing community!</h4>
					<p class="text-sm text-blue-700">
						As a new platform, we're showcasing all our amazing sellers. Join us and start building your reputation today!
					</p>
				</div>
			</div>
		</div>
	</div>
</div>