/**
 * Form and Validation Interfaces
 * Type definitions for forms, validation, and user input
 * 
 * @fileoverview Provides comprehensive form typing for the entire application
 * @version 1.0.0
 * @created 2025-07-27
 */

import type { Tables } from './database';
import type { UserProfile, ListingData, ShippingAddress } from './components';

// =============================================================================
// CORE FORM INTERFACES
// =============================================================================

/**
 * Form Field State
 * Common state pattern for all form fields
 */
export interface FormFieldState<T = any> {
  /** Current field value */
  value: T;
  /** Validation error message */
  error?: string;
  /** Field has been touched by user */
  touched: boolean;
  /** Field is currently being validated */
  validating: boolean;
  /** Field is disabled */
  disabled: boolean;
}

/**
 * Form State Management
 * Overall form state and operations
 */
export interface FormState<T extends Record<string, any> = Record<string, any>> {
  /** Form field values */
  values: T;
  /** Form field errors */
  errors: Partial<Record<keyof T, string>>;
  /** Fields that have been touched */
  touched: Partial<Record<keyof T, boolean>>;
  /** Form is currently submitting */
  submitting: boolean;
  /** Form has been submitted at least once */
  submitted: boolean;
  /** Form is valid (no errors) */
  isValid: boolean;
  /** Form has unsaved changes */
  isDirty: boolean;
}

/**
 * Validation Rule
 * Single validation rule for form fields
 */
export interface ValidationRule<T = any> {
  /** Validation function */
  validator: (value: T, allValues?: Record<string, any>) => string | null | Promise<string | null>;
  /** Error message when validation fails */
  message: string;
  /** Only validate when field is not empty */
  optional?: boolean;
  /** Validation priority (lower runs first) */
  priority?: number;
}

/**
 * Field Validation Schema
 * Multiple validation rules for a single field
 */
export interface FieldValidationSchema<T = any> {
  /** Array of validation rules */
  rules: ValidationRule<T>[];
  /** Validate on field change */
  validateOnChange?: boolean;
  /** Validate on field blur */
  validateOnBlur?: boolean;
  /** Debounce validation (ms) */
  debounce?: number;
}

// =============================================================================
// AUTHENTICATION FORMS
// =============================================================================

/**
 * Login Form Data
 */
export interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
  captcha_token?: string;
}

/**
 * Login Form Validation Schema
 */
export interface LoginFormSchema {
  email: FieldValidationSchema<string>;
  password: FieldValidationSchema<string>;
  captcha_token?: FieldValidationSchema<string>;
}

/**
 * Registration Form Data
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  username: string;
  display_name: string;
  terms_accepted: boolean;
  newsletter_subscribed: boolean;
  captcha_token?: string;
}

/**
 * Two-Factor Authentication Setup Form
 */
export interface TwoFactorSetupFormData {
  verification_code: string;
  backup_codes_acknowledged: boolean;
}

/**
 * Two-Factor Authentication Verify Form
 */
export interface TwoFactorVerifyFormData {
  code: string;
  use_backup_code: boolean;
  backup_code?: string;
  remember_device: boolean;
}

/**
 * Password Reset Form Data
 */
export interface PasswordResetFormData {
  email: string;
  captcha_token?: string;
}

/**
 * New Password Form Data
 */
export interface NewPasswordFormData {
  password: string;
  confirm_password: string;
  token: string;
}

// =============================================================================
// PROFILE FORMS
// =============================================================================

/**
 * Profile Settings Form Data
 */
export interface ProfileSettingsFormData {
  display_name: string;
  bio: string;
  location: string;
  website: string;
  social_media: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  avatar_file?: File;
  privacy: {
    show_email: boolean;
    show_location: boolean;
    allow_messages: boolean;
  };
  notifications: {
    email_new_messages: boolean;
    email_order_updates: boolean;
    email_marketing: boolean;
    push_new_messages: boolean;
    push_order_updates: boolean;
  };
}

/**
 * Profile Onboarding Form Data
 */
export interface ProfileOnboardingFormData {
  account_type: 'personal' | 'brand';
  display_name: string;
  bio: string;
  location: string;
  interests: string[];
  avatar_file?: File;
  
  // Brand-specific fields
  brand_name?: string;
  brand_description?: string;
  brand_website?: string;
  brand_logo?: File;
}

// =============================================================================
// LISTING FORMS
// =============================================================================

/**
 * Create Listing Form Data
 * Multi-step form for creating marketplace listings
 */
export interface CreateListingFormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  category_id: string;
  subcategory_id?: string;
  
  // Step 2: Product Details
  brand: string;
  size: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'worn';
  color: string;
  material?: string;
  
  // Step 3: Pricing
  price: number;
  original_price?: number;
  currency: string;
  accept_offers: boolean;
  minimum_offer?: number;
  
  // Step 4: Shipping
  shipping_cost: number;
  shipping_methods: string[];
  ships_to: string[];
  processing_time: number;
  
  // Step 5: Media
  images: File[];
  image_urls?: string[];
  main_image_index: number;
  
  // Additional
  tags: string[];
  is_vintage: boolean;
  measurements?: {
    chest?: number;
    waist?: number;
    length?: number;
    sleeve?: number;
  };
}

