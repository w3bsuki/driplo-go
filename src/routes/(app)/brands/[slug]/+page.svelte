<script lang="ts">
	import { page } from '$app/stores';
	import { Building2, Globe, Instagram, Facebook, Twitter, MapPin, Calendar, Star, Package, ShoppingBag, Users, TrendingUp, ExternalLink, Check } from 'lucide-svelte';
	import type { PageData } from './$types';
	import ListingCard from '$lib/components/listings/ListingCard.svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const brandProfile = $derived(data.brandProfile);
	const user = $derived(brandProfile.user);
	const listings = $derived(data.listings);
	const stats = $derived(data.stats);
	const reviews = $derived(data.reviews);

	const socialLinks = $derived([
		{ platform: 'website', url: brandProfile.website_url, icon: Globe },
		{ platform: 'instagram', url: brandProfile.instagram_url, icon: Instagram },
		{ platform: 'facebook', url: brandProfile.facebook_url, icon: Facebook },
		{ platform: 'twitter', url: brandProfile.twitter_url, icon: Twitter },
		{ platform: 'tiktok', url: brandProfile.tiktok_url, icon: null }
	].filter(link => link.url));

	function getRelativeTime(date: string) {
		const now = new Date();
		const past = new Date(date);
		const diffInMs = now.getTime() - past.getTime();
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
		
		if (diffInDays === 0) return 'Today';
		if (diffInDays === 1) return 'Yesterday';
		if (diffInDays < 7) return `${diffInDays} days ago`;
		if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
		if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
		return `${Math.floor(diffInDays / 365)} years ago`;
	}

	let activeTab = $state<'products' | 'about' | 'reviews'>('products');
</script>

