<script lang="ts">
	import { notifications } from '$lib/stores/notifications.svelte';
	import { fly, fade } from 'svelte/transition';
	import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';
	
	export let position: 'top-right' | 'top-center' | 'bottom-right' = 'top-right';
	
	const positionClasses = {
		'top-right': 'top-4 right-4',
		'top-center': 'top-4 left-1/2 -translate-x-1/2',
		'bottom-right': 'bottom-20 right-4'
	};
	
	const notificationIcons = {
		success: CheckCircle,
		error: XCircle,
		info: Info,
		warning: AlertTriangle
	};
</script>

<div class="fixed {positionClasses[position]} z-50 pointer-events-none">
	<div class="flex flex-col gap-2 pointer-events-auto">
		{#each notifications.all as notification (notification.id)}
			<div
				transition:fly={{ y: -20, duration: 300 }}
				class="bg-background border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
					{notification.type === 'success' ? 'border-green-500/20 bg-green-50 dark:bg-green-950/20' : ''}
					{notification.type === 'error' ? 'border-red-500/20 bg-red-50 dark:bg-red-950/20' : ''}
					{notification.type === 'info' ? 'border-blue-500/20 bg-blue-50 dark:bg-blue-950/20' : ''}
					{notification.type === 'warning' ? 'border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20' : ''}"
			>
				<div class="flex items-start gap-3">
					<div class="{notification.type === 'success' ? 'text-green-600 dark:text-green-400' : ''}
						{notification.type === 'error' ? 'text-red-600 dark:text-red-400' : ''}
						{notification.type === 'info' ? 'text-blue-600 dark:text-blue-400' : ''}
						{notification.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}">
						<svelte:component this={notificationIcons[notification.type]} class="w-5 h-5" />
					</div>
					
					<div class="flex-1">
						<h4 class="font-medium text-sm">{notification.title}</h4>
						{#if notification.description}
							<p class="text-sm text-muted-foreground mt-1">
								{notification.description}
							</p>
						{/if}
						{#if notification.action}
							<button
								onclick={handleNotification.action.callback}
								class="text-sm font-medium mt-2 hover:underline"
							>
								{notification.action.label}
							</button>
						{/if}
					</div>
					
					<button
						onclick={() => notifications.dismiss(notification.id)}
						class="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded touch-safe"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>