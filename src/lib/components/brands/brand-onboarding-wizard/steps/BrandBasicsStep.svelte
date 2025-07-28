<script lang="ts">
	import { Building2, Type, FileText } from 'lucide-svelte';

	interface Props {
		brandName: string;
		brandCategory: string;
		brandDescription: string;
		onUpdate: (updates: { brandName?: string; brandCategory?: string; brandDescription?: string }) => void;
		disabled?: boolean;
	}

	let { brandName, brandCategory, brandDescription, onUpdate, disabled = false }: Props = $props();

	// Predefined brand categories
	const brandCategories = [
		'Fashion & Apparel',
		'Beauty & Cosmetics',
		'Technology',
		'Food & Beverage',
		'Health & Wellness',
		'Sports & Fitness',
		'Home & Garden',
		'Travel & Tourism',
		'Education',
		'Entertainment',
		'Finance',
		'Real Estate',
		'Automotive',
		'Art & Design',
		'Photography',
		'Music',
		'Other'
	];

	function updateBrandName(value: string) {
		onUpdate({ brandName: value });
	}

	function updateBrandCategory(value: string) {
		onUpdate({ brandCategory: value });
	}

	function updateBrandDescription(value: string) {
		onUpdate({ brandDescription: value });
	}
</script>

<!-- Brand Basics Step -->
<div class="space-y-6">
	<!-- Step Introduction -->
	<div class="text-center">
		<div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
			<Building2 class="w-6 h-6 text-brand-600" />
		</div>
		<h3 class="text-lg font-medium text-gray-900">Tell us about your brand</h3>
		<p class="mt-2 text-sm text-gray-600">
			Let's start with the basics. This information will help people discover and understand your brand.
		</p>
	</div>

	<!-- Brand Name -->
	<div class="space-y-2">
		<label for="brand-name" class="block text-sm font-medium text-gray-700">
			<div class="flex items-center space-x-2">
				<Type class="w-4 h-4 text-gray-500" />
				<span>Brand Name <span class="text-red-500">*</span></span>
			</div>
		</label>
		<input
			id="brand-name"
			type="text"
			value={brandName}
			oninput={(e) => updateBrandName(e.currentTarget.value)}
			placeholder="Enter your brand name"
			{disabled}
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
			maxlength="50"
		/>
		<div class="flex justify-between">
			<p class="text-xs text-gray-500">Choose a memorable name that represents your brand</p>
			<span class="text-xs text-gray-400">{brandName.length}/50</span>
		</div>
	</div>

	<!-- Brand Category -->
	<div class="space-y-2">
		<label for="brand-category" class="block text-sm font-medium text-gray-700">
			<div class="flex items-center space-x-2">
				<Building2 class="w-4 h-4 text-gray-500" />
				<span>Brand Category <span class="text-red-500">*</span></span>
			</div>
		</label>
		<select
			id="brand-category"
			value={brandCategory}
			onchange={(e) => updateBrandCategory(e.currentTarget.value)}
			{disabled}
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
		>
			<option value="">Select a category</option>
			{#each brandCategories as category}
				<option value={category}>{category}</option>
			{/each}
		</select>
		<p class="text-xs text-gray-500">This helps people find brands like yours</p>
	</div>

	<!-- Brand Description -->
	<div class="space-y-2">
		<label for="brand-description" class="block text-sm font-medium text-gray-700">
			<div class="flex items-center space-x-2">
				<FileText class="w-4 h-4 text-gray-500" />
				<span>Brand Description <span class="text-red-500">*</span></span>
			</div>
		</label>
		<textarea
			id="brand-description"
			value={brandDescription}
			oninput={(e) => updateBrandDescription(e.currentTarget.value)}
			placeholder="Describe what your brand is about, what makes it unique, and what you offer..."
			{disabled}
			rows="4"
			class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors resize-none"
			maxlength="500"
		></textarea>
		<div class="flex justify-between">
			<p class="text-xs text-gray-500">
				{#if brandDescription.length < 10}
					Tell people what your brand is about (minimum 10 characters)
				{:else}
					Great! This description will help people understand your brand
				{/if}
			</p>
			<span class="text-xs text-gray-400">{brandDescription.length}/500</span>
		</div>
	</div>

	<!-- Tips Section -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
		<h4 class="text-sm font-medium text-blue-900 mb-2">💡 Tips for a great brand profile</h4>
		<ul class="text-xs text-blue-800 space-y-1">
			<li>• Keep your brand name short and memorable</li>
			<li>• Choose the category that best represents your main focus</li>
			<li>• Write a description that clearly explains what you do</li>
			<li>• Mention what makes your brand special or different</li>
		</ul>
	</div>

	<!-- Character Count Warnings -->
	{#if brandName.length > 40}
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
			<p class="text-xs text-amber-800">
				⚠️ Consider a shorter brand name for better memorability
			</p>
		</div>
	{/if}

	{#if brandDescription.length > 400}
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
			<p class="text-xs text-amber-800">
				⚠️ Consider keeping your description more concise for better readability
			</p>
		</div>
	{/if}
</div>

<style>
	/* Custom focus styles for better accessibility */
	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
	}

	/* Character count color coding */
	.text-warning {
		color: #d97706;
	}

	.text-danger {
		color: #dc2626;
	}

	/* Smooth transitions */
	input,
	select,
	textarea {
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	/* Placeholder styling */
	input::placeholder,
	textarea::placeholder {
		color: #9ca3af;
		font-style: italic;
	}
</style>