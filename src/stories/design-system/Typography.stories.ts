import type { Meta, StoryObj } from '@storybook/svelte';
import TypographyShowcase from './TypographyShowcase.svelte';

const meta = {
  title: 'Design System/Typography',
  component: TypographyShowcase,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# Typography System

Our typography system uses Inter as the primary font family with Plus Jakarta Sans for headings and JetBrains Mono for code.

## Font Families

- **Inter**: Primary font for body text and UI elements
- **Plus Jakarta Sans**: Used for headings and marketing copy
- **JetBrains Mono**: Monospace font for code and technical content

## Type Scale

The type scale follows a modular approach with consistent sizing and spacing.
        `
      }
    }
  }
} satisfies Meta<TypographyShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};