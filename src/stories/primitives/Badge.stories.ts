import type { Meta, StoryObj } from '@storybook/svelte';
import Badge from '$lib/components/ui/badge.svelte';
import BadgeShowcase from './BadgeShowcase.svelte';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style of the badge',
      table: {
        defaultValue: { summary: 'default' }
      }
    },
    class: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
Badges are used to display small bits of information, such as status indicators, counts, or labels.

## Usage Guidelines

- Use badges to highlight important metadata
- Keep badge text short and concise
- Use appropriate variants for different contexts
- Consider color-blind users when choosing variants

## Common Use Cases

- Status indicators (Active, Pending, Completed)
- Category labels
- Notification counts
- Feature flags (New, Beta, Pro)
        `
      }
    }
  }
} satisfies Meta<Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary'
  }
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive'
  }
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline'
  }
};

export const AllVariants: Story = {
  render: () => ({
    Component: BadgeShowcase
  }),
  parameters: {
    docs: {
      source: {
        code: null
      }
    }
  }
};