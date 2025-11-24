export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_applications: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_earnings: {
        Row: {
          affiliate_id: string
          amount: number
          book_id: string
          created_at: string
          id: string
          order_id: string | null
          referred_user_id: string
        }
        Insert: {
          affiliate_id: string
          amount?: number
          book_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          referred_user_id: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          book_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_earnings_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "affiliate_earnings_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_earnings_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "affiliate_earnings_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_orders: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          order_id: string
          referral_id: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          order_id: string
          referral_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          order_id?: string
          referral_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates_referrals: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          referred_user_id: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          referred_user_id: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "affiliates_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "affiliates_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banking_subaccounts: {
        Row: {
          account_number: string | null
          bank_code: string | null
          bank_name: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          encrypted_account_number: string | null
          encrypted_bank_code: string | null
          encrypted_bank_name: string | null
          encrypted_business_name: string | null
          encrypted_email: string | null
          encrypted_subaccount_code: string | null
          encryption_key_hash: string | null
          id: string
          paystack_response: Json | null
          recipient_code: string | null
          status: string | null
          subaccount_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          encrypted_account_number?: string | null
          encrypted_bank_code?: string | null
          encrypted_bank_name?: string | null
          encrypted_business_name?: string | null
          encrypted_email?: string | null
          encrypted_subaccount_code?: string | null
          encryption_key_hash?: string | null
          id?: string
          paystack_response?: Json | null
          recipient_code?: string | null
          status?: string | null
          subaccount_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          encrypted_account_number?: string | null
          encrypted_bank_code?: string | null
          encrypted_bank_name?: string | null
          encrypted_business_name?: string | null
          encrypted_email?: string | null
          encrypted_subaccount_code?: string | null
          encryption_key_hash?: string | null
          id?: string
          paystack_response?: Json | null
          recipient_code?: string | null
          status?: string | null
          subaccount_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bobbox_webhooks: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          received_at: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          received_at?: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          received_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          additional_images: string[]
          address_encryption_version: number | null
          affiliate_ref_id: string | null
          author: string
          availability: string | null
          available_quantity: number
          back_cover: string | null
          category: string
          condition: string
          created_at: string
          curriculum: string | null
          description: string
          front_cover: string | null
          genre: string | null
          grade: string | null
          id: string
          image_url: string
          initial_quantity: number
          inside_pages: string | null
          isbn: string | null
          item_type: string | null
          pickup_address_encrypted: string | null
          price: number
          province: string | null
          requires_banking_setup: boolean | null
          seller_id: string
          seller_subaccount_code: string | null
          sold: boolean
          sold_at: string | null
          sold_quantity: number
          subaccount_code: string | null
          title: string
          university: string | null
          university_year: string | null
          updated_at: string | null
        }
        Insert: {
          additional_images?: string[]
          address_encryption_version?: number | null
          affiliate_ref_id?: string | null
          author: string
          availability?: string | null
          available_quantity?: number
          back_cover?: string | null
          category: string
          condition: string
          created_at?: string
          curriculum?: string | null
          description: string
          front_cover?: string | null
          genre?: string | null
          grade?: string | null
          id?: string
          image_url: string
          initial_quantity?: number
          inside_pages?: string | null
          isbn?: string | null
          item_type?: string | null
          pickup_address_encrypted?: string | null
          price: number
          province?: string | null
          requires_banking_setup?: boolean | null
          seller_id: string
          seller_subaccount_code?: string | null
          sold?: boolean
          sold_at?: string | null
          sold_quantity?: number
          subaccount_code?: string | null
          title: string
          university?: string | null
          university_year?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_images?: string[]
          address_encryption_version?: number | null
          affiliate_ref_id?: string | null
          author?: string
          availability?: string | null
          available_quantity?: number
          back_cover?: string | null
          category?: string
          condition?: string
          created_at?: string
          curriculum?: string | null
          description?: string
          front_cover?: string | null
          genre?: string | null
          grade?: string | null
          id?: string
          image_url?: string
          initial_quantity?: number
          inside_pages?: string | null
          isbn?: string | null
          item_type?: string | null
          pickup_address_encrypted?: string | null
          price?: number
          province?: string | null
          requires_banking_setup?: boolean | null
          seller_id?: string
          seller_subaccount_code?: string | null
          sold?: boolean
          sold_at?: string | null
          sold_quantity?: number
          subaccount_code?: string | null
          title?: string
          university?: string | null
          university_year?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_affiliate_ref_id_fkey"
            columns: ["affiliate_ref_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_affiliate_ref_id_fkey"
            columns: ["affiliate_ref_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "books_affiliate_ref_id_fkey"
            columns: ["affiliate_ref_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_books_seller_profile"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_books_seller_profile"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_books_seller_profile"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_feedback_orders: {
        Row: {
          amount: number | null
          book_id: string | null
          buyer_email: string | null
          buyer_feedback: string | null
          buyer_id: string | null
          buyer_phone: string | null
          buyer_status: string
          commit_deadline: string | null
          committed_at: string | null
          created_at: string | null
          delivery_fee: number | null
          delivery_status: string | null
          id: string
          order_id: string
          payment_reference: string | null
          payment_status: string | null
          platform_fee: number | null
          refund_status: string | null
          refunded_at: string | null
          seller_id: string | null
          status: string | null
          total_amount: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          book_id?: string | null
          buyer_email?: string | null
          buyer_feedback?: string | null
          buyer_id?: string | null
          buyer_phone?: string | null
          buyer_status: string
          commit_deadline?: string | null
          committed_at?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_status?: string | null
          id?: string
          order_id: string
          payment_reference?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          refund_status?: string | null
          refunded_at?: string | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          book_id?: string | null
          buyer_email?: string | null
          buyer_feedback?: string | null
          buyer_id?: string | null
          buyer_phone?: string | null
          buyer_status?: string
          commit_deadline?: string | null
          committed_at?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_status?: string | null
          id?: string
          order_id?: string
          payment_reference?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          refund_status?: string | null
          refunded_at?: string | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_feedback_orders_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_feedback_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_feedback_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "buyer_feedback_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_feedback_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_feedback_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_feedback_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "buyer_feedback_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cashout_request: {
        Row: {
          affiliate_id: string
          amount: number
          contact_email: string | null
          created_at: string
          encrypted_account_number: string | null
          encrypted_bank_code: string | null
          encrypted_bank_name: string | null
          encrypted_business_name: string | null
          encrypted_email: string | null
          encrypted_first_name: string | null
          encrypted_last_name: string | null
          encrypted_phone_number: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          referral_data: Json
          rejection_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          contact_email?: string | null
          created_at?: string
          encrypted_account_number?: string | null
          encrypted_bank_code?: string | null
          encrypted_bank_name?: string | null
          encrypted_business_name?: string | null
          encrypted_email?: string | null
          encrypted_first_name?: string | null
          encrypted_last_name?: string | null
          encrypted_phone_number?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          referral_data?: Json
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          contact_email?: string | null
          created_at?: string
          encrypted_account_number?: string | null
          encrypted_bank_code?: string | null
          encrypted_bank_name?: string | null
          encrypted_business_name?: string | null
          encrypted_email?: string | null
          encrypted_first_name?: string | null
          encrypted_last_name?: string | null
          encrypted_phone_number?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          referral_data?: Json
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashout_request_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashout_request_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cashout_request_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashout_request_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashout_request_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "account_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cashout_request_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          details: Json | null
          executed_at: string | null
          id: string
          job_name: string
          status: string | null
        }
        Insert: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name: string
          status?: string | null
        }
        Update: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name?: string
          status?: string | null
        }
        Relationships: []
      }
      delivery_automation_log: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          order_id: string
          provider: string | null
          request_data: Json | null
          response_data: Json | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id: string
          provider?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string
          provider?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_automation_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      mail_queue: {
        Row: {
          body: string
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          retry_count: number | null
          sent_at: string | null
          status: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_requests: {
        Row: {
          course_code: string | null
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string
          notified_at: string | null
          program_id: string | null
          program_name: string | null
          status: string
          university_id: string | null
          university_name: string | null
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          course_code?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type: string
          notified_at?: string | null
          program_id?: string | null
          program_name?: string | null
          status?: string
          university_id?: string | null
          university_name?: string | null
          updated_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          course_code?: string | null
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          notified_at?: string | null
          program_id?: string | null
          program_name?: string | null
          status?: string
          university_id?: string | null
          university_name?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          order_id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          order_id: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          order_id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_activity_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          order_id: string | null
          read: boolean | null
          sent_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          order_id?: string | null
          read?: boolean | null
          sent_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          order_id?: string | null
          read?: boolean | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_encryption_version: number | null
          amount: number
          book_id: string | null
          buyer_email: string
          buyer_full_name: string | null
          buyer_id: string | null
          buyer_phone_number: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          commit_deadline: string | null
          committed_at: string | null
          created_at: string
          decline_reason: string | null
          declined_at: string | null
          delivery_data: Json | null
          delivery_locker_data: Json | null
          delivery_locker_location_id: number | null
          delivery_locker_provider_slug: string | null
          delivery_option: string | null
          delivery_status: string | null
          delivery_type: string | null
          id: string
          items: Json
          metadata: Json | null
          order_id: string | null
          paid_at: string | null
          payment_data: Json | null
          payment_reference: string | null
          payment_status: string | null
          paystack_reference: string | null
          pickup_address_encrypted: string | null
          pickup_locker_data: Json | null
          pickup_locker_location_id: number | null
          pickup_locker_provider_slug: string | null
          pickup_type: string | null
          refund_reference: string | null
          refund_status: string | null
          refunded_at: string | null
          selected_courier_name: string | null
          selected_courier_slug: string | null
          selected_service_code: string | null
          selected_service_name: string | null
          selected_shipping_cost: number | null
          seller_email: string | null
          seller_full_name: string | null
          seller_id: string
          seller_phone_number: string | null
          shipping_address_encrypted: string | null
          status: string
          total_amount: number | null
          total_refunded: number | null
          tracking_data: Json | null
          tracking_number: string | null
          updated_at: string
          waybill_url: string | null
        }
        Insert: {
          address_encryption_version?: number | null
          amount: number
          book_id?: string | null
          buyer_email: string
          buyer_full_name?: string | null
          buyer_id?: string | null
          buyer_phone_number?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          commit_deadline?: string | null
          committed_at?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          delivery_data?: Json | null
          delivery_locker_data?: Json | null
          delivery_locker_location_id?: number | null
          delivery_locker_provider_slug?: string | null
          delivery_option?: string | null
          delivery_status?: string | null
          delivery_type?: string | null
          id?: string
          items?: Json
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          payment_data?: Json | null
          payment_reference?: string | null
          payment_status?: string | null
          paystack_reference?: string | null
          pickup_address_encrypted?: string | null
          pickup_locker_data?: Json | null
          pickup_locker_location_id?: number | null
          pickup_locker_provider_slug?: string | null
          pickup_type?: string | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          selected_courier_name?: string | null
          selected_courier_slug?: string | null
          selected_service_code?: string | null
          selected_service_name?: string | null
          selected_shipping_cost?: number | null
          seller_email?: string | null
          seller_full_name?: string | null
          seller_id: string
          seller_phone_number?: string | null
          shipping_address_encrypted?: string | null
          status?: string
          total_amount?: number | null
          total_refunded?: number | null
          tracking_data?: Json | null
          tracking_number?: string | null
          updated_at?: string
          waybill_url?: string | null
        }
        Update: {
          address_encryption_version?: number | null
          amount?: number
          book_id?: string | null
          buyer_email?: string
          buyer_full_name?: string | null
          buyer_id?: string | null
          buyer_phone_number?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          commit_deadline?: string | null
          committed_at?: string | null
          created_at?: string
          decline_reason?: string | null
          declined_at?: string | null
          delivery_data?: Json | null
          delivery_locker_data?: Json | null
          delivery_locker_location_id?: number | null
          delivery_locker_provider_slug?: string | null
          delivery_option?: string | null
          delivery_status?: string | null
          delivery_type?: string | null
          id?: string
          items?: Json
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          payment_data?: Json | null
          payment_reference?: string | null
          payment_status?: string | null
          paystack_reference?: string | null
          pickup_address_encrypted?: string | null
          pickup_locker_data?: Json | null
          pickup_locker_location_id?: number | null
          pickup_locker_provider_slug?: string | null
          pickup_type?: string | null
          refund_reference?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          selected_courier_name?: string | null
          selected_courier_slug?: string | null
          selected_service_code?: string | null
          selected_service_name?: string | null
          selected_shipping_cost?: number | null
          seller_email?: string | null
          seller_full_name?: string | null
          seller_id?: string
          seller_phone_number?: string | null
          shipping_address_encrypted?: string | null
          status?: string
          total_amount?: number | null
          total_refunded?: number | null
          tracking_data?: Json | null
          tracking_number?: string | null
          updated_at?: string
          waybill_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          event_type: string
          id: string
          payload: Json | null
          paystack_event_id: string | null
          processed_at: string | null
          transaction_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          payload?: Json | null
          paystack_event_id?: string | null
          processed_at?: string | null
          transaction_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json | null
          paystack_event_id?: string | null
          processed_at?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          bobpay_response: Json | null
          created_at: string
          currency: string | null
          custom_payment_id: string | null
          id: string
          items: Json | null
          metadata: Json | null
          order_id: string
          payment_method: string
          paystack_response: Json | null
          reference: string
          shipping_address: Json | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          bobpay_response?: Json | null
          created_at?: string
          currency?: string | null
          custom_payment_id?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          order_id: string
          payment_method?: string
          paystack_response?: Json | null
          reference: string
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          bobpay_response?: Json | null
          created_at?: string
          currency?: string | null
          custom_payment_id?: string | null
          id?: string
          items?: Json | null
          metadata?: Json | null
          order_id?: string
          payment_method?: string
          paystack_response?: Json | null
          reference?: string
          shipping_address?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          notes: string | null
          old_status: string | null
          payout_id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          payout_id: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          payout_id?: string
          performed_by?: string | null
        }
        Relationships: []
      }
      payout_items: {
        Row: {
          book_id: string | null
          book_title: string | null
          commission_amount: number
          created_at: string | null
          id: string
          payout_id: string
          sale_amount: number
          sale_date: string
          seller_amount: number
        }
        Insert: {
          book_id?: string | null
          book_title?: string | null
          commission_amount: number
          created_at?: string | null
          id?: string
          payout_id: string
          sale_amount: number
          sale_date: string
          seller_amount: number
        }
        Update: {
          book_id?: string | null
          book_title?: string | null
          commission_amount?: number
          created_at?: string | null
          id?: string
          payout_id?: string
          sale_amount?: number
          sale_date?: string
          seller_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          bank_account_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          requested_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          bank_account_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          bank_account_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_encryption_version: number | null
          addresses_same: boolean | null
          affiliate_code: string | null
          aps_profile: Json | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          email_verification_token: string | null
          email_verified: boolean | null
          encryption_status: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_affiliate: boolean
          last_name: string | null
          name: string | null
          phone_number: string | null
          phone_verification_code: string | null
          phone_verified: boolean | null
          pickup_address_encrypted: string | null
          preferences: Json | null
          preferred_delivery_locker_data: Json | null
          preferred_delivery_locker_location_id: number | null
          preferred_delivery_locker_provider_slug: string | null
          preferred_delivery_locker_saved_at: string | null
          preferred_pickup_locker_saved_at: string | null
          preferred_pickup_method: string | null
          profile_picture_url: string | null
          role: string | null
          shipping_address_encrypted: string | null
          status: string | null
          suspended_at: string | null
          suspension_reason: string | null
          total_affiliate_earnings: number
          updated_at: string
          user_tier: string | null
          verification_expires_at: string | null
        }
        Insert: {
          address_encryption_version?: number | null
          addresses_same?: boolean | null
          affiliate_code?: string | null
          aps_profile?: Json | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          encryption_status?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          is_affiliate?: boolean
          last_name?: string | null
          name?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean | null
          pickup_address_encrypted?: string | null
          preferences?: Json | null
          preferred_delivery_locker_data?: Json | null
          preferred_delivery_locker_location_id?: number | null
          preferred_delivery_locker_provider_slug?: string | null
          preferred_delivery_locker_saved_at?: string | null
          preferred_pickup_locker_saved_at?: string | null
          preferred_pickup_method?: string | null
          profile_picture_url?: string | null
          role?: string | null
          shipping_address_encrypted?: string | null
          status?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          total_affiliate_earnings?: number
          updated_at?: string
          user_tier?: string | null
          verification_expires_at?: string | null
        }
        Update: {
          address_encryption_version?: number | null
          addresses_same?: boolean | null
          affiliate_code?: string | null
          aps_profile?: Json | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          email_verification_token?: string | null
          email_verified?: boolean | null
          encryption_status?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_affiliate?: boolean
          last_name?: string | null
          name?: string | null
          phone_number?: string | null
          phone_verification_code?: string | null
          phone_verified?: boolean | null
          pickup_address_encrypted?: string | null
          preferences?: Json | null
          preferred_delivery_locker_data?: Json | null
          preferred_delivery_locker_location_id?: number | null
          preferred_delivery_locker_provider_slug?: string | null
          preferred_delivery_locker_saved_at?: string | null
          preferred_pickup_locker_saved_at?: string | null
          preferred_pickup_method?: string | null
          profile_picture_url?: string | null
          role?: string | null
          shipping_address_encrypted?: string | null
          status?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          total_affiliate_earnings?: number
          updated_at?: string
          user_tier?: string | null
          verification_expires_at?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          buyer_email: string
          generated_at: string | null
          id: string
          order_id: string | null
          receipt_data: Json
          receipt_number: string
          seller_email: string
          sent_to_admin: boolean | null
          sent_to_buyer: boolean | null
        }
        Insert: {
          buyer_email: string
          generated_at?: string | null
          id?: string
          order_id?: string | null
          receipt_data: Json
          receipt_number: string
          seller_email: string
          sent_to_admin?: boolean | null
          sent_to_buyer?: boolean | null
        }
        Update: {
          buyer_email?: string
          generated_at?: string | null
          id?: string
          order_id?: string | null
          receipt_data?: Json
          receipt_number?: string
          seller_email?: string
          sent_to_admin?: boolean | null
          sent_to_buyer?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_transactions: {
        Row: {
          amount: number
          bobpay_refund_reference: string | null
          bobpay_response: Json | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          initiated_by: string | null
          order_id: string
          paystack_refund_reference: string | null
          paystack_response: Json | null
          processed_at: string | null
          reason: string
          status: string
          transaction_reference: string
          updated_at: string
        }
        Insert: {
          amount: number
          bobpay_refund_reference?: string | null
          bobpay_response?: Json | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          order_id: string
          paystack_refund_reference?: string | null
          paystack_response?: Json | null
          processed_at?: string | null
          reason: string
          status?: string
          transaction_reference: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bobpay_refund_reference?: string | null
          bobpay_response?: Json | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          order_id?: string
          paystack_refund_reference?: string | null
          paystack_response?: Json | null
          processed_at?: string | null
          reason?: string
          status?: string
          transaction_reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          book_id: string | null
          book_title: string
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_user_id: string
          seller_name: string
          status: string
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          book_title: string
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_user_id: string
          seller_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          book_title?: string
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_user_id?: string
          seller_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_commitments: {
        Row: {
          commitment_deadline: string
          committed_at: string | null
          created_at: string
          id: string
          order_id: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          commitment_deadline: string
          committed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          commitment_deadline?: string
          committed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_commitments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          book_id: string
          book_title: string
          buyer_email: string | null
          buyer_id: string
          buyer_phone: string | null
          commission: number
          committed_at: string | null
          created_at: string
          delivery_address: Json | null
          delivery_fee: number | null
          expires_at: string | null
          id: string
          paystack_reference: string | null
          paystack_subaccount_code: string | null
          price: number
          refund_reason: string | null
          refunded: boolean | null
          seller_committed: boolean | null
          seller_id: string
          status: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          book_id: string
          book_title: string
          buyer_email?: string | null
          buyer_id: string
          buyer_phone?: string | null
          commission: number
          committed_at?: string | null
          created_at?: string
          delivery_address?: Json | null
          delivery_fee?: number | null
          expires_at?: string | null
          id?: string
          paystack_reference?: string | null
          paystack_subaccount_code?: string | null
          price: number
          refund_reason?: string | null
          refunded?: boolean | null
          seller_committed?: boolean | null
          seller_id: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          book_title?: string
          buyer_email?: string | null
          buyer_id?: string
          buyer_phone?: string | null
          commission?: number
          committed_at?: string | null
          created_at?: string
          delivery_address?: Json | null
          delivery_fee?: number | null
          expires_at?: string | null
          id?: string
          paystack_reference?: string | null
          paystack_subaccount_code?: string | null
          price?: number
          refund_reason?: string | null
          refunded?: boolean | null
          seller_committed?: boolean | null
          seller_id?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          available_balance: number | null
          created_at: string | null
          id: string
          pending_balance: number | null
          total_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          created_at?: string | null
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance?: number | null
          created_at?: string | null
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          reference_order_id: string | null
          reference_payout_id: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          reference_order_id?: string | null
          reference_payout_id?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          reference_order_id?: string | null
          reference_payout_id?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      account_details: {
        Row: {
          bio: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string | null
          full_name: string | null
          id: string | null
          last_name: string | null
          phone_number: string | null
          phone_verified: boolean | null
          preferences: Json | null
          profile_picture_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          last_name?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          last_name?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          name: string | null
          profile_picture_url: string | null
          status: string | null
          user_tier: string | null
        }
        Relationships: []
      }
      refund_summary: {
        Row: {
          amount: number | null
          buyer_email: string | null
          buyer_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string | null
          initiated_by_email: string | null
          order_id: string | null
          paystack_refund_reference: string | null
          processing_hours: number | null
          reason: string | null
          seller_email: string | null
          seller_id: string | null
          status: string | null
          transaction_reference: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _assert_self_or_admin: { Args: { p_user_id: string }; Returns: undefined }
      activate_affiliate: { Args: { user_id: string }; Returns: string }
      add_funds_to_wallet: {
        Args: {
          p_amount: number
          p_order_id: string
          p_reason?: string
          p_seller_id: string
        }
        Returns: boolean
      }
      admin_delete_user: {
        Args: { user_id_to_delete: string }
        Returns: boolean
      }
      admin_delete_user_safe: {
        Args: { user_id_to_delete: string }
        Returns: Json
      }
      admin_safe_delete_user_comprehensive: {
        Args: { user_id_to_delete: string }
        Returns: Json
      }
      approve_affiliate_application: {
        Args: { application_id: string }
        Returns: undefined
      }
      approve_seller_payout: {
        Args: { p_notes?: string; p_payout_id: string; p_reviewer_id: string }
        Returns: boolean
      }
      atomic_book_purchase: {
        Args: { p_amount: number; p_book_id: string; p_buyer_id: string }
        Returns: string
      }
      auto_cancel_expired_orders: { Args: never; Returns: undefined }
      auto_process_ready_orders: { Args: never; Returns: undefined }
      calculate_commission: {
        Args: { base_amount: number; user_tier?: string }
        Returns: number
      }
      calculate_payment_split: {
        Args: {
          p_book_amount: number
          p_delivery_amount?: number
          p_platform_commission_rate?: number
        }
        Returns: {
          courier_amount: number
          platform_commission: number
          seller_amount: number
        }[]
      }
      check_refund_eligibility: {
        Args: { p_order_id: string }
        Returns: {
          eligible: boolean
          max_refund_amount: number
          reason: string
        }[]
      }
      clear_user_aps_profile: { Args: { user_id?: string }; Returns: boolean }
      create_buyer_feedback_record: {
        Args: {
          p_buyer_feedback?: string
          p_buyer_status: string
          p_order_id: string
        }
        Returns: string
      }
      create_missing_profiles_for_books: { Args: never; Returns: number }
      create_order_notification: {
        Args: {
          p_message: string
          p_order_id: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_payment_split: {
        Args: {
          p_book_amount: number
          p_courier_subaccount: string
          p_delivery_amount?: number
          p_seller_subaccount: string
          p_transaction_id: string
        }
        Returns: string
      }
      create_payout_request: {
        Args: { p_amount: number; p_user_id: string }
        Returns: string
      }
      credit_wallet_on_collection: {
        Args: { p_book_price: number; p_order_id: string; p_seller_id: string }
        Returns: {
          credit_amount: number
          error_message: string
          new_balance: number
          success: boolean
        }[]
      }
      delete_user_address: {
        Args: { address_type: string; target_user_id: string }
        Returns: Json
      }
      delete_user_profile: { Args: { user_id: string }; Returns: undefined }
      deny_seller_payout: {
        Args: { p_payout_id: string; p_reason: string; p_reviewer_id: string }
        Returns: boolean
      }
      execute_payment_split_after_pickup: {
        Args: { p_transaction_id: string }
        Returns: boolean
      }
      find_orphaned_books: {
        Args: never
        Returns: {
          book_id: string
          book_title: string
          seller_email: string
          seller_id: string
        }[]
      }
      fix_book_quantities: { Args: { p_book_id: string }; Returns: boolean }
      generate_affiliate_code: { Args: never; Returns: string }
      generate_api_key: { Args: { user_id: string }; Returns: string }
      generate_encryption_key_hash: {
        Args: { user_id: string }
        Returns: string
      }
      generate_receipt_number: { Args: never; Returns: string }
      get_affiliate_stats: {
        Args: { p_affiliate_id: string }
        Returns: {
          active_referrals: number
          total_book_sales: number
          total_earnings: number
          total_referrals: number
        }[]
      }
      get_bobbox_webhooks: {
        Args: never
        Returns: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          received_at: string
        }[]
      }
      get_complete_schema: { Args: never; Returns: Json }
      get_current_user_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_encrypted_address_data: {
        Args: { address_type?: string; record_id: string; table_name: string }
        Returns: {
          encryption_version: number
          has_encrypted_data: boolean
          has_plaintext_data: boolean
        }[]
      }
      get_orders_for_tracking_update: {
        Args: never
        Returns: {
          buyer_email: string
          courier: string
          delivery_status: string
          order_id: string
          seller_id: string
          tracking_number: string
        }[]
      }
      get_orphaned_data_stats: {
        Args: never
        Returns: {
          orphaned_books_count: number
          users_with_books_no_profile: number
        }[]
      }
      get_payment_statistics: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          avg_payment_amount: number
          failed_payments: number
          pending_payments: number
          successful_payments: number
          total_amount: number
          total_payments: number
        }[]
      }
      get_payment_transaction: {
        Args: { p_reference: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          order_id: string
          reference: string
          status: string
          verified_at: string
        }[]
      }
      get_payout_statistics: {
        Args: never
        Returns: {
          approved_count: number
          denied_count: number
          pending_count: number
          total_approved_amount: number
        }[]
      }
      get_public_profiles: {
        Args: never
        Returns: {
          bio: string
          created_at: string
          full_name: string
          id: string
          name: string
          profile_picture_url: string
          status: string
          user_tier: string
        }[]
      }
      get_refund_statistics: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          avg_processing_time: unknown
          avg_refund_amount: number
          failed_refunds: number
          pending_refunds: number
          processing_refunds: number
          successful_refunds: number
          total_refund_amount: number
          total_refunds: number
        }[]
      }
      get_seller_available_balance: {
        Args: { p_seller_id: string }
        Returns: number
      }
      get_seller_profile_for_checkout: {
        Args: { seller_user_id: string }
        Returns: {
          email: string
          id: string
          name: string
          pickup_address_encrypted: string
          subaccount_code: string
        }[]
      }
      get_seller_profile_for_delivery: {
        Args: { p_seller_id: string }
        Returns: {
          has_subaccount: boolean
          seller_email: string
          seller_id: string
          seller_name: string
        }[]
      }
      get_seller_subaccount: { Args: { seller_id: string }; Returns: string }
      get_user_aps_profile: { Args: { user_id?: string }; Returns: Json }
      get_user_payment_history: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          created_at: string
          order_id: string
          payment_method: string
          reference: string
          status: string
          transaction_id: string
          verified_at: string
        }[]
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          email: string
          id: string
          name: string
        }[]
      }
      get_wallet_summary: {
        Args: { p_user_id: string }
        Returns: {
          available_balance: number
          pending_balance: number
          total_earned: number
          total_withdrawn: number
        }[]
      }
      has_role:
      | { Args: { role_name: string; user_id: number }; Returns: boolean }
      | { Args: { role_name: string; user_id: string }; Returns: boolean }
      is_admin: { Args: { uid: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_seller_ready_for_orders: {
        Args: { p_seller_id: string }
        Returns: boolean
      }
      is_user_admin: { Args: never; Returns: boolean }
      list_all_profiles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          username: string
        }[]
      }
      manually_release_order_stock: {
        Args: { p_order_id: string }
        Returns: Json
      }
      meetup_mark_read: { Args: { p_message_ids: string[] }; Returns: number }
      redact_json_addresses: { Args: { input: Json }; Returns: Json }
      reject_affiliate_application: {
        Args: { application_id: string; reason: string }
        Returns: undefined
      }
      release_book_stock: {
        Args: { p_book_id: string; p_qty?: number }
        Returns: undefined
      }
      reserve_book_stock: {
        Args: { p_book_id: string; p_qty?: number }
        Returns: boolean
      }
      safe_delete_user: {
        Args: { user_id_to_delete: string }
        Returns: boolean
      }
      save_user_aps_profile: {
        Args: { profile_data: Json; user_id?: string }
        Returns: boolean
      }
      search_books: {
        Args: {
          category_filter?: string
          max_price?: number
          search_term: string
        }
        Returns: {
          author: string
          category: string
          condition: string
          created_at: string
          description: string
          id: string
          image_url: string
          price: number
          seller_id: string
          title: string
        }[]
      }
      secure_atomic_book_purchase: {
        Args: {
          p_amount: number
          p_book_id: string
          p_book_title: string
          p_buyer_id: string
        }
        Returns: string
      }
      send_commit_reminders: { Args: never; Returns: undefined }
      update_expired_transactions: { Args: never; Returns: undefined }
      update_order_tracking_status: {
        Args: {
          p_new_status: string
          p_order_id: string
          p_tracking_data?: Json
        }
        Returns: boolean
      }
      update_user_profile: {
        Args: { new_email: string; new_name: string; user_id: string }
        Returns: undefined
      }
      validate_aps_profile: { Args: { profile_data: Json }; Returns: boolean }
      validate_book_availability: {
        Args: { book_id: string }
        Returns: boolean
      }
      validate_book_ownership: {
        Args: { book_id: string; user_id: string }
        Returns: boolean
      }
      validate_payment_amount: { Args: { amount: number }; Returns: boolean }
      validate_payout_request: {
        Args: { p_amount: number; p_seller_id: string }
        Returns: {
          message: string
          valid: boolean
        }[]
      }
      validate_refund_amount: {
        Args: { p_amount: number; p_order_id: string }
        Returns: {
          reason: string
          valid: boolean
          validated_amount: number
        }[]
      }
      verify_book_seller_relationship: {
        Args: { p_book_id: string }
        Returns: {
          book_id: string
          book_title: string
          seller_has_address: boolean
          seller_has_subaccount: boolean
          seller_id: string
          seller_name: string
        }[]
      }
    }
    Enums: {
      broadcast_priority: "low" | "normal" | "medium" | "high" | "urgent"
      broadcast_target_audience: "all" | "users" | "admin"
      broadcast_type: "info" | "warning" | "success" | "error"
      meetup_status: "active" | "complete" | "canceled" | "expired"
      message_type: "text" | "time_location" | "system"
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
      broadcast_priority: ["low", "normal", "medium", "high", "urgent"],
      broadcast_target_audience: ["all", "users", "admin"],
      broadcast_type: ["info", "warning", "success", "error"],
      meetup_status: ["active", "complete", "canceled", "expired"],
      message_type: ["text", "time_location", "system"],
    },
  },
} as const
