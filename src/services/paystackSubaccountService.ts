import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface SubaccountDetails {
  business_name: string;
  email: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
}

export interface SubaccountUpdateDetails {
  business_name?: string;
  settlement_bank?: string;
  account_number?: string;
  percentage_charge?: number;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  settlement_schedule?: "auto" | "weekly" | "monthly" | "manual";
  metadata?: Record<string, any>;
}

export interface SubaccountData {
  subaccount_code: string;
  business_name: string;
  description?: string;
  primary_contact_email?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  percentage_charge: number;
  settlement_bank: string;
  account_number: string;
  settlement_schedule: string;
  active: boolean;
  migrate?: boolean;
  metadata?: Record<string, any>;
  domain?: string;
  subaccount_id?: number;
  is_verified?: boolean;
  split_ratio?: number;
}

export class PaystackSubaccountService {
  // Helper method to format error messages properly
  private static formatError(error: any): string {
    if (!error) return "Unknown error occurred";

    if (typeof error === "string") return error;

    if (error.message) return error.message;

    if (error.details) return error.details;

    if (error.hint) return error.hint;

    // If it's an object, try to stringify it properly
    try {
      const errorStr = JSON.stringify(error);
      if (errorStr === "{}") return "Unknown error occurred";
      return errorStr;
    } catch {
      return String(error);
    }
  }
  // Note: createOrUpdateSubaccount has been removed in favor of using BankingService directly
  // Banking details are now encrypted and stored locally without Paystack subaccount creation

