<script>
  import ListingCard from '$lib/components/listings/ListingCard.svelte';
  
  // Sample listings data
  const listings = [
    {
      id: '1',
      title: 'Vintage Denim Jacket',
      price: 89.99,
      size: 'M',
      brand: 'Levi\'s',
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop',
      seller: {
        username: 'vintagelover',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vintagelover',
        is_verified: true
      },
      likes: 24,
      isLiked: false,
      condition: 'excellent'
    },
    {
      id: '2',
      title: 'Designer Silk Dress',
      price: 299.99,
      size: 'S',
      brand: 'Gucci',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
      seller: {
        username: 'gucci_official',
        account_type: 'brand',
        is_verified: true
      },
      likes: 156,
      isLiked: true,
      condition: 'new_with_tags'
    },
    {
      id: '3',
      title: 'Leather Ankle Boots',
      price: 120.00,
      size: '38',
      brand: 'Dr. Martens',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop',
      seller: {
        username: 'shoecollector'
      },
      likes: 8,
      isLiked: false,
      condition: 'good'
    },
    {
      id: '4',
      title: 'Cashmere Sweater',
      price: 180.00,
      size: 'M',
      brand: 'Cos',
      image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=400&fit=crop',
      seller: {
        username: 'luxuryfashion',
        is_verified: true
      },
      likes: 67,
      isLiked: false,
      condition: 'new_without_tags'
    },
    {
      id: '5',
      title: 'Vintage Band T-Shirt',
      price: 45.00,
      size: 'L',
      brand: 'Unknown',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
      seller: {
        username: 'retrofinds'
      },
      likes: 3,
      isLiked: false,
      condition: 'fair'
    },
    {
      id: '6',
      title: 'Designer Handbag with Gold Hardware',
      price: 850.00,
      brand: 'Chanel',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
      seller: {
        username: 'luxuryreseller',
        account_type: 'professional',
        is_verified: true
      },
      likes: 234,
      isLiked: true,
      condition: 'excellent'
    }
  ];
  
  const conditions = ['new_with_tags', 'new_without_tags', 'excellent', 'good', 'fair'];
</script>

<div class="space-y-8 w-full">
  <!-- Grid Layout -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Grid Layout</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {#each listings as listing}
        <ListingCard {...listing} />
      {/each}
    </div>
  </section>

  <!-- Different Conditions -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Condition States</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {#each conditions as condition, i}
        <ListingCard
          id={`condition-${i}`}
          title="Sample Item"
          price={99.99}
          size="M"
          brand="Brand"
          image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"
          seller={{ username: 'seller' }}
          {condition}
        />
      {/each}
    </div>
  </section>

  <!-- Different States -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Interactive States</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p class="text-sm text-gray-600 mb-2">Default</p>
        <ListingCard
          id="state-1"
          title="Regular Item"
          price={49.99}
          size="M"
          image="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop"
          seller={{ username: 'seller' }}
        />
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-2">Liked</p>
        <ListingCard
          id="state-2"
          title="Liked Item"
          price={49.99}
          size="M"
          image="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop"
          seller={{ username: 'seller' }}
          likes={15}
          isLiked={true}
        />
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-2">Verified Seller</p>
        <ListingCard
          id="state-3"
          title="From Verified"
          price={49.99}
          size="M"
          image="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"
          seller={{ username: 'verified', is_verified: true }}
        />
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-2">Brand Account</p>
        <ListingCard
          id="state-4"
          title="Official Product"
          price={149.99}
          size="M"
          brand="Nike"
          image="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=400&fit=crop"
          seller={{ username: 'nike_official', account_type: 'brand', is_verified: true }}
        />
      </div>
    </div>
  </section>

  <!-- Edge Cases -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Edge Cases</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <p class="text-sm text-gray-600 mb-2">No Image</p>
        <ListingCard
          id="edge-1"
          title="Item without image"
          price={29.99}
          size="M"
          image=""
          seller={{ username: 'seller' }}
        />
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-2">Long Title</p>
        <ListingCard
          id="edge-2"
          title="This is a very long title that should be truncated when it exceeds the available space in the card"
          price={99.99}
          size="M"
          image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"
          seller={{ username: 'longusername123' }}
        />
      </div>
      <div>
        <p class="text-sm text-gray-600 mb-2">High Price</p>
        <ListingCard
          id="edge-3"
          title="Luxury Item"
          price={9999.99}
          brand="Hermès"
          image="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop"
          seller={{ username: 'luxury' }}
          likes={999}
        />
      </div>
    </div>
  </section>

  <!-- Mobile View -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Mobile View (2 columns)</h3>
    <div class="max-w-md">
      <div class="grid grid-cols-2 gap-3">
        {#each listings.slice(0, 4) as listing}
          <ListingCard {...listing} />
        {/each}
      </div>
    </div>
  </section>
</div>

<style>
  :global(.space-y-8 > * + *) {
    margin-top: 2rem;
  }
</style>