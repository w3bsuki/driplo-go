// API Response Types
// This file defines TypeScript types for all API endpoints

import type { Tables } from './database.types';

// Common response shapes
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
}

// Browse API
export interface BrowseLoadMoreResponse {
  listings: Array<Tables<'listings'> & {
    profiles: Tables<'profiles'>;
    listing_images: Array<Tables<'listing_images'>>;
    favorites?: Array<Tables<'favorites'>>;
  }>;
  hasMore: boolean;
  nextPage: number | null;
}

// Sellers API
export interface TopSellersResponse {
  sellers: Array<{
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    total_sales: number;
    revenue: number;
    average_rating: number | null;
    review_count: number;
    rank?: number;
  }>;
  period: string;
  totalCount: number;
}

// Messages API
export interface ConversationResponse {
  id: string;
  user1_id: string;
  user2_id: string;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  user1_archived: boolean;
  user2_archived: boolean;
  messages?: Array<Tables<'messages'>>;
  listing?: Tables<'listings'>;
  other_user?: Tables<'profiles'>;
  unread_count?: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MessageSendRequest {
  recipient_id: string;
  content: string;
  listing_id?: string;
}

export interface MessageSendResponse {
  message: Tables<'messages'>;
  conversation_id: string;
}

// Orders API
export interface OrderResponse extends Tables<'orders'> {
  listing?: Tables<'listings'>;
  seller?: Tables<'profiles'>;
  buyer?: Tables<'profiles'>;
  payment?: Tables<'payments'>;
}

export interface OrderStatsResponse {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
  revenue_by_month: Array<{
    month: string;
    revenue: number;
    order_count: number;
  }>;
}

export interface OrderCreateRequest {
  listing_id: string;
  quantity: number;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  payment_method_id: string;
}

export interface OrderShipRequest {
  tracking_number: string;
  carrier: string;
  notes?: string;
}

export interface OrderRefundRequest {
  amount?: number;
  reason: string;
}

// Payment API
export interface PaymentIntentRequest {
  order_id: string;
  amount: number;
  currency?: string;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface PaymentAccountSetupResponse {
  account_link_url: string;
  account_id: string;
  expires_at: number;
}

// Wishlist API
export interface WishlistToggleRequest {
  listing_id: string;
}

export interface WishlistToggleResponse {
  added: boolean;
  favorite_id?: string;
}

// Upload API
export interface ImageUploadRequest {
  file: File;
  type: 'profile' | 'listing' | 'brand';
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

export interface ImageUploadResponse {
  url: string;
  public_url: string;
  path: string;
  size: number;
  width?: number;
  height?: number;
}

// Admin API
export interface PayoutStatsResponse {
  total_payouts: number;
  pending_amount: number;
  processed_amount: number;
  failed_count: number;
  average_payout: number;
  payouts_by_status: Record<string, number>;
}

export interface PayoutBatchRequest {
  payout_ids: string[];
  action: 'process' | 'cancel' | 'retry';
}

export interface PayoutBatchResponse {
  processed: number;
  failed: number;
  errors: Array<{
    payout_id: string;
    error: string;
  }>;
}

// Health Check API
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    storage: ServiceHealth;
    stripe: ServiceHealth;
    email?: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

// Search API
export interface SearchSuggestionsResponse {
  suggestions: Array<{
    type: 'category' | 'brand' | 'query' | 'user';
    value: string;
    label: string;
    count?: number;
    icon?: string;
  }>;
}

// Transaction API
export interface TransactionResponse extends Tables<'transactions'> {
  order?: Tables<'orders'>;
  user?: Tables<'profiles'>;
}

// Draft API
export interface DraftListingRequest {
  title?: string;
  description?: string;
  price?: number;
  category_id?: string;
  condition?: string;
  size?: string;
  brand?: string;
  tags?: string[];
  images?: string[];
}

export interface DraftListingResponse {
  draft_id: string;
  saved: boolean;
  data: DraftListingRequest;
}

// Metrics API
export interface MetricsData {
  path: string;
  duration: number;
  timestamp: string;
  userAgent?: string;
  metrics?: {
    ttfb?: number;
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  };
}

// Generic API Error Response
export interface ApiErrorResponse {
  error: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

// Type guards
export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiErrorResponse).error === 'string'
  );
}

export function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'pagination' in response
  );
}

// Re-export from api-utils for convenience
export type { ApiResponse, PaginatedResponse } from '$lib/server/api-utils';