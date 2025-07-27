<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import MobileFiltersDrawer from './MobileFiltersDrawer.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { logger } from '$lib/services/logger';
	
	interface Props {
		class?: string;
	}
	
	let { class: className = '' }: Props = $props();
	
	let showFilters = $state(false);
	
	// Define pages where bottom nav should be hidden
	const HIDDEN_PATHS = [
		'/orders',
		'/wishlist',
		'/checkout',
		'/messages',
		'/settings',
		'/profile/edit',
		'/onboarding'
	] as const;
	
	// Derived state
	const isVisible = $derived(!HIDDEN_PATHS.some(path => $page.url.pathname.startsWith(path)));
	
	// Types
	interface NavItem {
		href: string;
		emoji: string;
		label: string;
		isAction?: boolean;
		isPrimary?: boolean;
		ariaLabel?: string;
	}
	
	// Navigation items with proper aria labels
	const navItems: NavItem[] = [
		{ 
			href: '#filters', 
			emoji: '⚙️', 
			label: m.nav_filters(), 
			isAction: true,
			ariaLabel: 'Open filters'
		},
		{ 
			href: '/browse', 
			emoji: '💰', 
			label: m.nav_shop(),
			ariaLabel: 'Go to shop'
		},
		{ 
			href: '/sell', 
			emoji: '➕', 
			label: m.nav_sell(), 
			isPrimary: true,
			ariaLabel: 'Sell item'
		},
		{ 
			href: '/wishlist', 
			emoji: '❤️', 
			label: m.nav_wishlist(),
			ariaLabel: 'View wishlist'
		},
		{ 
			href: '/leaderboard', 
			emoji: '⭐', 
			label: m.nav_sellers(),
			ariaLabel: 'View sellers'
		}
	];
	
	function handleNavClick(item: NavItem) {
		try {
			if (item.isAction && item.href === '#filters') {
				showFilters = true;
			}
		} catch (error) {
			logger.error('Navigation error:', error);
		}
	}
	
	function isActive(item: NavItem): boolean {
		if (item.isAction) return false;
		return $page.url.pathname === item.href;
	}
</script>

{#if isVisible}
<nav 
	class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden safe-area-pb {className}"
	role="navigation"
	aria-label="Mobile navigation"
>
	<div class="grid grid-cols-5">
		{#each navItems as item (item.href)}
			{#if item.isPrimary}
				<!-- Primary Sell Button -->
				<a
					href={item.href}
					class="flex items-center justify-center py-2"
					aria-label={item.ariaLabel}
				>
					<div class="relative">
						<div class="absolute inset-0 bg-gray-900 rounded-full blur-lg opacity-20"></div>
						<div class="relative flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg transform transition-all duration-200 active:scale-95">
							<span class="text-2xl font-bold" aria-hidden="true">+</span>
						</div>
					</div>
				</a>
			{:else if item.isAction}
				<!-- Filter Action -->
				<button
					onclick={() => handleNavClick(item)}
					class="flex flex-col items-center justify-center gap-1 py-2 px-2 text-gray-600 transition-colors duration-200 active:scale-95"
					aria-label={item.ariaLabel}
					type="button"
				>
					<span class="text-xl" aria-hidden="true">{item.emoji}</span>
					<span class="text-xs font-medium">{item.label}</span>
				</button>
			{:else}
				<!-- Regular Navigation -->
				<a
					href={item.href}
					class="flex flex-col items-center justify-center gap-1 py-2 px-2 transition-all duration-200 active:scale-95 {isActive(item) ? 'text-blue-600' : 'text-gray-600'}"
					aria-label={item.ariaLabel}
					aria-current={isActive(item) ? 'page' : undefined}
				>
					<div class="relative">
						<span class="text-xl {isActive(item) ? 'scale-110' : ''}" aria-hidden="true">{item.emoji}</span>
						{#if isActive(item)}
							<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" aria-hidden="true"></div>
						{/if}
					</div>
					<span class="text-xs font-medium {isActive(item) ? 'font-semibold' : ''}">{item.label}</span>
				</a>
			{/if}
		{/each}
	</div>
</nav>
{/if}

<MobileFiltersDrawer isOpen={showFilters} onClose={() => showFilters = false} />

<style>
	/* Safe area padding for iOS devices */
	.safe-area-pb {
		padding-bottom: env(safe-area-inset-bottom, 0);
	}
</style>