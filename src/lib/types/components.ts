/**
 * Component Props Interfaces
 * Comprehensive TypeScript interfaces for all Svelte components
 * 
 * @fileoverview This file provides type safety for component props across the entire application
 * @version 1.0.0
 * @created 2025-07-27
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { Tables, Database } from './database';

// =============================================================================
// CORE UI COMPONENT INTERFACES
// =============================================================================

/**
 * Button Component Props
 * Extends HTMLButtonAttributes for full button compatibility
 */
export interface ButtonProps extends HTMLButtonAttributes {
  /** Button visual variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Button size variant */
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | 'icon';
  /** Additional CSS classes */
  class?: string;
  /** Button content slot */
  children: Snippet;
  /** Loading state */
  loading?: boolean;
  /** Icon-only button */
  iconOnly?: boolean;
}

/**
 * Input Component Props
 * Enhanced input with size variants and comprehensive event handling
 */
export interface InputProps extends Omit<HTMLInputAttributes, 'size'> {
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  class?: string;
  /** Bindable input value */
  value?: string | number;
  /** Error state styling */
  error?: boolean;
  /** Helper text below input */
  helperText?: string;
  /** Input icon */
  icon?: Snippet;
}

/**
 * Badge Component Props
 * Small status/category indicators
 */
export interface BadgeProps {
  /** Badge visual variant */
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info';
  /** Badge size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  class?: string;
  /** Badge content */
  children: Snippet;
}

// =============================================================================
// BUSINESS LOGIC COMPONENT INTERFACES
// =============================================================================

/**
 * User Profile Data
 * Common user profile structure used across components
 */
export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string | null;
  account_type?: 'personal' | 'brand';
  is_verified?: boolean;
  bio?: string;
  location?: string;
}

/**
 * Listing Data Structure
 * Comprehensive listing object for marketplace items
 */
export interface ListingData {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  currency?: string;
  size?: string;
  brand?: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'worn';
  category_id: string;
  subcategory_id?: string;
  seller_id: string;
  images: string[];
  status: 'active' | 'sold' | 'pending' | 'draft';
  created_at: string;
  updated_at?: string;
  view_count?: number;
  like_count?: number;
  
  // Related data
  seller?: UserProfile;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  is_liked?: boolean;
  is_favorited?: boolean;
}

/**
 * Listing Card Component Props
 * Card component displaying marketplace listings
 */
export interface ListingCardProps {
  /** Listing data object */
  listing: ListingData;
  /** Card display variant */
  variant?: 'default' | 'compact' | 'featured' | 'minimal';
  /** Show seller information */
  showSeller?: boolean;
  /** Show like/favorite button */
  showFavorite?: boolean;
  /** Show price information */
  showPrice?: boolean;
  /** Enable hover animations */
  enableHover?: boolean;
  /** Eager loading for images */
  eagerLoading?: boolean;
  /** Additional CSS classes */
  class?: string;
  
  // Event handlers
  /** Listing click handler */
  onclick?: (listing: ListingData) => void;
  /** Favorite toggle handler */
  onFavorite?: (listingId: string, isFavorited: boolean) => void;
  /** Share listing handler */
  onShare?: (listing: ListingData) => void;
}

/**
 * Message Thread Component Props
 * Real-time messaging interface
 */
export interface MessageThreadProps {
  /** Conversation ID */
  conversationId: string;
  /** Current user ID */
  userId: string;
  /** Supabase client instance */
  supabase: import('@supabase/supabase-js').SupabaseClient<Database>;
  /** Enable virtual scrolling for large conversations */
  useVirtualScrolling?: boolean;
  /** Auto-focus message input on mount */
  autoFocus?: boolean;
  /** Maximum messages to load initially */
  initialMessageLimit?: number;
  /** Enable file attachments */
  enableAttachments?: boolean;
  
  // Event handlers
  /** Message sent callback */
  onMessageSent?: (message: any) => void;
  /** Conversation closed callback */
  onClose?: () => void;
}

