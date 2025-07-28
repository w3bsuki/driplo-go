<script lang="ts">
	import { Heart } from 'lucide-svelte';
	import BrandBadge from '$lib/components/ui/BrandBadge.svelte';
	import LazyAvatar from '$lib/components/common/LazyAvatar.svelte';
	import * as m from '$lib/paraglide/messages.js';
	
	// Constants
	const PRICE_CURRENCY = 'GBP';
	const PRICE_LOCALE = 'en-GB';
	const AVATAR_GRADIENT_COLORS = [
		'from-blue-500 to-purple-500',
		'from-green-500 to-blue-500', 
		'from-blue-300 to-red-500',
		'from-purple-500 to-pink-500',
		'from-yellow-500 to-blue-300',
		'from-pink-500 to-red-500'
	];
	
	interface Props {
		title: string;
		price: number;
		size?: string;
		brand?: string;
		seller: {
			username: string;
			avatar?: string;
			account_type?: string;
			is_verified?: boolean;
		};
		likeCount?: number;
		eagerLoading?: boolean;
	}
	
	let { 
		title, 
		price, 
		size, 
		brand, 
		seller,
		likeCount = 0,
		eagerLoading = false 
	}: Props = $props();
	
	// Helper functions
	function formatPrice(price: number): string {
		return new Intl.NumberFormat(PRICE_LOCALE, {
			style: 'currency',
			currency: PRICE_CURRENCY,
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		}).format(price);
	}

	function getAvatarGradient(username: string): string {
		const index = username.charCodeAt(0) % AVATAR_GRADIENT_COLORS.length;
		return AVATAR_GRADIENT_COLORS[index];
	}
	
	// Derived values
	const formattedPrice = $derived(formatPrice(price));
	const avatarGradient = $derived(getAvatarGradient(seller.username));
</script>

<div class="p-[var(--spacing-2)] space-y-[var(--spacing-1)]">
	<div class="flex items-start justify-between gap-[var(--spacing-2)]">
		<div class="flex-1 min-w-0">
			<h3 class="text-[var(--font-size-base)] font-semibold text-[var(--color-text-primary)] truncate leading-[var(--line-height-snug)]">
				{title}
			</h3>
			{#if brand}
				<p class="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)] leading-[var(--line-height-snug)]">
					{brand}
				</p>
			{/if}
		</div>
		<p class="text-[var(--font-size-lg)] font-bold text-[var(--color-text-primary)] tabular-nums" aria-label={m.listing_price({ price: formattedPrice })}>
			{formattedPrice}
		</p>
	</div>
	
	{#if size}
		<p class="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)] leading-[var(--line-height-snug)]">
			{m.listing_size({ size })}
		</p>
	{/if}
	
	<div class="flex items-center gap-[var(--spacing-1-5)] pt-[var(--spacing-1)]">
		<LazyAvatar 
			src={seller.avatar}
			username={seller.username}
			size="xs"
			class="rounded-[var(--border-radius-sm)]"
			eager={eagerLoading}
		/>
		<span class="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] truncate">
			{seller.username}
		</span>
		{#if seller.account_type === 'brand'}
			<BrandBadge size="xs" isVerified={seller.is_verified} showText={false} />
		{/if}
		{#if likeCount > 0}
			<span class="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)] ml-auto flex items-center gap-[var(--spacing-0-5)] tabular-nums" aria-live="polite">
				{likeCount}
				<Heart class="h-3 w-3 fill-current" aria-hidden="true" />
			</span>
		{/if}
	</div>
</div>