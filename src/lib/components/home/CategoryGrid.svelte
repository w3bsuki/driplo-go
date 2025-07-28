<script lang="ts">
	const categories = [
		{
			name: 'Women',
			href: '/browse?category=women',
			image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop',
			count: '2.3M items'
		},
		{
			name: 'Men',
			href: '/browse?category=men',
			image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&h=500&fit=crop',
			count: '1.8M items'
		},
		{
			name: 'Kids',
			href: '/browse?category=kids',
			image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=500&fit=crop',
			count: '982K items'
		},
		{
			name: 'Designer',
			href: '/browse?category=designer',
			image: 'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=400&h=500&fit=crop',
			count: '156K items'
		},
		{
			name: 'Shoes',
			href: '/browse?category=shoes',
			image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop',
			count: '743K items'
		},
		{
			name: 'Accessories',
			href: '/browse?category=accessories',
			image: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=400&h=500&fit=crop',
			count: '421K items'
		}
	];
</script>

<section class="py-3">
	<div class="container px-2">
		<h2 class="text-base font-semibold mb-3">Browse by style</h2>
		
		<!-- Desktop: Horizontal scrollable categories -->
		<div class="hidden md:block">
			<div class="flex items-center space-x-2 overflow-x-auto pb-2">
				{#each categories as category}
					<a 
						href={category.href}
						class="group flex-shrink-0 text-center"
					>
						<div class="w-10 h-10 mx-auto mb-1 overflow-hidden rounded-sm bg-muted">
							<img
								src={category.image}
								alt={category.name}
								class="h-full w-full object-cover transition-transform duration-100 group-hover:scale-110"
								loading="lazy"
							/>
						</div>
						<h3 class="text-xs font-medium">{category.name}</h3>
					</a>
				{/each}
			</div>
		</div>

		<!-- Mobile: Horizontal scroll (like main categories) -->
		<div class="md:hidden">
			<div class="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
				{#each categories as category}
					<a 
						href={category.href}
						class="group flex-shrink-0 text-center"
					>
						<div class="w-10 h-10 mx-auto mb-1 overflow-hidden rounded-sm bg-muted">
							<img
								src={category.image}
								alt={category.name}
								class="h-full w-full object-cover transition-transform duration-100 group-hover:scale-110"
								loading="lazy"
							/>
						</div>
						<h3 class="text-xs font-medium whitespace-nowrap">{category.name}</h3>
					</a>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>