<script lang="ts">
	import { X } from 'lucide-svelte';
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils/cn';
	
	/**
	 * Promotional banner component with dismissible functionality
	 * Supports multiple variants and call-to-action buttons
	 */
	
	// Constants
	const STORAGE_KEY = 'banner-dismissed';
	const DISMISSAL_DURATION_DAYS = 7;
	const MS_PER_DAY = 1000 * 60 * 60 * 24;
	
	const bannerVariants = cva(
		'relative text-center py-2 px-3 text-xs md:text-sm font-medium transition-colors',
		{
			variants: {
				variant: {
					default: 'bg-surface-secondary text-text-primary border-b border-border-primary',
					gradient: 'bg-gray-900 text-white dark:bg-gray-950 dark:text-gray-50',
					launch: 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
				}
			},
			defaultVariants: {
				variant: 'gradient'
			}
		}
	);
	
	const ctaVariants = cva(
		'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
		{
			variants: {
				variant: {
					default: 'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500',
					gradient: 'bg-white text-gray-900 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 focus-visible:ring-white',
					launch: 'bg-brand-500/20 text-brand-600 hover:bg-brand-500/30 dark:bg-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/40 focus-visible:ring-brand-500'
				}
			},
			defaultVariants: {
				variant: 'gradient'
			}
		}
	);
	
	const dismissButtonVariants = cva(
		'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
		{
			variants: {
				variant: {
					default: 'hover:bg-surface-hover text-text-secondary hover:text-text-primary focus-visible:ring-brand-500',
					gradient: 'hover:bg-white/10 text-white/70 hover:text-white dark:hover:bg-white/20 focus-visible:ring-white',
					launch: 'hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 dark:hover:bg-brand-500/30 focus-visible:ring-brand-500'
				}
			},
			defaultVariants: {
				variant: 'gradient'
			}
		}
	);
	
	type BannerVariantProps = VariantProps<typeof bannerVariants>;
	
	export interface PromotionalBannerProps extends BannerVariantProps {
		/**
		 * The message to display in the banner
		 */
		message: string;
		/**
		 * Optional secondary message to display
		 */
		secondaryMessage?: string;
		/**
		 * Optional call-to-action button text
		 */
		ctaText?: string;
		/**
		 * Optional call-to-action button link
		 */
		ctaHref?: string;
		/**
		 * Whether the banner can be dismissed
		 * @default true
		 */
		dismissible?: boolean;
		/**
		 * Whether to show countdown functionality (currently unused but accepted for compatibility)
		 * @default false
		 */
		countdown?: boolean;
		/**
		 * Callback function when banner is dismissed
		 */
		onDismiss?: () => void;
		/**
		 * Additional CSS classes
		 */
		class?: string;
	}
	
	let { 
		message,
		secondaryMessage,
		ctaText, 
		ctaHref, 
		dismissible = true,
		countdown = false,
		variant = 'gradient',
		onDismiss,
		class: className = ''
	}: PromotionalBannerProps = $props();
	
	// Utility functions
	function getStorageItem(key: string): string | null {
		if (typeof window === 'undefined') return null;
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	}
	
	function setStorageItem(key: string, value: string): void {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(key, value);
		} catch {
			// Silently fail
		}
	}
	
	function shouldShowBanner(): boolean {
		if (!dismissible) return true;
		
		const dismissedAt = getStorageItem(STORAGE_KEY);
		if (!dismissedAt) return true;
		
		const timestamp = parseInt(dismissedAt, 10);
		if (isNaN(timestamp)) return true;
		
		const daysSince = (Date.now() - timestamp) / MS_PER_DAY;
		return daysSince >= DISMISSAL_DURATION_DAYS;
	}
	
	// State
	let isDismissed = $state(!shouldShowBanner());
	
	// Derived values
	let bannerClass = $derived(cn(bannerVariants({ variant }), className));
	let ctaClass = $derived(ctaVariants({ variant }));
	let dismissButtonClass = $derived(dismissButtonVariants({ variant }));
	let ctaAriaLabel = $derived(`${ctaText}: ${message}`);
	
	function handleDismiss(): void {
		isDismissed = true;
		if (dismissible) {
			setStorageItem(STORAGE_KEY, Date.now().toString());
		}
		onDismiss?.();
	}
</script>

{#if !isDismissed}
	<div 
		class={bannerClass}
		role="banner"
		aria-live="polite"
		aria-atomic="true"
	>
		<div class="container mx-auto flex items-center justify-center gap-3">
			<div class="flex flex-col sm:flex-row sm:items-center sm:gap-2">
				<span class="inline-block">{message}</span>
				{#if secondaryMessage}
					<span class="inline-block text-xs opacity-80">{secondaryMessage}</span>
				{/if}
			</div>
			{#if ctaText && ctaHref}
				<a 
					href={ctaHref}
					class={ctaClass}
					aria-label={ctaAriaLabel}
				>
					{ctaText}
					<span aria-hidden="true">→</span>
				</a>
			{/if}
		</div>
		{#if dismissible}
			<button
				onclick={handleDismiss}
				class={dismissButtonClass}
				aria-label="Dismiss banner for {DISMISSAL_DURATION_DAYS} days"
				type="button"
			>
				<X class="h-3 w-3" aria-hidden="true" />
			</button>
		{/if}
	</div>
{/if}