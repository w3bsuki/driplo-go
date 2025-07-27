<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  
  const textSizes = [
    { name: 'text-xs', class: 'text-xs', size: '0.75rem / 12px' },
    { name: 'text-sm', class: 'text-sm', size: '0.875rem / 14px' },
    { name: 'text-base', class: 'text-base', size: '1rem / 16px' },
    { name: 'text-lg', class: 'text-lg', size: '1.125rem / 18px' },
    { name: 'text-xl', class: 'text-xl', size: '1.25rem / 20px' },
    { name: 'text-2xl', class: 'text-2xl', size: '1.5rem / 24px' },
    { name: 'text-3xl', class: 'text-3xl', size: '1.875rem / 30px' },
    { name: 'text-4xl', class: 'text-4xl', size: '2.25rem / 36px' },
    { name: 'text-5xl', class: 'text-5xl', size: '3rem / 48px' },
  ];
  
  const fontWeights = [
    { name: 'font-light', class: 'font-light', weight: '300' },
    { name: 'font-normal', class: 'font-normal', weight: '400' },
    { name: 'font-medium', class: 'font-medium', weight: '500' },
    { name: 'font-semibold', class: 'font-semibold', weight: '600' },
    { name: 'font-bold', class: 'font-bold', weight: '700' },
  ];
</script>

<Meta title="Design System/Typography" />

<Story name="Type Scale">
  <div class="space-y-6">
    <h2 class="text-2xl font-bold mb-4">Type Scale</h2>
    {#each textSizes as size}
      <div class="flex items-baseline gap-4 py-2">
        <div class="w-32 text-sm text-muted-foreground">
          <code class="text-xs">{size.name}</code>
        </div>
        <div class="w-32 text-sm text-muted-foreground">
          {size.size}
        </div>
        <p class="{size.class}">The quick brown fox jumps over the lazy dog</p>
      </div>
    {/each}
  </div>
</Story>

<Story name="Font Weights">
  <div class="space-y-6">
    <h2 class="text-2xl font-bold mb-4">Font Weights</h2>
    {#each fontWeights as weight}
      <div class="flex items-center gap-4">
        <div class="w-32 text-sm text-muted-foreground">
          <code class="text-xs">{weight.name}</code>
        </div>
        <div class="w-16 text-sm text-muted-foreground">
          {weight.weight}
        </div>
        <p class="text-lg {weight.class}">The quick brown fox jumps over the lazy dog</p>
      </div>
    {/each}
  </div>
</Story>

<Story name="Headings">
  <div class="space-y-6">
    <h1 class="text-5xl font-bold">Heading 1 - Page Title</h1>
    <h2 class="text-4xl font-bold">Heading 2 - Section Title</h2>
    <h3 class="text-3xl font-semibold">Heading 3 - Subsection</h3>
    <h4 class="text-2xl font-semibold">Heading 4 - Card Title</h4>
    <h5 class="text-xl font-medium">Heading 5 - List Title</h5>
    <h6 class="text-lg font-medium">Heading 6 - Label</h6>
  </div>
</Story>

<Story name="Paragraph Styles">
  <div class="space-y-6 max-w-prose">
    <div>
      <h3 class="text-lg font-semibold mb-2">Body Text</h3>
      <p class="text-base leading-relaxed">
        This is standard body text used throughout the application. It provides comfortable reading
        with appropriate line height and letter spacing. The font family is Inter, which offers
        excellent readability across all devices.
      </p>
    </div>
    
    <div>
      <h3 class="text-lg font-semibold mb-2">Small Text</h3>
      <p class="text-sm leading-relaxed text-muted-foreground">
        This is small text commonly used for descriptions, helper text, and secondary information.
        It maintains readability while taking up less visual space.
      </p>
    </div>
    
    <div>
      <h3 class="text-lg font-semibold mb-2">Fine Print</h3>
      <p class="text-xs leading-relaxed text-muted-foreground">
        This is extra small text used for timestamps, legal text, and other fine print. 
        Use sparingly to maintain accessibility.
      </p>
    </div>
  </div>
</Story>

<Story name="Text Colors">
  <div class="space-y-4">
    <p class="text-foreground">Default text color (foreground)</p>
    <p class="text-muted-foreground">Muted text color for secondary content</p>
    <p class="text-primary">Primary brand color text</p>
    <p class="text-destructive">Destructive action text</p>
    <p class="text-success">Success message text</p>
    <p class="text-warning">Warning message text</p>
  </div>
</Story>

<Story name="Font Families">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold mb-2">Sans Serif (Inter)</h3>
      <p class="font-sans text-lg">
        The quick brown fox jumps over the lazy dog.
      </p>
      <p class="font-sans text-sm text-muted-foreground">
        Used for all UI text, headings, and body content.
      </p>
    </div>
    
    <div>
      <h3 class="text-lg font-semibold mb-2">Display (Plus Jakarta Sans)</h3>
      <p class="font-display text-lg font-semibold">
        The quick brown fox jumps over the lazy dog.
      </p>
      <p class="font-sans text-sm text-muted-foreground">
        Used for marketing headlines and special emphasis.
      </p>
    </div>
    
    <div>
      <h3 class="text-lg font-semibold mb-2">Monospace (JetBrains Mono)</h3>
      <p class="font-mono text-lg">
        const price = 99.99;
      </p>
      <p class="font-sans text-sm text-muted-foreground">
        Used for code, prices, and technical information.
      </p>
    </div>
  </div>
</Story>