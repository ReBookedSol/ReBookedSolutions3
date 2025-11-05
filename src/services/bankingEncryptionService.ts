import { supabase } from "@/lib/supabase";

export interface EncryptedBundle {
  ciphertext: string;
  iv: string;
  authTag: string;
  version?: number;
}

export interface EncryptedBankingData {
  encrypted_account_number: EncryptedBundle;
  encrypted_bank_code: EncryptedBundle;
  encrypted_bank_name?: EncryptedBundle;
  encrypted_subaccount_code?: EncryptedBundle;
}

export interface BankingEncryptionResult {
  success: boolean;
  data?: EncryptedBankingData;
  error?: string;
}

export class BankingEncryptionService {
  /**
   * Encrypt banking details using the edge function
   */
  static async encryptBankingDetails(
    account_number: string,
    bank_code: string,
    bank_name?: string,
    subaccount_code?: string
  ): Promise<BankingEncryptionResult> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return {
          success: false,
          error: "Authentication required. Please log in.",
        };
      }

      console.log("🔒 Calling encrypt-banking-details edge function");

      const { data, error } = await supabase.functions.invoke(
        "encrypt-banking-details",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            account_number,
            bank_code,
            ...(bank_name && { bank_name }),
            ...(subaccount_code && { subaccount_code }),
          },
        }
      );

      if (error) {
        console.error("Edge function error:", error);
        
        if (error.message?.includes("non-2xx status code") || 
            error.message?.includes("404")) {
          return {
            success: false,
            error: "Banking encryption service is temporarily unavailable. Please try again later.",
          };
        }

        return {
          success: false,
          error: error.message || "Failed to encrypt banking details",
        };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || "Failed to encrypt banking details",
        };
      }

      console.log("✅ Banking details encrypted successfully");

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error("Error in encryptBankingDetails:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create bundle string for storage (combines all encrypted components)
   */
  static createEncryptedBundle(
    account_number: EncryptedBundle,
    bank_code: EncryptedBundle,
    bank_name?: EncryptedBundle,
    subaccount_code?: EncryptedBundle
  ): string {
    return JSON.stringify({
      account_number,
      bank_code,
      ...(bank_name && { bank_name }),
      ...(subaccount_code && { subaccount_code }),
    });
  }

  /**
   * Generate encryption key hash for storage
   */
  static async generateKeyHash(): Promise<string> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No authenticated session");
      }

      // Create a hash of the user ID + timestamp for the key identifier
      const encoder = new TextEncoder();
      const data = encoder.encode(`${session.user.id}_banking_key_v1`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return hashHex;
    } catch (error) {
      console.error("Error generating key hash:", error);
      throw error;
    }
  }
}

export default BankingEncryptionService;
