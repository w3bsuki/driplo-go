<script lang="ts">
	import { getFormContext } from '../FormContext.svelte.ts'
	import { validateField, formatPrice } from '../utils/validation'
	import { cn } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import Input from '$lib/components/ui/input.svelte'
	import { Label } from '$lib/components/ui'
	import { MapPin, Package, AlertCircle, Globe, Truck, Users, X } from 'lucide-svelte'
	
	const form = getFormContext()
	
	// Shipping options with details
	const shippingOptions = [
		{
			value: 'standard',
			label: 'Standard Shipping',
			description: '3-5 business days',
			icon: Package,
			avgCost: '$5-10'
		},
		{
			value: 'express',
			label: 'Express Shipping', 
			description: '1-2 business days',
			icon: Truck,
			avgCost: '$15-25'
		},
		{
			value: 'pickup',
			label: 'Local Pickup',
			description: 'Buyer picks up in person',
			icon: Users,
			avgCost: 'Free'
		}
	]
	
	// Shipping cost input
	let shippingCostInput = $state(
		form.formData.shipping_cost ? form.formData.shipping_cost.toString() : ''
	)
	
	// Popular cities for suggestions
	const popularCities = [
		'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
		'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
		'Austin', 'Jacksonville', 'San Francisco', 'Columbus', 'Fort Worth',
		'London', 'Paris', 'Tokyo', 'Berlin', 'Madrid'
	]
	
	let showCitySuggestions = $state(false)
	let citySuggestions = $state<string[]>([])
	
	// Handle location input
	function handleLocationInput(e: Event) {
		const input = e.target as HTMLInputElement
		const value = input.value
		form.updateField('location_city', value)
		
		// Show suggestions
		if (value.length > 0) {
			citySuggestions = popularCities.filter(city => 
				city.toLowerCase().includes(value.toLowerCase())
			).slice(0, 5)
			showCitySuggestions = citySuggestions.length > 0
		} else {
			showCitySuggestions = false
		}
		
		// Validate
		const error = validateField('location_city', value)
		if (error) {
			form.setFieldError('location_city', error)
		}
	}
	
	// Handle shipping cost input
	function handleShippingCostInput(e: Event) {
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
		
		shippingCostInput = value
		const numValue = parseFloat(value) || 0
		form.updateField('shipping_cost', numValue)
	}
	
	// Select city suggestion
	function selectCity(city: string) {
		form.updateField('location_city', city)
		showCitySuggestions = false
		form.clearFieldError('location_city')
	}
	
	// Shipping type change handler
	function handleShippingTypeChange(type: string) {
		form.updateField('shipping_type', type)
		
		// Reset shipping cost for pickup
		if (type === 'pickup') {
			form.updateField('shipping_cost', 0)
			form.updateField('ships_worldwide', false)
			shippingCostInput = ''
		}
	}
	
	// Calculate total with shipping
	const totalWithShipping = $derived(
		form.formData.price + (form.formData.shipping_cost || 0)
	)
	
	// Tags for item (optional feature)
	let tagInput = $state('')
	
	function addTag(tag: string) {
		if (tag && form.formData.tags.length < 5) {
			form.updateField('tags', [...form.formData.tags, tag.toLowerCase()])
			tagInput = ''
		}
	}
	
	function removeTag(index: number) {
		form.updateField('tags', form.formData.tags.filter((_, i) => i !== index))
	}
</script>

