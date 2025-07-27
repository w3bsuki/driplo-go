<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils';

	const buttonVariants = cva(
		'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-100 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 btn-compact-safe',
		{
			variants: {
				variant: {
					default: 'bg-brand-500 text-white border border-transparent hover:bg-brand-600 active:bg-brand-700',
					destructive: 'bg-error-500 text-white border border-transparent hover:bg-error-600 active:bg-error-600',
					outline: 'border border-gray-200 bg-white hover:bg-brand-500 hover:text-white',
					secondary: 'bg-gray-100 text-gray-900 border border-transparent hover:bg-gray-200',
					ghost: 'hover:bg-brand-500 hover:text-white',
					link: 'text-brand-500 underline-offset-4 hover:underline p-0 h-auto'
				},
				size: {
					xs: 'px-2 text-xs rounded-sm',
					sm: 'px-3 text-sm rounded-sm',
					default: 'px-4 text-sm rounded-sm',
					lg: 'px-5 text-sm rounded-sm',
					xl: 'px-6 text-sm rounded-sm',
					icon: 'p-0 rounded-sm'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	type ButtonVariantProps = VariantProps<typeof buttonVariants>;

	interface ButtonProps extends ButtonVariantProps, HTMLButtonAttributes {
		class?: string;
		children: Snippet;
	}

	let {
		class: className = '',
		variant = 'default',
		size = 'default',
		type = 'button',
		disabled = false,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

<button 
	{type} 
	{disabled} 
	class={cn(buttonVariants({ variant, size, className }))}
	style={`height: var(--button-height-${size === 'default' ? 'md' : size})`}
	{...restProps}
>
	{@render children()}
</button>

<style>
	/* Modern 2025 button interactions with spring physics */
	@media (hover: hover) and (pointer: fine) {
		button:hover {
			transform: translateY(-1px) scale(1.02);
			transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
		}
	}

	/* Touch devices get optimized feedback */
	@media (hover: none) and (pointer: coarse) {
		button:active {
			transform: scale(0.95);
			transition: transform 100ms ease-out;
		}
	}

	/* Enhanced focus-visible for better accessibility */
	button:focus-visible {
		transform: scale(1.02);
		transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
	}

	/* Disabled state animations */
	button:disabled {
		transform: none !important;
		animation: none !important;
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none !important;
		}
		button:hover,
		button:focus-visible,
		button:active {
			transform: none !important;
		}
	}

	/* Link variant should not scale */
	button:global(.btn-link):hover,
	button:global(.btn-link):focus-visible,
	button:global(.btn-link):active {
		transform: none !important;
	}
</style>

