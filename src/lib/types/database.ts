export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          meta_title: string | null
          meta_description: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          meta_title?: string | null
          meta_description?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          meta_title?: string | null
          meta_description?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          brand: string | null
          category_id: string | null
          color: string | null
          condition: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          images: Json | null
          is_featured: boolean | null
          like_count: number | null
          location_city: string | null
          location_country: string | null
          material: string | null
          price: number
          published_at: string | null
          seller_id: string
          shipping_cost: number | null
          shipping_type: string | null
          ships_worldwide: boolean | null
          size: string | null
          slug: string | null
          sold_at: string | null
          status: string | null
          subcategory_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          like_count?: number | null
          location_city?: string | null
          location_country?: string | null
          material?: string | null
          price: number
          published_at?: string | null
          seller_id: string
          shipping_cost?: number | null
          shipping_type?: string | null
          ships_worldwide?: boolean | null
          size?: string | null
          slug?: string | null
          sold_at?: string | null
          status?: string | null
          subcategory_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          like_count?: number | null
          location_city?: string | null
          location_country?: string | null
          material?: string | null
          price?: number
          published_at?: string | null
          seller_id?: string
          shipping_cost?: number | null
          shipping_type?: string | null
          ships_worldwide?: boolean | null
          size?: string | null
          slug?: string | null
          sold_at?: string | null
          status?: string | null
          subcategory_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          buyer_rating: number | null
          buyer_rating_count: number | null
          completion_percentage: number | null
          cover_url: string | null
          created_at: string | null
          email: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          last_active: string | null
          location: string | null
          member_since: string | null
          profile_views: number | null
          response_time_hours: number | null
          role: string | null
          seller_level: number | null
          seller_rating: number | null
          seller_rating_count: number | null
          social_links: Json | null
          total_earnings: number | null
          total_purchases: number | null
          total_sales: number | null
          updated_at: string | null
          username: string
          verification_badges: Json | null
          website: string | null
          account_type: 'personal' | 'brand' | null
          setup_completed: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          buyer_rating?: number | null
          buyer_rating_count?: number | null
          completion_percentage?: number | null
          cover_url?: string | null
          created_at?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          last_active?: string | null
          location?: string | null
          member_since?: string | null
          profile_views?: number | null
          response_time_hours?: number | null
          role?: string | null
          seller_level?: number | null
          seller_rating?: number | null
          seller_rating_count?: number | null
          social_links?: Json | null
          total_earnings?: number | null
          total_purchases?: number | null
          total_sales?: number | null
          updated_at?: string | null
          username: string
          verification_badges?: Json | null
          website?: string | null
          account_type?: 'personal' | 'brand' | null
          setup_completed?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          buyer_rating?: number | null
          buyer_rating_count?: number | null
          completion_percentage?: number | null
          cover_url?: string | null
          created_at?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_active?: string | null
          location?: string | null
          member_since?: string | null
          profile_views?: number | null
          response_time_hours?: number | null
          role?: string | null
          seller_level?: number | null
          seller_rating?: number | null
          seller_rating_count?: number | null
          social_links?: Json | null
          total_earnings?: number | null
          total_purchases?: number | null
          total_sales?: number | null
          updated_at?: string | null
          username?: string
          verification_badges?: Json | null
          website?: string | null
          account_type?: 'personal' | 'brand' | null
          setup_completed?: boolean | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          listing_id: string
          payment_method: string | null
          refund_amount: number | null
          seller_id: string
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          listing_id: string
          payment_method?: string | null
          refund_amount?: number | null
          seller_id: string
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          listing_id?: string
          payment_method?: string | null
          refund_amount?: number | null
          seller_id?: string
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          created_at: string | null
          helpful_count: number | null
          id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          rating_type: Database["public"]["Enums"]["rating_type"]
          review_text: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          rating_type: Database["public"]["Enums"]["rating_type"]
          review_text?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          rating_type?: Database["public"]["Enums"]["rating_type"]
          review_text?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ratings_rater_user_id_fkey"
            columns: ["rater_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ratings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          id: string
          stripe_event_id: string
          event_type: string
          processed: boolean | null
          created_at: string | null
          processed_at: string | null
          error: string | null
        }
        Insert: {
          id?: string
          stripe_event_id: string
          event_type: string
          processed?: boolean | null
          created_at?: string | null
          processed_at?: string | null
          error?: string | null
        }
        Update: {
          id?: string
          stripe_event_id?: string
          event_type?: string
          processed?: boolean | null
          created_at?: string | null
          processed_at?: string | null
          error?: string | null
        }
        Relationships: []
      }
      seller_payouts: {
        Row: {
          id: string
          transaction_id: string
          seller_id: string
          amount: number
          seller_revtag: string
          status: string | null
          processed_by: string | null
          processed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
          stripe_payout_id: string | null
          stripe_transfer_amount: number | null
          stripe_transfer_id: string | null
          stripe_payout_date: string | null
          payout_method: string | null
          payout_details: Json | null
          admin_notes: string | null
          paid_at: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          seller_id: string
          amount: number
          seller_revtag: string
          status?: string | null
          processed_by?: string | null
          processed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          stripe_payout_id?: string | null
          stripe_transfer_amount?: number | null
          stripe_transfer_id?: string | null
          stripe_payout_date?: string | null
          payout_method?: string | null
          payout_details?: Json | null
          admin_notes?: string | null
          paid_at?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          seller_id?: string
          amount?: number
          seller_revtag?: string
          status?: string | null
          processed_by?: string | null
          processed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          stripe_payout_id?: string | null
          stripe_transfer_amount?: number | null
          stripe_transfer_id?: string | null
          stripe_payout_date?: string | null
          payout_method?: string | null
          payout_details?: Json | null
          admin_notes?: string | null
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_payouts_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          id: string
          user_id: string
          revtag: string
          verified: boolean | null
          verification_notes: string | null
          created_at: string
          updated_at: string
          payout_method: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_routing_number: string | null
          bank_name: string | null
          paypal_email: string | null
          preferred_currency: string | null
        }
        Insert: {
          id?: string
          user_id: string
          revtag: string
          verified?: boolean | null
          verification_notes?: string | null
          created_at?: string
          updated_at?: string
          payout_method?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_routing_number?: string | null
          bank_name?: string | null
          paypal_email?: string | null
          preferred_currency?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          revtag?: string
          verified?: boolean | null
          verification_notes?: string | null
          created_at?: string
          updated_at?: string
          payout_method?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_routing_number?: string | null
          bank_name?: string | null
          paypal_email?: string | null
          preferred_currency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          last_message_at: string | null
          archived_by_buyer: boolean | null
          archived_by_seller: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          seller_id: string
          last_message_at?: string | null
          archived_by_buyer?: boolean | null
          archived_by_seller?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string
          last_message_at?: string | null
          archived_by_buyer?: boolean | null
          archived_by_seller?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message_text: string
          attachments: Json | null
          is_read: boolean | null
          read_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          message_text: string
          attachments?: Json | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          message_text?: string
          attachments?: Json | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          buyer_id: string
          seller_id: string
          transaction_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          shipping_address: Json
          shipping_method: string | null
          shipping_carrier: string | null
          tracking_number: string | null
          shipping_label_url: string | null
          subtotal: number
          shipping_cost: number
          tax_amount: number
          total_amount: number
          confirmed_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          refunded_at: string | null
          notes: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          buyer_id: string
          seller_id: string
          transaction_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          shipping_address: Json
          shipping_method?: string | null
          shipping_carrier?: string | null
          tracking_number?: string | null
          shipping_label_url?: string | null
          subtotal: number
          shipping_cost?: number
          tax_amount?: number
          total_amount: number
          confirmed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          buyer_id?: string
          seller_id?: string
          transaction_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          shipping_address?: Json
          shipping_method?: string | null
          shipping_carrier?: string | null
          tracking_number?: string | null
          shipping_label_url?: string | null
          subtotal?: number
          shipping_cost?: number
          tax_amount?: number
          total_amount?: number
          confirmed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          notes?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          listing_id: string
          quantity: number
          price: number
          total: number
          item_snapshot: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          listing_id: string
          quantity?: number
          price: number
          total: number
          item_snapshot: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          listing_id?: string
          quantity?: number
          price?: number
          total?: number
          item_snapshot?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          from_status: Database["public"]["Enums"]["order_status"] | null
          to_status: Database["public"]["Enums"]["order_status"]
          changed_by: string | null
          reason: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          to_status: Database["public"]["Enums"]["order_status"]
          changed_by?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          from_status?: Database["public"]["Enums"]["order_status"] | null
          to_status?: Database["public"]["Enums"]["order_status"]
          changed_by?: string | null
          reason?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_events: {
        Row: {
          id: string
          order_id: string
          event_type: string
          event_description: string | null
          location: string | null
          carrier_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          event_type: string
          event_description?: string | null
          location?: string | null
          carrier_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          event_type?: string
          event_description?: string | null
          location?: string | null
          carrier_data?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          id: string
          order_id: string
          initiated_by: string
          reason: string
          description: string
          evidence: Json
          status: string
          resolution: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          initiated_by: string
          reason: string
          description: string
          evidence?: Json
          status?: string
          resolution?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          initiated_by?: string
          reason?: string
          description?: string
          evidence?: Json
          status?: string
          resolution?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_verification_requests: {
        Row: {
          id: string
          brand_id: string
          requester_id: string
          status: 'pending' | 'approved' | 'rejected'
          documents: Json | null
          notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          requester_id: string
          status?: 'pending' | 'approved' | 'rejected'
          documents?: Json | null
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          requester_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          documents?: Json | null
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_verification_requests_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_verification_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_approvals: {
        Row: {
          id: string
          request_type: string
          request_id: string
          admin_id: string
          action: 'approved' | 'rejected'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_type: string
          request_id: string
          admin_id: string
          action: 'approved' | 'rejected'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_type?: string
          request_id?: string
          admin_id?: string
          action?: 'approved' | 'rejected'
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_approvals_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_top_category_sellers: {
        Args: {
          category_uuid: string
        }
        Returns: {
          user_id: string
          username: string
          avatar_url: string | null
          total_sales: number
          average_rating: number | null
        }[]
      }
    }
    Enums: {
      rating_type: "seller" | "buyer"
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded" | "disputed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      rating_type: ["seller", "buyer"],
      order_status: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded", "disputed"],
    },
  },
} as const
