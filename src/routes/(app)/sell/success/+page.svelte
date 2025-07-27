<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { Button } from '$lib/components/ui'
	import confetti from 'canvas-confetti'
	import * as m from '$lib/paraglide/messages.js'
	
	let listing = $state<any>(null)
	let loading = $state(true)
	let hasLoaded = $state(false)
	
	const listingId = $derived($page.url.searchParams.get('id'))
	
	// Get supabase client from page data
	const supabase = $derived($page.data.supabase)
	
	onMount(async () => {
		// Prevent double execution
		if (hasLoaded) return
		hasLoaded = true
		
		// Load listing first for faster perceived performance
		if (listingId && !listing) {
			loadListing() // Don't await - let it load async
		} else if (!listingId) {
			console.warn('No listing ID provided in URL')
			loading = false
		}
		
		// Celebrate with confetti after a small delay to not block initial render
		setTimeout(() => {
			try {
				confetti({
					particleCount: 100,
					spread: 70,
					origin: { y: 0.6 }
				})
			} catch (error) {
				// Confetti might fail due to CSP restrictions, but that's okay
				console.log('Confetti animation skipped due to CSP')
			}
		}, 100)
	})
	
	async function loadListing() {
		try {
			const { data, error } = await supabase
				.from('listings')
				.select('*, seller:profiles(*)')
				.eq('id', listingId)
				.single()
			
			if (error) throw error
			listing = data
		} catch (error) {
			console.error('Error loading listing:', error)
		} finally {
			loading = false
		}
	}
	
	function handleShare() {
		if (navigator.share && listing) {
			navigator.share({
				title: listing.title,
				text: `Check out ${listing.title} on Threadly!`,
				url: `${window.location.origin}/listings/${listing.id}`
			})
		} else {
			// Fallback - copy to clipboard
			navigator.clipboard.writeText(`${window.location.origin}/listings/${listing.id}`)
			alert('Link copied to clipboard!')
		}
	}
	
	const tips = [
		{ emoji: "📸", text: "Add high-quality photos from multiple angles" },
		{ emoji: "💰", text: "Price competitively by researching similar items" },
		{ emoji: "✨", text: "Write detailed descriptions with measurements" },
		{ emoji: "📈", text: "Share your listing on social media for more views" }
	]
</script>

