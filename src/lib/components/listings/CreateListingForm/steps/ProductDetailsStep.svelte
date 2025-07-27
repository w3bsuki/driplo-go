<script lang="ts">
	import { getFormContext } from '../FormContext.svelte.ts'
	import { validateField, getSuggestions, sanitizeInput } from '../utils/validation'
	import { cn } from '$lib/utils'
	import { fade, slide } from 'svelte/transition'
	import Input from '$lib/components/ui/input.svelte'
	import Textarea from '$lib/components/ui/textarea.svelte'
	import { Label } from '$lib/components/ui'
	import { AlertCircle, Info } from 'lucide-svelte'
	
	const form = getFormContext()
	
	// Local state for suggestions
	let showCategorySuggestions = $state(false)
	let categorySearch = $state('')
	
	// Filtered categories based on search
	const filteredCategories = $derived(
		categorySearch
			? form.categories.filter(cat => 
				cat.name.toLowerCase().includes(categorySearch.toLowerCase())
			)
			: form.categories
	)
	
	// Character counts
	const titleCharCount = $derived(form.formData.title.length)
	const descriptionCharCount = $derived(form.formData.description.length)
	
	// Handle category selection
	function selectCategory(categoryId: string) {
		form.updateField('category_id', categoryId)
		showCategorySuggestions = false
		categorySearch = ''
		
		// Load subcategories
		loadSubcategories(categoryId)
	}
	
	// Load subcategories for selected category
	async function loadSubcategories(categoryId: string) {
		try {
			const res = await fetch(`/api/categories/${categoryId}/subcategories`)
			if (res.ok) {
				const subcategories = await res.json()
				form.setSubcategories(subcategories)
			}
		} catch (error) {
			console.error('Failed to load subcategories:', error)
		}
	}
	
	// Get selected category name
	const selectedCategory = $derived(
		form.categories.find(cat => cat.id === form.formData.category_id)
	)
	
	// Real-time validation with debouncing
	let titleTimeout: NodeJS.Timeout
	let descriptionTimeout: NodeJS.Timeout
	
	function handleTitleInput(e: Event) {
		const input = e.target as HTMLInputElement
		const value = sanitizeInput(input.value)
		form.updateField('title', value)
		
		clearTimeout(titleTimeout)
		titleTimeout = setTimeout(() => {
			const error = validateField('title', value)
			if (error) {
				form.setFieldError('title', error)
			} else {
				form.clearFieldError('title')
			}
		}, 300)
	}
	
	function handleDescriptionInput(e: Event) {
		const input = e.target as HTMLTextAreaElement
		const value = sanitizeInput(input.value)
		form.updateField('description', value)
		
		clearTimeout(descriptionTimeout)
		descriptionTimeout = setTimeout(() => {
			const error = validateField('description', value)
			if (error) {
				form.setFieldError('description', error)
			} else {
				form.clearFieldError('description')
			}
		}, 300)
	}
	
	// Auto-save draft when user stops typing
	$effect(() => {
		if (form.hasUnsavedChanges) {
			const timeout = setTimeout(() => {
				form.saveDraft()
			}, 2000)
			
			return () => clearTimeout(timeout)
		}
	})
</script>

