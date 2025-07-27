<script>
  import Button from '$lib/components/ui/button.svelte';
  import { ChevronRight, Download, Heart, Plus, Settings, Trash2 } from 'lucide-svelte';
  
  const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
  const sizes = ['xs', 'sm', 'default', 'lg', 'xl'];
</script>

<div class="space-y-8 w-full max-w-4xl">
  <!-- Variants Section -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Variants</h3>
    <div class="flex flex-wrap gap-3">
      {#each variants as variant}
        <Button {variant}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Button>
      {/each}
    </div>
  </section>

  <!-- Sizes Section -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Sizes</h3>
    <div class="flex flex-wrap items-center gap-3">
      {#each sizes as size}
        <Button {size}>
          {size === 'default' ? 'Default' : size.toUpperCase()}
        </Button>
      {/each}
      <Button size="icon">
        <Settings class="h-4 w-4" />
      </Button>
    </div>
  </section>

  <!-- With Icons Section -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">With Icons</h3>
    <div class="flex flex-wrap gap-3">
      <Button>
        <Plus class="mr-2 h-4 w-4" />
        Add Item
      </Button>
      <Button variant="secondary">
        <Download class="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button variant="destructive">
        <Trash2 class="mr-2 h-4 w-4" />
        Delete
      </Button>
      <Button variant="outline">
        Continue
        <ChevronRight class="ml-2 h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Heart class="h-4 w-4" />
      </Button>
    </div>
  </section>

  <!-- States Section -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">States</h3>
    <div class="flex flex-wrap gap-3">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button class="animate-pulse">Loading...</Button>
    </div>
  </section>

  <!-- Full Width Section -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Full Width</h3>
    <div class="space-y-2 max-w-sm">
      <Button class="w-full">Full Width Button</Button>
      <Button variant="outline" class="w-full">Full Width Outline</Button>
    </div>
  </section>

  <!-- Button Groups Section -->
  <section>
    <h3 class="text-lg font-semibold mb-4 text-gray-900">Button Groups</h3>
    <div class="space-y-3">
      <div class="flex gap-2">
        <Button variant="outline">Previous</Button>
        <Button>Next</Button>
      </div>
      <div class="inline-flex rounded-lg shadow-sm">
        <Button variant="outline" class="rounded-r-none">Left</Button>
        <Button variant="outline" class="rounded-none border-x-0">Center</Button>
        <Button variant="outline" class="rounded-l-none">Right</Button>
      </div>
    </div>
  </section>
</div>

<style>
  :global(.space-y-8 > * + *) {
    margin-top: 2rem;
  }
  :global(.space-y-3 > * + *) {
    margin-top: 0.75rem;
  }
  :global(.space-y-2 > * + *) {
    margin-top: 0.5rem;
  }
</style>