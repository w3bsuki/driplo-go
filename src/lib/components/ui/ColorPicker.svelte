<script lang="ts">
	import { cn } from '$lib/utils'
	import { Check } from 'lucide-svelte'
	
	interface Props {
		value?: string | null
		onchange?: (color: string) => void
		label?: string
		required?: boolean
		class?: string
	}
	
	let { value = $bindable(), onchange, label, required = false, class: className }: Props = $props()
	
	// Popular clothing colors with proper hex values
	const colors = [
		{ name: 'Black', value: '#000000', emoji: '⚫' },
		{ name: 'White', value: '#FFFFFF', emoji: '⚪' },
		{ name: 'Gray', value: '#6B7280', emoji: '🩶' },
		{ name: 'Navy', value: '#1E3A8A', emoji: '🔵' },
		{ name: 'Blue', value: '#3B82F6', emoji: '💙' },
		{ name: 'Red', value: '#EF4444', emoji: '❤️' },
		{ name: 'Pink', value: '#EC4899', emoji: '💗' },
		{ name: 'Green', value: '#10B981', emoji: '💚' },
		{ name: 'Yellow', value: '#F59E0B', emoji: '💛' },
		{ name: 'Orange', value: '#F97316', emoji: '🧡' },
		{ name: 'Purple', value: '#8B5CF6', emoji: '💜' },
		{ name: 'Brown', value: '#92400E', emoji: '🤎' },
		{ name: 'Beige', value: '#D4A574', emoji: '🟤' },
		{ name: 'Multi', value: 'multi', emoji: '🌈' },
	]
	
	function handleSelect(color: typeof colors[0]) {
		value = color.value
		onchange?.(color.value)
	}
	
	// Helper to determine if we need dark or light text
	function needsDarkText(hex: string): boolean {
		if (hex === 'multi') return false
		if (hex === '#FFFFFF') return true
		if (hex === '#F59E0B') return true // Yellow
		if (hex === '#D4A574') return true // Beige
		return false
	}
</script>

<div class={cn("space-y-2", className)}>
	{#if label}
		<label class="block text-sm font-medium text-gray-700">
			<span class="text-lg">🎨</span>
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</label>
	{/if}
	
	<div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
		{#each colors as color}
			<button
				type="button"
				onclick={() => handleSelect(color)}
				class={cn(
					"relative group aspect-square rounded-xl border-2 transition-all duration-200",
					"flex flex-col items-center justify-center p-2",
					"hover:scale-105 active:scale-95",
					value === color.value 
						? "ring-2 ring-offset-2 ring-blue-500 shadow-lg" 
						: "hover:shadow-md"
				)}
				style={color.value !== 'multi' ? `background-color: ${color.value}` : 'background: linear-gradient(to br, #EF4444, #F59E0B, #10B981, #3B82F6, #8B5CF6)'}
				aria-label={`Select ${color.name}`}
			>
				<!-- Emoji indicator -->
				<span class="text-2xl mb-1 drop-shadow-sm">
					{color.emoji}
				</span>
				
				<!-- Color name -->
				<span class={cn(
					"text-xs font-medium",
					needsDarkText(color.value) ? "text-gray-900" : "text-white",
					"drop-shadow-sm"
				)}>
					{color.name}
				</span>
				
				<!-- Selected checkmark -->
				{#if value === color.value}
					<div class={cn(
						"absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
						"bg-blue-500 text-white shadow-md animate-in zoom-in-50 duration-200"
					)}>
						<Check class="w-3.5 h-3.5 stroke-[3]" />
					</div>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	@keyframes zoom-in-50 {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.animate-in {
		animation-duration: 200ms;
		animation-fill-mode: both;
	}
	
	.zoom-in-50 {
		animation-name: zoom-in-50;
	}
</style>