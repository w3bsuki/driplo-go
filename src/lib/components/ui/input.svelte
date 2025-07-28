<script lang="ts">
	import { cn } from '$lib/utils'
	
	interface Props {
		class?: string
		type?: string
		value?: string | number
		placeholder?: string
		disabled?: boolean
		required?: boolean
		id?: string
		size?: 'sm' | 'md' | 'lg'
		onblur?: (e: FocusEvent) => void
		onchange?: (e: Event) => void
		onclick?: (e: MouseEvent) => void
		onfocus?: (e: FocusEvent) => void
		onkeydown?: (e: KeyboardEvent) => void
		onkeypress?: (e: KeyboardEvent) => void
		onkeyup?: (e: KeyboardEvent) => void
		onmouseover?: (e: MouseEvent) => void
		onmouseenter?: (e: MouseEvent) => void
		onmouseleave?: (e: MouseEvent) => void
		onpaste?: (e: ClipboardEvent) => void
		oninput?: (e: Event) => void
		[key: string]: any
	}
	
	let {
		class: className,
		type = 'text',
		value = $bindable(),
		placeholder,
		disabled = false,
		required = false,
		id,
		size = 'md',
		onblur,
		onchange,
		onclick,
		onfocus,
		onkeydown,
		onkeypress,
		onkeyup,
		onmouseover,
		onmouseenter,
		onmouseleave,
		onpaste,
		oninput,
		...restProps
	}: Props = $props()
	
	const sizeClasses = {
		sm: 'px-3 text-sm h-[var(--input-height-sm)]',
		md: 'px-3 text-sm h-[var(--input-height-md)]',
		lg: 'px-3 text-sm h-[var(--input-height-lg)]'
	}
</script>

<input
	{id}
	{type}
	{placeholder}
	{disabled}
	{required}
	bind:value
	class={cn(
		'flex w-full rounded-sm border border-gray-200 bg-white ring-offset-white transition-all duration-100 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 input-compact-safe',
		sizeClasses[size],
		className
	)}
	{onblur}
	{onchange}
	{onclick}
	{onfocus}
	{onkeydown}
	{onkeypress}
	{onkeyup}
	{onmouseover}
	{onmouseenter}
	{onmouseleave}
	{onpaste}
	{oninput}
	{...restProps}
/>

<style>
	/* Modern 2025 input focus interactions */
	@media (hover: hover) and (pointer: fine) {
		input:hover:not(:disabled) {
			transform: scale(1.005);
			transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25);
		}
	}

	/* Enhanced focus-visible for better accessibility */
	input:focus-visible {
		transform: scale(1.01);
		transition: transform 150ms cubic-bezier(0.5, 1.25, 0.75, 1.25),
		           box-shadow 150ms ease-out;
	}

	/* Touch devices get subtle feedback */
	@media (hover: none) and (pointer: coarse) {
		input:focus {
			transform: scale(1.005);
			transition: transform 100ms ease-out;
		}
	}

	/* Disabled state should not animate */
	input:disabled {
		transform: none !important;
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		input {
			transition: none !important;
		}
		input:hover,
		input:focus-visible,
		input:focus {
			transform: none !important;
		}
	}

	/* File input specific styles */
	input[type="file"]:focus-visible {
		transform: none;
	}
</style>

