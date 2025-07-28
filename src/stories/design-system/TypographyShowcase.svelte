<script>
  const headingSizes = [
    { tag: 'h1', class: 'text-5xl', size: '48px', weight: 'font-bold' },
    { tag: 'h2', class: 'text-4xl', size: '36px', weight: 'font-semibold' },
    { tag: 'h3', class: 'text-3xl', size: '30px', weight: 'font-semibold' },
    { tag: 'h4', class: 'text-2xl', size: '24px', weight: 'font-semibold' },
    { tag: 'h5', class: 'text-xl', size: '20px', weight: 'font-medium' },
    { tag: 'h6', class: 'text-lg', size: '18px', weight: 'font-medium' }
  ];
  
  const textSizes = [
    { name: 'Extra Large', class: 'text-xl', size: '20px' },
    { name: 'Large', class: 'text-lg', size: '18px' },
    { name: 'Base', class: 'text-base', size: '16px' },
    { name: 'Small', class: 'text-sm', size: '14px' },
    { name: 'Extra Small', class: 'text-xs', size: '12px' }
  ];
  
  const fontWeights = [
    { name: 'Regular', class: 'font-normal', value: '400' },
    { name: 'Medium', class: 'font-medium', value: '500' },
    { name: 'Semibold', class: 'font-semibold', value: '600' },
    { name: 'Bold', class: 'font-bold', value: '700' }
  ];
</script>

<div class="space-y-12 p-6 max-w-5xl">
  <!-- Headings -->
  <section>
    <h2 class="text-2xl font-bold mb-6 text-gray-900">Headings</h2>
    <div class="space-y-4">
      {#each headingSizes as heading}
        <div class="py-4 border-b border-gray-100">
          <div class="flex items-baseline justify-between mb-2">
            <div class="{heading.class} {heading.weight} text-gray-900 font-[Plus_Jakarta_Sans]">
              Heading {heading.tag.toUpperCase()}
            </div>
            <div class="text-sm text-gray-500 font-mono">
              {heading.class} {heading.weight}
            </div>
          </div>
          <p class="text-sm text-gray-600">
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Body Text -->
  <section>
    <h2 class="text-2xl font-bold mb-6 text-gray-900">Body Text</h2>
    <div class="space-y-6">
      {#each textSizes as size}
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-medium text-gray-700">{size.name}</h3>
            <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{size.class}</code>
          </div>
          <p class="{size.class} text-gray-900 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Font Weights -->
  <section>
    <h2 class="text-2xl font-bold mb-6 text-gray-900">Font Weights</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {#each fontWeights as weight}
        <div class="text-center">
          <div class="text-3xl {weight.class} text-gray-900 mb-2">Aa</div>
          <p class="text-sm text-gray-600">{weight.name}</p>
          <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{weight.class}</code>
        </div>
      {/each}
    </div>
  </section>

  <!-- Line Heights -->
  <section>
    <h2 class="text-2xl font-bold mb-6 text-gray-900">Line Heights</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div>
        <h3 class="font-medium mb-2">Tight</h3>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mb-3 inline-block">leading-tight</code>
        <p class="text-base leading-tight text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
        </p>
      </div>
      <div>
        <h3 class="font-medium mb-2">Normal</h3>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mb-3 inline-block">leading-normal</code>
        <p class="text-base leading-normal text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
        </p>
      </div>
      <div>
        <h3 class="font-medium mb-2">Relaxed</h3>
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mb-3 inline-block">leading-relaxed</code>
        <p class="text-base leading-relaxed text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
        </p>
      </div>
    </div>
  </section>

  <!-- Text Colors -->
  <section>
    <h2 class="text-2xl font-bold mb-6 text-gray-900">Text Colors</h2>
    <div class="space-y-3">
      <p class="text-gray-900">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mr-3">text-gray-900</code>
        Primary text color for headings and important content
      </p>
      <p class="text-gray-700">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mr-3">text-gray-700</code>
        Default text color for body content
      </p>
      <p class="text-gray-500">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mr-3">text-gray-500</code>
        Secondary text for less important information
      </p>
      <p class="text-primary">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mr-3">text-primary</code>
        Brand color for links and interactive elements
      </p>
      <p class="text-destructive">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mr-3">text-destructive</code>
        Error states and destructive actions
      </p>
      <p class="text-success">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded font-mono mr-3">text-success</code>
        Success states and positive feedback
      </p>
    </div>
  </section>

  <!-- Code Blocks -->
  <section>
    <h2 class="text-2xl font-bold mb-6 text-gray-900">Code & Monospace</h2>
    <div class="space-y-4">
      <div>
        <h3 class="font-medium mb-2">Inline Code</h3>
        <p class="text-base text-gray-700">
          Use <code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">font-mono</code> for inline code snippets.
        </p>
      </div>
      <div>
        <h3 class="font-medium mb-2">Code Block</h3>
        <pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto">
<code class="text-sm font-mono">const greeting = "Hello, World!";
console.log(greeting);

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}</code></pre>
      </div>
    </div>
  </section>
</div>

<style>
  :global(.space-y-12 > * + *) {
    margin-top: 3rem;
  }
  :global(.space-y-6 > * + *) {
    margin-top: 1.5rem;
  }
  :global(.space-y-4 > * + *) {
    margin-top: 1rem;
  }
  :global(.space-y-3 > * + *) {
    margin-top: 0.75rem;
  }
</style>