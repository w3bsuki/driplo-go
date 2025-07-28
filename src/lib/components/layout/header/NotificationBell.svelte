<script lang="ts">
	import { unreadCount } from '$lib/stores/messages';
	import { cn } from '$lib/utils/cn';
	import * as m from '$lib/paraglide/messages.js';
	
	interface NotificationBellProps {
		href?: string;
		emoji?: string;
		ariaLabel?: string;
		maxCount?: number;
		class?: string;
	}
	
	let {
		href = '/messages',
		emoji = '💬',
		ariaLabel = m.header_messages(),
		maxCount = 99,
		class: className = ''
	}: NotificationBellProps = $props();
	
	// Direct store subscription for better performance
	const unreadValue = $derived($unreadCount);
	
	const displayCount = $derived(
		unreadValue > maxCount ? `${maxCount}+` : unreadValue
	);
</script>

<a 
	{href}
	class={cn(
		"relative flex items-center justify-center rounded-sm",
		"hover:bg-muted hover:scale-105 active:scale-95",
		"transition-all duration-100 will-change-transform",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
		className
	)}
	aria-label={`${ariaLabel}${unreadValue > 0 ? `, ${unreadValue} unread` : ''}`}
	aria-live="polite"
	aria-atomic="true"
>
	<span class="text-xl" aria-hidden="true">{emoji}</span>
	{#if unreadValue > 0}
		<span 
			class="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center"
			aria-hidden="true"
		>
			{displayCount}
		</span>
	{/if}
</a>