<div class="space-y-8">
	<!-- Step Header -->
	<div>
		<h2 class="text-xl sm:text-2xl font-bold mb-2">📝 Product Details</h2>
		<p class="text-sm sm:text-base text-gray-600">Tell buyers about what you're selling</p>
	</div>
	
	<!-- Title Field -->
	<div>
		<Label for="title" class="block mb-3">
			Title <span class="text-red-500">*</span>
		</Label>
		<div class="relative">
			<Input
				id="title"
				type="text"
				value={form.formData.title}
				oninput={handleTitleInput}
				maxlength={100}
				placeholder="e.g., Nike Air Max 90 - Size 10"
				class={cn(
					"w-full pr-16",
					form.validationErrors.title && "border-red-300 focus:ring-red-500"
				)}
				aria-invalid={!!form.validationErrors.title}
				aria-describedby={form.validationErrors.title ? "title-error" : undefined}
			/>
			<span class={cn(
				"absolute right-3 top-1/2 -translate-y-1/2 text-xs",
				titleCharCount > 80 ? "text-orange-500" : "text-gray-500"
			)}>
				{titleCharCount}/100
			</span>
		</div>
		{#if form.validationErrors.title}
			<p id="title-error" class="mt-1 text-xs text-red-500 flex items-center gap-1" transition:slide>
				<AlertCircle class="w-3 h-3" />
				{form.validationErrors.title}
			</p>
		{/if}
		{#if titleCharCount > 0 && titleCharCount < 20}
			<p class="mt-1 text-xs text-gray-500 flex items-center gap-1">
				<Info class="w-3 h-3" />
				Add more details to help buyers find your item
			</p>
		{/if}
	</div>
	
	<!-- Category Selection -->
	<div class="grid md:grid-cols-2 gap-6">
		<div>
			<Label for="category" class="block mb-3">
				Category <span class="text-red-500">*</span>
			</Label>
			<div class="relative">
				<div 
					class={cn(
						"w-full px-4 py-3 min-h-[48px] border rounded-lg cursor-pointer",
						"hover:border-gray-400 transition-colors",
						"flex items-center justify-between",
						"active:bg-gray-50", // Touch feedback
						form.validationErrors.category_id && "border-red-300",
						selectedCategory ? "text-gray-900" : "text-gray-500"
					)}
					onclick={() => showCategorySuggestions = !showCategorySuggestions}
					role="combobox"
					aria-expanded={showCategorySuggestions}
					aria-haspopup="listbox"
				>
					<span class="text-sm sm:text-base">{selectedCategory?.name || 'Select category'}</span>
					<svg class={cn(
						"w-4 h-4 text-gray-400 transition-transform",
						showCategorySuggestions && "rotate-180"
					)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</div>
				
				{#if showCategorySuggestions}
					<div 
						class={cn(
							"absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-auto",
							"max-h-[50vh] sm:max-h-60" // Better mobile height
						)}
						transition:fade={{ duration: 150 }}
					>
						<div class="sticky top-0 bg-white border-b p-2">
							<Input
								type="text"
								bind:value={categorySearch}
								placeholder="Search categories..."
								class="w-full text-sm"
								onclick={(e: Event) => e.stopPropagation()}
							/>
						</div>
						<ul role="listbox">
							{#each filteredCategories as category}
								<li>
									<button
										type="button"
										class={cn(
											"w-full px-4 py-4 sm:py-3 text-left hover:bg-gray-50",
											"transition-colors text-sm sm:text-base",
											"active:bg-gray-100", // Touch feedback
											form.formData.category_id === category.id && "bg-blue-50 text-blue-600"
										)}
										onclick={() => selectCategory(category.id)}
										role="option"
										aria-selected={form.formData.category_id === category.id}
									>
										{category.name}
										{#if category.description}
											<span class="text-xs text-gray-500 block mt-0.5">{category.description}</span>
										{/if}
									</button>
								</li>
							{/each}
							{#if filteredCategories.length === 0}
								<li class="px-4 py-3 text-gray-500 text-sm">No categories found</li>
							{/if}
						</ul>
					</div>
				{/if}
			</div>
			{#if form.validationErrors.category_id}
				<p class="mt-1 text-xs text-red-500 flex items-center gap-1" transition:slide>
					<AlertCircle class="w-3 h-3" />
					{form.validationErrors.category_id}
				</p>
			{/if}
		</div>
		
		<!-- Subcategory (if available) -->
		{#if form.subcategories.length > 0}
			<div transition:slide>
				<Label for="subcategory" class="block mb-3">
					Subcategory <span class="text-gray-500 text-xs">(optional)</span>
				</Label>
				<select
					id="subcategory"
					bind:value={form.formData.subcategory_id}
					class="w-full px-4 py-3 min-h-12 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">Select subcategory</option>
					{#each form.subcategories as subcategory}
						<option value={subcategory.id}>{subcategory?.name || 'Unnamed'}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>
	
	<!-- Description -->
	<div>
		<Label for="description" class="block mb-3">
			Description <span class="text-red-500">*</span>
		</Label>
		<Textarea
			id="description"
			value={form.formData.description}
			oninput={handleDescriptionInput}
			maxlength={2000}
			rows={4}
			placeholder="Describe your item - include condition details, measurements, any flaws, and why you're selling..."
			class={cn(
				"w-full resize-none",
				form.validationErrors.description && "border-red-300 focus:ring-red-500"
			)}
			aria-invalid={!!form.validationErrors.description}
			aria-describedby={form.validationErrors.description ? "description-error" : undefined}
		/>
		<div class="flex justify-between items-start mt-1">
			<div class="flex-1">
				{#if form.validationErrors.description}
					<p id="description-error" class="text-xs text-red-500 flex items-center gap-1" transition:slide>
						<AlertCircle class="w-3 h-3" />
						{form.validationErrors.description}
					</p>
				{:else if descriptionCharCount > 0 && descriptionCharCount < 50}
					<p class="text-xs text-gray-500">
						Add more details to help buyers understand your item
					</p>
				{/if}
			</div>
			<span class={cn(
				"text-xs ml-2",
				descriptionCharCount > 1800 ? "text-orange-500" : "text-gray-500"
			)}>
				{descriptionCharCount}/2000
			</span>
		</div>
	</div>
	
	<!-- Tips Section -->
	<div class="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
		<h3 class="font-medium text-purple-900 mb-2 flex items-center gap-2">
			💡 Pro Tips for Great Listings
		</h3>
		<ul class="text-sm text-purple-800 space-y-1.5">
			<li>🔍 Use specific keywords buyers might search for</li>
			<li>🏷️ Mention brand, size, color, and condition clearly</li>
			<li>📏 Include measurements for clothing items</li>
			<li>✨ Be honest about any flaws or imperfections</li>
		</ul>
	</div>
	
	<!-- Auto-save indicator -->
	{#if form.isAutoSaving}
		<div class="text-xs text-gray-500 flex items-center gap-2" transition:fade>
			<div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
			Saving draft...
		</div>
	{:else if form.lastSaved}
		<div class="text-xs text-gray-500" transition:fade>
			Draft saved {new Date(form.lastSaved).toLocaleTimeString()}
		</div>
	{/if}
</div>