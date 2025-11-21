import { supabase } from "@/integrations/supabase/client";

export interface WalletBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit" | "hold" | "release";
  amount: number;
  reason: string | null;
  reference_order_id: string | null;
  reference_payout_id: string | null;
  status: string;
  created_at: string;
}

export class WalletService {
  /**
   * Get wallet balance for current user
   */
  static async getWalletBalance(): Promise<WalletBalance | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .rpc("get_wallet_summary", { p_user_id: user.id }, { count: 'exact' });

      if (error || !data || data.length === 0) {
        console.error("Error fetching wallet balance:", error);
        return null;
      }

      const balance = data[0];
      return {
        available_balance: Math.floor(balance.available_balance / 100),
        pending_balance: Math.floor(balance.pending_balance / 100),
        total_earned: Math.floor(balance.total_earned / 100),
      };
    } catch (error) {
      console.error("Error in getWalletBalance:", error);
      return null;
    }
  }

  /**
   * Get wallet balance for a specific user (admin only)
   */
  static async getUserWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const { data, error } = await supabase
        .rpc("get_wallet_summary", { p_user_id: userId }, { count: 'exact' });

      if (error || !data || data.length === 0) {
        console.error("Error fetching user wallet balance:", error);
        return null;
      }

      const balance = data[0];
      return {
        available_balance: Math.floor(balance.available_balance / 100),
        pending_balance: Math.floor(balance.pending_balance / 100),
        total_earned: Math.floor(balance.total_earned / 100),
      };
    } catch (error) {
      console.error("Error in getUserWalletBalance:", error);
      return null;
    }
  }

  /**
   * Get wallet transaction history
   */
  static async getTransactionHistory(limit = 50, offset = 0): Promise<WalletTransaction[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching transaction history:", error);
        return [];
      }

      return (data || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: Math.floor(tx.amount / 100),
        reason: tx.reason,
        reference_order_id: tx.reference_order_id,
        reference_payout_id: tx.reference_payout_id,
        status: tx.status,
        created_at: tx.created_at,
      }));
    } catch (error) {
      console.error("Error in getTransactionHistory:", error);
      return [];
    }
  }

  /**
   * Credit wallet when book is received (called from edge function)
   */
  static async creditWalletOnCollection(
    orderId: string,
    sellerId: string,
    bookPrice: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Call the database function directly
      const { data, error } = await supabase.rpc("add_funds_to_wallet", {
        p_seller_id: sellerId,
        p_amount: Math.round(bookPrice * 90 / 100),
        p_order_id: orderId,
        p_reason: "Book received",
      });

      if (error) {
        return {
          success: false,
          error: error.message || "Failed to credit wallet",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error in creditWalletOnCollection:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
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

  /**
   * Get transaction type display label
   */
  static getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      credit: "Credited",
      debit: "Debited",
      hold: "On Hold",
      release: "Released",
    };
    return labels[type] || type;
  }

  /**
   * Get transaction type color
   */
  static getTransactionTypeColor(type: string): string {
    const colors: Record<string, string> = {
      credit: "text-green-600",
      debit: "text-red-600",
      hold: "text-amber-600",
      release: "text-blue-600",
    };
    return colors[type] || "text-gray-600";
  }
}
