<script lang="ts">
	import { goto } from '$app/navigation';
	import { User } from 'lucide-svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	import { DropdownMenu, Button } from '$lib/components/ui';
	
	interface Props {
		authContext: ReturnType<typeof getAuthContext>;
		brandSlug?: string | null;
		onSignOut: () => void;
		open?: boolean;
	}
	
	let { authContext, brandSlug = null, onSignOut, open }: Props = $props();
	
	// Badge mapping
	const badgeConfig: Record<string, { emoji: string; label: string }> = {
		brand: { emoji: '🏪', label: 'Brand' },
		top_seller: { emoji: '⭐', label: 'Top Seller' },
		verified: { emoji: '✅', label: 'Verified' },
		power_seller: { emoji: '🔥', label: 'Power Seller' },
		rising_star: { emoji: '🌟', label: 'Rising Star' },
		admin: { emoji: '👑', label: 'Admin' }
	};
</script>

{#if authContext?.user}
	<!-- Profile Header -->
	<DropdownMenu.Item
		onSelect={() => goto(authContext.profile?.username ? `/profile/${authContext.profile.username}` : '/profile')}
		class="flex items-center gap-2 p-2 mb-2 rounded-sm hover:bg-gray-50"
	>
		<div class="relative">
			<img 
				src={authContext.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authContext.profile?.username || authContext.user.email}`} 
				alt="Profile" 
				class="h-8 w-8 rounded-sm object-cover" 
			/>
			{#if authContext.profile?.badges?.length && authContext.profile.badges.length > 0}
				<div class="absolute -bottom-1 -right-1 flex">
					{#each authContext.profile.badges.slice(0, 2) as badge}
						{#if badgeConfig[badge]}
							<span 
								class="text-xs -ml-1 first:ml-0" 
								title={badgeConfig[badge].label}
							>
								{badgeConfig[badge].emoji}
							</span>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
		<div class="flex-1">
			<div class="flex items-center gap-1">
				<p class="text-sm font-medium">{authContext.profile?.username || 'user'}</p>
				{#if authContext.profile?.badges?.length && authContext.profile.badges.length > 2}
					{#each authContext.profile.badges.slice(2) as badge}
						{#if badgeConfig[badge]}
							<span 
								class="text-xs" 
								title={badgeConfig[badge].label}
							>
								{badgeConfig[badge].emoji}
							</span>
						{/if}
					{/each}
				{/if}
			</div>
			<p class="text-xs text-gray-500">View profile</p>
		</div>
	</DropdownMenu.Item>

	<!-- Grid Menu -->
	<div class="grid grid-cols-2 gap-1.5 p-2">
		<DropdownMenu.Item
			onSelect={() => goto('/orders?type=bought')}
			class="flex flex-col items-center gap-1 p-2 rounded-sm bg-gray-50 hover:bg-gray-100 text-center"
		>
			<span class="text-lg">🛍️</span>
			<span class="text-xs">Orders</span>
		</DropdownMenu.Item>
		
		<DropdownMenu.Item
			onSelect={() => goto('/orders?type=sold')}
			class="flex flex-col items-center gap-1 p-2 rounded-sm bg-gray-50 hover:bg-gray-100 text-center"
		>
			<span class="text-lg">💰</span>
			<span class="text-xs">Sales</span>
		</DropdownMenu.Item>
		
		<DropdownMenu.Item
			onSelect={() => goto('/profile/settings')}
			class="flex flex-col items-center gap-1 p-2 rounded-sm bg-gray-50 hover:bg-gray-100 text-center"
		>
			<span class="text-lg">⚙️</span>
			<span class="text-xs">Settings</span>
		</DropdownMenu.Item>
		
		<DropdownMenu.Item
			onSelect={() => goto('/wishlist')}
			class="flex flex-col items-center gap-1 p-2 rounded-sm bg-gray-50 hover:bg-gray-100 text-center"
		>
			<span class="text-lg">❤️</span>
			<span class="text-xs">Wishlist</span>
		</DropdownMenu.Item>
		
		{#if authContext.profile?.account_type === 'brand' && brandSlug}
			<DropdownMenu.Item
				onSelect={() => goto(`/brands/${brandSlug}`)}
				class="flex flex-col items-center gap-1 p-2 rounded-sm bg-gray-50 hover:bg-gray-100 text-center"
			>
				<span class="text-lg">🏪</span>
				<span class="text-xs">Brand</span>
			</DropdownMenu.Item>
			
			<DropdownMenu.Item
				onSelect={() => goto('/brands/analytics')}
				class="flex flex-col items-center gap-1 p-2 rounded-sm bg-gray-50 hover:bg-gray-100 text-center"
			>
				<span class="text-lg">📊</span>
				<span class="text-xs">Analytics</span>
			</DropdownMenu.Item>
		{:else}
			<DropdownMenu.Item
				onSelect={() => goto('/brands/settings')}
				class="flex flex-col items-center gap-1 p-2 rounded-sm bg-amber-50 hover:bg-amber-100 text-center col-span-2"
			>
				<span class="text-lg">✨</span>
				<span class="text-xs">Upgrade to Brand</span>
			</DropdownMenu.Item>
		{/if}
		
		{#if authContext.profile?.is_admin}
			<DropdownMenu.Item
				onSelect={() => goto('/admin')}
				class="flex flex-col items-center gap-1 p-2 rounded-sm bg-purple-50 hover:bg-purple-100 text-center col-span-2"
			>
				<span class="text-lg">👑</span>
				<span class="text-xs text-purple-700">Admin Dashboard</span>
			</DropdownMenu.Item>
		{/if}
	</div>
	
	<!-- Footer -->
	<div class="border-t p-2 space-y-1.5">
		<div class="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-gray-50">
			<span class="text-sm">🌐 Language</span>
			<LanguageSwitcher />
		</div>
		
		<DropdownMenu.Item
			onSelect={onSignOut}
			class="flex items-center justify-center gap-2 py-1.5 rounded-sm hover:bg-red-50 text-red-600"
		>
			<span>🚪</span>
			<span class="text-sm">Sign out</span>
		</DropdownMenu.Item>
	</div>
{:else}
	<!-- Not logged in -->
	<div class="p-4 text-center">
		<span class="text-3xl mb-3 block">👋</span>
		<p class="text-sm font-medium mb-1">Welcome!</p>
		<p class="text-xs text-gray-500 mb-4">Sign in to start shopping</p>
		
		<div class="space-y-2">
			<a
				href="/login"
				class="flex items-center justify-center py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-sm text-sm font-medium cursor-pointer w-full no-underline"
			>
				Sign in
			</a>
			<a
				href="/register"
				class="flex items-center justify-center py-1.5 border border-gray-300 hover:bg-gray-50 rounded-sm text-sm cursor-pointer w-full no-underline"
			>
				Create account
			</a>
		</div>
	</div>
{/if}