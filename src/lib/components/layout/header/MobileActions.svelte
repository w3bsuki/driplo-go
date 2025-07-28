<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils/cn';
	import NotificationBell from './NotificationBell.svelte';
	import UserMenu from './UserMenu.svelte';
	import type { AuthContext } from '$lib/stores/auth-context.svelte';
	
	interface MobileActionsProps {
		authContext: AuthContext | null;
		brandSlug: string | null;
		onSignOut: () => void;
		showUnreadCount?: boolean;
		class?: string;
	}
	
	let {
		authContext,
		brandSlug,
		onSignOut,
		showUnreadCount = true,
		class: className = ''
	}: MobileActionsProps = $props();
</script>

<div class={cn("flex items-center gap-2 ml-auto md:hidden", className)} role="group" aria-label="Mobile actions">
	{#if authContext?.user && showUnreadCount}
		<NotificationBell />
	{/if}
	
	<UserMenu {authContext} {brandSlug} {onSignOut} isMobile={true} />
</div>