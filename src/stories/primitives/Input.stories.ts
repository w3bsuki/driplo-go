import type { Meta, StoryObj } from '@storybook/svelte';
import Input from '$lib/components/ui/input.svelte';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'The type of input',
      table: {
        defaultValue: { summary: 'text' }
      }
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the input',
      table: {
        defaultValue: { summary: 'md' }
      }
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
      table: {
        defaultValue: { summary: false }
      }
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required',
      table: {
        defaultValue: { summary: false }
      }
    },
    value: {
      control: 'text',
      description: 'The input value'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A flexible input component with multiple sizes and states. Supports all standard HTML input types and follows the Driplo design system.'
      }
    }
  }
} satisfies Meta<Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...'
  }
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'name@example.com'
  }
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password'
  }
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0'
  }
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...'
  }
};

export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input'
  }
};

export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input'
  }
};

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Required field'
  }
};

export const WithValue: Story = {
  args: {
    value: 'Pre-filled value'
  }
};

export const WithCustomClass: Story = {
  args: {
    placeholder: 'Custom styled input',
    class: 'border-primary focus:ring-primary'
  }
};