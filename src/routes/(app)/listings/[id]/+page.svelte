<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatCurrency } from '$lib/utils/currency';
	import { 
		Heart, Share2, MapPin, Shield, Eye, Star,
		ShoppingBag, ChevronLeft, ChevronRight, MessageCircle, 
		UserPlus, UserMinus, Truck, RotateCcw, Info, FileText,
		Ruler, Palette, Tag, Package, X, ZoomIn, Maximize2
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages.js';
	import LazyCheckoutFlow from '$lib/components/checkout/LazyCheckoutFlow.svelte';
	import { Badge } from '$lib/components/ui';
	import BrandBadge from '$lib/components/ui/BrandBadge.svelte';
	import ConditionBadge from '$lib/components/badges/ConditionBadge.svelte';
	import CategoryBadge from '$lib/components/badges/CategoryBadge.svelte';
	import SizeBadge from '$lib/components/badges/SizeBadge.svelte';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '$lib/components/ui/breadcrumb';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import Image from '$lib/components/ui/Image.svelte';
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	const supabase = $derived(data.supabase);
	let listing = $derived(data.listing);
	let currentUser = $derived(data.user);
	let relatedListings = $derived(data.relatedListings);
	let isFollowing = $state(data.isFollowing || false);

	let currentImageIndex = $state(0);
	let isLiked = $state(data.isLiked || false);
	let showCheckout = $state(false);
	let activeTab = $state('description');
	let isFollowLoading = $state(false);
	let isLikeLoading = $state(false);
	let showFullscreenGallery = $state(false);
	let isDescriptionExpanded = $state(false);
	let checkoutFlowRef: any;

	let isOwner = $derived(currentUser?.id === listing?.seller_id);
	let images = $derived(() => {
		if (!listing) return [];
		
		// Try images field first (this is what the database actually uses)
		if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
			return listing.images.filter(img => img && typeof img === 'string');
		}
		
		// Then try image_urls
		if (listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0) {
			return listing.image_urls.filter(url => url && typeof url === 'string');
		}
		
		// Handle other formats just in case
		if (listing.image_urls) {
			if (typeof listing.image_urls === 'object' && !Array.isArray(listing.image_urls)) {
				return Object.values(listing.image_urls).filter(url => url && typeof url === 'string');
			}
			if (typeof listing.image_urls === 'string') {
				return [listing.image_urls];
			}
		}
		
		if (listing.images) {
			if (typeof listing.images === 'object' && !Array.isArray(listing.images)) {
				return Object.values(listing.images).filter(url => url && typeof url === 'string');
			}
			if (typeof listing.images === 'string') {
				return [listing.images];
			}
		}
		
		// Fallback to single image field if it exists
		if (listing.image && typeof listing.image === 'string') {
			return [listing.image];
		}
		
		console.log('No images found for listing:', listing?.id, { 
			images: listing?.images, 
			image_urls: listing?.image_urls,
			image: listing?.image 
		});
		
		return [];
	});
	let hasMultipleImages = $derived(images.length > 1);
	let hasImages = $derived(images.length > 0);

	function nextImage() {
		currentImageIndex = (currentImageIndex + 1) % images.length;
	}

	function prevImage() {
		currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
	}

	async function handleLike() {
		if (!currentUser) {
			goto('/login');
			return;
		}
		
		if (isLikeLoading || !listing) return;
		
		// Optimistic update
		const previousLiked = isLiked;
		isLiked = !isLiked;
		isLikeLoading = true;
		
		try {
			const response = await fetch('/api/wishlist', {
				method: isLiked ? 'POST' : 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ listing_id: listing.id })
			});
			
			if (!response.ok) {
				// Revert on error
				isLiked = previousLiked;
				const error = await response.json();
				toast.error(error.message || 'Failed to update favorites');
			} else {
				// Update favorite count
				if (listing) {
					listing.favorite_count = (listing.favorite_count || 0) + (isLiked ? 1 : -1);
				}
			}
		} catch (error) {
			// Revert on error
			isLiked = previousLiked;
			toast.error('Failed to update favorites');
		} finally {
			isLikeLoading = false;
		}
	}

	function handleBuyNow() {
		if (!currentUser) {
			goto('/login');
			return;
		}
		showCheckout = true;
	}


	async function handleShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: listing?.title,
					text: listing?.description,
					url: window.location.href
				});
			} catch (err) {
				console.log('Error sharing:', err);
			}
		}
	}

	function getAvatarColor(username: string): string {
		const colors = [
			'bg-blue-400', 'bg-blue-300', 'bg-blue-500', 
			'bg-cyan-400', 'bg-sky-400', 'bg-indigo-400'
		];
		return colors[username.charCodeAt(0) % colors.length];
	}


	async function handleFollow() {
		if (!currentUser || !listing) {
			goto('/login');
			return;
		}
		
		isFollowLoading = true;
		try {
			if (isFollowing) {
				await supabase
					.from('user_follows')
					.delete()
					.eq('follower_id', currentUser.id)
					.eq('following_id', listing.seller_id);
				isFollowing = false;
				toast.success(m.profile_unfollow_success());
			} else {
				await supabase
					.from('user_follows')
					.insert({
						follower_id: currentUser.id,
						following_id: listing.seller_id
					});
				isFollowing = true;
				toast.success(m.profile_follow_success());
			}
		} catch (error) {
			console.error('Follow error:', error);
			toast.error(m.profile_follow_update_error());
		} finally {
			isFollowLoading = false;
		}
	}

	function openFullscreenGallery(index: number = currentImageIndex) {
		currentImageIndex = index;
		showFullscreenGallery = true;
		document.body.style.overflow = 'hidden';
	}

	function closeFullscreenGallery() {
		showFullscreenGallery = false;
		document.body.style.overflow = '';
	}

	// Track view for anonymous users on mount
	onMount(() => {
		if (!currentUser && listing) {
			// Generate or get session ID for anonymous users
			let sessionId = sessionStorage.getItem('session_id');
			if (!sessionId) {
				sessionId = crypto.randomUUID();
				sessionStorage.setItem('session_id', sessionId);
			}
			
			// Track the view
			fetch('/api/views', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					listing_id: listing.id,
					session_id: sessionId
				})
			}).catch(() => {
				// Silent failure - view tracking is not critical
			});
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!showFullscreenGallery) return;
		
		switch(e.key) {
			case 'ArrowLeft':
				prevImage();
				break;
			case 'ArrowRight':
				nextImage();
				break;
			case 'Escape':
				closeFullscreenGallery();
				break;
		}
	}

	onMount(() => {
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
	<title>{listing?.title || 'Product'} - Driplo</title>
	<meta name="description" content={listing?.description || 'Check out this item on Driplo'} />
</svelte:head>

{#if listing}
	<div class="min-h-screen bg-background">
		<div class="container mx-auto px-4 py-2 pb-20 max-w-7xl">
			<!-- Breadcrumb Navigation -->
			<Breadcrumb class="mb-4">
				<BreadcrumbItem>
					<BreadcrumbLink href="/">{m.header_home()}</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbLink href="/browse">{m.header_browse()}</BreadcrumbLink>
				</BreadcrumbItem>
				{#if listing.category}
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/browse?category={listing.category}">{listing.category}</BreadcrumbLink>
					</BreadcrumbItem>
				{/if}
				{#if listing.subcategory}
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/browse?category={listing.category}&subcategory={listing.subcategory}">{listing.subcategory}</BreadcrumbLink>
					</BreadcrumbItem>
				{/if}
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbLink>{listing.title}</BreadcrumbLink>
				</BreadcrumbItem>
			</Breadcrumb>
			
			<div class="grid grid-cols-1 lg:grid-cols-[1fr,480px] gap-3">
				<!-- Image Gallery Section -->
				<div class="space-y-2">
					<div class="relative bg-white rounded-sm  border border-gray-200/60 p-2">
						<button 
							onclick={() => hasImages && openFullscreenGallery()}
							class="relative aspect-square overflow-hidden rounded-sm bg-gray-50 w-full group cursor-zoom-in"
							disabled={!hasImages}
						>
							{#if hasImages && images[currentImageIndex]}
								<Image
									src={images[currentImageIndex]}
									alt={listing.title}
									class="w-full h-full transition-transform duration-200 group-hover:scale-[1.02]"
									aspectRatio="1/1"
									objectFit="contain"
									preferredSize="large"
									loading="eager"
									priority={true}
								/>
							{:else}
								<div class="w-full h-full bg-gray-100 flex items-center justify-center">
									<span class="text-gray-400">No image available</span>
								</div>
							{/if}
							
							<!-- Zoom indicator -->
							<div class="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
								<Maximize2 class="w-4 h-4" />
							</div>
							
							<!-- Sold Badge Overlay -->
							{#if listing.status === 'sold'}
								<div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
									Sold
								</div>
							{/if}
						
						{#if hasMultipleImages}
							<!-- Navigation buttons -->
							<button
								onclick={(e) => { e.stopPropagation(); prevImage(); }}
								class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-200 hover:bg-white transition-all duration-100"
							>
								<ChevronLeft class="w-4 h-4" />
							</button>
							<button
								onclick={(e) => { e.stopPropagation(); nextImage(); }}
								class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-200 hover:bg-white transition-all duration-100"
							>
								<ChevronRight class="w-4 h-4" />
							</button>

							<!-- Image indicators -->
							<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
								{#each images as _, index (index)}
									<button
										onclick={(e) => { e.stopPropagation(); currentImageIndex = index; }}
										class={cn("w-1 h-1 rounded-full transition-all", 
											index === currentImageIndex ? "bg-white w-4" : "bg-white/60"
										)}
									/>
								{/each}
							</div>
						{/if}
					</button>
					</div>

					<!-- Thumbnail strip -->
					{#if hasMultipleImages}
						<div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
							{#each images as image, index (index)}
								<button
									onclick={() => currentImageIndex = index}
									class={cn("flex-shrink-0 w-12 h-12 rounded overflow-hidden border transition-all",
										index === currentImageIndex ? "border-primary " : "border-gray-200 opacity-80 hover:opacity-100"
									)}
								>
									{#if image}
										<Image 
											src={image} 
											alt="Product {index + 1}" 
											class="w-full h-full" 
											objectFit="cover"
											preferredSize="thumb"
											loading="eager"
										/>
									{:else}
										<div class="w-full h-full bg-gray-100"></div>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Product Details Section -->
				<div class="space-y-3">
					<!-- Header -->
					<div class="space-y-2">
						<div class="flex items-center justify-between gap-2">
							<h1 class="text-base font-semibold text-foreground flex-1">
								{listing.title}
							</h1>
							<div class="flex items-center gap-1">
								<button
									onclick={handleLike}
									class={cn("p-1.5 rounded-sm hover:bg-gray-100 transition-colors duration-100",
										isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
									)}
								>
									<Heart class={cn("w-4 h-4", isLiked && "fill-current")} />
								</button>
								<button 
									onclick={handleShare}
									class="p-1.5 rounded-sm text-gray-500 hover:bg-gray-100 transition-colors duration-100"
								>
									<Share2 class="w-4 h-4" />
								</button>
							</div>
						</div>
						
						<div class="flex items-center gap-3">
							<span class="text-xl font-bold text-gray-900">{formatCurrency(listing.price)}</span>
							{#if listing.original_price && listing.original_price > listing.price}
								<span class="text-sm text-gray-500 line-through">{formatCurrency(listing.original_price)}</span>
								<Badge variant="destructive" class="text-xs px-1.5 py-0.5">
									{Math.round((1 - listing.price / listing.original_price) * 100)}% off
								</Badge>
							{/if}
						</div>

						<!-- Quick info badges -->
						<div class="flex items-center gap-2 flex-wrap">
							{#if listing.condition}
								<ConditionBadge condition={listing.condition} size="md" />
							{/if}
							{#if listing.size}
								<SizeBadge size={listing.size} badgeSize="md" />
							{/if}
							{#if listing.category}
								<CategoryBadge category={listing.category.name} size="md" />
							{/if}
							{#if listing.brand}
								<BrandBadge brand={listing.brand} size="md" isVerified={false} />
							{/if}
						</div>

						<!-- Compact description -->
						<div class="text-sm text-gray-600">
							{#if isDescriptionExpanded || listing.description.length <= 100}
								<p>{listing.description}</p>
							{:else}
								<p>
									{listing.description.slice(0, 100)}...
									<button 
										onclick={() => isDescriptionExpanded = true}
										class="text-primary hover:underline ml-1"
									>
										See more
									</button>
								</p>
							{/if}
						</div>
					</div>

					<!-- Compact Seller Card -->
					<div class="border border-gray-200 rounded-sm p-3">
						<div class="flex items-center justify-between">
							<a href="/profile/{listing.seller.username}" class="flex items-center gap-2 group flex-1">
								{#if listing.seller.avatar_url}
									<Image
										src={listing.seller.avatar_url}
										alt={listing.seller.username}
										class="w-8 h-8 rounded-full"
										objectFit="cover"
										preferredSize="thumb"
									/>
								{:else}
									<div class={cn("w-8 h-8 rounded-full flex items-center justify-center", getAvatarColor(listing.seller.username))}>
										<span class="text-white text-xs font-medium">{listing.seller.username.charAt(0).toUpperCase()}</span>
									</div>
								{/if}
								<div>
									<div class="flex items-center gap-1">
										<span class="text-sm font-medium group-hover:text-primary transition-colors duration-100">
											{listing.seller.username}
										</span>
										{#if listing.seller.account_type === 'brand'}
											<BrandBadge size="xs" isVerified={listing.seller.is_verified} showText={false} />
										{/if}
									</div>
									<div class="flex items-center gap-1 text-xs text-gray-500">
										<Star class="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
										<span>{listing.seller.rating || 4.8}</span>
										<span>•</span>
										<span>{listing.seller.sales_count || 0} sales</span>
									</div>
								</div>
							</a>
							{#if !isOwner}
								<button
									onclick={handleFollow}
									disabled={isFollowLoading}
									class={cn("px-3 py-1.5 rounded-sm text-xs font-medium transition-all",
										isFollowing 
											? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
											: "bg-primary text-white hover:bg-primary/90",
										isFollowLoading && "opacity-50 cursor-not-allowed"
									)}
								>
									{#if isFollowLoading}
										<Spinner size="sm" color={isFollowing ? "current" : "white"} />
									{:else}
										{isFollowing ? "Following" : "Follow"}
									{/if}
								</button>
							{/if}
						</div>
					</div>


					<!-- Details Section with Tabs -->
					<Tabs value="details" class="w-full">
						<TabsList class="grid w-full grid-cols-3">
							<TabsTrigger value="details" class="text-sm">
								<span class="mr-1">📋</span> Details
							</TabsTrigger>
							<TabsTrigger value="shipping" class="text-sm">
								<span class="mr-1">📦</span> Shipping
							</TabsTrigger>
							<TabsTrigger value="seller" class="text-sm">
								<span class="mr-1">👤</span> Seller
							</TabsTrigger>
						</TabsList>
						
						<TabsContent value="details" class="mt-4 space-y-4">
							<div class="grid grid-cols-1 gap-3">
								{#if listing.materials && listing.materials.length > 0}
									<div class="flex justify-between items-center py-2 border-b border-gray-100">
										<span class="text-sm text-gray-500">Materials</span>
										<span class="text-sm text-gray-900 font-medium">{listing.materials.join(', ')}</span>
									</div>
								{/if}
								{#if listing.category}
									<div class="flex justify-between items-center py-2 border-b border-gray-100">
										<span class="text-sm text-gray-500">Category</span>
										<span class="text-sm text-gray-900 font-medium">{listing.category.name}</span>
									</div>
								{/if}
								{#if listing.subcategory}
									<div class="flex justify-between items-center py-2 border-b border-gray-100">
										<span class="text-sm text-gray-500">Subcategory</span>
										<span class="text-sm text-gray-900 font-medium">{listing.subcategory?.name}</span>
									</div>
								{/if}
								<div class="flex justify-between items-center py-2 border-b border-gray-100">
									<span class="text-sm text-gray-500">Listed</span>
									<span class="text-sm text-gray-900 font-medium">{new Date(listing.created_at).toLocaleDateString()}</span>
								</div>
								{#if listing.view_count}
									<div class="flex justify-between items-center py-2 border-b border-gray-100">
										<span class="text-sm text-gray-500">Views</span>
										<span class="text-sm text-gray-900 font-medium flex items-center gap-1">
											<Eye class="w-3 h-3" />
											{listing.view_count}
										</span>
									</div>
								{/if}
							</div>
							
							{#if listing.tags && listing.tags.length > 0}
								<div class="flex flex-wrap gap-1.5 pt-2">
									{#each listing.tags as tag (tag)}
										<Badge variant="secondary" size="sm">
											#{tag}
										</Badge>
									{/each}
								</div>
							{/if}
						</TabsContent>
						
						<TabsContent value="shipping" class="mt-4 space-y-4">
							<div class="space-y-2">
								<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-sm">
									<Truck class="w-5 h-5 text-gray-600 mt-0.5" />
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">Standard Shipping</p>
										<p class="text-sm text-gray-600">3-5 business days</p>
										<p class="text-sm font-medium text-gray-900 mt-1">
											{listing.shipping_cost > 0 ? formatCurrency(listing.shipping_cost) : 'Free'}
										</p>
									</div>
								</div>
								
								<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-sm">
									<RotateCcw class="w-5 h-5 text-gray-600 mt-0.5" />
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">Returns</p>
										<p class="text-sm text-gray-600">30-day return policy</p>
										<p class="text-xs text-gray-500 mt-1">Item must be in original condition</p>
									</div>
								</div>
								
								{#if listing.location_city}
									<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-sm">
										<MapPin class="w-5 h-5 text-gray-600 mt-0.5" />
										<div class="flex-1">
											<p class="text-sm font-medium text-gray-900">Ships from</p>
											<p class="text-sm text-gray-600">{listing.location_city}</p>
										</div>
									</div>
								{/if}
							</div>
						</TabsContent>
						
						<TabsContent value="seller" class="mt-4 space-y-4">
							<div class="flex items-start gap-3">
								{#if listing.seller.avatar_url}
									<Image
										src={listing.seller.avatar_url}
										alt={listing.seller.username}
										class="w-12 h-12 rounded-full"
										objectFit="cover"
										preferredSize="thumb"
									/>
								{:else}
									<div class={cn("w-12 h-12 rounded-full flex items-center justify-center", getAvatarColor(listing.seller.username))}>
										<span class="text-white font-medium">{listing.seller.username.charAt(0).toUpperCase()}</span>
									</div>
								{/if}
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<h3 class="text-sm font-medium text-gray-900">{listing.seller.username}</h3>
										{#if listing.seller.account_type === 'brand'}
											<BrandBadge size="xs" isVerified={listing.seller.is_verified} showText={false} />
										{/if}
									</div>
									<div class="flex items-center gap-3 mt-1 text-sm text-gray-600">
										<span class="flex items-center gap-1">
											<Star class="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
											{listing.seller.rating || 4.8}
										</span>
										<span>•</span>
										<span>{listing.seller.sales_count || 0} sales</span>
										<span>•</span>
										<span>Joined {new Date(listing.seller.created_at || Date.now()).getFullYear()}</span>
									</div>
									<div class="flex gap-2 mt-3">
										<a 
											href="/profile/{listing.seller.username}" 
											class="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-sm text-center text-sm font-medium text-gray-700 transition-colors duration-100"
										>
											View Profile
										</a>
										{#if !isOwner}
											<button 
												class="p-2 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors duration-100"
												onclick={() => goto(`/messages?user=${listing.seller.username}`)}
											>
												<MessageCircle class="w-4 h-4 text-gray-700" />
											</button>
										{/if}
									</div>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	</div>

	<!-- Compact Bottom Bar -->
	<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
		<div class="max-w-7xl mx-auto flex items-center gap-2">
			<div class="flex-1">
				<div class="text-base font-bold text-gray-900">{formatCurrency(listing.price)}</div>
				<div class="text-xs text-gray-500">{listing.shipping_cost > 0 ? `+ ${formatCurrency(listing.shipping_cost)} shipping` : 'Free shipping'}</div>
			</div>
			{#if !isOwner}
				<button
					onclick={handleLike}
					class={cn(
						"p-2.5 rounded-sm transition-all duration-200 transform active:scale-[0.98]",
						isLiked 
							? "bg-red-50 text-red-600 border border-red-200" 
							: "bg-gray-100 text-gray-600 hover:bg-gray-200"
					)}
				>
					<Heart class={cn("w-5 h-5", isLiked && "fill-current")} />
				</button>
				<button
					onclick={handleBuyNow}
					onmouseenter={() => checkoutFlowRef?.preload()}
					onfocus={() => checkoutFlowRef?.preload()}
					class="bg-primary text-white rounded-sm px-4 py-2 font-medium hover:bg-primary/90 transition-all duration-100 transform active:scale-[0.98]"
				>
					Buy Now
				</button>
			{:else}
				<button
					onclick={() => goto(`/listings/${listing.id}/edit`)}
					class="bg-primary text-white rounded-sm px-4 py-2 font-medium hover:bg-primary/90 transition-all duration-100 transform active:scale-[0.98]"
				>
					Edit Listing
				</button>
			{/if}
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background">
		<div class="container mx-auto px-4 py-2 pb-20 max-w-7xl">
			<div class="grid grid-cols-1 lg:grid-cols-[1fr,480px] gap-3">
				<!-- Image skeleton -->
				<div class="space-y-2">
					<div class="relative bg-white rounded-sm  border border-gray-200/60 p-2">
						<div class="aspect-square bg-gray-100 rounded-sm animate-pulse"></div>
					</div>
					<div class="flex gap-1.5">
						{#each Array(4) as _, index (index)}
							<div class="w-12 h-12 bg-gray-100 rounded-sm animate-pulse"></div>
						{/each}
					</div>
				</div>
				
				<!-- Details skeleton -->
				<div class="space-y-3">
					<div class="space-y-2">
						<div class="h-6 w-3/4 bg-gray-100 rounded-sm animate-pulse"></div>
						<div class="h-8 w-24 bg-gray-100 rounded-sm animate-pulse"></div>
						<div class="flex gap-2">
							<div class="h-6 w-16 bg-gray-100 rounded-sm animate-pulse"></div>
							<div class="h-6 w-20 bg-gray-100 rounded-sm animate-pulse"></div>
							<div class="h-6 w-16 bg-gray-100 rounded-sm animate-pulse"></div>
						</div>
						<div class="h-12 w-full bg-gray-100 rounded-sm animate-pulse"></div>
					</div>
					
					<div class="border border-gray-200 rounded-sm p-3">
						<div class="flex items-center gap-2">
							<div class="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div>
							<div class="space-y-1 flex-1">
								<div class="h-3 w-20 bg-gray-100 rounded-sm animate-pulse"></div>
								<div class="h-2 w-16 bg-gray-100 rounded-sm animate-pulse"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Full-screen Gallery -->
{#if showFullscreenGallery}
	<div 
		class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
		transition:fade={{ duration: 200 }}
		onclick={closeFullscreenGallery}
	>
		<div class="relative w-full h-full flex items-center justify-center p-3">
			<!-- Close button -->
			<button
				onclick={closeFullscreenGallery}
				class="absolute top-3 right-3 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
			>
				<X class="w-6 h-6" />
			</button>

			<!-- Image container -->
			<div class="relative max-w-full max-h-full" onclick={(e) => e.stopPropagation()}>
				{#if hasImages && images[currentImageIndex]}
					<Image
						src={images[currentImageIndex]}
						alt={listing.title}
						class="max-w-full max-h-[90vh]"
						objectFit="contain"
						preferredSize="full"
						loading="eager"
						priority={true}
					/>
				{:else}
					<div class="w-full h-full flex items-center justify-center">
						<span class="text-white text-sm">No image available</span>
					</div>
				{/if}

				{#if hasMultipleImages}
					<!-- Navigation buttons -->
					<button
						onclick={(e) => { e.stopPropagation(); prevImage(); }}
						class="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-100"
					>
						<ChevronLeft class="w-6 h-6" />
					</button>
					<button
						onclick={(e) => { e.stopPropagation(); nextImage(); }}
						class="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-100"
					>
						<ChevronRight class="w-6 h-6" />
					</button>
				{/if}
			</div>

			<!-- Thumbnail strip -->
			{#if hasMultipleImages}
				<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
					{#each images as _, index (index)}
						<button
							onclick={(e) => { e.stopPropagation(); currentImageIndex = index; }}
							class={cn("w-12 h-12 rounded-sm overflow-hidden border-2 transition-all",
								index === currentImageIndex ? "border-white" : "border-white/30 opacity-60 hover:opacity-100"
							)}
						>
							<Image 
								src={images[index]} 
								alt="Thumbnail {index + 1}" 
								class="w-full h-full"
								aspectRatio="1/1"
								objectFit="cover"
								preferredSize="thumb"
								loading="eager"
							/>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Checkout Flow -->
{#if listing}
	<LazyCheckoutFlow 
		{listing}
		isOpen={showCheckout}
		onClose={() => showCheckout = false}
		bind:this={checkoutFlowRef}
	/>
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	/* Compact modern styles */
	:global(.compact-shadow) {
		box-shadow: 0 1px 3px rgba(0,0,0,0.04);
	}
	
	/* Hover states */
	:global(.hover-lift) {
		transition: transform 0.2s ease-out;
	}
	:global(.hover-lift:hover) {
		transform: translateY(-1px);
	}
</style>