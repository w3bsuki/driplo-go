<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/cn';
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
	class={cn(
		"fixed bottom-0 left-0 right-0 z-50",
		"bg-background border-t border-border shadow-lg",
		"md:hidden safe-area-pb",
		className
	)}
	role="navigation"
	aria-label="Mobile navigation"
>
	<div class="grid grid-cols-5">
		{#each navItems as item (item.href)}
			{#if item.isPrimary}
				<!-- Primary Sell Button with proper touch target -->
				<a
					href={item.href}
					class="flex items-center justify-center min-h-[60px] py-2"
					aria-label={item.ariaLabel}
				>
					<div class="relative">
						<div class="absolute inset-0 bg-foreground rounded-full blur-lg opacity-20"></div>
						<div class="relative flex items-center justify-center w-[48px] h-[48px] bg-foreground text-background rounded-full shadow-lg transform transition-all duration-200 active:scale-95 will-change-transform">
							<span class="text-2xl font-bold" aria-hidden="true">+</span>
						</div>
					</div>
				</a>
			{:else if item.isAction}
				<!-- Filter Action with proper touch target -->
				<button
					onclick={() => handleNavClick(item)}
					class={cn(
						"flex flex-col items-center justify-center gap-1",
						"min-h-[60px] py-2 px-2",
						"text-muted-foreground transition-colors duration-200",
						"active:scale-95 will-change-transform",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
					)}
					aria-label={item.ariaLabel}
					type="button"
				>
					<span class="text-xl" aria-hidden="true">{item.emoji}</span>
					<span class="text-xs font-medium">{item.label}</span>
				</button>
			{:else}
				<!-- Regular Navigation with proper touch target -->
				<a
					href={item.href}
					class={cn(
						"flex flex-col items-center justify-center gap-1",
						"min-h-[60px] py-2 px-2",
						"transition-all duration-200 active:scale-95 will-change-transform",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
						isActive(item) ? 'text-brand-500' : 'text-muted-foreground'
					)}
					aria-label={item.ariaLabel}
					aria-current={isActive(item) ? 'page' : undefined}
				>
					<div class="relative">
						<span class="text-xl {isActive(item) ? 'scale-110' : ''}" aria-hidden="true">{item.emoji}</span>
						{#if isActive(item)}
							<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" aria-hidden="true"></div>
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
	
	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.safe-area-pb {
			background-color: var(--background);
		}
	}
	
	/* GPU acceleration for better performance */
	@supports (transform: translateZ(0)) {
		nav {
			transform: translateZ(0);
			backface-visibility: hidden;
		}
	}
</style>