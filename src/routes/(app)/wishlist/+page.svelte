<script lang="ts">
	import { 
		Heart, 
		ShoppingBag, 
		Trash2, 
		X, 
		ChevronRight, 
		Sparkles, 
		TrendingUp,
		Clock,
		Filter,
		Grid3x3,
		List,
		Package,
		Check,
		Star,
		Tag,
		AlertCircle
	} from 'lucide-svelte'
	import ListingCard from '$lib/components/listings/ListingCard.svelte'
	import type { PageData } from './$types'
	import { onMount } from 'svelte'
	import { formatDistanceToNow } from 'date-fns'
	import { cn } from '$lib/utils'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages.js'

	let { data }: { data: PageData } = $props()

	let favorites = $state(data.favorites)
	let loading = $state(false)
	let selectedItems = $state<Set<string>>(new Set())
	let bulkActionLoading = $state(false)
	let viewMode = $state<'grid' | 'list'>('grid')
	let sortBy = $state<'recent' | 'price-low' | 'price-high'>('recent')

	// Sorted favorites
	const sortedFavorites = $derived.by(() => {
		const sorted = [...favorites]
		switch (sortBy) {
			case 'price-low':
				return sorted.sort((a, b) => (a.listings?.price || 0) - (b.listings?.price || 0))
			case 'price-high':
				return sorted.sort((a, b) => (b.listings?.price || 0) - (a.listings?.price || 0))
			default:
				return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		}
	})

	// Stats
	const totalValue = $derived(
		favorites.reduce((sum, fav) => sum + (fav.listings?.price || 0), 0)
	)

	const avgPrice = $derived(
		favorites.length > 0 ? totalValue / favorites.length : 0
	)

	const lowestPrice = $derived(
		favorites.length > 0 ? Math.min(...favorites.map(f => f.listings?.price || 0)) : 0
	)

	const highestPrice = $derived(
		favorites.length > 0 ? Math.max(...favorites.map(f => f.listings?.price || 0)) : 0
	)

	async function removeFavorite(listingId: string) {
		loading = true
		try {
			const response = await fetch('/api/wishlist', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ listing_id: listingId })
			})

			if (response.ok) {
				favorites = favorites.filter(fav => fav.listing_id !== listingId)
				selectedItems.delete(listingId)
				selectedItems = new Set(selectedItems)
				toast.success('Removed from wishlist')
			} else {
				toast.error('Failed to remove item')
			}
		} catch (error) {
			// Error already handled with toast
			toast.error('Something went wrong')
		} finally {
			loading = false
		}
	}

	function toggleItem(itemId: string) {
		if (selectedItems.has(itemId)) {
			selectedItems.delete(itemId)
		} else {
			selectedItems.add(itemId)
		}
		selectedItems = new Set(selectedItems)
	}

	function toggleAllItems() {
		if (selectedItems.size === favorites.length) {
			selectedItems.clear()
		} else {
			selectedItems = new Set(favorites.map(f => f.listing_id))
		}
		selectedItems = new Set(selectedItems)
	}

	async function bulkRemove() {
		if (selectedItems.size === 0) return
		
		const confirmed = confirm(`Remove ${selectedItems.size} items from your wishlist?`)
		if (!confirmed) return
		
		bulkActionLoading = true
		
		try {
			// Remove items one by one for now
			const promises = Array.from(selectedItems).map(itemId => removeFavorite(itemId))
			await Promise.all(promises)
			selectedItems.clear()
			selectedItems = new Set()
			toast.success(`Removed ${promises.length} items`)
		} catch (error) {
			// Error already handled with toast
			toast.error('Failed to remove some items')
		} finally {
			bulkActionLoading = false
		}
	}

	function formatPrice(price: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price)
	}

	// Popular categories for empty state
	const popularCategories = [
		{ name: 'Dresses', emoji: '👗', slug: 'dresses' },
		{ name: 'Shoes', emoji: '👠', slug: 'shoes' },
		{ name: 'Bags', emoji: '👜', slug: 'bags' },
		{ name: 'Jackets', emoji: '🧥', slug: 'jackets' },
		{ name: 'Accessories', emoji: '💍', slug: 'accessories' }
	]
</script>

