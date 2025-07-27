<script>
  import { onMount } from 'svelte';
  
  // Define color categories
  const colorCategories = {
    'Brand Colors': [
      { name: 'Primary', variable: '--primary', class: 'bg-primary' },
      { name: 'Primary Foreground', variable: '--primary-foreground', class: 'bg-primary-foreground' },
      { name: 'Secondary', variable: '--secondary', class: 'bg-secondary' },
      { name: 'Secondary Foreground', variable: '--secondary-foreground', class: 'bg-secondary-foreground' },
      { name: 'Accent', variable: '--accent', class: 'bg-accent' },
      { name: 'Accent Foreground', variable: '--accent-foreground', class: 'bg-accent-foreground' }
    ],
    'Semantic Colors': [
      { name: 'Success', variable: '--success', class: 'bg-success' },
      { name: 'Success Foreground', variable: '--success-foreground', class: 'bg-success-foreground' },
      { name: 'Warning', variable: '--warning', class: 'bg-warning' },
      { name: 'Warning Foreground', variable: '--warning-foreground', class: 'bg-warning-foreground' },
      { name: 'Destructive', variable: '--destructive', class: 'bg-destructive' },
      { name: 'Destructive Foreground', variable: '--destructive-foreground', class: 'bg-destructive-foreground' }
    ],
    'Neutral Colors': [
      { name: 'Background', variable: '--background', class: 'bg-background' },
      { name: 'Foreground', variable: '--foreground', class: 'bg-foreground' },
      { name: 'Muted', variable: '--muted', class: 'bg-muted' },
      { name: 'Muted Foreground', variable: '--muted-foreground', class: 'bg-muted-foreground' },
      { name: 'Card', variable: '--card', class: 'bg-card' },
      { name: 'Card Foreground', variable: '--card-foreground', class: 'bg-card-foreground' },
      { name: 'Popover', variable: '--popover', class: 'bg-popover' },
      { name: 'Popover Foreground', variable: '--popover-foreground', class: 'bg-popover-foreground' }
    ],
    'UI States': [
      { name: 'Border', variable: '--border', class: 'bg-border' },
      { name: 'Input', variable: '--input', class: 'bg-input' },
      { name: 'Ring', variable: '--ring', class: 'bg-ring' }
    ]
  };
  
  let colorValues = {};
  let copied = '';
  
  onMount(() => {
    // Get computed color values
    const computedStyle = getComputedStyle(document.documentElement);
    
    Object.entries(colorCategories).forEach(([category, colors]) => {
      colors.forEach(color => {
        const value = computedStyle.getPropertyValue(color.variable).trim();
        if (value) {
          colorValues[color.variable] = value;
        }
      });
    });
  });
  
  function copyToClipboard(text, name) {
    navigator.clipboard.writeText(text);
    copied = name;
    setTimeout(() => copied = '', 2000);
  }
  
  function getContrastColor(variable) {
    return variable.includes('foreground') || variable === '--background' ? 'text-gray-900' : 'text-white';
  }
</script>

<div class="space-y-8 p-6 max-w-6xl">
  {#each Object.entries(colorCategories) as [category, colors]}
    <section>
      <h2 class="text-xl font-semibold mb-4 text-gray-900">{category}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each colors as color}
          <button
            class="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
            on:click={() => copyToClipboard(color.class, color.name)}
          >
            <div class="{color.class} h-24 relative">
              {#if copied === color.name}
                <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span class="text-white font-medium">Copied!</span>
                </div>
              {/if}
            </div>
            <div class="p-4 bg-white">
              <h3 class="font-medium text-gray-900">{color.name}</h3>
              <p class="text-sm text-gray-500 font-mono mt-1">{color.class}</p>
              {#if colorValues[color.variable]}
                <p class="text-xs text-gray-400 font-mono mt-1">
                  hsl({colorValues[color.variable]})
                </p>
              {/if}
              <p class="text-xs text-gray-400 font-mono">
                var({color.variable})
              </p>
            </div>
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg class="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/each}
  
  <!-- Usage Examples -->
  <section>
    <h2 class="text-xl font-semibold mb-4 text-gray-900">Usage Examples</h2>
    <div class="bg-gray-50 rounded-lg p-6 space-y-4">
      <div>
        <h3 class="font-medium mb-2">Text Colors</h3>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded">text-primary</code>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded ml-2">text-secondary</code>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded ml-2">text-muted-foreground</code>
      </div>
      <div>
        <h3 class="font-medium mb-2">Background Colors</h3>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded">bg-primary</code>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded ml-2">bg-secondary</code>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded ml-2">bg-muted</code>
      </div>
      <div>
        <h3 class="font-medium mb-2">Border Colors</h3>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded">border-primary</code>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded ml-2">border-border</code>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded ml-2">border-input</code>
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