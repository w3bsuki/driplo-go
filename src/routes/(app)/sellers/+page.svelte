<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	
	// Mock data for top sellers
	let sellers = $state([
		{ id: 1, rank: 1, name: 'Stylish Store', sales: 1234, rating: 4.9, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller1', movement: 'up' },
		{ id: 2, rank: 2, name: 'Fashion Hub', sales: 987, rating: 4.8, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller2', movement: 'up' },
		{ id: 3, rank: 3, name: 'Trendy Threads', sales: 876, rating: 4.7, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller3', movement: 'down' },
		{ id: 4, rank: 4, name: 'Elite Boutique', sales: 765, rating: 4.9, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller4', movement: 'same' },
		{ id: 5, rank: 5, name: 'Urban Style', sales: 654, rating: 4.6, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller5', movement: 'up' },
		{ id: 6, rank: 6, name: 'Classic Collection', sales: 543, rating: 4.8, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller6', movement: 'down' },
		{ id: 7, rank: 7, name: 'Modern Market', sales: 432, rating: 4.5, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller7', movement: 'up' },
		{ id: 8, rank: 8, name: 'Vintage Vibes', sales: 321, rating: 4.7, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller8', movement: 'same' },
		{ id: 9, rank: 9, name: 'Chic Closet', sales: 210, rating: 4.6, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller9', movement: 'up' },
		{ id: 10, rank: 10, name: 'Designer Dreams', sales: 198, rating: 4.9, avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=seller10', movement: 'down' }
	]);
	
	function getRankBadgeClass(rank: number) {
		if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white';
		if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800';
		if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white';
		return 'bg-gray-100 text-gray-700';
	}
</script>

<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
	<!-- Page Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">{m.nav_sellers()}</h1>
		<p class="text-gray-600 mt-1">Discover top-rated sellers on our platform</p>
	</div>
	<!-- Stats Cards -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
			<p class="text-sm text-gray-500">Total Sellers</p>
			<p class="text-2xl font-bold text-gray-900">1,234</p>
		</div>
		<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
			<p class="text-sm text-gray-500">Active Today</p>
			<p class="text-2xl font-bold text-[#4F9FC5]">342</p>
		</div>
		<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
			<p class="text-sm text-gray-500">New This Month</p>
			<p class="text-2xl font-bold text-green-600">87</p>
		</div>
		<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
			<p class="text-sm text-gray-500">Avg Rating</p>
			<p class="text-2xl font-bold text-amber-500">4.7⭐</p>
		</div>
	</div>
	
	<!-- Top Sellers List -->
	<div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
		<div class="p-6 border-b border-gray-100">
			<h2 class="text-xl font-bold text-gray-900">🏆 Top 10 Sellers This Month</h2>
		</div>
		
		<div class="divide-y divide-gray-100">
			{#each sellers as seller (seller.id)}
				<a 
					href="/shops/{seller.id}"
					class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
				>
					<!-- Rank -->
					<div class="flex items-center gap-2">
						<div class={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankBadgeClass(seller.rank)}`}>
							{seller.rank}
						</div>
						{#if seller.movement === 'up'}
							<span class="text-green-500 text-sm">↑</span>
						{:else if seller.movement === 'down'}
							<span class="text-red-500 text-sm">↓</span>
						{:else}
							<span class="text-gray-400 text-sm">−</span>
						{/if}
					</div>
					
					<!-- Avatar -->
					<img 
						src={seller.avatar} 
						alt={seller.name}
						class="w-12 h-12 rounded-full object-cover"
					/>
					
					<!-- Info -->
					<div class="flex-1">
						<h3 class="font-semibold text-gray-900">{seller.name}</h3>
						<div class="flex items-center gap-4 text-sm text-gray-500">
							<span>{seller.sales} sales</span>
							<span>⭐ {seller.rating}</span>
						</div>
					</div>
					
					<!-- Action -->
					<button class="text-[#4F9FC5] hover:text-[#3d7a96] transition-colors">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				</a>
			{/each}
		</div>
	</div>
	
	<!-- Categories -->
	<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">Browse by Category</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
			{#each ['Fashion', 'Electronics', 'Home & Garden', 'Sports', 'Beauty', 'Books', 'Toys', 'Food'] as category (category)}
				<a 
					href="/browse?category={category.toLowerCase()}"
					class="px-4 py-3 rounded-xl bg-gray-50 hover:bg-primary/10 hover:border-primary border border-transparent transition-all text-center text-sm font-medium text-gray-700 hover:text-[#4F9FC5]"
				>
					{category}
				</a>
			{/each}
		</div>
	</div>
</div>