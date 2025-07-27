import type { Meta, StoryObj } from '@storybook/svelte';
import ColorPalette from './ColorPalette.svelte';

const meta = {
  title: 'Design System/Colors',
  component: ColorPalette,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# Color System

Our color system is built on CSS custom properties (CSS variables) defined in \`app.css\`. This ensures consistency across the application and makes theming possible.

## Usage

Colors are accessed through Tailwind utility classes:
- \`text-primary\` - Primary text color
- \`bg-primary\` - Primary background color
- \`border-primary\` - Primary border color

## Color Categories

1. **Brand Colors**: Primary and secondary colors that represent the Driplo brand
2. **Semantic Colors**: Success, warning, error states
3. **Neutral Colors**: Grays and backgrounds for UI elements
4. **Interactive Colors**: Hover, focus, and active states
        `
      }
    }
  }
} satisfies Meta<ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};