/**
 * Edit Listing Form Data
 */
export interface EditListingFormData extends Partial<CreateListingFormData> {
  id: string;
  status: 'active' | 'sold' | 'pending' | 'draft';
}

/**
 * Listing Draft Data
 * Saved form progress
 */
export interface ListingDraftData {
  id?: string;
  form_data: Partial<CreateListingFormData>;
  current_step: number;
  last_saved: string;
  expires_at: string;
}

// =============================================================================
// ORDER AND PAYMENT FORMS
// =============================================================================

/**
 * Checkout Form Data
 */
export interface CheckoutFormData {
  // Shipping Information
  shipping_address: ShippingAddress;
  billing_same_as_shipping: boolean;
  billing_address?: ShippingAddress;
  
  // Payment Information
  payment_method: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  save_payment_method: boolean;
  
  // Order Details
  special_instructions?: string;
  gift_message?: string;
  marketing_consent: boolean;
}

/**
 * Payment Method Form Data
 */
export interface PaymentMethodFormData {
  card_number: string;
  expiry_month: number;
  expiry_year: number;
  cvc: string;
  cardholder_name: string;
  billing_address: ShippingAddress;
  save_for_future: boolean;
}

/**
 * Shipping Form Data
 */
export interface ShippingFormData {
  tracking_number: string;
  carrier: string;
  estimated_delivery: string;
  shipping_notes?: string;
  mark_as_shipped: boolean;
}

// =============================================================================
// MESSAGING FORMS
// =============================================================================

/**
 * Send Message Form Data
 */
export interface SendMessageFormData {
  content: string;
  message_type: 'text' | 'image' | 'offer';
  attachments: File[];
  
  // For offer messages
  offer_amount?: number;
  offer_expires?: string;
}

/**
 * Message Search Form Data
 */
export interface MessageSearchFormData {
  query: string;
  conversation_id?: string;
  date_from?: string;
  date_to?: string;
  message_type?: 'text' | 'image' | 'offer' | 'system';
}

// =============================================================================
// SEARCH AND FILTER FORMS
// =============================================================================

/**
 * Browse Listings Filter Form
 */
export interface BrowseFiltersFormData {
  search: string;
  category: string;
  subcategory: string;
  brand: string[];
  size: string[];
  condition: string[];
  color: string[];
  min_price: number;
  max_price: number;
  location: string;
  sort_by: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popularity';
  show_sold: boolean;
}

/**
 * Advanced Search Form Data
 */
export interface AdvancedSearchFormData {
  keywords: string;
  exact_phrase: string;
  exclude_words: string;
  seller_username: string;
  location_radius: number;
  date_listed: 'today' | 'week' | 'month' | 'year';
  has_images: boolean;
  verified_sellers_only: boolean;
}

// =============================================================================
// ADMIN FORMS
// =============================================================================

/**
 * User Moderation Form Data
 */
export interface UserModerationFormData {
  action: 'warn' | 'suspend' | 'ban' | 'verify';
  reason: string;
  duration?: number; // days
  send_notification: boolean;
  internal_notes?: string;
}

/**
 * Listing Moderation Form Data
 */
export interface ListingModerationFormData {
  action: 'approve' | 'reject' | 'remove' | 'feature';
  reason?: string;
  feedback_to_seller?: string;
  violation_type?: string;
  internal_notes?: string;
}

/**
 * Category Management Form Data
 */
export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  sort_order: number;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Common Validation Errors
 */
export interface ValidationErrors {
  required: string;
  email: string;
  password: string;
  confirm_password: string;
  min_length: string;
  max_length: string;
  min_value: string;
  max_value: string;
  pattern: string;
  file_size: string;
  file_type: string;
  unique: string;
}

/**
 * File Upload Constraints
 */
export interface FileUploadConstraints {
  max_size: number; // bytes
  allowed_types: string[];
  max_files: number;
  required: boolean;
}

/**
 * Form Step Configuration
 */
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  validation?: Record<string, FieldValidationSchema>;
  required?: boolean;
  can_skip?: boolean;
}

/**
 * Multi-Step Form Configuration
 */
export interface MultiStepFormConfig {
  steps: FormStep[];
  allow_navigation: boolean;
  save_progress: boolean;
  show_progress: boolean;
  validation_mode: 'step' | 'all' | 'field';
}

// =============================================================================
// FORM SUBMISSION TYPES
// =============================================================================

/**
 * Form Submission Result
 */
export interface FormSubmissionResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  message?: string;
  redirect?: string;
}

/**
 * Form Action Types
 * For SvelteKit form actions
 */
export type FormActionResult<T = any> = {
  type: 'success';
  status: number;
  data: T;
} | {
  type: 'failure';
  status: number;
  data: {
    errors: Record<string, string>;
    message?: string;
  };
} | {
  type: 'error';
  status: number;
  error: Error;
};

/**
 * Server Action Enhanced Request
 */
export interface ActionRequest<T = any> {
  formData: FormData;
  url: URL;
  request: Request;
  locals: App.Locals;
  platform: App.Platform;
  parsedData?: T;
}
