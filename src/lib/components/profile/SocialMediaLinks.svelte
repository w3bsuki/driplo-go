<script lang="ts">
	import { Instagram, Globe, Link2, ShoppingBag } from 'lucide-svelte';
	import type { Database } from '$lib/types/database.types';
	import type { ExtendedProfile } from '$lib/types/database.extended';

	type Profile = ExtendedProfile;
	type SocialMediaAccount = Database['public']['Tables']['social_media_accounts']['Row'];

	interface Props {
		profile: Profile;
		socialAccounts?: SocialMediaAccount[];
	}

	let { profile, socialAccounts = [] }: Props = $props();

	const platformIcons: Record<string, any> = {
		instagram: Instagram,
		tiktok: ShoppingBag, // Using ShoppingBag as placeholder for TikTok
		facebook: Globe,
		twitter: Link2,
		youtube: Globe,
		pinterest: ShoppingBag,
		website: Globe
	};

	const platformColors: Record<string, string> = {
		instagram: 'from-purple-500 to-pink-500',
		tiktok: 'from-gray-900 to-gray-700',
		facebook: 'from-blue-600 to-blue-500',
		twitter: 'from-sky-500 to-sky-400',
		youtube: 'from-red-600 to-red-500',
		pinterest: 'from-red-700 to-red-600',
		website: 'from-gray-600 to-gray-500'
	};

	function getPlatformIcon(platform: string) {
		return platformIcons[platform] || Globe;
	}

	function getPlatformColor(platform: string) {
		return platformColors[platform] || 'from-gray-600 to-gray-500';
	}

	function formatUsername(username: string, platform: string): string {
		// Remove @ if present
		let formatted = username.replace('@', '');
		
		// Add @ for social platforms
		if (['instagram', 'tiktok', 'twitter'].includes(platform)) {
			return `@${formatted}`;
		}
		
		return formatted;
	}

	// Get brand social links from profile
	const brandSocialLinks = $derived.by(() => {
		if (!profile.account_type || profile.account_type !== 'brand') return [];
		
		const links = [];
		
		if (profile.brand_instagram) {
			links.push({
				platform: 'instagram',
				username: profile.brand_instagram,
				url: `https://instagram.com/${profile.brand_instagram.replace('@', '')}`
			});
		}
		
		if (profile.brand_facebook) {
			links.push({
				platform: 'facebook',
				username: profile.brand_facebook,
				url: `https://facebook.com/${profile.brand_facebook}`
			});
		}
		
		if (profile.brand_website) {
			links.push({
				platform: 'website',
				username: new URL(profile.brand_website).hostname,
				url: profile.brand_website
			});
		}
		
		return links;
	});

	// Combine all social links
	const allSocialLinks = $derived([
		...socialAccounts.map(acc => ({
			platform: acc.platform,
			username: acc.username,
			url: acc.url || '#',
			isVerified: acc.is_verified
		})),
		...brandSocialLinks
	]);
</script>

{#if allSocialLinks.length > 0}
	<div class="mt-6 space-y-3">
		<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">Connect</h3>
		
		<div class="flex flex-wrap gap-2">
			{#each allSocialLinks as link}
				<a
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
					class="group relative flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 
						hover:shadow-md transition-all duration-200 hover:scale-105"
				>
					<!-- Gradient background on hover -->
					<div class="absolute inset-0 rounded-full bg-gradient-to-r {getPlatformColor(link.platform)} 
						opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
					
					<!-- Content -->
					<div class="relative flex items-center gap-2">
						<svelte:component 
							this={getPlatformIcon(link.platform)} 
							class="w-4 h-4 text-gray-700 group-hover:text-white transition-colors"
						/>
						<span class="text-sm font-medium text-gray-700 group-hover:text-white transition-colors">
							{formatUsername(link.username, link.platform)}
						</span>
						{#if link.isVerified}
							<div class="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
								<svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</div>
{/if}

{#if profile.account_type === 'brand' && profile.brand_description}
	<div class="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
		<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">About</h3>
		<p class="text-sm text-gray-700 leading-relaxed">{profile.brand_description}</p>
		
		{#if profile.brand_values && profile.brand_values.length > 0}
			<div class="mt-3 flex flex-wrap gap-2">
				{#each profile.brand_values as value}
					<span class="px-3 py-1 bg-white/70 rounded-full text-xs font-medium text-purple-700">
						{value}
					</span>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Smooth hover transitions */
	a {
		@apply transform-gpu;
	}
</style>