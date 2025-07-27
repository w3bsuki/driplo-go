<script lang="ts">
	import { Star } from 'lucide-svelte'
	
	interface Props {
		rating: number
		maxRating?: number
		size?: 'sm' | 'md' | 'lg'
		interactive?: boolean
		showText?: boolean
		onRate?: (rating: number) => void
	}
	
	let {
		rating,
		maxRating = 5,
		size = 'md',
		interactive = false,
		showText = false,
		onRate
	}: Props = $props()
	
	let hoverRating = $state(0)
	
	const sizeClasses = {
		sm: 'w-3 h-3',
		md: 'w-4 h-4', 
		lg: 'w-5 h-5'
	}
	
	const textSizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	}
	
	function handleStarClick(starRating: number) {
		if (interactive && onRate) {
			onRate(starRating)
		}
	}
	
	function handleStarHover(starRating: number) {
		if (interactive) {
			hoverRating = starRating
		}
	}
	
	function handleMouseLeave() {
		if (interactive) {
			hoverRating = 0
		}
	}
	
	function getStarFill(starIndex: number): 'full' | 'half' | 'empty' {
		const currentRating = interactive && hoverRating > 0 ? hoverRating : rating
		
		if (currentRating >= starIndex) {
			return 'full'
		} else if (currentRating >= starIndex - 0.5) {
			return 'half'
		} else {
			return 'empty'
		}
	}
	
	function getRatingText(rating: number): string {
		if (rating >= 4.5) return 'Excellent'
		if (rating >= 4.0) return 'Very Good'
		if (rating >= 3.5) return 'Good'
		if (rating >= 3.0) return 'Average'
		if (rating >= 2.0) return 'Below Average'
		return 'Poor'
	}
</script>

<div 
	class="flex items-center gap-1"
	role={interactive ? 'radiogroup' : 'img'}
	aria-label={interactive ? 'Rate this item' : `Rating: ${rating} out of ${maxRating} stars`}
	onmouseleave={handleMouseLeave}
>
	{#each Array(maxRating) as _, index}
		{@const starIndex = index + 1}
		{@const fill = getStarFill(starIndex)}
		
		<button
			type="button"
			class="relative {interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
			class:pointer-events-none={!interactive}
			disabled={!interactive}
			aria-label={interactive ? `Rate ${starIndex} star${starIndex > 1 ? 's' : ''}` : ''}
			onclick={() => handleStarClick(starIndex)}
			onmouseenter={() => handleStarHover(starIndex)}
			onfocus={() => handleStarHover(starIndex)}
		>
			{#if fill === 'full'}
				<Star 
					class="{sizeClasses[size]} text-yellow-400 fill-current" 
					aria-hidden="true"
				/>
			{:else if fill === 'half'}
				<div class="relative">
					<Star 
						class="{sizeClasses[size]} text-gray-300" 
						aria-hidden="true"
					/>
					<div class="absolute inset-0 overflow-hidden" style="width: 50%">
						<Star 
							class="{sizeClasses[size]} text-yellow-400 fill-current" 
							aria-hidden="true"
						/>
					</div>
				</div>
			{:else}
				<Star 
					class="{sizeClasses[size]} text-gray-300 {interactive ? 'hover:text-yellow-200' : ''}" 
					aria-hidden="true"
				/>
			{/if}
		</button>
	{/each}
	
	{#if showText}
		<span class="ml-2 {textSizeClasses[size]} text-gray-600">
			{rating.toFixed(1)} ({getRatingText(rating)})
		</span>
	{/if}
</div>

<style>
	/* Ensure half-star clipping works properly */
	.relative {
		display: inline-block;
	}
</style>