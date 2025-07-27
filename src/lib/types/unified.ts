/**
 * Unified Type Definitions
 * Single source of truth matching database schema
 */

import type { Database } from './database'
import type { ExtendedProfile } from './database.extended'

// Core database types
export type Profile = ExtendedProfile
export type Listing = Database['public']['Tables']['listings']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type UserRating = Database['public']['Tables']['user_ratings']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type UserFollow = Database['public']['Tables']['user_follows']['Row']

// Insert types for mutations
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ListingInsert = Database['public']['Tables']['listings']['Insert']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

// Update types for patches
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ListingUpdate = Database['public']['Tables']['listings']['Update']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

// Enums from database
export type ListingStatus = 'draft' | 'active' | 'sold' | 'reserved' | 'deleted'
export type ListingCondition = 'new' | 'like_new' | 'excellent' | 'good' | 'fair'
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
export type RatingType = 'seller' | 'buyer'

// Helper types for common patterns
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  category?: string
  minPrice?: number
  maxPrice?: number
  condition?: ListingCondition
  location?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Extended types with relations
export interface ProfileWithStats extends Profile {
  listings?: Listing[]
  followers?: UserFollow[]
  following?: UserFollow[]
  ratings?: UserRating[]
}

export interface ListingWithDetails extends Listing {
  seller: Profile
  category: Category | null
  favorites: Favorite[]
  isFavorited?: boolean
}

export interface TransactionWithDetails extends Transaction {
  buyer: Profile
  seller: Profile
  listing: Listing
  rating?: UserRating
}

export interface MessageThread {
  participant: Profile
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

// Form/Input types matching database constraints
export interface ProfileFormData {
  username: string
  full_name?: string
  bio?: string
  location?: string
  website?: string
}

export interface ListingFormData {
  title: string
  description?: string
  price: number
  category_id?: string
  condition?: ListingCondition
  size?: string
  brand?: string
  color?: string
  material?: string
  images: string[]
  location_city?: string
  location_country?: string
  ships_worldwide: boolean
}

// Achievement types
export interface AchievementLevel {
  level: number
  name: string
  requirement: string
  reward: string
}

export interface AchievementDefinition {
  type: string
  name: string
  description: string
  icon: string
  color: string
  requirement: string
  levels: AchievementLevel[]
}

// Re-export database types for backwards compatibility
export type { Database } from './database'