<script lang="ts">
	import { CheckCircle, Sparkles, Package, Camera, Shield, TrendingUp, Users, MessageCircle, ExternalLink } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import Confetti from '$lib/components/ui/Confetti.svelte';
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
	
	const brandProfile = $derived(data.brandProfile);
	const profile = $derived(data.profile);
	
	const nextSteps = [
		{
			icon: Package,
			title: 'List Your Products',
			description: 'Start adding your products to your brand catalog',
			action: 'Create Listing',
			href: '/sell',
			completed: false
		},
		{
			icon: Camera,
			title: 'Complete Your Profile',
			description: 'Add more photos and details to your brand page',
			action: 'Edit Profile',
			href: '/brands/settings',
			completed: brandProfile.brand_logo_url && brandProfile.brand_cover_url
		},
		{
			icon: Shield,
			title: 'Get Verified',
			description: 'Apply for brand verification to build trust',
			action: 'Apply Now',
			href: '/brands/settings?tab=verification',
			completed: profile.is_verified
		},
		{
			icon: Users,
			title: 'Build Your Audience',
			description: 'Share your brand page to attract followers',
			action: 'View Profile',
			href: `/brands/${brandProfile.brand_slug}`,
			completed: false
		}
	];
	
	const brandBenefits = [
		{
			icon: TrendingUp,
			title: 'Analytics Dashboard',
			description: 'Track your sales, views, and customer insights'
		},
		{
			icon: Shield,
			title: 'Verified Badge',
			description: 'Build trust with verification badge (after approval)'
		},
		{
			icon: Users,
			title: 'Brand Storefront',
			description: 'Professional brand page to showcase your products'
		},
		{
			icon: MessageCircle,
			title: 'Priority Support',
			description: 'Get faster response times from our support team'
		}
	];
	
	function handleShare() {
		const brandUrl = `${window.location.origin}/brands/${brandProfile.brand_slug}`;
		
		if (navigator.share) {
			navigator.share({
				title: brandProfile.brand_name,
				text: `Check out ${brandProfile.brand_name} on Driplo!`,
				url: brandUrl
			});
		} else {
			// Fallback to copying to clipboard
			navigator.clipboard.writeText(brandUrl);
			// You might want to show a toast here
		}
	}
</script>

<svelte:head>
	<title>Welcome to Driplo Brands | {brandProfile.brand_name}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
	<Confetti />
	
	<div class="max-w-6xl mx-auto px-4 py-8">
		<!-- Success Header -->
		<div class="text-center mb-12">
			<div class="relative inline-block mb-6">
				{#if brandProfile.brand_logo_url}
					<img 
						src={brandProfile.brand_logo_url} 
						alt="{brandProfile.brand_name} logo"
						class="w-32 h-32 rounded-2xl object-cover shadow-xl"
					/>
				{:else}
					<div class="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center shadow-xl">
						<Sparkles class="w-16 h-16 text-purple-600" />
					</div>
				{/if}
				<div class="absolute -bottom-3 -right-3 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
					<CheckCircle class="w-8 h-8 text-white" />
				</div>
			</div>
			
			<h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
				Welcome to Driplo Brands! 🎉
			</h1>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto">
				Congratulations! <span class="font-semibold">{brandProfile.brand_name}</span> is now a professional brand on Driplo.
			</p>
		</div>
		
		<!-- Brand URL Card -->
		<div class="max-w-2xl mx-auto mb-12">
			<div class="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
				<div class="flex items-center justify-between gap-4">
					<div class="flex-1">
						<p class="text-sm text-gray-600 mb-2">Your brand page is live at:</p>
						<div class="flex items-center gap-2">
							<code class="text-purple-600 font-mono text-sm bg-purple-50 px-3 py-1 rounded">
								driplo.com/brands/{brandProfile.brand_slug}
							</code>
						</div>
					</div>
					<div class="flex gap-2">
						<button
							onclick={handleShare}
							class="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
						>
							Share
						</button>
						<a
							href="/brands/{brandProfile.brand_slug}"
							class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center gap-2"
						>
							View Profile
							<ExternalLink class="w-4 h-4" />
						</a>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Two Column Layout -->
		<div class="grid lg:grid-cols-2 gap-8 mb-12">
			<!-- Next Steps -->
			<div class="bg-white rounded-2xl shadow-lg p-8">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">Next Steps</h2>
				<div class="space-y-4">
					{#each nextSteps as step}
						<div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors {step.completed ? 'opacity-60' : ''}">
							<div class="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<svelte:component this={step.icon} class="w-6 h-6 text-purple-600" />
							</div>
							<div class="flex-1">
								<div class="flex items-start justify-between">
									<div>
										<h3 class="font-semibold text-gray-900 mb-1">
											{step.title}
											{#if step.completed}
												<span class="inline-flex items-center gap-1 ml-2 text-green-600 text-sm">
													<CheckCircle class="w-4 h-4" />
													Done
												</span>
											{/if}
										</h3>
										<p class="text-sm text-gray-600">{step.description}</p>
									</div>
									{#if !step.completed}
										<a
											href={step.href}
											class="ml-4 text-purple-600 hover:text-purple-700 font-medium text-sm whitespace-nowrap"
										>
											{step.action} →
										</a>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
			
			<!-- Brand Benefits -->
			<div class="bg-white rounded-2xl shadow-lg p-8">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">Your Brand Benefits</h2>
				<div class="space-y-4">
					{#each brandBenefits as benefit}
						<div class="flex gap-4 p-4">
							<div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<svelte:component this={benefit.icon} class="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
								<p class="text-sm text-gray-600">{benefit.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
		
		<!-- Tips Section -->
		<div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
			<h2 class="text-2xl font-bold mb-4">Pro Tips for Brand Success</h2>
			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<h3 class="font-semibold mb-2">📸 Quality Photos</h3>
					<p class="text-purple-100 text-sm">
						Use high-quality product photos with consistent styling to build a professional brand image.
					</p>
				</div>
				<div>
					<h3 class="font-semibold mb-2">📝 Detailed Descriptions</h3>
					<p class="text-purple-100 text-sm">
						Write detailed product descriptions that tell your brand story and highlight unique features.
					</p>
				</div>
				<div>
					<h3 class="font-semibold mb-2">💬 Engage Customers</h3>
					<p class="text-purple-100 text-sm">
						Respond quickly to messages and reviews to build trust and loyalty with your customers.
					</p>
				</div>
				<div>
					<h3 class="font-semibold mb-2">🎯 Consistent Branding</h3>
					<p class="text-purple-100 text-sm">
						Maintain consistent branding across all your listings, social media, and communications.
					</p>
				</div>
			</div>
		</div>
		
		<!-- CTA Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center mt-12">
			<a
				href="/brands/{brandProfile.brand_slug}"
				class="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg text-center"
			>
				View Your Brand Profile
			</a>
			<a
				href="/sell"
				class="px-8 py-4 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-lg border border-gray-200 text-center"
			>
				Start Listing Products
			</a>
		</div>
	</div>
</div>