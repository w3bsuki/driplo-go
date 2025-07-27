<script lang="ts">
	import { getFormContext } from '../FormContext.svelte.ts'
	import { validateField, getSuggestions, formatPrice } from '../utils/validation'
	import { cn } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import Input from '$lib/components/ui/input.svelte'
	import { Label } from '$lib/components/ui'
	import { DollarSign, AlertCircle, Info, Sparkles } from 'lucide-svelte'
	
	const form = getFormContext()
	
	// Condition options with descriptions
	const conditions = [
		{ 
			value: 'new_with_tags', 
			label: 'New with tags',
			description: 'Brand new, never worn, with original tags',
			icon: '🏷️'
		},
		{ 
			value: 'new_without_tags', 
			label: 'New without tags',
			description: 'Brand new, never worn, tags removed',
			icon: '✨'
		},
		{ 
			value: 'very_good', 
			label: 'Very good',
			description: 'Worn once or twice, excellent condition',
			icon: '👍'
		},
		{ 
			value: 'good', 
			label: 'Good',
			description: 'Worn several times, minor signs of wear',
			icon: '👌'
		},
		{ 
			value: 'fair', 
			label: 'Fair',
			description: 'Visible wear, but still wearable',
			icon: '🤏'
		}
	]
	
	// Suggestions state
	let showColorSuggestions = $state(false)
	let showBrandSuggestions = $state(false)
	let showSizeSuggestions = $state(false)
	
	let colorSuggestions = $state<string[]>([])
	let brandSuggestions = $state<string[]>([])
	let sizeSuggestions = $state<string[]>([])
	
	// Price formatting
	let priceInput = $state(form.formData.price ? form.formData.price.toString() : '')
	const formattedPrice = $derived(
		form.formData.price > 0 ? formatPrice(form.formData.price) : ''
	)
	
	// Smart pricing suggestion (mock - would be ML-based in production)
	const suggestedPriceRange = $derived(() => {
		if (!form.formData.brand || !form.formData.condition) return null
		
		// Mock price suggestions based on brand/condition
		const brandMultiplier = form.formData.brand.toLowerCase().includes('nike') ? 1.5 : 1
		const conditionMultiplier = {
			'new_with_tags': 1,
			'new_without_tags': 0.85,
			'very_good': 0.7,
			'good': 0.5,
			'fair': 0.3
		}[form.formData.condition] || 0.5
		
		const basePrice = 50
		const suggested = basePrice * brandMultiplier * conditionMultiplier
		
		return {
			min: Math.round(suggested * 0.8),
			max: Math.round(suggested * 1.2),
			avg: Math.round(suggested)
		}
	})
	
	// Handle price input
	function handlePriceInput(e: Event) {
		const input = e.target as HTMLInputElement
		let value = input.value.replace(/[^0-9.]/g, '')
		
		// Handle decimal places
		const parts = value.split('.')
		if (parts.length > 2) {
			value = parts[0] + '.' + parts.slice(1).join('')
		}
		if (parts[1]?.length > 2) {
			value = parts[0] + '.' + parts[1].substring(0, 2)
		}
		
		priceInput = value
		const numValue = parseFloat(value) || 0
		form.updateField('price', numValue)
		
		// Validate
		const error = validateField('price', numValue)
		if (error) {
			form.setFieldError('price', error)
		}
	}
	
	// Handle color input with suggestions
	function handleColorInput(e: Event) {
		const input = e.target as HTMLInputElement
		const value = input.value
		form.updateField('color', value)
		
		// Get suggestions
		if (value.length > 0) {
			colorSuggestions = getSuggestions('color', value)
			showColorSuggestions = colorSuggestions.length > 0
		} else {
			showColorSuggestions = false
		}
		
		// Validate
		const error = validateField('color', value)
		if (error) {
			form.setFieldError('color', error)
		}
	}
	
	// Handle brand input with suggestions
	function handleBrandInput(e: Event) {
		const input = e.target as HTMLInputElement
		const value = input.value
		form.updateField('brand', value)
		
		// Get suggestions
		if (value.length > 0) {
			brandSuggestions = getSuggestions('brand', value)
			showBrandSuggestions = brandSuggestions.length > 0
		} else {
			showBrandSuggestions = false
		}
	}
	
	// Handle size input with suggestions  
	function handleSizeInput(e: Event) {
		const input = e.target as HTMLInputElement
		const value = input.value
		form.updateField('size', value)
		
		// Get suggestions
		if (value.length > 0) {
			sizeSuggestions = getSuggestions('size', value)
			showSizeSuggestions = sizeSuggestions.length > 0
		} else {
			showSizeSuggestions = false
		}
	}
	
	// Select suggestion
	function selectSuggestion(field: string, value: string) {
		switch (field) {
			case 'color':
				form.updateField('color', value)
				showColorSuggestions = false
				break
			case 'brand':
				form.updateField('brand', value)
				showBrandSuggestions = false
				break
			case 'size':
				form.updateField('size', value)
				showSizeSuggestions = false
				break
		}
	}
