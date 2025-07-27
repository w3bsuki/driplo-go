<script lang="ts">
	import { cookieConsent } from '$lib/stores/cookie-consent.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Switch from '$lib/components/ui/switch.svelte';
	import { fly } from 'svelte/transition';
	import { X, Cookie, Shield, BarChart, Heart, Settings, Globe } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { setCookie } from '$lib/utils/cookies';

	// Local state for preferences editing
	let localPreferences = $state({
		analytics: cookieConsent.consent.preferences.analytics,
		marketing: cookieConsent.consent.preferences.marketing,
		preferences: cookieConsent.consent.preferences.preferences
	});

	// Language selection state
	let selectedLanguage = $state(getLocale());

	// Update local preferences when store changes
	$effect(() => {
		localPreferences.analytics = cookieConsent.consent.preferences.analytics;
		localPreferences.marketing = cookieConsent.consent.preferences.marketing;
		localPreferences.preferences = cookieConsent.consent.preferences.preferences;
	});

	const cookieCategories = [
		{
			id: 'necessary',
			icon: Shield,
			title: 'Necessary Cookies',
			description: 'Essential for the website to function properly. These cannot be disabled.',
			alwaysOn: true
		},
		{
			id: 'analytics',
			icon: BarChart,
			title: 'Analytics Cookies',
			description: 'Help us understand how visitors interact with our website by collecting anonymous information.'
		},
		{
			id: 'marketing',
			icon: Heart,
			title: 'Marketing Cookies',
			description: 'Used to track visitors across websites to display relevant ads and marketing campaigns.'
		},
		{
			id: 'preferences',
			icon: Settings,
			title: 'Preference Cookies',
			description: 'Allow the website to remember choices you make and provide enhanced features.'
		}
	];

	function handleLanguageChange(lang: string) {
		selectedLanguage = lang as 'en' | 'bg';
		// Save language preference in locale cookie (same as LanguageSwitcher)
		setCookie('locale', lang);
		// Reload page with new language
		const url = new URL(window.location.href);
		if (lang === 'bg') {
			// For Bulgarian, add language prefix
			url.pathname = `/bg${url.pathname.replace(/^\/(en|bg)/, '')}`;
		} else {
			// For English (default), remove language prefix
			url.pathname = url.pathname.replace(/^\/(en|bg)/, '');
		}
		window.location.href = url.toString();
	}

	function handleAcceptAll(event?: MouseEvent) {
		event?.stopPropagation();
		// Save language preference before accepting
		setCookie('locale', selectedLanguage);
		cookieConsent.acceptAll();
		// Apply language if different from current
		if (selectedLanguage !== getLocale()) {
			handleLanguageChange(selectedLanguage);
		}
	}

	function handleRejectAll(event?: MouseEvent) {
		event?.stopPropagation();
		// Save language preference even when rejecting
		setCookie('locale', selectedLanguage);
		cookieConsent.rejectAll();
		// Apply language if different from current
		if (selectedLanguage !== getLocale()) {
			handleLanguageChange(selectedLanguage);
		}
	}

	function handleSavePreferences(event?: MouseEvent) {
		event?.stopPropagation();
		// Save language preference
		setCookie('locale', selectedLanguage);
		cookieConsent.savePreferences(localPreferences);
		// Apply language if different from current
		if (selectedLanguage !== getLocale()) {
			handleLanguageChange(selectedLanguage);
		}
	}

	function handleOpenPreferences(event?: MouseEvent) {
		event?.stopPropagation();
		cookieConsent.openPreferences();
	}

	function handleClosePreferences(event?: MouseEvent) {
		event?.stopPropagation();
		cookieConsent.closePreferences();
	}
</script>

