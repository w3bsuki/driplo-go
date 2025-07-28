/**
 * API Response Interfaces
 * Standardized response types for all API endpoints
 * 
 * @fileoverview Provides type safety for API responses and ensures consistent patterns
 * @version 1.0.0
 * @created 2025-07-27
 */

import type { Tables, Database } from './database';
import type { UserProfile, ListingData } from './components';

// =============================================================================
// CORE API RESPONSE PATTERNS
// =============================================================================

/**
 * Standard API Response Wrapper
 * All API endpoints should return this structure
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data?: T;
  /** Error information */
  error?: string;
  /** HTTP status code */
  status: number;
  /** Request ID for debugging */
  requestId?: string;
  /** Additional metadata */
  meta?: {
    timestamp: string;
    version?: string;
    [key: string]: any;
  };
}

/**
 * Success Response Helper
 * For successful API responses
 */
export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  data: T;
  status: 200 | 201 | 204;
}

/**
 * Error Response Structure
 * For failed API responses
 */
export interface ApiErrorResponse extends ApiResponse<never> {
  error: string;
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;
  details?: {
    field?: string;
    code?: string;
    message?: string;
  }[];
}

/**
 * Paginated Response Structure
 * For endpoints returning paginated data
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-based) */
    page: number;
    /** Items per page */
    limit: number;
    /** Total number of items */
    total: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there are more pages */
    hasMore: boolean;
    /** Next page number if available */
    nextPage?: number;
    /** Previous page number if available */
    prevPage?: number;
  };
}

// =============================================================================
// AUTHENTICATION API INTERFACES
// =============================================================================

/**
 * Login Request Body
 */
export interface LoginRequest {
  email: string;
  password: string;
  captcha_token?: string;
  remember_me?: boolean;
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: UserProfile;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  };
  requires_2fa?: boolean;
  setup_required?: boolean;
}

/**
 * Registration Request Body
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name?: string;
  captcha_token?: string;
  terms_accepted: boolean;
}

/**
 * Registration Response
 */
export interface RegisterResponse {
  user: UserProfile;
  verification_required: boolean;
  setup_required: boolean;
}

/**
 * 2FA Setup Response
 */
export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

/**
 * 2FA Verification Request
 */
export interface TwoFactorVerifyRequest {
  code: string;
  backup_code?: string;
  remember_device?: boolean;
}

// =============================================================================
// LISTING API INTERFACES
// =============================================================================

/**
 * Browse Listings Request Parameters
 */
export interface BrowseListingsParams {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  size?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popularity';
  seller?: string;
}

/**
 * Browse Listings Response
 */
export interface BrowseListingsResponse extends PaginatedResponse<ListingData> {
  /** Available filters for current search */
  filters: {
    brands: string[];
    sizes: string[];
    conditions: string[];
    price_range: {
      min: number;
      max: number;
    };
  };
}

/**
 * Create Listing Request
 */
export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  original_price?: number;
  size?: string;
  brand?: string;
  condition: string;
  category_id: string;
  subcategory_id?: string;
  images: string[];
  shipping_cost?: number;
  tags?: string[];
}

/**
 * Create Listing Response
 */
export interface CreateListingResponse {
  listing: ListingData;
  draft_id?: string;
}

/**
 * Update Listing Request
 */
export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  status?: 'active' | 'sold' | 'pending' | 'draft';
}

// =============================================================================
// ORDER API INTERFACES
// =============================================================================

/**
 * Order Data Structure
 */
export interface OrderData {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  shipping_cost: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  
  // Related data
  buyer?: UserProfile;
  seller?: UserProfile;
  listing?: ListingData;
  shipping_address?: ShippingAddress;
  tracking_number?: string;
}

/**
 * Create Order Request
 */
export interface CreateOrderRequest {
  listing_id: string;
  shipping_address: ShippingAddress;
  payment_method_id: string;
  special_instructions?: string;
}

/**
 * Create Order Response
 */
export interface CreateOrderResponse {
  order: OrderData;
  payment_intent_id: string;
  client_secret: string;
}

