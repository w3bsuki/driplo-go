<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }
  
  const primaryColors = [
    { name: 'primary', value: 'hsl(197 71% 73%)', class: 'bg-primary' },
    { name: 'primary-600', value: '#6bb6d8', class: 'bg-primary-600' },
    { name: 'primary-700', value: '#4f9fc5', class: 'bg-primary-700' },
  ];
  
  const semanticColors = [
    { name: 'destructive', value: 'hsl(0 84% 60%)', class: 'bg-destructive' },
    { name: 'success', value: 'hsl(152 69% 42%)', class: 'bg-success' },
    { name: 'warning', value: 'hsl(61 95% 66%)', class: 'bg-warning' },
  ];
  
  const neutralColors = [
    { name: 'background', value: 'hsl(0 0% 100%)', class: 'bg-background' },
    { name: 'foreground', value: 'hsl(0 0% 6%)', class: 'bg-foreground' },
    { name: 'muted', value: 'hsl(0 0% 96%)', class: 'bg-muted' },
    { name: 'muted-foreground', value: 'hsl(0 0% 45%)', class: 'bg-muted-foreground' },
    { name: 'border', value: 'hsl(0 0% 90%)', class: 'bg-border' },
    { name: 'input', value: 'hsl(0 0% 90%)', class: 'bg-input' },
  ];
</script>

<Meta title="Design System/Colors" />

<Story name="All Colors">
  <div class="space-y-8">
    <!-- Primary Colors -->
    <div>
      <h2 class="text-2xl font-bold mb-4">Primary Colors</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {#each primaryColors as color}
          <button
            onclick={() => copyToClipboard(color.value)}
            class="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <div class="{color.class} h-24"></div>
            <div class="p-4 bg-white">
              <p class="font-medium">{color.name}</p>
              <p class="text-sm text-gray-500">{color.value}</p>
              <p class="text-xs text-gray-400 mt-1">Click to copy</p>
            </div>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Semantic Colors -->
    <div>
      <h2 class="text-2xl font-bold mb-4">Semantic Colors</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {#each semanticColors as color}
          <button
            onclick={() => copyToClipboard(color.value)}
            class="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <div class="{color.class} h-24"></div>
            <div class="p-4 bg-white">
              <p class="font-medium">{color.name}</p>
              <p class="text-sm text-gray-500">{color.value}</p>
              <p class="text-xs text-gray-400 mt-1">Click to copy</p>
            </div>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Neutral Colors -->
    <div>
      <h2 class="text-2xl font-bold mb-4">Neutral Colors</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {#each neutralColors as color}
          <button
            onclick={() => copyToClipboard(color.value)}
            class="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <div class="{color.class} h-24 {color.name.includes('foreground') ? '' : 'border'}"></div>
            <div class="p-4 bg-white">
              <p class="font-medium">{color.name}</p>
              <p class="text-sm text-gray-500">{color.value}</p>
              <p class="text-xs text-gray-400 mt-1">Click to copy</p>
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</Story>

<Story name="Color Contrast">
  <div class="space-y-4">
    <div class="bg-primary text-white p-4 rounded-lg">
      <p class="font-medium">Primary on white text</p>
      <p class="text-sm opacity-90">This shows contrast ratio for primary color</p>
    </div>
    
    <div class="bg-destructive text-white p-4 rounded-lg">
      <p class="font-medium">Destructive on white text</p>
      <p class="text-sm opacity-90">This shows contrast ratio for destructive color</p>
    </div>
    
    <div class="bg-success text-white p-4 rounded-lg">
      <p class="font-medium">Success on white text</p>
      <p class="text-sm opacity-90">This shows contrast ratio for success color</p>
    </div>
    
    <div class="bg-warning text-foreground p-4 rounded-lg">
      <p class="font-medium">Warning on dark text</p>
      <p class="text-sm opacity-90">This shows contrast ratio for warning color</p>
    </div>
  </div>
</Story>

<Story name="Dark Mode Colors">
  <div class="dark">
    <div class="bg-background text-foreground p-8 rounded-lg">
      <h2 class="text-2xl font-bold mb-4">Dark Mode Palette</h2>
      <div class="space-y-4">
        <div class="bg-card p-4 rounded-lg border">
          <p class="font-medium">Card Background</p>
          <p class="text-sm text-muted-foreground">Used for card surfaces</p>
        </div>
        
        <div class="bg-muted p-4 rounded-lg">
          <p class="font-medium">Muted Background</p>
          <p class="text-sm text-muted-foreground">Used for subtle backgrounds</p>
        </div>
        
        <div class="border-2 border-primary p-4 rounded-lg">
          <p class="font-medium text-primary">Primary Border</p>
          <p class="text-sm text-muted-foreground">Used for focus states</p>
        </div>
      </div>
    </div>
  </div>
</Story>