import type { FilterGroup } from '$lib/types';

// Color definitions with hex values for visual swatches
export const COLORS = {
  black: { label: 'Black', hex: '#000000' },
  white: { label: 'White', hex: '#FFFFFF' },
  gray: { label: 'Gray', hex: '#6B7280' },
  red: { label: 'Red', hex: '#EF4444' },
  pink: { label: 'Pink', hex: '#EC4899' },
  orange: { label: 'Orange', hex: '#F97316' },
  yellow: { label: 'Yellow', hex: '#F59E0B' },
  green: { label: 'Green', hex: '#10B981' },
  blue: { label: 'Blue', hex: '#3B82F6' },
  purple: { label: 'Purple', hex: '#8B5CF6' },
  brown: { label: 'Brown', hex: '#92400E' },
  beige: { label: 'Beige', hex: '#D4A574' },
  navy: { label: 'Navy', hex: '#1E3A8A' },
  multicolor: { label: 'Multicolor', hex: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)' }
};

// Common brands across categories
const COMMON_BRANDS = [
  'Zara', 'H&M', 'Mango', 'Massimo Dutti', 'Uniqlo', 'Gap', 'Banana Republic',
  'COS', 'Other Stories', 'Weekday', 'Monki', 'Pull & Bear', 'Bershka', 'Stradivarius'
];

// Luxury brands
const LUXURY_BRANDS = [
  'Gucci', 'Prada', 'Louis Vuitton', 'Chanel', 'Dior', 'Versace', 'Balenciaga',
  'Saint Laurent', 'Burberry', 'Fendi', 'Bottega Veneta', 'Celine', 'Valentino'
];

// Sport brands
const SPORT_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Under Armour', 'Reebok', 'Converse',
  'Vans', 'The North Face', 'Patagonia', 'Columbia', 'Fila', 'Champion'
];

