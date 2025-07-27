<script>
	import '../app.css';
	import Header from '$lib/components/layout/Header.svelte';
	import MobileNav from '$lib/components/layout/MobileNav.svelte';
	import PromotionalBanner from '$lib/components/layout/PromotionalBanner.svelte';
	import CookieConsent from '$lib/components/cookie-consent/CookieConsent.svelte';
	import { Toaster } from 'svelte-sonner';
	import { setAuthContext } from '$lib/stores/auth-context.svelte.ts';
	import { notifyAuthStateChange } from '$lib/stores/auth-compat';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import { createQueryClient } from '$lib/stores/query-client';
	import NotificationPopup from '$lib/components/NotificationPopup.svelte';
	import { onboarding } from '$lib/stores/onboarding.svelte.ts';
	import { browser, dev } from '$app/environment';
	import { initWebVitals } from '$lib/utils/web-vitals';
	import * as m from '$lib/paraglide/messages.js';

	export let data;

	// Initialize auth context with server-side data
	const authContext = setAuthContext(data.supabase, data.user, data.session);
	
	// Initialize query client
	const queryClient = createQueryClient();
	
	// Track scroll position for landing page
	let showMobileNavOnLanding = false;
	
	// Define pages where bottom nav should be hidden
	const hiddenPaths = [
		'/orders',
		'/wishlist',
		'/checkout',
		'/messages',
		'/settings',
		'/profile/edit'
	];
	
	// Hide mobile nav on specific pages
	$: shouldHideMobileNav = 
		hiddenPaths.some(path => $page.url.pathname.startsWith(path)) || // Hidden paths
		$page.url.pathname.includes('/listings/') || // Product detail pages
		$page.url.pathname.includes('/sell') || // Sell product form
		($page.url.pathname === '/' && !showMobileNavOnLanding) || // Landing page (show when scrolled)
		$page.url.pathname.includes('/payment') || // Payment forms
		$page.url.pathname.includes('/login') || // Login page
		$page.url.pathname.includes('/register'); // Register page
		
	// Check if we're on an auth page
	$: isAuthPage = $page.url.pathname.includes('/login') || $page.url.pathname.includes('/register');

	onMount(() => {
		// Initialize Web Vitals monitoring
		if (browser) {
			initWebVitals({
				sendToAnalytics: (metric) => {
					// In production, send to your analytics service
					if (!dev) {
						// Example: Google Analytics
						// gtag('event', metric.name, {
						//   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
						//   metric_rating: metric.rating,
						//   non_interaction: true
						// });
					}
				},
				sampleRate: dev ? 1 : 0.1, // 100% in dev, 10% in production
				metadata: {
					version: '1.0.0',
					environment: dev ? 'development' : 'production'
				}
			});
		}
		
		// Handle scroll for showing mobile nav on landing page
		const handleScroll = () => {
			if ($page.url.pathname === '/') {
				// Show nav immediately after first scroll
				showMobileNavOnLanding = window.scrollY > 50;
			}
		};
		
		window.addEventListener('scroll', handleScroll);
		
		// Listen for auth changes and update context
		const { data: authListener } = data.supabase.auth.onAuthStateChange(async (event, session) => {
			// Update the auth context directly
			if (event === 'SIGNED_IN' && session?.user) {
				authContext.user = session.user;
				authContext.session = session;
				// Initialize onboarding for new user
				onboarding.initialize(session.user.id);
				// Notify compatibility layer
				notifyAuthStateChange(authContext.user, authContext.session, authContext.profile, authContext.loading);
				// Invalidate to get fresh data
				await invalidate('supabase:auth');
			} else if (event === 'SIGNED_OUT') {
				authContext.user = null;
				authContext.session = null;
				authContext.profile = null;
				// Reset onboarding
				onboarding.reset();
				// Notify compatibility layer
				notifyAuthStateChange(authContext.user, authContext.session, authContext.profile, authContext.loading);
				// Invalidate to clear server-side session
				await invalidate('supabase:auth');
			} else if (event === 'TOKEN_REFRESHED' && session) {
				authContext.session = session;
				// Invalidate to sync with server
				await invalidate('supabase:auth');
			}
		});

		return () => {
			authListener.subscription.unsubscribe();
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-background">
		{#if !isAuthPage}
			{#if !data.user}
				<PromotionalBanner 
					message={m.banner_launch_message()} 
					secondaryMessage={m.banner_launch_secondary()}
					ctaText={m.banner_launch_cta()} 
					ctaHref="/register"
					variant="launch"
					countdown={true}
				/>
			{:else}
				<PromotionalBanner 
					message={m.banner_welcome_message()} 
					ctaText={m.banner_welcome_cta()} 
					ctaHref="/sell"
					variant="gradient"
				/>
			{/if}
			<Header categories={data.categories} supabase={data.supabase} />
		{/if}
		<main class={shouldHideMobileNav ? "pb-0 md:pb-0" : "pb-20 md:pb-0"}>
			<slot />
		</main>
		{#if !shouldHideMobileNav}
			<MobileNav />
		{/if}
	</div>

	<CookieConsent />
	<Toaster richColors position="top-center" />
	<NotificationPopup position="top-right" />
	
	
	<!-- Page transition loading indicator -->
	{#if $navigating}
		<div class="fixed top-0 left-0 right-0 z-[100]">
			<div class="h-1 bg-blue-200">
				<div class="h-full bg-blue-400 animate-pulse" style="animation: loading-bar 1s ease-in-out infinite"></div>
			</div>
		</div>
	{/if}
</QueryClientProvider>

<style>
	@keyframes loading-bar {
		0% {
			width: 0%;
			margin-left: 0%;
		}
		50% {
			width: 70%;
			margin-left: 15%;
		}
		100% {
			width: 0%;
			margin-left: 100%;
		}
	}
</style>

