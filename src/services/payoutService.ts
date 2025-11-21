import { supabase } from "@/integrations/supabase/client";

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  requested_at: string;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  admin_notes: string | null;
}

export interface CreatePayoutRequestData {
  amount: number;
  notes?: string;
}

export interface PayoutResult {
  success: boolean;
  payout_id?: string;
  error?: string;
}

export class PayoutService {
  /**
   * Create a new payout request
   */
  static async createPayoutRequest(data: CreatePayoutRequestData): Promise<PayoutResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Amount is in ZAR, convert to cents for database
      const amountInCents = Math.round(data.amount * 100);

      // Get current wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("user_wallets")
        .select("available_balance")
        .eq("user_id", user.id)
        .single();

      if (walletError || !walletData) {
        return {
          success: false,
          error: "Wallet not found",
        };
      }

      if (walletData.available_balance < amountInCents) {
        return {
          success: false,
          error: "Insufficient balance",
        };
      }

      // Call the database function to create payout request
      const { data: payoutId, error: payoutError } = await supabase
        .rpc("create_payout_request", {
          p_user_id: user.id,
          p_amount: amountInCents,
        });

      if (payoutError || !payoutId) {
        return {
          success: false,
          error: payoutError?.message || "Failed to create payout request",
        };
      }

      // Update payout request with notes if provided
      if (data.notes) {
        await supabase
          .from("payout_requests")
          .update({ notes: data.notes })
          .eq("id", payoutId);
      }

      return {
        success: true,
        payout_id: payoutId,
      };
    } catch (error) {
      console.error("Error in createPayoutRequest:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all payout requests for current user
   */
  static async getPayoutRequests(): Promise<PayoutRequest[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false });

      if (error) {
        console.error("Error fetching payout requests:", error);
        return [];
      }

      return (data || []).map((payout: any) => ({
        id: payout.id,
        user_id: payout.user_id,
        amount: Math.floor(payout.amount / 100),
        status: payout.status,
        requested_at: payout.requested_at,
        approved_at: payout.approved_at,
        paid_at: payout.paid_at,
        notes: payout.notes,
        admin_notes: payout.admin_notes,
      }));
    } catch (error) {
      console.error("Error in getPayoutRequests:", error);
      return [];
    }
  }

  /**
   * Get a specific payout request
   */
  static async getPayoutRequest(payoutId: string): Promise<PayoutRequest | null> {
    try {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("id", payoutId)
        .single();

      if (error || !data) {
        console.error("Error fetching payout request:", error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        amount: Math.floor(data.amount / 100),
        status: data.status,
        requested_at: data.requested_at,
        approved_at: data.approved_at,
        paid_at: data.paid_at,
        notes: data.notes,
        admin_notes: data.admin_notes,
      };
    } catch (error) {
      console.error("Error in getPayoutRequest:", error);
      return null;
    }
  }

  /**
   * Cancel a payout request (admin only - refunds balance)
   */
  static async cancelPayoutRequest(payoutId: string): Promise<PayoutResult> {
    try {
      const { data: cancelResult, error: cancelError } = await supabase
        .rpc("cancel_payout_request", {
          p_payout_id: payoutId,
        });

      if (cancelError || !cancelResult) {
        return {
          success: false,
          error: cancelError?.message || "Failed to cancel payout request",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in cancelPayoutRequest:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get status badge color
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  /**
   * Format amount in ZAR
   */
  static formatZAR(amount: number): string {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  }
}
