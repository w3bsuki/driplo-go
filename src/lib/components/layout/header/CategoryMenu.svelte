<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { DropdownMenu } from '$lib/components/ui';
	import * as m from '$lib/paraglide/messages.js';
	
	interface Category {
		id: string;
		name: string;
		slug: string;
		emoji?: string;
		subcategories?: Category[];
	}
	
	interface CategoryMenuProps {
		categories?: Category[];
		currentCategoryId?: string;
		onCategorySelect?: (category: Category) => void;
		class?: string;
	}
	
	let {
		categories = [],
		currentCategoryId,
		onCategorySelect,
		class: className = ''
	}: CategoryMenuProps = $props();
	
	// Sample categories if none provided
	const defaultCategories: Category[] = [
		{ id: '1', name: 'Women', slug: 'women', emoji: '👗' },
		{ id: '2', name: 'Men', slug: 'men', emoji: '👔' },
		{ id: '3', name: 'Accessories', slug: 'accessories', emoji: '👜' },
		{ id: '4', name: 'Shoes', slug: 'shoes', emoji: '👟' },
		{ id: '5', name: 'Jewelry', slug: 'jewelry', emoji: '💍' }
	];
	
	const displayCategories = categories.length > 0 ? categories : defaultCategories;
	const currentCategory = displayCategories.find(cat => cat.id === currentCategoryId);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger 
		class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-sm hover:bg-muted transition-colors {className}"
	>
		<span>{currentCategory?.name || 'Categories'}</span>
		<ChevronDown class="h-4 w-4" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start" class="w-56">
		<DropdownMenu.Label>Shop by Category</DropdownMenu.Label>
		<DropdownMenu.Separator />
		{#each displayCategories as category}
			<DropdownMenu.Item
				onclick={() => onCategorySelect?.(category)}
				class="cursor-pointer"
			>
				<span class="mr-2">{category.emoji || '📦'}</span>
				{category.name}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
</script>