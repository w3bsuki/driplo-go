<!-- Re-export the new modular Header component for backward compatibility -->
<script lang="ts">
	import Header from './header/Header.svelte';
	
	// Accept all props that the Header component accepts
	let props = $props();
</script>

<Header {...props} />