<div class="space-y-8">
	<!-- Step Header -->
	<div>
		<h2 class="text-xl sm:text-2xl font-bold mb-2">Shipping & Location</h2>
		<p class="text-sm sm:text-base text-gray-600">Where are you shipping from and how?</p>
	</div>
	
	<!-- Location Input -->
	<div>
		<Label for="location" class="mb-3">
			Your City <span class="text-red-500">*</span>
		</Label>
		<div class="relative">
			<Input
				id="location"
				type="text"
				value={form.formData.location_city}
				oninput={handleLocationInput}
				placeholder="Enter your city"
				class={cn(
					"w-full",
					form.validationErrors.location_city && "border-red-300 focus:ring-red-500"
				)}
				aria-invalid={!!form.validationErrors.location_city}
				aria-describedby={form.validationErrors.location_city ? "location-error" : undefined}
			/>
			{#if showCitySuggestions}
				<div class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg" transition:fade>
					{#each citySuggestions as city}
						<button
							type="button"
							class="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2"
							onclick={() => selectCity(city)}
						>
							<MapPin class="w-3 h-3 text-gray-400" />
							{city}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		{#if form.validationErrors.location_city}
			<p id="location-error" class="mt-1 text-xs text-red-500 flex items-center gap-1" transition:slide>
				<AlertCircle class="w-3 h-3" />
				{form.validationErrors.location_city}
			</p>
		{/if}
		<p class="mt-1 text-xs text-gray-500">
			Buyers prefer shopping from sellers in their area
		</p>
	</div>
	
	<!-- Shipping Type Selection -->
	<div>
		<Label class="block mb-3">
			Shipping Method <span class="text-red-500">*</span>
		</Label>
		<div class="space-y-2">
			{#each shippingOptions as option}
				{@const Icon = option.icon}
				<label class={cn(
					"flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all",
					"hover:shadow-sm",
					form.formData.shipping_type === option.value 
						? "border-[#6BB6D8] bg-gradient-to-br from-blue-50 to-white" 
						: "border-gray-200 hover:border-gray-300"
				)}>
					<input
						type="radio"
						name="shipping_type"
						value={option.value}
						checked={form.formData.shipping_type === option.value}
						onchange={() => handleShippingTypeChange(option.value)}
						class="sr-only"
					/>
					<Icon class={cn(
						"w-5 h-5 mr-3",
						form.formData.shipping_type === option.value ? "text-[#6BB6D8]" : "text-gray-500"
					)} />
					<div class="flex-1">
						<div class={cn(
							"font-medium",
							form.formData.shipping_type === option.value && "text-blue-900"
						)}>{option.label}</div>
						<div class={cn(
							"text-sm",
							form.formData.shipping_type === option.value ? "text-blue-700" : "text-gray-600"
						)}>{option.description}</div>
					</div>
					<div class={cn(
						"text-sm font-medium",
						form.formData.shipping_type === option.value ? "text-[#4F9FC5]" : "text-gray-500"
					)}>{option.avgCost}</div>
				</label>
			{/each}
		</div>
		{#if form.validationErrors.shipping_type}
			<p class="mt-2 text-xs text-red-500 flex items-center gap-1">
				<AlertCircle class="w-3 h-3" />
				{form.validationErrors.shipping_type}
			</p>
		{/if}
	</div>
	
	<!-- Shipping Cost & Options (if not pickup) -->
	{#if form.formData.shipping_type !== 'pickup'}
		<div class="space-y-4" transition:slide>
			<div class="grid md:grid-cols-2 gap-4">
				<!-- Shipping Cost -->
				<div>
					<Label for="shipping_cost" class="text-sm font-medium mb-2">
						Shipping Cost
					</Label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
						<Input
							id="shipping_cost"
							type="text"
							value={shippingCostInput}
							oninput={handleShippingCostInput}
							placeholder="0.00"
							class="pl-8"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						Leave at $0.00 for free shipping
					</p>
				</div>
				
				<!-- Worldwide Shipping -->
				<div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
					<label class="flex items-center cursor-pointer space-x-3">
						<input
							type="checkbox"
							bind:checked={form.formData.ships_worldwide}
							class="w-4 h-4 text-[#6BB6D8] rounded focus:ring-[#6BB6D8] accent-[#6BB6D8]"
						/>
						<div>
							<div class="font-medium flex items-center gap-2 text-gray-900">
								<Globe class="w-4 h-4" />
								Ship worldwide
							</div>
							<p class="text-sm text-gray-600">
								Reach buyers globally and expand your market
							</p>
						</div>
					</label>
				</div>
			</div>
			
			<!-- Total Price Preview -->
			{#if form.formData.price > 0}
				<div class="bg-gray-50 rounded-lg p-4">
					<h4 class="font-medium mb-2">Buyer will pay:</h4>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span>Item price</span>
							<span>{formatPrice(form.formData.price)}</span>
						</div>
						{#if form.formData.shipping_cost > 0}
							<div class="flex justify-between">
								<span>Shipping</span>
								<span>{formatPrice(form.formData.shipping_cost)}</span>
							</div>
							<div class="border-t pt-1 mt-1">
								<div class="flex justify-between font-medium">
									<span>Total</span>
									<span>{formatPrice(totalWithShipping)}</span>
								</div>
							</div>
						{:else}
							<div class="text-green-600">
								✓ Free shipping
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Tags (Optional) -->
	<div>
		<Label for="tags" class="text-sm font-medium mb-2">
			Tags <span class="text-gray-500 text-xs">(optional, max 5)</span>
		</Label>
		<div class="space-y-2">
			{#if form.formData.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each form.formData.tags as tag, index}
						<span class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
							#{tag}
							<button
								type="button"
								onclick={() => removeTag(index)}
								class="text-gray-500 hover:text-gray-700"
							>
								<X class="w-3 h-3" />
							</button>
						</span>
					{/each}
				</div>
			{/if}
			{#if form.formData.tags.length < 5}
				<div class="flex gap-2">
					<Input
						id="tags"
						type="text"
						bind:value={tagInput}
						placeholder="Add tags like: vintage, streetwear, designer"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault()
								addTag(tagInput.trim())
							}
						}}
						class="flex-1"
					/>
					<button
						type="button"
						onclick={() => addTag(tagInput.trim())}
						disabled={!tagInput.trim() || form.formData.tags.length >= 5}
						class={cn(
							"px-4 py-2 rounded-lg font-medium transition-colors",
							tagInput.trim() && form.formData.tags.length < 5
								? "bg-gray-900 text-white hover:bg-gray-800"
								: "bg-gray-100 text-gray-400 cursor-not-allowed"
						)}
					>
						Add
					</button>
				</div>
			{/if}
		</div>
		<p class="mt-1 text-xs text-gray-500">
			Tags help buyers find your item when searching
		</p>
	</div>
	
	<!-- Final tips -->
	<div class="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-4">
		<h3 class="font-medium text-blue-900 mb-2">Almost done!</h3>
		<p class="text-sm text-blue-800 mb-3">
			You're just one step away from listing your item.
		</p>
		<ul class="space-y-2 text-sm text-blue-700 list-disc list-inside">
			<li>Your listing will be visible to thousands of buyers instantly</li>
			<li>You can always edit your listing later if needed</li>
			<li>Get notifications when buyers message you</li>
		</ul>
	</div>
</div>