<!-- Cookie Banner -->
{#if cookieConsent.showBanner && !cookieConsent.showPreferences}
	<div
		transition:fly={{ y: 100, duration: 400 }}
		class="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 bg-white border-t-2 border-blue-100 shadow-2xl pointer-events-auto"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="max-w-7xl mx-auto">
			<div class="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
				<div class="flex items-start gap-3">
					<Cookie class="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
					<div class="space-y-2">
						<h3 class="font-semibold text-base text-gray-900">Cookie Consent</h3>
						<p class="text-sm text-gray-600">
							We use cookies to enhance your browsing experience, personalize content, and analyze our traffic. 
							By clicking "Accept All", you consent to our use of cookies.
						</p>
						<!-- Language Selection -->
						<div class="flex items-center gap-2 mt-3">
							<Globe class="w-4 h-4 text-gray-500" />
							<span class="text-sm text-gray-600">Choose language:</span>
							<div class="flex gap-2">
								<button
									onclick={() => selectedLanguage = 'en'}
									class={cn(
										"px-3 py-1 text-sm rounded-md transition-colors",
										selectedLanguage === 'en' 
											? "bg-blue-600 text-white" 
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									)}
								>
									English
								</button>
								<button
									onclick={() => selectedLanguage = 'bg'}
									class={cn(
										"px-3 py-1 text-sm rounded-md transition-colors",
										selectedLanguage === 'bg' 
											? "bg-blue-600 text-white" 
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									)}
								>
									Български
								</button>
							</div>
						</div>
					</div>
				</div>
				<div class="flex flex-col sm:flex-row gap-2">
					<Button onclick={handleRejectAll} variant="outline" size="sm" class="border-gray-300 hover:bg-gray-50">
						Reject All
					</Button>
					<Button onclick={handleOpenPreferences} variant="outline" size="sm" class="border-blue-600 text-blue-600 hover:bg-blue-50">
						Manage Preferences
					</Button>
					<Button onclick={handleAcceptAll} size="sm" class="bg-blue-600 hover:bg-blue-700 text-white">
						Accept All
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Preferences Modal -->
{#if cookieConsent.showPreferences}
	<div class="fixed inset-0 z-[10000] overflow-y-auto">
		<!-- Backdrop -->
		<button
			onclick={handleClosePreferences}
			class="fixed inset-0 bg-black/50 backdrop-blur-sm"
			aria-label="Close preferences"
		/>
		
		<!-- Modal -->
		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="relative min-h-screen flex items-center justify-center p-4"
		>
			<div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
				<!-- Header -->
				<div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Cookie Preferences</h2>
					<button
						onclick={handleClosePreferences}
						class="p-2 hover:bg-gray-100 rounded-md transition-colors"
						aria-label="Close"
					>
						<X class="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<!-- Content -->
				<div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
					<p class="text-sm text-gray-600 mb-6">
						When you visit our website, we may store or retrieve information on your browser, 
						mostly in the form of cookies. This information might be about you, your preferences, 
						or your device and is mostly used to make the site work as you expect it to.
					</p>

					<!-- Language Selection -->
					<div class="mb-6 p-4 bg-blue-50 rounded-lg">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<Globe class="w-5 h-5 text-blue-600" />
								<div>
									<h3 class="font-medium text-gray-900">Language Preference</h3>
									<p class="text-sm text-gray-600">Choose your preferred language</p>
								</div>
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => selectedLanguage = 'en'}
									class={cn(
										"px-4 py-2 text-sm rounded-md transition-colors font-medium",
										selectedLanguage === 'en' 
											? "bg-blue-600 text-white" 
											: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
									)}
								>
									English
								</button>
								<button
									onclick={() => selectedLanguage = 'bg'}
									class={cn(
										"px-4 py-2 text-sm rounded-md transition-colors font-medium",
										selectedLanguage === 'bg' 
											? "bg-blue-600 text-white" 
											: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
									)}
								>
									Български
								</button>
							</div>
						</div>
					</div>

					<div class="space-y-6">
						{#each cookieCategories as category}
							<div class="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
								<div class="flex items-start gap-3 flex-1">
									<svelte:component this={category.icon} class="w-5 h-5 text-blue-600 mt-0.5" />
									<div class="space-y-1">
										<h3 class="font-medium text-gray-900">{category.title}</h3>
										<p class="text-sm text-gray-600">
											{category.description}
										</p>
									</div>
								</div>
								<div class="flex-shrink-0">
									{#if category.alwaysOn}
										<span class="text-sm font-medium text-gray-500">Always On</span>
									{:else}
										<Switch
											bind:checked={localPreferences[category.id as keyof typeof localPreferences]}
											ariaLabel={`Toggle ${category.title}`}
										/>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Footer -->
				<div class="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex flex-col sm:flex-row gap-2 justify-between">
					<Button onclick={handleRejectAll} variant="outline" size="sm" class="border-gray-300 hover:bg-gray-50">
						Reject All
					</Button>
					<div class="flex gap-2">
						<Button onclick={handleClosePreferences} variant="outline" size="sm" class="border-gray-300 hover:bg-gray-50">
							Cancel
						</Button>
						<Button onclick={handleSavePreferences} size="sm" class="bg-blue-600 hover:bg-blue-700 text-white">
							Save Preferences
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}