// Category-specific filter configurations
export const categoryFilters: Record<string, FilterGroup[]> = {
  women: [
    {
      type: 'price',
      label: 'Price',
      options: [
        { value: '0-25', label: 'Under $25' },
        { value: '25-50', label: '$25-$50' },
        { value: '50-100', label: '$50-$100' },
        { value: '100-200', label: '$100-$200' },
        { value: '200-500', label: '$200-$500' },
        { value: '500-', label: '$500+' }
      ]
    },
    {
      type: 'size',
      label: 'Size',
      options: [
        { value: 'XXS', label: 'XXS' },
        { value: 'XS', label: 'XS' },
        { value: 'S', label: 'S' },
        { value: 'M', label: 'M' },
        { value: 'L', label: 'L' },
        { value: 'XL', label: 'XL' },
        { value: 'XXL', label: 'XXL' },
        { value: '0', label: '0' },
        { value: '2', label: '2' },
        { value: '4', label: '4' },
        { value: '6', label: '6' },
        { value: '8', label: '8' },
        { value: '10', label: '10' },
        { value: '12', label: '12' },
        { value: '14', label: '14' },
        { value: '16', label: '16' }
      ]
    },
    {
      type: 'color',
      label: 'Color',
      options: Object.entries(COLORS).map(([value, { label }]) => ({ value, label }))
    },
    {
      type: 'brand',
      label: 'Brand',
      options: [...COMMON_BRANDS, ...LUXURY_BRANDS].sort().map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand }))
    },
    {
      type: 'condition',
      label: 'Condition',
      options: [
        { value: 'new-with-tags', label: 'New with tags' },
        { value: 'new-without-tags', label: 'New without tags' },
        { value: 'like-new', label: 'Like new' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' }
      ]
    },
    {
      type: 'style',
      label: 'Style',
      options: [
        { value: 'casual', label: 'Casual' },
        { value: 'formal', label: 'Formal' },
        { value: 'business', label: 'Business' },
        { value: 'cocktail', label: 'Cocktail' },
        { value: 'bohemian', label: 'Bohemian' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'sporty', label: 'Sporty' },
        { value: 'streetwear', label: 'Streetwear' },
        { value: 'minimalist', label: 'Minimalist' },
        { value: 'romantic', label: 'Romantic' }
      ]
    },
    {
      type: 'material',
      label: 'Material',
      options: [
        { value: 'cotton', label: 'Cotton' },
        { value: 'polyester', label: 'Polyester' },
        { value: 'silk', label: 'Silk' },
        { value: 'wool', label: 'Wool' },
        { value: 'cashmere', label: 'Cashmere' },
        { value: 'linen', label: 'Linen' },
        { value: 'denim', label: 'Denim' },
        { value: 'leather', label: 'Leather' },
        { value: 'synthetic', label: 'Synthetic' },
        { value: 'velvet', label: 'Velvet' }
      ]
    }
  ],
  
  men: [
    {
      type: 'price',
      label: 'Price',
      options: [
        { value: '0-25', label: 'Under $25' },
        { value: '25-50', label: '$25-$50' },
        { value: '50-100', label: '$50-$100' },
        { value: '100-200', label: '$100-$200' },
        { value: '200-500', label: '$200-$500' },
        { value: '500-', label: '$500+' }
      ]
    },
    {
      type: 'size',
      label: 'Size',
      options: [
        { value: 'XS', label: 'XS' },
        { value: 'S', label: 'S' },
        { value: 'M', label: 'M' },
        { value: 'L', label: 'L' },
        { value: 'XL', label: 'XL' },
        { value: 'XXL', label: 'XXL' },
        { value: 'XXXL', label: 'XXXL' }
      ]
    },
    {
      type: 'color',
      label: 'Color',
      options: Object.entries(COLORS).map(([value, { label }]) => ({ value, label }))
    },
    {
      type: 'brand',
      label: 'Brand',
      options: [...COMMON_BRANDS, ...SPORT_BRANDS].sort().map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand }))
    },
    {
      type: 'condition',
      label: 'Condition',
      options: [
        { value: 'new-with-tags', label: 'New with tags' },
        { value: 'new-without-tags', label: 'New without tags' },
        { value: 'like-new', label: 'Like new' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' }
      ]
    },
    {
      type: 'style',
      label: 'Style',
      options: [
        { value: 'casual', label: 'Casual' },
        { value: 'formal', label: 'Formal' },
        { value: 'business', label: 'Business' },
        { value: 'smart-casual', label: 'Smart Casual' },
        { value: 'streetwear', label: 'Streetwear' },
        { value: 'sporty', label: 'Sporty' },
        { value: 'vintage', label: 'Vintage' },
        { value: 'minimalist', label: 'Minimalist' },
        { value: 'rugged', label: 'Rugged' },
        { value: 'preppy', label: 'Preppy' }
      ]
    }
  ],
  
  kids: [
    {
      type: 'price',
      label: 'Price',
      options: [
        { value: '0-15', label: 'Under $15' },
        { value: '15-30', label: '$15-$30' },
        { value: '30-50', label: '$30-$50' },
        { value: '50-100', label: '$50-$100' },
        { value: '100-', label: '$100+' }
      ]
    },
    {
      type: 'size',
      label: 'Size',
      options: [
        { value: '0-3m', label: '0-3 months' },
        { value: '3-6m', label: '3-6 months' },
        { value: '6-12m', label: '6-12 months' },
        { value: '12-18m', label: '12-18 months' },
        { value: '18-24m', label: '18-24 months' },
        { value: '2t', label: '2T' },
        { value: '3t', label: '3T' },
        { value: '4t', label: '4T' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '7', label: '7' },
        { value: '8', label: '8' },
        { value: '10', label: '10' },
        { value: '12', label: '12' },
        { value: '14', label: '14' },
        { value: '16', label: '16' }
      ]
    },
    {
      type: 'gender',
      label: 'Gender',
      options: [
        { value: 'boys', label: 'Boys' },
        { value: 'girls', label: 'Girls' },
        { value: 'unisex', label: 'Unisex' }
      ]
    },
    {
      type: 'color',
      label: 'Color',
      options: Object.entries(COLORS).map(([value, { label }]) => ({ value, label }))
    },
    {
      type: 'brand',
      label: 'Brand',
      options: [
        'Gap Kids', 'H&M Kids', 'Zara Kids', 'Nike', 'Adidas', 'Carter\'s', 
        'OshKosh', 'Ralph Lauren', 'Tommy Hilfiger', 'Mini Rodini', 'Stella McCartney Kids'
      ].map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand }))
    },
    {
      type: 'condition',
      label: 'Condition',
      options: [
        { value: 'new-with-tags', label: 'New with tags' },
        { value: 'new-without-tags', label: 'New without tags' },
        { value: 'like-new', label: 'Like new' },
        { value: 'good', label: 'Good' },
        { value: 'play-condition', label: 'Play condition' }
      ]
    }
  ],
  
  bags: [
    {
      type: 'price',
      label: 'Price',
      options: [
        { value: '0-50', label: 'Under $50' },
        { value: '50-100', label: '$50-$100' },
        { value: '100-250', label: '$100-$250' },
        { value: '250-500', label: '$250-$500' },
        { value: '500-1000', label: '$500-$1000' },
        { value: '1000-', label: '$1000+' }
      ]
    },
    {
      type: 'type',
      label: 'Bag Type',
      options: [
        { value: 'handbag', label: 'Handbag' },
        { value: 'shoulder-bag', label: 'Shoulder Bag' },
        { value: 'crossbody', label: 'Crossbody' },
        { value: 'tote', label: 'Tote' },
        { value: 'clutch', label: 'Clutch' },
        { value: 'backpack', label: 'Backpack' },
        { value: 'satchel', label: 'Satchel' },
        { value: 'hobo', label: 'Hobo' },
        { value: 'bucket-bag', label: 'Bucket Bag' },
        { value: 'wallet', label: 'Wallet' }
      ]
    },
    {
      type: 'brand',
      label: 'Brand',
      options: [...LUXURY_BRANDS, 'Coach', 'Michael Kors', 'Kate Spade', 'Marc Jacobs', 'Furla', 'Longchamp']
        .sort().map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand }))
    },
    {
      type: 'color',
      label: 'Color',
      options: Object.entries(COLORS).map(([value, { label }]) => ({ value, label }))
    },
    {
      type: 'material',
      label: 'Material',
      options: [
        { value: 'leather', label: 'Leather' },
        { value: 'canvas', label: 'Canvas' },
        { value: 'suede', label: 'Suede' },
        { value: 'nylon', label: 'Nylon' },
        { value: 'synthetic', label: 'Synthetic' },
        { value: 'fabric', label: 'Fabric' },
        { value: 'straw', label: 'Straw' },
        { value: 'exotic', label: 'Exotic' }
      ]
    },
    {
      type: 'condition',
      label: 'Condition',
      options: [
        { value: 'new-with-tags', label: 'New with tags' },
        { value: 'new-without-tags', label: 'New without tags' },
        { value: 'excellent', label: 'Excellent' },
        { value: 'very-good', label: 'Very Good' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' }
      ]
    },
    {
      type: 'size',
      label: 'Size',
      options: [
        { value: 'mini', label: 'Mini' },
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'oversized', label: 'Oversized' }
      ]
    }
  ],
  
  shoes: [
    {
      type: 'price',
      label: 'Price',
      options: [
        { value: '0-50', label: 'Under $50' },
        { value: '50-100', label: '$50-$100' },
        { value: '100-200', label: '$100-$200' },
        { value: '200-500', label: '$200-$500' },
        { value: '500-', label: '$500+' }
      ]
    },
    {
      type: 'size',
      label: 'Size',
      options: [
        // EU sizes
        { value: '35', label: 'EU 35' },
        { value: '36', label: 'EU 36' },
        { value: '37', label: 'EU 37' },
        { value: '38', label: 'EU 38' },
        { value: '39', label: 'EU 39' },
        { value: '40', label: 'EU 40' },
        { value: '41', label: 'EU 41' },
        { value: '42', label: 'EU 42' },
        { value: '43', label: 'EU 43' },
        { value: '44', label: 'EU 44' },
        { value: '45', label: 'EU 45' },
        { value: '46', label: 'EU 46' }
      ]
    },
    {
      type: 'type',
      label: 'Shoe Type',
      options: [
        { value: 'sneakers', label: 'Sneakers' },
        { value: 'boots', label: 'Boots' },
        { value: 'heels', label: 'Heels' },
        { value: 'flats', label: 'Flats' },
        { value: 'sandals', label: 'Sandals' },
        { value: 'loafers', label: 'Loafers' },
        { value: 'oxfords', label: 'Oxfords' },
        { value: 'athletic', label: 'Athletic' },
        { value: 'pumps', label: 'Pumps' },
        { value: 'wedges', label: 'Wedges' }
      ]
    },
    {
      type: 'brand',
      label: 'Brand',
      options: [...SPORT_BRANDS, ...LUXURY_BRANDS, 'Dr. Martens', 'Timberland', 'Clarks', 'Steve Madden']
        .sort().map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand }))
    },
    {
      type: 'color',
      label: 'Color',
      options: Object.entries(COLORS).map(([value, { label }]) => ({ value, label }))
    },
    {
      type: 'condition',
      label: 'Condition',
      options: [
        { value: 'new-in-box', label: 'New in box' },
        { value: 'new-without-box', label: 'New without box' },
        { value: 'like-new', label: 'Like new' },
        { value: 'very-good', label: 'Very Good' },
        { value: 'good', label: 'Good' },
        { value: 'worn', label: 'Worn' }
      ]
    }
  ],
  
  designer: [
    {
      type: 'price',
      label: 'Price',
      options: [
        { value: '0-500', label: 'Under $500' },
        { value: '500-1000', label: '$500-$1000' },
        { value: '1000-2500', label: '$1000-$2500' },
        { value: '2500-5000', label: '$2500-$5000' },
        { value: '5000-10000', label: '$5000-$10000' },
        { value: '10000-', label: '$10000+' }
      ]
    },
    {
      type: 'brand',
      label: 'Designer Brand',
      options: LUXURY_BRANDS.sort().map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand }))
    },
    {
      type: 'category',
      label: 'Category',
      options: [
        { value: 'bags', label: 'Bags' },
        { value: 'shoes', label: 'Shoes' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'accessories', label: 'Accessories' },
        { value: 'jewelry', label: 'Jewelry' },
        { value: 'watches', label: 'Watches' }
      ]
    },
    {
      type: 'authentication',
      label: 'Authentication',
      options: [
        { value: 'authenticated', label: 'Authenticated' },
        { value: 'receipt-included', label: 'Receipt Included' },
        { value: 'dust-bag-box', label: 'With Dust Bag/Box' },
        { value: 'no-authentication', label: 'No Authentication' }
      ]
    },
    {
      type: 'condition',
      label: 'Condition',
      options: [
        { value: 'new-with-tags', label: 'New with tags' },
        { value: 'new-without-tags', label: 'New without tags' },
        { value: 'pristine', label: 'Pristine' },
        { value: 'excellent', label: 'Excellent' },
        { value: 'very-good', label: 'Very Good' },
        { value: 'good', label: 'Good' }
      ]
    }
  ]
};

// Default filters for categories not explicitly defined
export const defaultFilters: FilterGroup[] = [
  {
    type: 'price',
    label: 'Price',
    options: [
      { value: '0-25', label: 'Under $25' },
      { value: '25-50', label: '$25-$50' },
      { value: '50-100', label: '$50-$100' },
      { value: '100-200', label: '$100-$200' },
      { value: '200-', label: '$200+' }
    ]
  },
  {
    type: 'condition',
    label: 'Condition',
    options: [
      { value: 'new-with-tags', label: 'New with tags' },
      { value: 'new-without-tags', label: 'New without tags' },
      { value: 'like-new', label: 'Like new' },
      { value: 'good', label: 'Good' },
      { value: 'fair', label: 'Fair' }
    ]
  }
];

export function getFiltersForCategory(categorySlug: string): FilterGroup[] {
  return categoryFilters[categorySlug] || defaultFilters;
}