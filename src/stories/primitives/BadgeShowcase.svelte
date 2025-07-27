<script>
  import Badge from '$lib/components/ui/badge.svelte';
  import { Check, X, AlertCircle, Clock, TrendingUp, Star, Heart } from 'lucide-svelte';
  
  const variants = ['default', 'secondary', 'destructive', 'outline'];
  
  const statuses = [
    { label: 'Active', variant: 'default', icon: Check },
    { label: 'Pending', variant: 'secondary', icon: Clock },
    { label: 'Error', variant: 'destructive', icon: X },
    { label: 'Draft', variant: 'outline', icon: AlertCircle }
  ];
  
  const categories = [
    'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Toys'
  ];
  
  const features = [
    { label: 'New', variant: 'default' },
    { label: 'Beta', variant: 'secondary' },
    { label: 'Pro', variant: 'default' },
    { label: 'Coming Soon', variant: 'outline' }
  ];
</script>

<div class="space-y-8 w-full max-w-4xl">
  <!-- Basic Variants -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
    <div class="flex flex-wrap gap-2">
      {#each variants as variant}
        <Badge {variant}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Badge>
      {/each}
    </div>
  </section>

  <!-- Status Badges -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Status Indicators</h3>
    <div class="flex flex-wrap gap-2">
      {#each statuses as status}
        <Badge variant={status.variant}>
          <svelte:component this={status.icon} class="mr-1 h-3 w-3" />
          {status.label}
        </Badge>
      {/each}
    </div>
  </section>

  <!-- Category Badges -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Categories</h3>
    <div class="flex flex-wrap gap-2">
      {#each categories as category}
        <Badge variant="secondary">{category}</Badge>
      {/each}
    </div>
  </section>

  <!-- Feature Badges -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Feature Flags</h3>
    <div class="flex flex-wrap gap-2">
      {#each features as feature}
        <Badge variant={feature.variant}>{feature.label}</Badge>
      {/each}
    </div>
  </section>

  <!-- Count Badges -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Counts & Numbers</h3>
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Messages</span>
        <Badge>12</Badge>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Notifications</span>
        <Badge variant="destructive">3</Badge>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Updates</span>
        <Badge variant="secondary">99+</Badge>
      </div>
    </div>
  </section>

  <!-- Sizes -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Custom Sizes</h3>
    <div class="flex flex-wrap items-center gap-3">
      <Badge class="text-xs py-0 px-2">Extra Small</Badge>
      <Badge>Default</Badge>
      <Badge class="text-base py-1 px-3">Large</Badge>
    </div>
  </section>

  <!-- With Icons -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">With Icons</h3>
    <div class="flex flex-wrap gap-2">
      <Badge>
        <Star class="mr-1 h-3 w-3" />
        Featured
      </Badge>
      <Badge variant="secondary">
        <TrendingUp class="mr-1 h-3 w-3" />
        Trending
      </Badge>
      <Badge variant="destructive">
        <Heart class="mr-1 h-3 w-3" />
        Popular
      </Badge>
    </div>
  </section>

  <!-- In Context -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">In Context</h3>
    <div class="space-y-4">
      <!-- Product Card Example -->
      <div class="border rounded-lg p-4 bg-white">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium">Premium Leather Jacket</h4>
          <Badge variant="destructive">Sale</Badge>
        </div>
        <p class="text-sm text-gray-600 mb-3">High-quality genuine leather jacket with modern design</p>
        <div class="flex gap-2">
          <Badge variant="outline">Size: M</Badge>
          <Badge variant="outline">Black</Badge>
          <Badge>Free Shipping</Badge>
        </div>
      </div>
      
      <!-- User Profile Example -->
      <div class="border rounded-lg p-4 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-medium">Jane Doe</h4>
              <Badge variant="secondary">Pro</Badge>
              <Badge>Verified</Badge>
            </div>
            <p class="text-sm text-gray-600">Member since 2022</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  :global(.space-y-8 > * + *) {
    margin-top: 2rem;
  }
  :global(.space-y-4 > * + *) {
    margin-top: 1rem;
  }
</style>