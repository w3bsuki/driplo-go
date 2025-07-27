<script lang="ts">
	import { page } from '$app/stores';
	import { 
		TrendingUp, Package, DollarSign, Star, ShoppingBag, 
		Eye, Heart, Calendar, ArrowUp, ArrowDown, Minus,
		Download, Filter
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages.js';
	import { formatCurrency } from '$lib/utils/currency';
	// import { languageTag } from '$lib/paraglide/runtime.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const brandProfile = $derived(data.brandProfile);
	const orders = $derived(data.orders);
	const salesStats = $derived(data.salesStats);
	const listingStats = $derived(data.listingStats);
	const reviewStats = $derived(data.reviewStats);

	let selectedPeriod = $state('30d');
	let activeTab = $state<'overview' | 'orders' | 'listings' | 'reviews'>('overview');

	function getOrderStatusBadge(status: string) {
		const statusConfig = {
			pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
			processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
			shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
			delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
			cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
		};
		return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
	}

	function getRelativeTime(date: string) {
		const now = new Date();
		const past = new Date(date);
		const diffInMs = now.getTime() - past.getTime();
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		
		if (diffInHours < 1) return 'Just now';
		if (diffInHours < 24) return `${diffInHours}h ago`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d ago`;
		if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
		
		return past.toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Brand Analytics - {brandProfile.brand_name} | Driplo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Brand Analytics</h1>
					<p class="text-gray-600 mt-1">Track your brand's performance and sales</p>
				</div>
				<div class="flex gap-3">
					<select
						bind:value={selectedPeriod}
						class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					>
						<option value="7d">Last 7 days</option>
						<option value="30d">Last 30 days</option>
						<option value="90d">Last 90 days</option>
						<option value="all">All time</option>
					</select>
					<button class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
						<Download class="w-4 h-4" />
						Export
					</button>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="bg-white rounded-xl shadow-sm p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
						<DollarSign class="w-6 h-6 text-green-600" />
					</div>
					<span class="text-sm font-medium text-green-600 flex items-center gap-1">
						<ArrowUp class="w-4 h-4" />
						+12%
					</span>
				</div>
				<h3 class="text-2xl font-bold text-gray-900">{formatCurrency(salesStats.total_revenue, 'en')}</h3>
				<p class="text-sm text-gray-600 mt-1">Total Revenue</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
						<ShoppingBag class="w-6 h-6 text-blue-600" />
					</div>
					<span class="text-sm font-medium text-gray-600 flex items-center gap-1">
						<Minus class="w-4 h-4" />
						0%
					</span>
				</div>
				<h3 class="text-2xl font-bold text-gray-900">{salesStats.total_orders}</h3>
				<p class="text-sm text-gray-600 mt-1">Total Orders</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
						<Package class="w-6 h-6 text-purple-600" />
					</div>
					<span class="text-sm font-medium text-purple-600 flex items-center gap-1">
						<ArrowUp class="w-4 h-4" />
						+5%
					</span>
				</div>
				<h3 class="text-2xl font-bold text-gray-900">{formatCurrency(salesStats.avg_order_value, 'en')}</h3>
				<p class="text-sm text-gray-600 mt-1">Avg Order Value</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
						<Star class="w-6 h-6 text-yellow-600" />
					</div>
					<span class="text-sm font-medium text-gray-600">{reviewStats.totalReviews} reviews</span>
				</div>
				<h3 class="text-2xl font-bold text-gray-900">{reviewStats.averageRating.toFixed(1)}</h3>
				<p class="text-sm text-gray-600 mt-1">Average Rating</p>
			</div>
		</div>

		<!-- Tabs -->
		<div class="bg-white rounded-xl shadow-sm">
			<div class="border-b">
				<nav class="flex">
					<button
						onclick={() => activeTab = 'overview'}
						class="px-6 py-4 font-medium text-sm border-b-2 transition-colors
							{activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Overview
					</button>
					<button
						onclick={() => activeTab = 'orders'}
						class="px-6 py-4 font-medium text-sm border-b-2 transition-colors
							{activeTab === 'orders' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Orders ({orders.length})
					</button>
					<button
						onclick={() => activeTab = 'listings'}
						class="px-6 py-4 font-medium text-sm border-b-2 transition-colors
							{activeTab === 'listings' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Listings
					</button>
					<button
						onclick={() => activeTab = 'reviews'}
						class="px-6 py-4 font-medium text-sm border-b-2 transition-colors
							{activeTab === 'reviews' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Reviews
					</button>
				</nav>
			</div>

			<div class="p-6">
				{#if activeTab === 'overview'}
					<!-- Overview Content -->
					<div class="space-y-6">
						<!-- Sales Chart Placeholder -->
						<div>
							<h3 class="text-lg font-semibold mb-4">Sales Trend</h3>
							<div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
								<div class="text-center">
									<TrendingUp class="w-12 h-12 text-gray-400 mx-auto mb-3" />
									<p class="text-gray-500">Sales chart coming soon</p>
								</div>
							</div>
						</div>

						<!-- Top Products -->
						<div>
							<h3 class="text-lg font-semibold mb-4">Top Performing Listings</h3>
							<div class="space-y-3">
								{#each listingStats.slice(0, 5) as listing}
									<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
										<div class="flex items-center gap-4">
											<div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
											<div>
												<h4 class="font-medium text-gray-900">{listing.title}</h4>
												<p class="text-sm text-gray-600">{formatCurrency(listing.price, 'en')}</p>
											</div>
										</div>
										<div class="text-right text-sm">
											<div class="flex items-center gap-2 text-gray-600">
												<Eye class="w-4 h-4" />
												{listing.views} views
											</div>
											<div class="flex items-center gap-2 text-gray-600">
												<Heart class="w-4 h-4" />
												{listing.favorites_count} likes
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else if activeTab === 'orders'}
					<!-- Orders List -->
					<div class="space-y-4">
						{#if orders.length === 0}
							<div class="text-center py-12">
								<ShoppingBag class="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<h3 class="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
								<p class="text-gray-500">When customers purchase your items, orders will appear here.</p>
							</div>
						{:else}
							{#each orders as order}
								{@const status = getOrderStatusBadge(order.status)}
								<div class="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
									<div class="flex items-start justify-between">
										<div class="flex gap-4">
											<img 
												src={order.listing.images[0]?.image_url || '/placeholder.jpg'}
												alt={order.listing.title}
												class="w-16 h-16 object-cover rounded-lg"
											/>
											<div>
												<h4 class="font-medium text-gray-900">{order.listing.title}</h4>
												<p class="text-sm text-gray-600 mt-1">
													Buyer: @{order.buyer.username}
												</p>
												<p class="text-sm text-gray-500">
													{getRelativeTime(order.created_at)}
												</p>
											</div>
										</div>
										<div class="text-right">
											<p class="font-semibold text-gray-900">{formatCurrency(order.total_amount, 'en')}</p>
											<span class={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${status.color}`}>
												{status.label}
											</span>
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				{:else if activeTab === 'listings'}
					<!-- Listings Performance -->
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b">
									<th class="text-left py-3 px-4 font-medium text-gray-700">Listing</th>
									<th class="text-left py-3 px-4 font-medium text-gray-700">Price</th>
									<th class="text-left py-3 px-4 font-medium text-gray-700">Views</th>
									<th class="text-left py-3 px-4 font-medium text-gray-700">Likes</th>
									<th class="text-left py-3 px-4 font-medium text-gray-700">Status</th>
								</tr>
							</thead>
							<tbody>
								{#each listingStats as listing}
									<tr class="border-b hover:bg-gray-50">
										<td class="py-3 px-4">
											<div class="font-medium text-gray-900">{listing.title}</div>
										</td>
										<td class="py-3 px-4">{formatCurrency(listing.price, 'en')}</td>
										<td class="py-3 px-4">{listing.views}</td>
										<td class="py-3 px-4">{listing.favorites_count}</td>
										<td class="py-3 px-4">
											<span class={`inline-block px-2 py-1 rounded text-xs font-medium
												${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
												{listing.status}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else if activeTab === 'reviews'}
					<!-- Reviews Stats -->
					<div class="space-y-6">
						<div class="grid md:grid-cols-2 gap-6">
							<!-- Rating Distribution -->
							<div>
								<h3 class="text-lg font-semibold mb-4">Rating Distribution</h3>
								<div class="space-y-3">
									{#each [5, 4, 3, 2, 1] as rating}
										{@const count = reviewStats.distribution[rating]}
										{@const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0}
										<div class="flex items-center gap-3">
											<div class="flex items-center gap-1 w-20">
												<span class="text-sm font-medium">{rating}</span>
												<Star class="w-4 h-4 text-yellow-500 fill-current" />
											</div>
											<div class="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
												<div 
													class="h-full bg-yellow-500 transition-all duration-500"
													style="width: {percentage}%"
												></div>
											</div>
											<span class="text-sm text-gray-600 w-12 text-right">{count}</span>
										</div>
									{/each}
								</div>
							</div>

							<!-- Review Summary -->
							<div class="bg-gray-50 rounded-lg p-6 text-center">
								<div class="text-4xl font-bold text-gray-900 mb-2">
									{reviewStats.averageRating.toFixed(1)}
								</div>
								<div class="flex justify-center gap-1 mb-2">
									{#each Array(5) as _, i}
										<Star 
											class="w-5 h-5 {i < Math.round(reviewStats.averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}"
										/>
									{/each}
								</div>
								<p class="text-gray-600">Based on {reviewStats.totalReviews} reviews</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="mt-8 bg-white rounded-xl shadow-sm p-6">
			<h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<a 
					href="/sell"
					class="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
				>
					<Package class="w-8 h-8 text-purple-600" />
					<span class="text-sm font-medium text-gray-900">Add Listing</span>
				</a>
				<a 
					href="/brands/settings"
					class="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
				>
					<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<span class="text-sm font-medium text-gray-900">Brand Settings</span>
				</a>
				<a 
					href="/messages"
					class="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
				>
					<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					<span class="text-sm font-medium text-gray-900">Messages</span>
				</a>
				<a 
					href={`/brands/${brandProfile.brand_slug}`}
					class="flex flex-col items-center gap-2 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-center"
				>
					<Eye class="w-8 h-8 text-yellow-600" />
					<span class="text-sm font-medium text-gray-900">View Profile</span>
				</a>
			</div>
		</div>
	</div>
</div>