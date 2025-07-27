<script lang="ts">
	import { cn } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	interface Props {
		checked?: boolean;
		disabled?: boolean;
		class?: string;
		id?: string;
		name?: string;
		value?: string;
		ariaLabel?: string;
		ariaLabelledby?: string;
		ariaDescribedby?: string;
		onCheckedChange?: (checked: boolean) => void;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		class: className = '',
		id,
		name,
		value,
		ariaLabel,
		ariaLabelledby,
		ariaDescribedby,
		onCheckedChange
	}: Props = $props();

	const dispatch = createEventDispatcher();

	function handleClick() {
		if (!disabled) {
			checked = !checked;
			onCheckedChange?.(checked);
			dispatch('change', checked);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={ariaLabel}
	aria-labelledby={ariaLabelledby}
	aria-describedby={ariaDescribedby}
	data-state={checked ? 'checked' : 'unchecked'}
	{disabled}
	{id}
	onclick={handleClick}
	onkeydown={handleKeydown}
	class={cn(
		'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
		'disabled:cursor-not-allowed disabled:opacity-50',
		checked ? 'bg-primary' : 'bg-input',
		className
	)}
>
	<span
		class={cn(
			'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
			checked ? 'translate-x-5' : 'translate-x-0'
		)}
	/>
</button>

{#if name}
	<input type="hidden" {name} {value} {checked} />
{/if}