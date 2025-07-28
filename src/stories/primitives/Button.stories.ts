import type { Meta, StoryObj } from 'storybook';
import Button from '$lib/components/ui/button.svelte';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button',
      table: {
        defaultValue: { summary: 'default' }
      }
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', 'icon'],
      description: 'The size of the button',
      table: {
        defaultValue: { summary: 'default' }
      }
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
      table: {
        defaultValue: { summary: false }
      }
    },
    class: {
      control: 'text',
      description: 'Additional CSS classes',
      table: {
        defaultValue: { summary: '' }
      }
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A flexible button component with multiple variants and sizes. Built with accessibility in mind and follows the Driplo design system.'
      }
    }
  }
} satisfies Meta<Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default button
export const Default: Story = {
  args: {
    children: () => 'Button'
  }
};

// All variants
export const AllVariants: Story = {
  args: {
    children: () => 'Button'
  },
  decorators: [
    (Story, context) => ({
      template: `
        <div class="flex flex-wrap items-center gap-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      `
    })
  ]
};

// All sizes
export const AllSizes: Story = {
  args: {
    children: () => 'Button'
  },
  decorators: [
    (Story, context) => ({
      template: `
        <div class="flex flex-wrap items-center gap-4">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
          <Button size="icon">🚀</Button>
        </div>
      `
    })
  ]
};

// Interactive example
export const Interactive: Story = {
  args: {
    children: () => 'Click me!'
  }
};

// States
export const Disabled: Story = {
  args: {
    disabled: true,
    children: () => 'Disabled'
  }
};

export const Loading: Story = {
  args: {
    class: 'animate-pulse',
    children: () => 'Loading...'
  }
};

// Variants
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: () => 'Delete'
  }
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: () => 'Cancel'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: () => 'Secondary'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: () => 'Ghost'
  }
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: () => 'Link Button'
  }
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: () => 'Small Button'
  }
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: () => 'Large Button'
  }
};

// Special cases
export const FullWidth: Story = {
  args: {
    class: 'w-full',
    children: () => 'Full Width Button'
  }
};

export const WithIcon: Story = {
  args: {
    children: () => '✨ With Icon'
  }
};