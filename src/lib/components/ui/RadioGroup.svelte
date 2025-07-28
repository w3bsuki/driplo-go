<script lang="ts">
	// Re-export the proper bits-ui based RadioGroup components
	export { default as RadioGroup } from './radio-group/RadioGroup.svelte';
	export { default as RadioGroupItem } from './radio-group/RadioGroupItem.svelte';
</script>

<!-- 
	This file now serves as a simple re-export wrapper.
	The actual implementation is in the radio-group/ directory using bits-ui primitives.
	
	Usage:
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/RadioGroup.svelte';
	
	Or use the individual components:
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
-->