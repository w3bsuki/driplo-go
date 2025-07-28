<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  
  const spacingScale = [
    { name: 'space-0', class: 'w-0', size: '0px' },
    { name: 'space-0.5', class: 'w-0.5', size: '0.125rem / 2px' },
    { name: 'space-1', class: 'w-1', size: '0.25rem / 4px' },
    { name: 'space-1.5', class: 'w-1.5', size: '0.375rem / 6px' },
    { name: 'space-2', class: 'w-2', size: '0.5rem / 8px' },
    { name: 'space-2.5', class: 'w-2.5', size: '0.625rem / 10px' },
    { name: 'space-3', class: 'w-3', size: '0.75rem / 12px' },
    { name: 'space-4', class: 'w-4', size: '1rem / 16px' },
    { name: 'space-5', class: 'w-5', size: '1.25rem / 20px' },
    { name: 'space-6', class: 'w-6', size: '1.5rem / 24px' },
    { name: 'space-8', class: 'w-8', size: '2rem / 32px' },
    { name: 'space-10', class: 'w-10', size: '2.5rem / 40px' },
    { name: 'space-12', class: 'w-12', size: '3rem / 48px' },
    { name: 'space-16', class: 'w-16', size: '4rem / 64px' },
    { name: 'space-20', class: 'w-20', size: '5rem / 80px' },
    { name: 'space-24', class: 'w-24', size: '6rem / 96px' },
  ];
  
  const borderRadius = [
    { name: 'rounded-none', class: 'rounded-none', size: '0px' },
    { name: 'rounded-sm', class: 'rounded-sm', size: '0.125rem / 2px' },
    { name: 'rounded', class: 'rounded', size: '0.25rem / 4px' },
    { name: 'rounded-md', class: 'rounded-md', size: '0.375rem / 6px' },
    { name: 'rounded-lg', class: 'rounded-lg', size: '0.5rem / 8px' },
    { name: 'rounded-xl', class: 'rounded-xl', size: '0.75rem / 12px' },
    { name: 'rounded-2xl', class: 'rounded-2xl', size: '1rem / 16px' },
    { name: 'rounded-3xl', class: 'rounded-3xl', size: '1.5rem / 24px' },
    { name: 'rounded-full', class: 'rounded-full', size: '9999px' },
  ];
</script>

<Meta title="Design System/Spacing" />

<Story name="Spacing Scale">
  <div class="space-y-2">
    <h2 class="text-2xl font-bold mb-4">Spacing Scale</h2>
    <p class="text-sm text-muted-foreground mb-6">
      Our spacing system is based on a 4px grid for consistency across the UI.
    </p>
    {#each spacingScale as space}
      <div class="flex items-center gap-4">
        <div class="w-24 text-sm">
          <code class="text-xs">{space.name}</code>
        </div>
        <div class="w-24 text-sm text-muted-foreground">
          {space.size}
        </div>
        <div class="{space.class} h-6 bg-primary"></div>
      </div>
    {/each}
  </div>
</Story>

<Story name="Padding Examples">
  <div class="space-y-6">
    <h2 class="text-2xl font-bold mb-4">Padding Examples</h2>
    
    <div class="space-y-4">
      <div class="border-2 border-dashed border-gray-300 inline-block">
        <div class="p-2 bg-primary/20">
          <div class="bg-primary text-white px-2 py-1 text-sm">p-2 (8px)</div>
        </div>
      </div>
      
      <div class="border-2 border-dashed border-gray-300 inline-block">
        <div class="p-4 bg-primary/20">
          <div class="bg-primary text-white px-2 py-1 text-sm">p-4 (16px)</div>
        </div>
      </div>
      
      <div class="border-2 border-dashed border-gray-300 inline-block">
        <div class="p-6 bg-primary/20">
          <div class="bg-primary text-white px-2 py-1 text-sm">p-6 (24px)</div>
        </div>
      </div>
      
      <div class="border-2 border-dashed border-gray-300 inline-block">
        <div class="px-8 py-4 bg-primary/20">
          <div class="bg-primary text-white px-2 py-1 text-sm">px-8 py-4</div>
        </div>
      </div>
    </div>
  </div>
</Story>

<Story name="Margin Examples">
  <div class="space-y-6">
    <h2 class="text-2xl font-bold mb-4">Margin Examples</h2>
    
    <div class="bg-gray-100 p-4">
      <div class="bg-white p-2 mb-2">First item (mb-2)</div>
      <div class="bg-white p-2 mb-4">Second item (mb-4)</div>
      <div class="bg-white p-2 mb-6">Third item (mb-6)</div>
      <div class="bg-white p-2">Last item (no margin)</div>
    </div>
    
    <div class="bg-gray-100 p-4 flex gap-4">
      <div class="bg-white p-4">Flex</div>
      <div class="bg-white p-4">Gap</div>
      <div class="bg-white p-4">4</div>
    </div>
  </div>
</Story>

<Story name="Border Radius">
  <div class="space-y-6">
    <h2 class="text-2xl font-bold mb-4">Border Radius Scale</h2>
    
    <div class="grid grid-cols-3 gap-4">
      {#each borderRadius as radius}
        <div class="text-center">
          <div class="w-24 h-24 bg-primary {radius.class} mx-auto mb-2"></div>
          <code class="text-xs">{radius.name}</code>
          <p class="text-xs text-muted-foreground">{radius.size}</p>
        </div>
      {/each}
    </div>
  </div>
</Story>

<Story name="Component Spacing">
  <div class="space-y-8">
    <h2 class="text-2xl font-bold mb-4">Common Component Patterns</h2>
    
    <!-- Card -->
    <div>
      <h3 class="text-lg font-semibold mb-3">Card Spacing</h3>
      <div class="border rounded-lg p-6 max-w-sm">
        <h4 class="text-lg font-medium mb-2">Card Title</h4>
        <p class="text-sm text-muted-foreground mb-4">
          Cards typically use p-6 for content padding with mb-4 between sections.
        </p>
        <button class="bg-primary text-white px-4 py-2 rounded-md text-sm">
          Action Button
        </button>
      </div>
    </div>
    
    <!-- Form -->
    <div>
      <h3 class="text-lg font-semibold mb-3">Form Spacing</h3>
      <div class="space-y-4 max-w-sm">
        <div>
          <label class="text-sm font-medium mb-1.5 block">Label</label>
          <input type="text" class="w-full px-3 py-2 border rounded-md" placeholder="Input field" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1.5 block">Another Label</label>
          <input type="text" class="w-full px-3 py-2 border rounded-md" placeholder="Another input" />
        </div>
      </div>
    </div>
    
    <!-- List -->
    <div>
      <h3 class="text-lg font-semibold mb-3">List Spacing</h3>
      <ul class="space-y-2">
        <li class="p-3 bg-gray-50 rounded-md">List item with p-3</li>
        <li class="p-3 bg-gray-50 rounded-md">Items have space-y-2 between</li>
        <li class="p-3 bg-gray-50 rounded-md">Consistent spacing throughout</li>
      </ul>
    </div>
  </div>
</Story>