<svelte:head>
	<title>{brandProfile.brand_name} | Driplo Brand</title>
	<meta name="description" content="{brandProfile.brand_description || `Shop from ${brandProfile.brand_name} on Driplo`}" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Brand Cover Image -->
	{#if brandProfile.brand_cover_url}
		<div class="relative h-48 md:h-64 lg:h-80">
			<img 
				src={brandProfile.brand_cover_url} 
				alt="{brandProfile.brand_name} cover"
				class="w-full h-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
		</div>
	{/if}
	
	<!-- Brand Header -->
	<div class="bg-white shadow-sm {brandProfile.brand_cover_url ? 'relative -mt-20' : ''}">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="py-8">
				<!-- Brand Info -->
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-6">
					<!-- Logo -->
					<div class="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center ring-4 ring-white shadow-xl">
						{#if brandProfile.brand_logo_url}
							<img 
								src={brandProfile.brand_logo_url} 
								alt="{brandProfile.brand_name} logo"
								class="w-full h-full object-cover rounded-xl"
							/>
						{:else}
							<Building2 class="w-12 h-12 md:w-16 md:h-16 text-purple-600" />
						{/if}
					</div>

					<!-- Brand Details -->
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h1 class="text-3xl font-bold text-gray-900">{brandProfile.brand_name}</h1>
							{#if brandProfile.verification_status === 'verified'}
								<div class="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium shadow-md">
									<Check class="w-4 h-4" />
									Verified Brand
								</div>
							{/if}
						</div>

						{#if brandProfile.brand_description}
							<p class="text-gray-600 mb-3 max-w-2xl">{brandProfile.brand_description}</p>
						{/if}

						<div class="flex flex-wrap gap-4 text-sm text-gray-500">
							{#if user.location}
								<div class="flex items-center gap-1">
									<MapPin class="w-4 h-4" />
									{user.location}
								</div>
							{/if}
							<div class="flex items-center gap-1">
								<Calendar class="w-4 h-4" />
								Member since {new Date(brandProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
							</div>
							{#if user.seller_rating}
								<div class="flex items-center gap-1">
									<Star class="w-4 h-4 text-yellow-500 fill-current" />
									{user.seller_rating.toFixed(1)} ({user.seller_rating_count} reviews)
								</div>
							{/if}
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-col sm:flex-row gap-3">
						<a 
							href="/messages?user={user.username}"
							class="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
						>
							Contact Brand
						</a>
						<button 
							class="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
						>
							Follow
						</button>
					</div>
				</div>

				<!-- Social Links -->
				{#if socialLinks.length > 0}
					<div class="flex gap-3 mt-6">
						{#each socialLinks as link}
							<a 
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
								title="Visit {link.platform}"
							>
								{#if link.icon}
									<svelte:component this={link.icon} class="w-5 h-5 text-gray-700" />
								{:else if link.platform === 'tiktok'}
									<svg class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
									</svg>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Stats -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-t">
				<div class="text-center">
					<p class="text-3xl font-bold text-gray-900">{stats.total_listings}</p>
					<p class="text-sm text-gray-500">Products</p>
				</div>
				<div class="text-center">
					<p class="text-3xl font-bold text-gray-900">{stats.total_sales}</p>
					<p class="text-sm text-gray-500">Sales</p>
				</div>
				<div class="text-center">
					<p class="text-3xl font-bold text-gray-900">
						{#if stats.avg_rating}
							{stats.avg_rating.toFixed(1)}⭐
						{:else}
							-
						{/if}
					</p>
					<p class="text-sm text-gray-500">Rating</p>
				</div>
				<div class="text-center">
					<p class="text-3xl font-bold text-gray-900">0</p>
					<p class="text-sm text-gray-500">Followers</p>
				</div>
			</div>

			<!-- Tabs -->
			<div class="border-t">
				<nav class="flex gap-8">
					<button
						onclick={() => activeTab = 'products'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors
							{activeTab === 'products' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Products ({stats.total_listings})
					</button>
					<button
						onclick={() => activeTab = 'about'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors
							{activeTab === 'about' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						About
					</button>
					<button
						onclick={() => activeTab = 'reviews'}
						class="py-4 px-1 border-b-2 font-medium text-sm transition-colors
							{activeTab === 'reviews' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					>
						Reviews ({stats.total_reviews})
					</button>
				</nav>
			</div>
		</div>
	</div>

	<!-- Tab Content -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if activeTab === 'products'}
			<!-- Products Grid -->
			{#if listings.length > 0}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
					{#each listings as listing}
						<ListingCard {listing} />
					{/each}
				</div>

				{#if stats.total_listings > 12}
					<div class="mt-8 flex justify-center">
						<a 
							href="/browse?seller={user.username}"
							class="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
						>
							View All Products
						</a>
					</div>
				{/if}
			{:else}
				<div class="text-center py-12">
					<Package class="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
					<p class="text-gray-500">This brand hasn't listed any products.</p>
				</div>
			{/if}
		{:else if activeTab === 'about'}
			<!-- About Section -->
			<div class="max-w-3xl">
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h2 class="text-xl font-semibold mb-4">About {brandProfile.brand_name}</h2>
					
					{#if brandProfile.brand_description}
						<div class="mb-6">
							<h3 class="font-medium text-gray-900 mb-2">Description</h3>
							<p class="text-gray-600 leading-relaxed">{brandProfile.brand_description}</p>
						</div>
					{/if}

					{#if brandProfile.brand_story}
						<div class="mb-6">
							<h3 class="font-medium text-gray-900 mb-2">Our Story</h3>
							<p class="text-gray-600 leading-relaxed whitespace-pre-wrap">{brandProfile.brand_story}</p>
						</div>
					{:else if user.bio}
						<div class="mb-6">
							<h3 class="font-medium text-gray-900 mb-2">Our Story</h3>
							<p class="text-gray-600 leading-relaxed">{user.bio}</p>
						</div>
					{/if}
					
					{#if brandProfile.brand_values}
						<div class="mb-6">
							<h3 class="font-medium text-gray-900 mb-2">Our Values</h3>
							<p class="text-gray-600 leading-relaxed">{brandProfile.brand_values}</p>
						</div>
					{/if}
					
					{#if brandProfile.brand_mission}
						<div class="mb-6">
							<h3 class="font-medium text-gray-900 mb-2">Our Mission</h3>
							<p class="text-gray-600 leading-relaxed">{brandProfile.brand_mission}</p>
						</div>
					{/if}

					<div class="grid sm:grid-cols-2 gap-6">
						<div>
							<h3 class="font-medium text-gray-900 mb-2">Location</h3>
							<p class="text-gray-600">{user.location || 'Not specified'}</p>
						</div>
						<div>
							<h3 class="font-medium text-gray-900 mb-2">Member Since</h3>
							<p class="text-gray-600">{new Date(brandProfile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
						</div>
					</div>

					{#if brandProfile.website_url}
						<div class="mt-6 pt-6 border-t">
							<a 
								href={brandProfile.website_url}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
							>
								Visit Website
								<ExternalLink class="w-4 h-4" />
							</a>
						</div>
					{/if}
				</div>
			</div>
		{:else if activeTab === 'reviews'}
			<!-- Reviews Section -->
			{#if reviews.length > 0}
				<div class="space-y-4 max-w-3xl">
					{#each reviews as review}
						<div class="bg-white rounded-xl p-6 shadow-sm">
							<div class="flex items-start gap-4">
								<img 
									src={review.reviewer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer.username}`}
									alt={review.reviewer.full_name || review.reviewer.username}
									class="w-12 h-12 rounded-full"
								/>
								<div class="flex-1">
									<div class="flex items-center justify-between mb-2">
										<div>
											<h4 class="font-medium text-gray-900">{review.reviewer.full_name || review.reviewer.username}</h4>
											<div class="flex items-center gap-2 text-sm text-gray-500">
												<div class="flex">
													{#each Array(5) as _, i}
														<Star 
															class="w-4 h-4 {i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}"
														/>
													{/each}
												</div>
												<span>·</span>
												<span>{getRelativeTime(review.created_at)}</span>
											</div>
										</div>
									</div>
									<p class="text-gray-600">{review.comment}</p>
								</div>
							</div>
						</div>
					{/each}

					{#if stats.total_reviews > 5}
						<div class="text-center">
							<button class="text-purple-600 hover:text-purple-700 font-medium">
								View All Reviews ({stats.total_reviews})
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-center py-12">
					<Star class="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
					<p class="text-gray-500">Be the first to review this brand!</p>
				</div>
			{/if}
		{/if}
	</div>
</div>