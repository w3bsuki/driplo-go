<script lang="ts">
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	import { onDestroy } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import DriploLogo from '$lib/components/ui/DriploLogo.svelte';
	import SearchBar from './SearchBar.svelte';
	import DesktopNav from './DesktopNav.svelte';
	import MobileActions from './MobileActions.svelte';
	import { useNotifications } from './hooks/useNotifications';
	import type { HeaderProps } from '$lib/types/components';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Database } from '$lib/types/database';

	type Props = Omit<HeaderProps, 'supabase'> & {
		supabase: SupabaseClient<Database>;
	};

	let {
		supabase,
		user = null,
		enableSearch = true,
		showUnreadCount = true,
		sticky = true,
		class: className = ''
	}: Props = $props();

	const authContext = getAuthContext();

	// Single source of truth for Supabase client
	const effectiveSupabase = $derived(authContext?.supabase ?? supabase);

	// Initialize notifications with enhanced error handling and context updates
	const notifications = useNotifications(effectiveSupabase, authContext?.user?.id);

	// Brand slug state with comprehensive error handling
	let brandSlug = $state<string | null>(null);
	let brandSlugFetched = $state(false);
	let brandSlugError = $state<string | null>(null);
	let brandSlugLoading = $state(false);

	// Derived state to determine when brand slug should be fetched
	const shouldFetchBrandSlug = $derived(
		authContext?.profile?.account_type === 'brand' &&
		authContext.user?.id &&
		!brandSlugFetched &&
		!brandSlugLoading &&
		!brandSlugError
	);

	// Effect for fetching brand slug with proper error handling and caching
	$effect(async () => {
		if (!shouldFetchBrandSlug) return;

		brandSlugLoading = true;
		brandSlugError = null;

		try {
			const { data, error } = await effectiveSupabase
				.from('brand_profiles')
				.select('brand_slug')
				.eq('user_id', authContext.user!.id)
				.single();

			if (error) {
				// Handle specific error cases
				if (error.code === 'PGRST116') {
					// No brand profile found - this is expected for new brand accounts
					brandSlugError = 'No brand profile found';
				} else {
					brandSlugError = `Database error: ${error.message}`;
					console.error('Brand slug fetch error:', error);
				}
			} else if (data?.brand_slug) {
				brandSlug = data.brand_slug;
			} else {
				brandSlugError = 'Brand slug not available';
			}
		} catch (error) {
			brandSlugError = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error('Failed to fetch brand slug:', error);
		} finally {
			brandSlugFetched = true;
			brandSlugLoading = false;
		}
	});

	// Reset brand slug state when user logs out or changes
	$effect(() => {
		const currentUserId = authContext?.user?.id;
		if (!currentUserId) {
			// User logged out - reset all brand slug state
			brandSlug = null;
			brandSlugFetched = false;
			brandSlugError = null;
			brandSlugLoading = false;
		}
	});

	// Debounced notifications management to prevent rapid reinitializations
	let notificationTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		// Clear any pending notification updates
		if (notificationTimeout) {
			clearTimeout(notificationTimeout);
		}

		if (authContext?.user) {
			// Debounce notifications initialization to prevent rapid toggling
			notificationTimeout = setTimeout(() => {
				notifications.updateContext(effectiveSupabase, authContext.user!.id);
				notifications.initialize();
			}, 100);
		} else {
			// Immediate cleanup when user logs out
			notifications.cleanup();
		}
	});

	// Enhanced sign out handler with proper error handling
	function handleSignOut(): void {
		try {
			// Clear any pending notification timeouts
			if (notificationTimeout) {
				clearTimeout(notificationTimeout);
				notificationTimeout = null;
			}
			
			// Perform sign out
			authContext?.signOut?.();
		} catch (error) {
			console.error('Sign out error:', error);
			// Still attempt cleanup even if sign out fails
			notifications.cleanup();
		}
	}

	// Component cleanup
	onDestroy(() => {
		if (notificationTimeout) {
			clearTimeout(notificationTimeout);
		}
		notifications.cleanup();
	});
</script>

<header 
	class={cn(
		'z-50 w-full border-b border-border bg-background',
		sticky && 'sticky top-0',
		'safe-area-pt',
		className
	)}
	role="banner"
>
	<div class="w-full flex items-center gap-2 px-4 md:container md:px-6 header-container">
		<!-- Logo with improved touch target -->
		<a 
			href="/" 
			class="flex items-center min-h-[44px] min-w-[44px] p-2 -m-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" 
			aria-label="Driplo Home"
		>
			<DriploLogo size="sm" className="md:hidden" />
			<DriploLogo size="md" className="hidden md:flex" />
		</a>
		
		<!-- Mobile Actions -->
		<MobileActions 
			{authContext} 
			{brandSlug} 
			onSignOut={handleSignOut}
			{showUnreadCount}
		/>

		<!-- Desktop Search Bar -->
		{#if enableSearch}
			<SearchBar class="hidden md:block flex-1 max-w-2xl mx-4" />
		{/if}

		<!-- Desktop Actions -->
		<DesktopNav
			{authContext}
			{brandSlug}
			onSignOut={handleSignOut}
			{showUnreadCount}
		/>
	</div>
</header>

<style>
	/* iOS safe area padding */
	.safe-area-pt {
		padding-top: env(safe-area-inset-top, 0);
	}
	
	/* Header sizing - mobile-first approach */
	:global(.header-container) {
		height: 56px; /* Standard mobile header height */
		padding-top: 8px;
		padding-bottom: 8px;
		/* Optimize rendering with single composite layer */
		transform: translate3d(0, 0, 0);
	}
	
	@media (min-width: 768px) {
		:global(.header-container) {
			height: 64px; /* Compact for desktop */
			padding: 8px 0;
		}
	}

	/* Modern 2025 navigation animations with optimized GPU acceleration */
	@media (hover: hover) and (pointer: fine) {
		/* Enhance interactive elements with spring physics */
		header a:hover {
			transform: translateY(-1px) translateZ(0);
			transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
			will-change: transform;
		}

		header a:not(:hover) {
			will-change: auto; /* Reset will-change when not hovering */
		}
	}

	/* Touch devices get scale feedback with optimized GPU acceleration */
	@media (hover: none) and (pointer: coarse) {
		header a:active, 
		header button:active {
			transform: scale(0.95) translateZ(0);
			transition: transform 100ms ease-out;
			will-change: transform;
		}

		header a:not(:active), 
		header button:not(:active) {
			will-change: auto; /* Reset will-change when not active */
		}
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		header *,
		header *::before,
		header *::after {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
			will-change: auto !important;
		}
	}
	
	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.safe-area-pt {
			background-color: var(--background);
		}
	}
</style>