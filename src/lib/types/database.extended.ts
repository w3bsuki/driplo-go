// Extended database types for tables and columns not yet in database.types.ts
// This file provides temporary type definitions until the database types are regenerated

import type { Database as GeneratedDatabase } from './database.types';

// Extended profile type with brand account fields
export interface ExtendedProfile extends GeneratedDatabase['public']['Tables']['profiles']['Row'] {
  account_type?: 'personal' | 'brand';
  brand_name?: string | null;
  brand_description?: string | null;
  brand_established_date?: string | null;
  brand_category?: string | null;
  is_local_brand?: boolean | null;
  brand_story?: string | null;
  brand_values?: string[] | null;
  brand_certifications?: any | null;
  brand_logo_url?: string | null;
  brand_cover_url?: string | null;
  brand_contact_email?: string | null;
  brand_contact_phone?: string | null;
  brand_instagram?: string | null;
  brand_facebook?: string | null;
  brand_website?: string | null;
  has_completed_onboarding?: boolean | null;
  onboarding_step?: number | null;
  onboarding_completed_at?: string | null;
  setup_completed?: boolean | null;
  setup_started_at?: string | null;
  setup_completed_at?: string | null;
  avatar_style?: string | null;
  avatar_seed?: string | null;
  custom_avatar_url?: string | null;
  brand_onboarding_completed?: boolean | null;
  brand_mission?: string | null;
}

// Brand verification request table type
export interface BrandVerificationRequest {
  id: string;
  user_id: string;
  brand_name: string;
  brand_category: string;
  business_registration_number?: string | null;
  tax_id?: string | null;
  legal_representative_name?: string | null;
  company_address?: string | null;
  verification_documents?: any | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Admin approval table type
export interface AdminApproval {
  id: string;
  admin_id: string;
  request_type: string;
  request_id: string;
  action: 'approved' | 'rejected';
  reason?: string | null;
  metadata?: any | null;
  created_at?: string | null;
}

// Extended database type with missing tables
export interface ExtendedDatabase extends GeneratedDatabase {
  public: GeneratedDatabase['public'] & {
    Tables: GeneratedDatabase['public']['Tables'] & {
      brand_verification_requests: {
        Row: BrandVerificationRequest;
        Insert: Partial<BrandVerificationRequest> & Pick<BrandVerificationRequest, 'user_id' | 'brand_name' | 'brand_category'>;
        Update: Partial<BrandVerificationRequest>;
        Relationships: [{
          foreignKeyName: "brand_verification_requests_user_id_fkey";
          columns: ["user_id"];
          isOneToOne: false;
          referencedRelation: "users";
          referencedColumns: ["id"];
        }];
      };
      admin_approvals: {
        Row: AdminApproval;
        Insert: Partial<AdminApproval> & Pick<AdminApproval, 'admin_id' | 'request_type' | 'request_id' | 'action'>;
        Update: Partial<AdminApproval>;
        Relationships: [{
          foreignKeyName: "admin_approvals_admin_id_fkey";
          columns: ["admin_id"];
          isOneToOne: false;
          referencedRelation: "users";
          referencedColumns: ["id"];
        }];
      };
    };
  };
}

// Helper type to use extended profile in components
export type Profile = ExtendedProfile;

// Helper type for subcategories with proper typing
export interface ExtendedSubcategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon?: string | null;
  description?: string | null;
  [key: string]: any;
}