/**
 * Order List Response
 */
export interface OrderListResponse extends PaginatedResponse<OrderData> {
  summary: {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
  };
}

// =============================================================================
// MESSAGING API INTERFACES
// =============================================================================

/**
 * Message Data Structure
 */
export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  message_type: 'text' | 'image' | 'offer' | 'system';
  
  // Related data
  sender?: UserProfile;
  attachments?: MessageAttachment[];
}

/**
 * Message Attachment
 */
export interface MessageAttachment {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  content_type: string;
}

/**
 * Conversation Data Structure
 */
export interface ConversationData {
  id: string;
  user1_id: string;
  user2_id: string;
  listing_id?: string;
  last_message_at: string;
  created_at: string;
  
  // Related data
  other_user?: UserProfile;
  listing?: Pick<ListingData, 'id' | 'title' | 'price' | 'images'>;
  last_message?: Pick<MessageData, 'content' | 'created_at' | 'sender_id'>;
  unread_count?: number;
}

/**
 * Send Message Request
 */
export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'offer';
  attachments?: File[];
}

/**
 * Send Message Response
 */
export interface SendMessageResponse {
  message: MessageData;
  conversation: ConversationData;
}

/**
 * Conversation List Response
 */
export interface ConversationListResponse extends PaginatedResponse<ConversationData> {
  total_unread: number;
}

// =============================================================================
// PAYMENT API INTERFACES
// =============================================================================

/**
 * Payment Intent Request
 */
export interface CreatePaymentIntentRequest {
  listing_id: string;
  amount: number;
  currency?: string;
  payment_method?: string;
}

/**
 * Payment Intent Response
 */
export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

/**
 * Payment Method Data
 */
export interface PaymentMethodData {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details: {
    name: string;
    email: string;
    address?: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

// =============================================================================
// SEARCH API INTERFACES
// =============================================================================

/**
 * Search Suggestions Request
 */
export interface SearchSuggestionsParams {
  query: string;
  limit?: number;
  categories?: string[];
}

/**
 * Search Suggestions Response
 */
export interface SearchSuggestionsResponse {
  suggestions: {
    listings: Pick<ListingData, 'id' | 'title' | 'price' | 'images'>[];
    brands: string[];
    categories: string[];
    users: Pick<UserProfile, 'id' | 'username' | 'avatar_url'>[];
  };
  total_results: number;
}

// =============================================================================
// ANALYTICS API INTERFACES
// =============================================================================

/**
 * User Analytics Data
 */
export interface UserAnalyticsData {
  views: {
    total: number;
    this_week: number;
    trend: 'up' | 'down' | 'stable';
  };
  sales: {
    total: number;
    total_revenue: number;
    this_month: number;
    average_sale_price: number;
  };
  listings: {
    active: number;
    sold: number;
    draft: number;
    total: number;
  };
  followers: {
    count: number;
    new_this_week: number;
  };
}

/**
 * Seller Analytics Response
 */
export interface SellerAnalyticsResponse {
  analytics: UserAnalyticsData;
  recent_activity: {
    orders: OrderData[];
    messages: MessageData[];
    views: { listing_id: string; count: number; date: string }[];
  };
}

// =============================================================================
// UPLOAD API INTERFACES
// =============================================================================

/**
 * File Upload Request
 */
export interface FileUploadRequest {
  file: File;
  folder?: string;
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

/**
 * File Upload Response
 */
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  content_type: string;
  folder: string;
}

// =============================================================================
// HEALTH CHECK API INTERFACES
// =============================================================================

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    storage: 'up' | 'down';
    stripe: 'up' | 'down';
    email: 'up' | 'down';
  };
  response_time_ms: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Shipping Address (also used in components.ts)
 */
export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

/**
 * Request ID Generator
 */
export type RequestId = `req_${number}_${string}`;

/**
 * API Method Types
 */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Sort Order Types
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Currency Codes
 */
export type CurrencyCode = 'GBP' | 'USD' | 'EUR';
