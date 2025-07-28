<script lang="ts">
	import { notifications } from '$lib/stores/notifications.svelte';
	import { fly, fade } from 'svelte/transition';
	import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';
	
	let { position = 'top-right' }: { position?: 'top-right' | 'top-center' | 'bottom-right' } = $props();
	
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
			{@const Icon = notificationIcons[notification.type]}
			<div
				transition:fly={{ y: -20, duration: 300 }}
				class="border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
					{notification.type === 'success' ? 'border-success-200 dark:border-success-500/30 bg-success-50 dark:bg-success-500/10' : ''}
					{notification.type === 'error' ? 'border-error-200 dark:border-error-500/30 bg-error-50 dark:bg-error-500/10' : ''}
					{notification.type === 'info' ? 'border-info-200 dark:border-info-500/30 bg-info-50 dark:bg-info-500/10' : ''}
					{notification.type === 'warning' ? 'border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10' : ''}
					{!notification.type || notification.type === 'default' ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900' : ''}"
			>
				<div class="flex items-start gap-3">
					<div class="{notification.type === 'success' ? 'text-success-600 dark:text-success-400' : ''}
						{notification.type === 'error' ? 'text-error-600 dark:text-error-400' : ''}
						{notification.type === 'info' ? 'text-info-600 dark:text-info-400' : ''}
						{notification.type === 'warning' ? 'text-warning-600 dark:text-warning-400' : ''}
						{!notification.type || notification.type === 'default' ? 'text-gray-600 dark:text-gray-400' : ''}">
						{#if Icon}
							<Icon class="w-5 h-5" />
						{/if}
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