<svelte:head>
	<title>Listing Created Successfully! | Threadly</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<div class="max-w-lg mx-auto px-4 pt-4">
		<!-- Success Header -->
		<div class="text-center mb-6">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-full mb-4 shadow-sm">
				<span class="text-3xl">✅</span>
			</div>
			
			<h1 class="text-2xl font-bold text-gray-900 mb-2">
				Your Listing is Live!
			</h1>
			
			<p class="text-sm text-gray-600">
				Your item is now available for shoppers to discover.
			</p>
		</div>
		
		<!-- Listing Preview Card -->
		{#if loading}
			<div class="bg-white rounded-xl shadow-sm p-4 mb-4">
				<div class="animate-pulse">
					<div class="h-48 bg-gray-200 rounded-lg mb-3"></div>
					<div class="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
					<div class="h-4 bg-gray-200 rounded w-1/2"></div>
				</div>
			</div>
		{:else if listing}
			<div class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
				{#if listing.images?.[0]}
					<img 
						src={listing.images[0]} 
						alt={listing.title}
						class="w-full h-48 object-cover"
					/>
				{:else}
					<div class="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
						<span class="text-5xl opacity-50">📦</span>
					</div>
				{/if}
				
				<div class="p-4">
					<h2 class="text-lg font-semibold text-gray-900 mb-1">{listing.title}</h2>
					<p class="text-2xl font-bold text-blue-600 mb-3">${listing.price}</p>
					
					{#if listing.description}
						<p class="text-sm text-gray-600 mb-4 line-clamp-2">{listing.description}</p>
					{/if}
					
					<div class="flex flex-col gap-2">
						<Button 
							class="w-full bg-gradient-to-r from-primary to-[#6BB6D8] hover:from-[#6BB6D8] hover:to-[#4F9FC5] text-white font-medium text-sm py-2 shadow-sm"
							on:click={() => goto(`/listings/${listing.id}`)}
						>
							<span class="mr-1">👁️</span>
							View Listing
						</Button>
						
						<div class="grid grid-cols-2 gap-2">
							<Button 
								variant="outline"
								class="text-sm py-2 border-gray-200 hover:bg-gray-50"
								on:click={handleShare}
							>
								<span class="mr-1">🔗</span>
								Share
							</Button>
							
							<Button 
								variant="outline"
								class="text-sm py-2 border-gray-200 hover:bg-gray-50"
								on:click={() => goto('/sell')}
							>
								<span class="mr-1">➕</span>
								Sell More
							</Button>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- No listing ID provided -->
			<div class="bg-white rounded-xl shadow-sm p-6 mb-4 text-center">
				<div class="text-5xl mb-3">🎉</div>
				<p class="text-gray-600 mb-4">Your listing has been created successfully!</p>
				<Button 
					class="bg-gradient-to-r from-primary to-[#6BB6D8] hover:from-[#6BB6D8] hover:to-[#4F9FC5] text-white font-medium text-sm py-2 shadow-sm"
					on:click={() => goto('/profile')}
				>
					View Your Listings
				</Button>
			</div>
		{/if}
		
		<!-- What's Next Section -->
		<div class="bg-white rounded-xl shadow-sm p-4 mb-4">
			<h3 class="text-base font-semibold text-gray-900 mb-3">🚀 What Happens Next?</h3>
			
			<div class="space-y-3">
				<div class="flex gap-3">
					<div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
						<span class="text-sm">1️⃣</span>
					</div>
					<div class="flex-1">
						<h4 class="font-medium text-gray-900 text-sm">Buyers will discover your item</h4>
						<p class="text-gray-600 text-xs mt-0.5">
							Your listing appears in search results immediately
						</p>
					</div>
				</div>
				
				<div class="flex gap-3">
					<div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
						<span class="text-sm">2️⃣</span>
					</div>
					<div class="flex-1">
						<h4 class="font-medium text-gray-900 text-sm">Respond to messages quickly</h4>
						<p class="text-gray-600 text-xs mt-0.5">
							Fast responses lead to more sales
						</p>
					</div>
				</div>
				
				<div class="flex gap-3">
					<div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
						<span class="text-sm">3️⃣</span>
					</div>
					<div class="flex-1">
						<h4 class="font-medium text-gray-900 text-sm">Ship promptly after sale</h4>
						<p class="text-gray-600 text-xs mt-0.5">
							Ship within 24 hours for best ratings
						</p>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Pro Tips -->
		<div class="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 mb-4 border border-blue-100">
			<h3 class="text-base font-semibold text-gray-900 mb-3">
				💡 Pro Tips
			</h3>
			
			<div class="space-y-2">
				{#each tips as tip}
					<div class="flex gap-2 items-start">
						<div class="flex-shrink-0">
							<span class="text-base">{tip.emoji}</span>
						</div>
						<p class="text-xs text-gray-700 leading-relaxed">{tip.text}</p>
					</div>
				{/each}
			</div>
		</div>
		
		<!-- Quick Actions -->
		<div class="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
			<div class="max-w-lg mx-auto flex gap-2">
				<Button 
					class="flex-1 bg-gradient-to-r from-primary to-[#6BB6D8] hover:from-[#6BB6D8] hover:to-[#4F9FC5] text-white font-medium text-sm py-2 shadow-sm"
					on:click={() => goto('/profile')}
				>
					View My Profile
					<span class="ml-1">→</span>
				</Button>
				
				<Button 
					variant="outline"
					class="flex-1 text-sm py-2"
					on:click={() => goto('/')}
				>
					Browse Marketplace
				</Button>
			</div>
		</div>
	</div>
</div>