</script>

<div class="space-y-8">
	<!-- Step Header -->
	<div>
		<h2 class="text-xl sm:text-2xl font-bold mb-2">💰 Pricing & Details</h2>
		<p class="text-sm sm:text-base text-gray-600">Set your price and describe the item's condition</p>
	</div>
	
	<!-- Price Input -->
	<div>
		<Label for="price" class="block mb-3">
			Price <span class="text-red-500">*</span>
		</Label>
		<div class="relative">
			<DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
			<Input
				id="price"
				type="text"
				value={priceInput}
				oninput={handlePriceInput}
				placeholder="0.00"
				class={cn(
					"pl-10 text-xl font-medium",
					form.validationErrors.price && "border-red-300 focus:ring-red-500"
				)}
				aria-invalid={!!form.validationErrors.price}
				aria-describedby={form.validationErrors.price ? "price-error" : undefined}
			/>
			{#if formattedPrice}
				<span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
					{formattedPrice}
				</span>
			{/if}
		</div>
		{#if form.validationErrors.price}
			<p id="price-error" class="mt-1 text-xs text-red-500 flex items-center gap-1" transition:slide>
				<AlertCircle class="w-3 h-3" />
				{form.validationErrors.price}
			</p>
		{/if}
		
		<!-- Smart pricing suggestion -->
		{#if suggestedPriceRange && form.formData.price > 0}
			<div class="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200" transition:slide>
				<p class="text-sm text-purple-900 font-medium flex items-center gap-2">
					✨ Price Intelligence
				</p>
				<p class="text-sm text-purple-800 mt-1">
					Similar items sell for <span class="font-semibold">${suggestedPriceRange.min} - ${suggestedPriceRange.max}</span>
				</p>
				{#if form.formData.price < suggestedPriceRange.min * 0.7}
					<p class="text-xs text-purple-700 mt-2 flex items-center gap-1">
						📈 Your price seems low. Consider pricing higher for faster profit.
					</p>
				{:else if form.formData.price > suggestedPriceRange.max * 1.5}
					<p class="text-xs text-purple-700 mt-2 flex items-center gap-1">
						📉 Your price is above market average. It might take longer to sell.
					</p>
				{:else}
					<p class="text-xs text-green-700 mt-2 flex items-center gap-1">
						✅ Great pricing! Your item is competitively priced.
					</p>
				{/if}
			</div>
		{/if}
	</div>
	
	<!-- Condition Selection -->
	<div>
		<Label class="block mb-3">
			Condition <span class="text-red-500">*</span>
		</Label>
		<div class="space-y-2">
			{#each conditions as condition}
				<label class={cn(
					"flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all",
					"hover:shadow-md hover:scale-[1.02]",
					form.formData.condition === condition.value 
						? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50" 
						: "border-gray-200 hover:border-gray-300"
				)}>
					<input
						type="radio"
						bind:group={form.formData.condition}
						value={condition.value}
						class="mt-0.5 mr-3 accent-purple-600"
					/>
					<div class="flex-1">
						<div class="flex items-center gap-2">
							<span class="text-xl">{condition.icon}</span>
							<span class={cn(
								"font-medium",
								form.formData.condition === condition.value && "text-purple-900"
							)}>{condition.label}</span>
						</div>
						<p class={cn(
							"text-sm mt-1",
							form.formData.condition === condition.value ? "text-purple-700" : "text-gray-600"
						)}>{condition.description}</p>
					</div>
				</label>
			{/each}
		</div>
		{#if form.validationErrors.condition}
			<p class="mt-2 text-xs text-red-500 flex items-center gap-1">
				<AlertCircle class="w-3 h-3" />
				{form.validationErrors.condition}
			</p>
		{/if}
	</div>
	
	<!-- Item Details Grid -->
	<div class="grid md:grid-cols-3 gap-4">
		<!-- Brand -->
		<div class="relative">
			<Label for="brand" class="text-sm font-medium mb-2">
				Brand <span class="text-gray-500 text-xs">(optional)</span>
			</Label>
			<Input
				id="brand"
				type="text"
				value={form.formData.brand || ''}
				oninput={handleBrandInput}
				placeholder="Nike, Zara, etc."
				class="w-full"
			/>
			{#if showBrandSuggestions}
				<div class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg" transition:fade>
					{#each brandSuggestions as suggestion}
						<button
							type="button"
							class="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
							onclick={() => selectSuggestion('brand', suggestion)}
						>
							{suggestion}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Size -->
		<div class="relative">
			<Label for="size" class="text-sm font-medium mb-2">
				Size <span class="text-gray-500 text-xs">(optional)</span>
			</Label>
			<Input
				id="size"
				type="text"
				value={form.formData.size || ''}
				oninput={handleSizeInput}
				placeholder="M, 42, One size"
				class="w-full"
			/>
			{#if showSizeSuggestions}
				<div class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg" transition:fade>
					{#each sizeSuggestions as suggestion}
						<button
							type="button"
							class="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
							onclick={() => selectSuggestion('size', suggestion)}
						>
							{suggestion}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Color -->
		<div class="relative">
			<Label for="color" class="text-sm font-medium mb-2">
				Color <span class="text-red-500">*</span>
			</Label>
			<Input
				id="color"
				type="text"
				value={form.formData.color}
				oninput={handleColorInput}
				placeholder="Black, Blue, etc."
				class={cn(
					"w-full",
					form.validationErrors.color && "border-red-300 focus:ring-red-500"
				)}
			/>
			{#if showColorSuggestions}
				<div class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg" transition:fade>
					{#each colorSuggestions as suggestion}
						<button
							type="button"
							class="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
							onclick={() => selectSuggestion('color', suggestion)}
						>
							{suggestion}
						</button>
					{/each}
				</div>
			{/if}
			{#if form.validationErrors.color}
				<p class="mt-1 text-xs text-red-500 flex items-center gap-1">
					<AlertCircle class="w-3 h-3" />
					{form.validationErrors.color}
				</p>
			{/if}
		</div>
	</div>
	
	<!-- Pricing tips -->
	<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
		<h3 class="font-medium text-gray-900 mb-2 flex items-center gap-2">
			<Info class="w-4 h-4" />
			Pricing tips
		</h3>
		<ul class="text-sm text-gray-600 space-y-1">
			<li>• Research similar items to price competitively</li>
			<li>• Consider offering free shipping in your price</li>
			<li>• Price ending in 9 or 5 tend to sell better</li>
			<li>• Be realistic about condition when pricing</li>
		</ul>
	</div>
</div>