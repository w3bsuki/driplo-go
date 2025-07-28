# Storybook Developer Guide

## 🚀 Getting Started

### Running Storybook
```bash
pnpm run storybook
```
This will start Storybook on http://localhost:6006

### Building Storybook
```bash
pnpm run build-storybook
```
This creates a static build in `storybook-static/`

## 📁 File Structure

```
src/stories/
├── design-system/        # Design tokens and system documentation
│   ├── Colors.stories.svelte
│   ├── Typography.stories.svelte
│   └── Spacing.stories.svelte
├── primitives/          # Basic UI components
│   ├── Button.stories.ts
│   ├── Input.stories.ts
│   └── ...
├── components/          # Complex components
│   ├── layout/
│   ├── listings/
│   └── shared/
└── patterns/           # UI patterns and guidelines
    └── *.mdx
```

## ✍️ Writing Stories

### Basic Story Structure (TypeScript)

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

### Svelte CSF Format

For more complex stories with templates:

```svelte
<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import MyComponent from '$lib/components/MyComponent.svelte';
</script>

<Meta title="Category/ComponentName" component={MyComponent} />

<Story name="Default">
  <MyComponent />
</Story>

<Story name="With Props">
  <MyComponent variant="primary" size="large" />
</Story>
```

## 🎨 Best Practices

### 1. Component Organization
- Place stories next to components or in `src/stories/`
- Use consistent naming: `ComponentName.stories.ts`
- Group related components in subdirectories

### 2. Story Naming
- **Default**: Basic component with minimal props
- **[Variant]**: Show different variants (Primary, Secondary, etc.)
- **[State]**: Show different states (Disabled, Loading, Error)
- **With[Feature]**: Show with specific features (WithIcon, WithTooltip)

### 3. Controls and Args
```typescript
argTypes: {
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
    description: 'Component size',
    table: {
      defaultValue: { summary: 'md' },
      type: { summary: 'string' }
    }
  }
}
```

### 4. Documentation
```typescript
parameters: {
  docs: {
    description: {
      component: 'Detailed component description here'
    }
  }
}
```

## 🔧 Advanced Features

### Dark Mode Support
Dark mode is automatically available via the toolbar. Components should respond to the `.dark` class on the document root.

### Mobile Viewports
Use the viewport addon to test responsive designs:
- Mobile: 375px
- Tablet: 768px  
- Desktop: 1280px

### Accessibility Testing
The a11y addon automatically checks for common accessibility issues. Fix any violations shown in the panel.

### Interactive Testing
```typescript
import { userEvent, within } from '@storybook/testing-library';

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
  }
};
```

## 📋 Component Checklist

When creating a new component story:

- [ ] Create story file with proper meta configuration
- [ ] Add Default story with minimal props
- [ ] Add stories for all variants
- [ ] Add stories for all states (disabled, loading, etc.)
- [ ] Configure appropriate controls
- [ ] Add component documentation
- [ ] Test in different viewports
- [ ] Check accessibility panel
- [ ] Test dark mode compatibility

## 🐛 Troubleshooting

### Common Issues

1. **Component not rendering**
   - Check import paths (use `$lib/...`)
   - Ensure component exports are correct
   - Verify Svelte 5 syntax compatibility

2. **Styles not loading**
   - Ensure `app.css` is imported in `.storybook/preview.ts`
   - Check Tailwind classes are being processed
   - Verify PostCSS configuration

3. **Props not working**
   - Use `$props()` for Svelte 5 components
   - Check argTypes configuration
   - Ensure prop names match exactly

4. **Dark mode not working**
   - Check `.dark` class is being applied
   - Verify CSS variables are set correctly
   - Test theme toggle in toolbar

## 🚀 Next Steps

1. **Create stories for all existing components**
2. **Add interaction tests for complex flows**
3. **Set up visual regression testing**
4. **Deploy Storybook to a public URL**
5. **Integrate with CI/CD pipeline**

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Storybook for Svelte](https://storybook.js.org/docs/svelte/get-started/introduction)
- [Component Story Format (CSF)](https://storybook.js.org/docs/api/csf)
- [Svelte CSF Addon](https://github.com/storybookjs/addon-svelte-csf)