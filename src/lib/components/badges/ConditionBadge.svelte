<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import { getConditionConfig, type ListingCondition } from '$lib/config/conditions';
	import * as m from '$lib/paraglide/messages.js';
	
	interface Props {
		condition: string | null | undefined;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}
	
	let { condition, size = 'sm', class: className }: Props = $props();
	
	const config = $derived(getConditionConfig(condition));
	
	function getLocalizedLabel(labelKey: string): string {
		const messageMap: Record<string, () => string> = {
			'condition_new_with_tags': m.condition_new_with_tags,
			'condition_new_without_tags': m.condition_new_without_tags,
			'condition_like_new': m.condition_like_new,
			'condition_excellent': m.condition_excellent,
			'condition_very_good': m.condition_very_good,
			'condition_good': m.condition_good,
			'condition_fair': m.condition_fair,
			'condition_worn': m.condition_worn
		};
		
		const messageFn = messageMap[labelKey];
		return messageFn ? messageFn() : config?.label || '';
	}
	
	function getVariant(condition: string | null | undefined): 'condition-new-with-tags' | 'condition-new-without-tags' | 'condition-very-good' | 'condition-good' | 'condition-fair' | 'default' {
		if (!condition) return 'default';
		
		switch(condition) {
			case 'new_with_tags':
				return 'condition-new-with-tags';
			case 'new_without_tags':
				return 'condition-new-without-tags';
			case 'very_good':
				return 'condition-very-good';
			case 'good':
				return 'condition-good';
			case 'fair':
				return 'condition-fair';
			default:
				return 'default';
		}
	}
</script>

{#if config}
	<Badge variant={getVariant(condition)} {size} class={className}>
		{getLocalizedLabel(config.labelKey)}
	</Badge>
{/if}