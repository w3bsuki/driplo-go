# Driplo Storybook Guide

Welcome to the Driplo design system documentation powered by Storybook!

## 🚀 Getting Started

```bash
# Install dependencies (if not already done)
pnpm install

# Start Storybook development server
pnpm run storybook

# Build static Storybook
pnpm run build-storybook
```

## 📁 Structure

```
src/stories/
├── design-system/      # Color palette, typography, spacing
├── primitives/         # Basic UI components (Button, Input, etc.)
├── components/         # Feature components (ListingCard, etc.)
├── patterns/           # Common UI patterns and examples
└── README.md          # This file
```

## 📝 Writing Stories

### Basic Story Format

```typescript
import type { Meta, StoryObj } from '@storybook/svelte';
import MyComponent from '$lib/components/MyComponent.svelte';

const meta = {
  title: 'Category/ComponentName',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    // Define controls for props
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'The visual style'
    }
  }
} satisfies Meta<MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  }
};
```

### Creating a Showcase Component

For complex components, create a separate `.svelte` file to showcase all variants:

```svelte
<!-- ComponentShowcase.svelte -->
<script>
  import Component from '$lib/components/Component.svelte';
</script>

<div class="space-y-8">
  <section>
    <h3>Variants</h3>
    <!-- Show all variants -->
  </section>
</div>
```

## 🎨 Design System

### Colors
- Access via CSS variables: `var(--primary)`, `var(--secondary)`, etc.
- Use Tailwind classes: `text-primary`, `bg-primary`, `border-primary`

### Typography
- Headings use Plus Jakarta Sans
- Body text uses Inter
- Code uses JetBrains Mono

### Spacing
- Use Tailwind spacing utilities
- Consistent 4px base unit

## 🧩 Component Guidelines

### Naming Conventions
- Stories: `ComponentName.stories.ts`
- Showcases: `ComponentNameShowcase.svelte`
- Use PascalCase for components
- Use kebab-case for file paths in imports

### Categories
- **Design System**: Colors, Typography, Spacing, Tokens
- **Primitives**: Button, Input, Badge, Chip, etc.
- **Components**: ListingCard, Header, Forms, etc.
- **Patterns**: Common UI patterns and compositions

### Story Best Practices
1. Always include a default story
2. Show all variants and states
3. Include edge cases (long text, no data, errors)
4. Add meaningful descriptions
5. Use realistic mock data
6. Test responsive behavior

## 🔧 Troubleshooting

### Common Issues

1. **Import errors**: Ensure you're using `$lib/` aliases
2. **Style issues**: Import `app.css` in preview.ts
3. **Type errors**: Use proper TypeScript types for Meta and Story
4. **Missing stories**: Check file naming and export syntax

### Tips
- Use the Controls addon to test prop combinations
- Check mobile viewports for responsive testing
- Use the Docs page for component documentation
- Enable measure addon for spacing inspection

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Svelte CSF Documentation](https://github.com/storybookjs/addon-svelte-csf)
- [SvelteKit Integration](https://github.com/storybookjs/storybook/tree/main/code/frameworks/sveltekit)

## 🎯 Next Steps

1. Create stories for remaining components
2. Add interaction tests with play functions
3. Set up visual regression testing
4. Deploy Storybook to production
5. Integrate with design tools