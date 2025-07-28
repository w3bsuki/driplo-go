import type { Meta, StoryObj } from '@storybook/svelte';
import ListingCard from '$lib/components/listings/ListingCard.svelte';
import ListingCardShowcase from './ListingCardShowcase.svelte';

const meta = {
  title: 'Components/ListingCard',
  component: ListingCard,
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the listing'
    },
    title: {
      control: 'text',
      description: 'Title of the listing'
    },
    price: {
      control: 'number',
      description: 'Price in GBP'
    },
    size: {
      control: 'text',
      description: 'Size of the item'
    },
    brand: {
      control: 'text',
      description: 'Brand name'
    },
    image: {
      control: 'text',
      description: 'Primary image URL'
    },
    condition: {
      control: 'select',
      options: ['new_with_tags', 'new_without_tags', 'excellent', 'good', 'fair'],
      description: 'Condition of the item'
    },
    likes: {
      control: 'number',
      description: 'Number of likes'
    },
    isLiked: {
      control: 'boolean',
      description: 'Whether the current user has liked this item'
    },
    eagerLoading: {
      control: 'boolean',
      description: 'Whether to load images eagerly'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
The ListingCard component displays a product listing in a card format. It's the primary way users browse items on the marketplace.

## Features

- Responsive image display with lazy loading
- Seller information with avatar
- Like functionality
- Condition and brand badges
- Price formatting
- Hover effects for desktop

## Usage

The ListingCard is typically used in grid layouts on browse, search, and profile pages.
        `
      }
    }
  }
} satisfies Meta<ListingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockSeller = {
  username: 'fashionista',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fashionista',
  account_type: 'individual',
  is_verified: true
};

const mockBrandSeller = {
  username: 'official_brand',
  account_type: 'brand',
  is_verified: true
};

export const Default: Story = {
  args: {
    id: '1',
    title: 'Vintage Denim Jacket',
    price: 89.99,
    size: 'M',
    brand: 'Levi\'s',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop',
    seller: mockSeller,
    likes: 12,
    isLiked: false,
    condition: 'excellent'
  }
};

export const NewWithTags: Story = {
  args: {
    id: '2',
    title: 'Designer Silk Dress',
    price: 299.99,
    size: 'S',
    brand: 'Gucci',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
    seller: mockBrandSeller,
    likes: 45,
    isLiked: true,
    condition: 'new_with_tags'
  }
};

export const NoImage: Story = {
  args: {
    id: '3',
    title: 'Classic White T-Shirt',
    price: 19.99,
    size: 'L',
    brand: 'Nike',
    image: '',
    seller: mockSeller,
    likes: 3,
    isLiked: false,
    condition: 'good'
  }
};

export const LongTitle: Story = {
  args: {
    id: '4',
    title: 'Premium Quality Italian Leather Handbag with Gold Hardware and Adjustable Strap',
    price: 450.00,
    brand: 'Prada',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    seller: mockSeller,
    likes: 89,
    isLiked: false,
    condition: 'new_without_tags'
  }
};

export const AllVariants: Story = {
  render: () => ({
    Component: ListingCardShowcase
  }),
  parameters: {
    docs: {
      source: {
        code: null
      }
    }
  }
};