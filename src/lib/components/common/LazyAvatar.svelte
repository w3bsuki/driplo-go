<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	
	interface Props {
		src?: string | null;
		username: string;
		size?: 'xs' | 'sm' | 'md' | 'lg';
		class?: string;
		eager?: boolean;
	}
	
	let { src, username, size = 'sm', class: className, eager = false }: Props = $props();
	
	let isIntersecting = $state(eager);
	let avatarElement: HTMLElement;
	
	const sizeClasses = {
		xs: 'h-5 w-5 text-xs',
		sm: 'h-8 w-8 text-sm',
		md: 'h-10 w-10 text-base',
		lg: 'h-16 w-16 text-lg'
	};
	
	const gradients = [
		'from-blue-500 to-purple-500',
		'from-green-500 to-blue-500',
		'from-purple-500 to-pink-500',
		'from-yellow-500 to-red-300',
		'from-pink-500 to-red-500',
		'from-blue-300 to-red-500'
	];
	
	const gradient = $derived(() => {
		const index = username.charCodeAt(0) % gradients.length;
		return gradients[index];
	});
	
	const initial = $derived(() => username.charAt(0).toUpperCase());
	
	onMount(() => {
		if (eager || !avatarElement) return;
		
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					isIntersecting = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '50px' }
		);
		
		observer.observe(avatarElement);
		return () => observer.disconnect();
	});
</script>

<div 
	bind:this={avatarElement} 
	class={cn(sizeClasses[size], 'rounded-full overflow-hidden relative', className)}
	role="img"
	aria-label="{username}'s avatar"
>
	{#if src && isIntersecting}
		<img
			{src}
			alt=""
			class="h-full w-full object-cover"
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
		/>
	{:else}
		<div class="h-full w-full bg-gradient-to-br {gradient()} flex items-center justify-center">
			<span class="font-medium text-white select-none">
				{initial()}
			</span>
		</div>
	{/if}
</div>