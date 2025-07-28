<script lang="ts">
	import { debug } from '$lib/utils/debug-logger';
	
	interface Props {
		show?: boolean;
		data: any;
		title?: string;
	}
	
	let { show = true, data, title = 'Debug Info' }: Props = $props();
	let collapsed = $state(false);
</script>

{#if show}
	<div class="fixed bottom-4 right-4 z-[9999] max-w-md">
		<div class="bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden">
			<button
				onclick={() => collapsed = !collapsed}
				class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-left flex items-center justify-between"
			>
				<span class="font-mono text-sm">{title}</span>
				<span class="text-xs">{collapsed ? '▲' : '▼'}</span>
			</button>
			
			{#if !collapsed}
				<div class="p-4 max-h-96 overflow-y-auto">
					<pre class="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	pre {
		font-family: 'JetBrains Mono', monospace;
		line-height: 1.4;
	}
</style>