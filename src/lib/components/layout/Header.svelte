<script lang="ts">
	import { User, ChevronDown } from 'lucide-svelte';
	import { DropdownMenu } from '$lib/components/ui';
	import { goto } from '$app/navigation';
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	import { unreadCount, initializeUnreadCount, subscribeToUnreadUpdates, unsubscribeFromUnreadUpdates } from '$lib/stores/messages';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Database } from '$lib/types/database.types';
	import * as m from '$lib/paraglide/messages.js';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import DriploLogo from '$lib/components/ui/DriploLogo.svelte';
	import ProfileDropdownContent from './ProfileDropdownContent.svelte';
	import { onMount, onDestroy } from 'svelte';
	
	interface Props {
		supabase: SupabaseClient<Database>;
	}
	
	let { supabase }: Props = $props();
	
	let searchQuery = $state('');
	
	const authContext = getAuthContext();

	// Initialize unread count and real-time subscriptions
	onMount(() => {
		if (authContext?.user) {
			initializeUnreadCount();
			subscribeToUnreadUpdates(authContext.user.id, supabase);
		}
	});

	onDestroy(() => {
		unsubscribeFromUnreadUpdates(supabase);
	});

	// Re-initialize when user changes
	$effect(() => {
		if (authContext?.user) {
			initializeUnreadCount();
			subscribeToUnreadUpdates(authContext.user.id, supabase);
		}
	});
	
	// Cache brand slug
	let brandSlug = $state<string | null>(null);
	
	$effect(async () => {
		if (authContext?.profile?.account_type === 'brand' && authContext.user?.id) {
			const { data } = await authContext.supabase
				.from('brand_profiles')
				.select('brand_slug')
				.eq('user_id', authContext.user.id)
				.single();
			brandSlug = data?.brand_slug || null;
		}
	});

	function handleSearch() {
		if (searchQuery.trim()) {
			goto(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
		} else {
			goto('/browse');
		}
	}

	function handleSignOut() {
		authContext?.signOut?.();
	}
	
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

<header class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
	<div class="container flex h-14 md:h-16 items-center gap-3 px-4">
		<!-- Logo -->
		<a href="/" class="flex items-center" aria-label="Driplo Home">
			<DriploLogo size="sm" className="md:hidden" />
			<DriploLogo size="md" className="hidden md:flex" />
		</a>
		
		<!-- Mobile Actions -->
		<div class="flex items-center gap-2 ml-auto md:hidden">
			{#if authContext?.user}
				<a 
					href="/messages" 
					class="relative h-10 w-10 flex items-center justify-center rounded-md hover:bg-gray-50 transition-colors duration-fast"
					aria-label="Messages"
				>
					<span class="text-xl">💬</span>
					{#if $unreadCount > 0}
						<span class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
							{$unreadCount > 9 ? '9+' : $unreadCount}
						</span>
					{/if}
				</a>
			{/if}
			
			<!-- Profile Dropdown -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="relative rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					aria-label="Account menu"
				>
					{#if authContext?.user}
						<img 
							src={authContext.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authContext.profile?.username || authContext.user.email}`} 
							alt="Profile" 
							width="40"
							height="40"
							class="h-10 w-10 rounded-md object-cover border border-gray-200 hover:border-gray-300 transition-colors duration-fast" 
						/>
						{#if authContext.profile?.badges?.length && authContext.profile.badges.length > 0}
							<div class="absolute -top-1 -right-1 bg-white rounded-md px-1 border border-gray-200">
								<span class="text-xs" title={badgeConfig[authContext.profile.badges[0]]?.label}>
									{badgeConfig[authContext.profile.badges[0]]?.emoji}
								</span>
							</div>
						{/if}
					{:else}
						<div class="h-10 w-10 rounded-md bg-gray-50 flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors duration-fast">
							<User class="h-5 w-5 text-gray-600" />
						</div>
					{/if}
					<div class="absolute -bottom-1 -right-1 bg-white rounded-md p-0.5 border border-gray-200">
						<ChevronDown class="h-3.5 w-3.5 text-gray-600" />
					</div>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content 
					align="end" 
					sideOffset={8}
					class="w-72 rounded-lg border border-gray-200 bg-white p-0 shadow-lg"
				>
					<ProfileDropdownContent {authContext} {brandSlug} onSignOut={handleSignOut} />
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<!-- Desktop Search Bar -->
		<div class="hidden md:block flex-1 max-w-2xl mx-4">
			<div class="relative">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
				<input
					type="search"
					placeholder={m.header_search_placeholder()}
					bind:value={searchQuery}
					onkeydown={(e) => e.key === 'Enter' && handleSearch()}
					class="w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 h-10 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-fast"
				/>
			</div>
		</div>

		<!-- Desktop Actions -->
		<div class="hidden md:flex items-center gap-2">
			<LanguageSwitcher />
			<a href="/wishlist" class="p-2.5 rounded-md hover:bg-gray-50 transition-colors duration-fast">
				<span class="text-xl">❤️</span>
				<span class="sr-only">{m.header_favorites()}</span>
			</a>
			<a href="/orders" class="p-2.5 rounded-md hover:bg-gray-50 transition-colors duration-fast">
				<span class="text-xl">🛍️</span>
				<span class="sr-only">Orders</span>
			</a>
			<a href="/messages" class="relative p-2.5 rounded-md hover:bg-gray-50 transition-colors duration-fast">
				<span class="text-xl">💬</span>
				{#if $unreadCount > 0}
					<span class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
						{$unreadCount > 99 ? '99+' : $unreadCount}
					</span>
				{/if}
				<span class="sr-only">{m.header_messages()}</span>
			</a>
			
			<!-- Desktop Profile -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="relative rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					aria-label="Account menu"
				>
					{#if authContext?.user}
						<img 
							src={authContext.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authContext.profile?.username || authContext.user.email}`} 
							alt="Profile" 
							class="h-10 w-10 rounded-md object-cover border border-gray-200 hover:border-gray-300 transition-colors duration-fast" 
						/>
						{#if authContext.profile?.badges?.length && authContext.profile.badges.length > 0}
							<div class="absolute -top-1 -right-1 bg-white rounded-md px-1 border border-gray-200">
								<span class="text-xs" title={badgeConfig[authContext.profile.badges[0]]?.label}>
									{badgeConfig[authContext.profile.badges[0]]?.emoji}
								</span>
							</div>
						{/if}
					{:else}
						<div class="h-10 w-10 rounded-md bg-gray-50 flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors duration-fast">
							<User class="h-5 w-5 text-gray-600" />
						</div>
					{/if}
					<div class="absolute -bottom-1 -right-1 bg-white rounded-md p-0.5 border border-gray-200">
						<ChevronDown class="h-3.5 w-3.5 text-gray-600" />
					</div>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content 
					align="end" 
					sideOffset={8}
					class="w-72 rounded-lg border border-gray-200 bg-white p-0 shadow-lg"
				>
					<ProfileDropdownContent {authContext} {brandSlug} onSignOut={handleSignOut} />
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</header>