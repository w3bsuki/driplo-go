<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import { Ruler } from 'lucide-svelte';
	
	interface Props {
		size: string;
		badgeSize?: 'sm' | 'md' | 'lg';
		class?: string;
	}
	
	let { size, badgeSize = 'sm', class: className }: Props = $props();
</script>

<Badge variant="outline" size={badgeSize} class={className}>
	<Ruler class="w-3 h-3 mr-1" />
	Size {size}
</Badge>