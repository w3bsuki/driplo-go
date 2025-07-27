<script lang="ts">
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import type { Category } from '$lib/types';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	interface Props {
		categories?: Category[];
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}

	let { 
		categories = [], 
		open = false,
		onOpenChange = () => {}
	}: Props = $props();

	let activeTab = $state('gender');

	// Popular brands
	const popularBrands = [
		{ name: 'Nike', emoji: '👟' },
		{ name: 'Adidas', emoji: '⚡' },
		{ name: 'Zara', emoji: '👗' },
		{ name: 'H&M', emoji: '🛍️' },
		{ name: 'Gucci', emoji: '💎' },
		{ name: 'Prada', emoji: '👜' },
		{ name: 'Versace', emoji: '✨' },
		{ name: 'Balenciaga', emoji: '🔥' },
		{ name: 'Louis Vuitton', emoji: '💼' },
		{ name: 'Chanel', emoji: '🌹' },
		{ name: 'Dior', emoji: '💐' },
		{ name: 'Burberry', emoji: '🧥' }
	];

	// Popular collections
	const collections = [
		{ slug: 'shoes', name: m.subcategory_shoes(), icon: '👟' },
		{ slug: 'bags', name: m.subcategory_bags(), icon: '👜' },
		{ slug: 'dresses', name: m.subcategory_dresses(), icon: '👗' },
		{ slug: 'jackets', name: m.subcategory_jackets(), icon: '🧥' },
		{ slug: 'accessories', name: m.subcategory_accessories(), icon: '💍' },
		{ slug: 'jeans', name: m.subcategory_jeans(), icon: '👖' },
		{ slug: 'tshirts', name: m.subcategory_tshirts(), icon: '👕' },
		{ slug: 'vintage', name: m.designer_vintage_pieces(), icon: '🕰️' },
		{ slug: 'new', name: m.category_new_arrivals(), icon: '✨' },
		{ slug: 'sale', name: m.category_sale_items(), icon: '🔥' }
	];

	// Gender categories
	const genderCategories = [
		{ slug: 'women', name: m.category_women(), icon: '👩' },
		{ slug: 'men', name: m.category_men(), icon: '👨' },
		{ slug: 'kids', name: m.category_kids(), icon: '👶' },
		{ slug: '', name: m.category_all(), icon: '🔍' }
	];

	function handleNavigation(url: string) {
		onOpenChange(false);
		goto(url);
	}
</script>

<Sheet.Root bind:open={open} onOpenChange={onOpenChange}>
	<Sheet.Content side="bottom" class="h-[80vh] p-0">
		<Sheet.Header class="px-4 py-3 border-b">
			<Sheet.Title class="text-base font-semibold">{m.header_categories()}</Sheet.Title>
		</Sheet.Header>
		
		<Tabs bind:value={activeTab} class="flex flex-col h-full">
			<TabsList class="w-full rounded-none border-b h-12 grid grid-cols-3 gap-0">
				<TabsTrigger value="gender" class="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
					<span class="text-sm font-medium">{m.category_women()} / {m.category_men()}</span>
				</TabsTrigger>
				<TabsTrigger value="collections" class="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
					<span class="text-sm font-medium">{m.category_all()}</span>
				</TabsTrigger>
				<TabsTrigger value="brands" class="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
					<span class="text-sm font-medium">{m.filter_brand()}</span>
				</TabsTrigger>
			</TabsList>
			
			<div class="flex-1 overflow-y-auto">
				<TabsContent value="gender" class="m-0 p-4">
					<div class="grid grid-cols-2 gap-3">
						{#each genderCategories as category}
							<button
								onclick={() => handleNavigation(category.slug ? `/${category.slug}` : '/browse')}
								class="flex flex-col items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<span class="text-4xl">{category.icon}</span>
								<span class="text-sm font-medium text-gray-900">{category.name}</span>
							</button>
						{/each}
					</div>
				</TabsContent>
				
				<TabsContent value="collections" class="m-0 p-4">
					<div class="grid grid-cols-2 gap-3">
						{#each collections as collection}
							<button
								onclick={() => {
									if (collection.slug === 'sale') {
										handleNavigation('/browse?filter=sale');
									} else if (collection.slug === 'new') {
										handleNavigation('/browse?sort=created_at&order=desc');
									} else {
										handleNavigation(`/browse?category=${collection.slug}`);
									}
								}}
								class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<span class="text-2xl">{collection.icon}</span>
								<span class="text-sm font-medium text-gray-900">{collection.name}</span>
							</button>
						{/each}
					</div>
				</TabsContent>
				
				<TabsContent value="brands" class="m-0 p-4">
					<div class="grid grid-cols-2 gap-3">
						{#each popularBrands as brand}
							<button
								onclick={() => handleNavigation(`/browse?brand=${encodeURIComponent(brand.name)}`)}
								class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<span class="text-2xl">{brand.emoji}</span>
								<span class="text-sm font-medium text-gray-900">{brand.name}</span>
							</button>
						{/each}
					</div>
					<div class="mt-4">
						<button
							onclick={() => handleNavigation('/brands')}
							class="w-full py-3 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
						>
							{m.category_browse_all_link()} →
						</button>
					</div>
				</TabsContent>
			</div>
		</Tabs>
	</Sheet.Content>
</Sheet.Root>