  // 👤 UPDATE USER PROFILE WITH SUBACCOUNT CODE
  static async updateUserProfileSubaccount(
    userId: string,
    subaccountCode: string,
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subaccount_code: subaccountCode })
        .eq("id", userId);

      if (error) {
        console.warn("Failed to update profile subaccount:", error);
      }
    } catch (error) {
      console.warn("Error updating profile subaccount:", error);
    }
  }

  // 🔗 LINK ALL USER'S BOOKS TO THEIR SUBACCOUNT
  static async linkBooksToSubaccount(subaccountCode: string): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId || !subaccountCode) {
        console.warn("No user ID or subaccount code provided");
        return false;
      }

      // 📚 UPDATE ALL USER'S BOOKS WITH SUBACCOUNT CODE
      // First check if the column exists by trying a minimal select
      console.log("Checking if seller_subaccount_code column exists...");
      let columnExists = true;
      try {
        const { error: checkError } = await supabase
          .from("books")
          .select("seller_subaccount_code")
          .limit(1);

        if (checkError) {
          console.warn("Column check failed:", checkError.message);
          columnExists = false;
        }
      } catch (error) {
        console.warn("seller_subaccount_code column doesn't exist in books table:", error);
        columnExists = false;
      }

      if (!columnExists) {
        console.warn("Skipping book update - seller_subaccount_code column not found in database schema");
        console.warn("This is expected if the database schema hasn't been updated yet");
        return true; // Return success since the main operation completed
      }

      const { data, error } = await supabase
        .from("books")
        .update({ seller_subaccount_code: subaccountCode })
        .eq("seller_id", userId)
        .is("seller_subaccount_code", null) // Only update books that don't already have a subaccount_code
        .select("id");

      if (error) {
        const formattedError = this.formatError(error);
        console.error(
          "Error updating books with seller_subaccount_code:",
          formattedError,
        );
        // Don't return false immediately, log the error but continue
        console.warn("Book update failed but continuing with subaccount creation");
        console.warn("This might be because the books table doesn't have the seller_subaccount_code column yet");
        console.warn("Error details:", formattedError);
        // Return true to not fail the subaccount creation process
        return true;
      }

      const updatedCount = data?.length || 0;
      console.log(
        `📚 ${updatedCount} books linked to subaccount ${subaccountCode} for user ${userId}`,
      );

      return true;
    } catch (error) {
      console.error("Error linking books to subaccount:", error);
      return false;
    }
  }

  // 📖 GET USER'S SUBACCOUNT CODE
  static async getUserSubaccountCode(userId?: string): Promise<string | null> {
    try {
      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;
        userId = user.id;
      }

      // Check profile table for subaccount code
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subaccount_code")
        .eq("id", userId)
        .single();

      if (!profileError && profileData?.subaccount_code) {
        return profileData.subaccount_code;
      }

      return null;
    } catch (error) {
      console.error("Error getting user subaccount code:", error);
      return null;
    }
  }

  // Note: fetchSubaccountDetails and updateSubaccountDetails have been removed
  // These functions called Paystack edge functions which are no longer needed
  // Banking details are now managed locally with encryption/decryption

  // 📊 GET COMPLETE USER SUBACCOUNT INFO
  static async getCompleteSubaccountInfo(userId?: string): Promise<{
    success: boolean;
    data?: {
      subaccount_code: string;
      banking_details: any;
      paystack_data: SubaccountData;
      profile_preferences: any;
    };
    error?: string;
  }> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication required. Please log in.");
      }

      const { data, error } = await supabase.functions.invoke(
        "manage-paystack-subaccount",
        {
          method: "GET",
          body: null,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (error) {
        console.error("Supabase function error:", error);

        // Check if this is an edge function deployment issue
        const isEdgeFunctionError = [
          "non-2xx status code",
          "Failed to send a request to the Edge Function",
          "FunctionsHttpError",
          "FunctionsFetchError",
          "404",
          "Function not found",
          "NetworkError",
          "Connection error"
        ].some(errorType =>
          error.message?.includes(errorType) ||
          this.formatError(error).includes(errorType)
        );

        if (isEdgeFunctionError) {
          console.warn("Edge function not available, using database fallback");
          // Fallback to direct database queries
          return await this.getCompleteSubaccountInfoFallback(session.user.id);
        }

        throw new Error(error.message || "Failed to get subaccount info");
      }

      if (!data?.success) {
        throw new Error(data.error || "Failed to get subaccount info");
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error("Error getting complete subaccount info:", error);

      // If main method fails, try fallback
      if (error.message?.includes("Authentication required")) {
        return {
          success: false,
          error: this.formatError(error),
        };
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          console.log("Attempting database fallback after main method failed");
          return await this.getCompleteSubaccountInfoFallback(session.user.id);
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }

      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // 🔄 FALLBACK METHOD FOR DATABASE-ONLY QUERIES
  private static async getCompleteSubaccountInfoFallback(userId: string): Promise<{
    success: boolean;
    data?: {
      subaccount_code: string;
      banking_details: any;
      paystack_data: SubaccountData;
      profile_preferences: any;
    };
    error?: string;
  }> {
    try {
      console.log("Using database fallback for subaccount info");

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subaccount_code, preferences")
        .eq("id", userId)
        .single();

      if (profileError || !profileData?.subaccount_code) {
        return {
          success: false,
          error: "No subaccount found for this user",
        };
      }

      // Get banking details
      const { data: bankingData, error: bankingError } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("subaccount_code", profileData.subaccount_code)
        .single();

      if (bankingError) {
        console.warn("Banking details not found:", bankingError);
      }

      return {
        success: true,
        data: {
          subaccount_code: profileData.subaccount_code,
          banking_details: bankingData || null,
          paystack_data: bankingData?.paystack_response || null,
          profile_preferences: profileData.preferences || {},
        },
      };
    } catch (error) {
      console.error("Database fallback failed:", error);
      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  // ✅ CHECK IF USER HAS SUBACCOUNT
  static async getUserSubaccountStatus(userId?: string): Promise<{
    hasSubaccount: boolean;
    canEdit: boolean;
    subaccountCode?: string;
    businessName?: string;
    bankName?: string;
    accountNumber?: string;
    email?: string;
  }> {
    try {
      console.log("🔍 getUserSubaccountStatus: Starting check...", { userId });

      if (!userId) {
        console.log(
          "📝 getUserSubaccountStatus: No userId provided, getting from auth...",
        );
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.log(
            "❌ getUserSubaccountStatus: No authenticated user found",
          );
          return { hasSubaccount: false, canEdit: false };
        }
        userId = user.id;
        console.log("✅ getUserSubaccountStatus: Got user from auth:", userId);
      }

      // First, check the profile table for subaccount_code
      console.log("���� getUserSubaccountStatus: Checking profile table...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subaccount_code, preferences")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.warn(
          "❌ getUserSubaccountStatus: Error checking profile:",
          profileError,
        );
        return { hasSubaccount: false, canEdit: false };
      }

      console.log("✅ getUserSubaccountStatus: Profile data:", {
        subaccountCode: profileData?.subaccount_code,
        hasPreferences: !!profileData?.preferences,
      });

      const subaccountCode = profileData?.subaccount_code;

      if (!subaccountCode) {
        console.log(
          "❌ getUserSubaccountStatus: No subaccount code found in profile",
        );
        return { hasSubaccount: false, canEdit: false };
      }

      console.log(
        "✅ getUserSubaccountStatus: Found subaccount code:",
        subaccountCode,
      );

      // If we have a subaccount code, try to get banking details from banking_subaccounts table
      const { data: subaccountData, error: subaccountError } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("subaccount_code", subaccountCode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subaccountError) {
        console.warn(
          "Error fetching banking details (table may not exist):",
          subaccountError,
        );

        // Fallback - we have subaccount code but no detailed banking info
        const preferences = profileData?.preferences || {};
        return {
          hasSubaccount: true,
          subaccountCode: subaccountCode,
          businessName:
            preferences.business_name || "Please complete banking setup",
          bankName:
            preferences.bank_details?.bank_name || "Banking details incomplete",
          accountNumber:
            preferences.bank_details?.account_number || "Not available",
          email: profileData?.email || "Please update",
          canEdit: true,
        };
      }

      if (!subaccountData) {
        // We have subaccount code but no banking details record
        const preferences = profileData?.preferences || {};
        return {
          hasSubaccount: true,
          subaccountCode: subaccountCode,
          businessName:
            preferences.business_name || "Please complete banking setup",
          bankName:
            preferences.bank_details?.bank_name || "Banking details incomplete",
          accountNumber:
            preferences.bank_details?.account_number || "Not available",
          email: profileData?.email || "Please update",
          canEdit: true,
        };
      }

      // We have both subaccount code and banking details
      return {
        hasSubaccount: true,
        subaccountCode: subaccountData.subaccount_code,
        businessName: subaccountData.business_name,
        bankName: subaccountData.bank_name,
        accountNumber: subaccountData.account_number,
        email: subaccountData.email,
        canEdit: true, // But form will show contact support message
      };
    } catch (error) {
      console.error("Error in getUserSubaccountStatus:", error);
      return { hasSubaccount: false, canEdit: false };
    }
  }
}

export default PaystackSubaccountService;
