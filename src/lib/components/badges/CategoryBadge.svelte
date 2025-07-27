<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import { Package2 } from 'lucide-svelte';
	
	interface Props {
		category: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}
	
	let { category, size = 'sm', class: className }: Props = $props();
</script>

<Badge variant="secondary" {size} class={className}>
	<Package2 class="w-3 h-3 mr-1" />
	{category}
</Badge>