<script lang="ts">
	import { cn } from '$lib/utils';
	import { throttle } from '$lib/utils/performance';
	
	interface Props {
		min?: number;
		max?: number;
		value?: [number, number];
		onChange?: (value: [number, number]) => void;
		theme?: 'blue' | 'pink';
	}
	
	let { 
		min = 0, 
		max = 1000, 
		value = [min, max], 
		onChange,
		theme = 'blue'
	}: Props = $props();
	
	let minValue = $state(value[0]);
	let maxValue = $state(value[1]);
	let isDragging = $state(false);
	
	$effect(() => {
		minValue = value[0];
		maxValue = value[1];
	});
	
	// Throttle the onChange callback to prevent excessive updates
	const throttledOnChange = onChange ? throttle(onChange, 100) : undefined;
	
	function handleMinChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newMin = Math.min(Number(target.value), maxValue - 10);
		minValue = newMin;
		throttledOnChange?.([newMin, maxValue]);
	}
	
	function handleMaxChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const newMax = Math.max(Number(target.value), minValue + 10);
		maxValue = newMax;
		throttledOnChange?.([minValue, newMax]);
	}
	
	const minPercent = $derived(((minValue - min) / (max - min)) * 100);
	const maxPercent = $derived(((maxValue - min) / (max - min)) * 100);
</script>

<div class="space-y-4">
	<div class="relative h-2">
		<!-- Track background -->
		<div class="absolute inset-0 bg-gray-200 rounded-full"></div>
		
		<!-- Active track -->
		<div 
			class={cn(
				"absolute h-full rounded-full",
				theme === 'pink' ? "bg-pink-500" : "bg-blue-500"
			)}
			style="left: {minPercent}%; right: {100 - maxPercent}%"
		></div>
		
		<!-- Min slider -->
		<input
			type="range"
			{min}
			{max}
			value={minValue}
			oninput={handleMinChange}
			onmousedown={() => isDragging = true}
			onmouseup={() => isDragging = false}
			class="absolute w-full h-full opacity-0 cursor-pointer"
			style="pointer-events: none"
		/>
		
		<!-- Max slider -->
		<input
			type="range"
			{min}
			{max}
			value={maxValue}
			oninput={handleMaxChange}
			onmousedown={() => isDragging = true}
			onmouseup={() => isDragging = false}
			class="absolute w-full h-full opacity-0 cursor-pointer"
			style="pointer-events: none"
		/>
		
		<!-- Min thumb -->
		<div 
			class={cn(
				"absolute w-5 h-5 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-pointer transition-transform",
				theme === 'pink' ? "bg-pink-500" : "bg-blue-500",
				isDragging && "scale-110"
			)}
			style="left: {minPercent}%"
		></div>
		
		<!-- Max thumb -->
		<div 
			class={cn(
				"absolute w-5 h-5 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-pointer transition-transform",
				theme === 'pink' ? "bg-pink-500" : "bg-blue-500",
				isDragging && "scale-110"
			)}
			style="left: {maxPercent}%"
		></div>
	</div>
	
	<!-- Value display -->
	<div class="flex items-center justify-between text-sm">
		<div class="flex items-center gap-2">
			<span class="text-gray-500">Min:</span>
			<input
				type="number"
				value={minValue}
				{min}
				max={maxValue - 10}
				onchange={handleMinChange}
				class="w-20 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>
		</div>
		<div class="text-gray-400">—</div>
		<div class="flex items-center gap-2">
			<span class="text-gray-500">Max:</span>
			<input
				type="number"
				value={maxValue}
				min={minValue + 10}
				{max}
				onchange={handleMaxChange}
				class="w-20 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
			/>
		</div>
	</div>
</div>

<style>
	input[type="range"] {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		pointer-events: all;
	}
	
	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: transparent;
		cursor: pointer;
		pointer-events: all;
	}
	
	input[type="range"]::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: transparent;
		cursor: pointer;
		border: none;
		pointer-events: all;
	}
</style>