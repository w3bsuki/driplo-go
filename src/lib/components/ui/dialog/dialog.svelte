<script lang="ts">
	import { cn } from '$lib/utils';
	
	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: any;
		class?: string;
	}
	
	let { open = $bindable(false), onOpenChange, children, class: className }: Props = $props();
	
	function handleClose() {
		open = false;
		onOpenChange?.(false);
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50">
		<!-- Backdrop -->
		<button
			class="fixed inset-0 bg-black/50 backdrop-blur-sm"
			onclick={handleBackdropClick}
			aria-label="Close dialog"
		></button>
		
		<!-- Dialog content -->
		<div class={cn("fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]", className)}>
			{@render children?.()}
		</div>
	</div>
{/if}