<svelte:head>
	<title>{m.nav_wishlist()} - Driplo</title>
	<meta name="description" content="View your favorite items and saved listings" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Sticky Header with Beautiful Design -->
	<div class="bg-white sticky top-0 z-20 shadow-sm">
		<div class="container mx-auto px-4">
			<!-- Title Section -->
			<div class="py-4 border-b border-gray-100">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="relative">
							<div class="absolute inset-0 bg-pink-200 rounded-xl blur-lg opacity-40"></div>
							<div class="relative bg-gradient-to-br from-pink-400 to-red-500 p-2.5 rounded-xl">
								<Heart class="w-5 h-5 text-white fill-white" />
							</div>
						</div>
						<div>
							<h1 class="text-xl font-bold text-gray-900">{m.nav_wishlist()}</h1>
							<p class="text-sm text-gray-500">{favorites.length} items saved</p>
						</div>
					</div>
					
					<!-- View Toggle -->
					<div class="bg-gray-100 p-1 rounded-lg flex gap-1">
						<button
							onclick={() => viewMode = 'grid'}
							class={cn(
								"p-2 rounded-md transition-all duration-200",
								viewMode === 'grid' 
									? "bg-white text-gray-900 shadow-sm" 
									: "text-gray-500 hover:text-gray-700"
							)}
							aria-label="Grid view"
						>
							<Grid3x3 class="w-4 h-4" />
						</button>
						<button
							onclick={() => viewMode = 'list'}
							class={cn(
								"p-2 rounded-md transition-all duration-200",
								viewMode === 'list' 
									? "bg-white text-gray-900 shadow-sm" 
									: "text-gray-500 hover:text-gray-700"
							)}
							aria-label="List view"
						>
							<List class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
			
			<!-- Stats Bar (only show when items exist) -->
			{#if favorites.length > 0}
				<div class="py-3 grid grid-cols-4 gap-4 text-center">
					<div>
						<p class="text-xs text-gray-500">Total Value</p>
						<p class="text-sm font-bold text-gray-900">{formatPrice(totalValue)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">Avg. Price</p>
						<p class="text-sm font-bold text-blue-600">{formatPrice(avgPrice)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">Lowest</p>
						<p class="text-sm font-bold text-green-600">{formatPrice(lowestPrice)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">Highest</p>
						<p class="text-sm font-bold text-pink-600">{formatPrice(highestPrice)}</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="container mx-auto px-4 py-6">
		{#if favorites.length === 0}
			<!-- Empty State with Beautiful Design -->
			<div class="max-w-md mx-auto">
				<div class="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
					<!-- Animated Heart Icon -->
					<div class="relative mx-auto w-32 h-32 mb-6">
						<div class="absolute inset-0 bg-pink-100 rounded-full animate-pulse"></div>
						<div class="absolute inset-2 bg-pink-200 rounded-full animate-pulse animation-delay-200"></div>
						<div class="absolute inset-4 bg-white rounded-full flex items-center justify-center">
							<Heart class="w-12 h-12 text-pink-500" />
						</div>
						<div class="absolute -top-2 -right-2">
							<div class="bg-yellow-400 rounded-full p-2 animate-bounce">
								<Star class="w-4 h-4 text-white fill-white" />
							</div>
						</div>
					</div>
					
					<h3 class="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
					<p class="text-gray-500 max-w-xs mx-auto mb-8">
						Start exploring our collection and save your favorite items by tapping the heart icon
					</p>
					
					<a 
						href="/browse" 
						class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
					>
						<ShoppingBag class="w-5 h-5" />
						Explore Collection
					</a>
					
					<!-- Category Suggestions -->
					<div class="mt-10 pt-6 border-t border-gray-100">
						<p class="text-sm text-gray-500 mb-4">Popular categories to explore</p>
						<div class="flex flex-wrap gap-2 justify-center">
							{#each popularCategories as category}
								<a 
									href={`/browse?subcategory=${category.slug}`}
									class="group flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-full transition-all duration-200"
								>
									<span class="text-lg">{category.emoji}</span>
									<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700">{category.name}</span>
								</a>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Controls Bar -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
				<div class="flex items-center justify-between gap-4">
					<!-- Selection Controls -->
					<div class="flex items-center gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input 
								type="checkbox" 
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								checked={selectedItems.size === favorites.length && favorites.length > 0}
								onchange={handleToggleAllItems}
							/>
							<span class="text-sm font-medium text-gray-700">
								Select all
								{#if selectedItems.size > 0}
									<span class="text-blue-600 ml-1">({selectedItems.size})</span>
								{/if}
							</span>
						</label>
						
						{#if selectedItems.size > 0}
							<button 
								class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
								onclick={handleBulkRemove}
								disabled={bulkActionLoading}
							>
								{#if bulkActionLoading}
									<div class="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
								{:else}
									<Trash2 class="w-3.5 h-3.5" />
								{/if}
								Remove selected
							</button>
						{/if}
					</div>
					
					<!-- Sort Dropdown -->
					<select
						bind:value={sortBy}
						class="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
					>
						<option value="recent">Recently added</option>
						<option value="price-low">Price: Low to High</option>
						<option value="price-high">Price: High to Low</option>
					</select>
				</div>
			</div>

			<!-- Grid View -->
			{#if viewMode === 'grid'}
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{#each sortedFavorites as favorite (favorite.id)}
						{@const listing = favorite.listings}
						{#if listing}
							<div class="relative group">
								<!-- Selection Checkbox -->
								<div class="absolute top-2 left-2 z-10">
									<input 
										type="checkbox" 
										class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white/90 backdrop-blur-sm shadow-sm"
										checked={selectedItems.has(listing.id)}
										onchange={() => toggleItem(listing.id)}
									/>
								</div>
								
								<!-- Quick Remove Button -->
								<button
									onclick={() => removeFavorite(listing.id)}
									class="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
									title="Remove from wishlist"
								>
									<X class="w-3.5 h-3.5 text-red-500" />
								</button>
								
								<!-- Listing Card -->
								<ListingCard
									id={listing.id}
									title={listing.title}
									price={listing.price}
									size={listing.size}
									brand={listing.brand}
									image={listing.images?.[0]}
									seller={{
										username: listing.profiles?.username || 'Unknown',
										avatar: listing.profiles?.avatar_url,
										account_type: listing.profiles?.account_type,
										is_verified: listing.profiles?.is_verified
									}}
									likes={listing.favorite_count || 0}
									isLiked={true}
									condition={listing.condition}
								/>
								
								<!-- Added Date Badge -->
								<div class="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
									<Clock class="w-3 h-3" />
									{formatDistanceToNow(new Date(favorite.created_at), { addSuffix: true })}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<!-- List View -->
				<div class="space-y-3">
					{#each sortedFavorites as favorite (favorite.id)}
						{@const listing = favorite.listings}
						{#if listing}
							<div class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
								<div class="p-4">
									<div class="flex items-start gap-4">
										<!-- Checkbox -->
										<input 
											type="checkbox" 
											class="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
											checked={selectedItems.has(listing.id)}
											onchange={() => toggleItem(listing.id)}
										/>
										
										<!-- Image -->
										<a href={`/listings/${listing.id}`} class="flex-shrink-0">
											{#if listing.images?.[0]}
												<img 
													src={listing.images[0]} 
													alt={listing.title}
													class="w-24 h-24 object-cover rounded-lg"
												/>
											{:else}
												<div class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
													<Package class="w-8 h-8 text-gray-400" />
												</div>
											{/if}
										</a>
										
										<!-- Info -->
										<div class="flex-1 min-w-0">
											<div class="flex items-start justify-between gap-4">
												<div class="flex-1">
													<a 
														href={`/listings/${listing.id}`}
														class="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
													>
														{listing.title}
													</a>
													<div class="flex items-center gap-2 mt-1">
														<span class="text-sm text-gray-500">{listing.brand}</span>
														<span class="text-gray-300">•</span>
														<span class="text-sm text-gray-500">Size {listing.size}</span>
														{#if listing.condition === 'new'}
															<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
																<Sparkles class="w-3 h-3" />
																New
															</span>
														{/if}
													</div>
													
													<!-- Seller Info -->
													<div class="flex items-center gap-2 mt-2">
														{#if listing.profiles}
															<img 
																src={listing.profiles.avatar_url || `https://ui-avatars.com/api/?name=${listing.profiles.username}`}
																alt={listing.profiles.username}
																class="w-5 h-5 rounded-full"
															/>
															<span class="text-xs text-gray-500">
																@{listing.profiles.username}
																{#if listing.profiles.is_verified}
																	<Check class="w-3 h-3 text-blue-500 inline ml-1" />
																{/if}
															</span>
														{/if}
													</div>
												</div>
												
												<!-- Price & Actions -->
												<div class="text-right">
													<p class="text-lg font-bold text-gray-900">{formatPrice(listing.price)}</p>
													<p class="text-xs text-gray-500 mt-1">
														Added {formatDistanceToNow(new Date(favorite.created_at), { addSuffix: true })}
													</p>
												</div>
											</div>
											
											<!-- Actions -->
											<div class="flex items-center gap-2 mt-3">
												<a 
													href={`/listings/${listing.id}`}
													class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
												>
													<ShoppingBag class="w-4 h-4" />
													View Details
												</a>
												<button
													onclick={() => removeFavorite(listing.id)}
													class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
													title="Remove from wishlist"
												>
													<Trash2 class="w-4 h-4" />
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	@keyframes animation-delay-200 {
		0%, 100% {
			opacity: 0.5;
			transform: scale(0.95);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05);
		}
	}
	
	.animation-delay-200 {
		animation: animation-delay-200 2s ease-in-out infinite;
		animation-delay: 200ms;
	}
</style>