/**
 * Checkout Flow Component Props
 * E-commerce checkout process
 */
export interface CheckoutFlowProps {
  /** Item being purchased */
  listing: ListingData;
  /** Current user data */
  user: UserProfile;
  /** Modal open/close state */
  isOpen: boolean;
  /** Enable guest checkout */
  allowGuestCheckout?: boolean;
  /** Default shipping address */
  defaultShippingAddress?: ShippingAddress;
  
  // Event handlers
  /** Purchase completed callback */
  onPurchaseComplete?: (orderId: string) => void;
  /** Checkout cancelled callback */
  onCancel?: () => void;
  /** Payment failed callback */
  onPaymentError?: (error: string) => void;
}

/**
 * Shipping Address Interface
 * Address information for checkout
 */
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  name?: string;
  phone?: string;
}

// =============================================================================
// LAYOUT COMPONENT INTERFACES
// =============================================================================

/**
 * Header Component Props
 * Main navigation header
 */
export interface HeaderProps {
  /** Supabase client for auth and data */
  supabase: import('@supabase/supabase-js').SupabaseClient<Database>;
  /** Current user data */
  user?: UserProfile | null;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Show unread message count */
  showUnreadCount?: boolean;
  /** Sticky header behavior */
  sticky?: boolean;
  /** Additional CSS classes */
  class?: string;
}

/**
 * Error Boundary Component Props
 * Error handling and display component
 */
export interface ErrorBoundaryProps {
  /** Error display level */
  level?: 'minimal' | 'detailed' | 'debug';
  /** Custom error message */
  fallbackMessage?: string;
  /** Show error details in production */
  showDetailsInProduction?: boolean;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: any) => void;
  /** Error boundary reset handler */
  onReset?: () => void;
  /** Additional CSS classes for error UI */
  class?: string;
  /** Child components */
  children: Snippet;
}

// =============================================================================
// FORM COMPONENT INTERFACES
// =============================================================================

/**
 * Form Field Props
 * Generic form field wrapper
 */
export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Field name/id */
  name: string;
  /** Required field indicator */
  required?: boolean;
  /** Field error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Additional CSS classes */
  class?: string;
  /** Field content */
  children: Snippet;
}

/**
 * Create Listing Form Props
 * Multi-step listing creation interface
 */
export interface CreateListingFormProps {
  /** Initial draft data */
  initialData?: Partial<ListingData>;
  /** Current form step */
  currentStep?: number;
  /** Enable auto-save */
  autoSave?: boolean;
  /** Show step progress */
  showProgress?: boolean;
  
  // Event handlers
  /** Form submission callback */
  onSubmit?: (listingData: ListingData) => void;
  /** Draft saved callback */
  onDraftSaved?: (draftId: string) => void;
  /** Form cancelled callback */
  onCancel?: () => void;
  /** Step changed callback */
  onStepChange?: (step: number) => void;
}

// =============================================================================
// LOADING AND STATE INTERFACES
// =============================================================================

/**
 * Loading State Interface
 * Common loading state pattern
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: any;
}

/**
 * Pagination Props
 * Reusable pagination component
 */
export interface PaginationProps {
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Show page info text */
  showPageInfo?: boolean;
  /** Additional CSS classes */
  class?: string;
  
  // Event handlers
  /** Page change callback */
  onPageChange: (page: number) => void;
  /** Page size change callback */
  onPageSizeChange?: (size: number) => void;
}

// =============================================================================
// UTILITY TYPE HELPERS
// =============================================================================

/**
 * Component Size Variants
 * Standard size system across components
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component Variants
 * Common variant patterns
 */
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

/**
 * Event Handler Types
 * Common event handler patterns
 */
export type ClickHandler<T = any> = (event: MouseEvent, data?: T) => void;
export type ChangeHandler<T = any> = (value: T, event?: Event) => void;
export type SubmitHandler<T = any> = (data: T, event?: SubmitEvent) => void;
