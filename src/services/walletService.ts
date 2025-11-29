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
  static async getWalletBalance(): Promise<WalletBalance> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      const { data, error } = await supabase
        .rpc("get_wallet_summary", { p_user_id: user.id });

      if (error) {
        // Return default zero balances if wallet doesn't exist yet
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      if (!data || data.length === 0) {
        // No wallet exists yet, return zeros
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      const balance = data[0];
      return {
        available_balance: balance.available_balance,
        pending_balance: balance.pending_balance,
        total_earned: balance.total_earned,
      };
    } catch (error) {
      // Return safe defaults on error
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
      };
    }
  }

  /**
   * Get wallet balance for a specific user (admin only)
   */
  static async getUserWalletBalance(userId: string): Promise<WalletBalance> {
    try {
      const { data, error } = await supabase
        .rpc("get_wallet_summary", { p_user_id: userId });

      if (error) {
        // Return default zero balances if wallet doesn't exist yet
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      if (!data || data.length === 0) {
        // No wallet exists yet, return zeros
        return {
          available_balance: 0,
          pending_balance: 0,
          total_earned: 0,
        };
      }

      const balance = data[0];
      return {
        available_balance: balance.available_balance,
        pending_balance: balance.pending_balance,
        total_earned: balance.total_earned,
      };
    } catch (error) {
      // Return safe defaults on error
      return {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
      };
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
        return [];
      }

      return (data || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        reason: tx.reason,
        reference_order_id: tx.reference_order_id,
        reference_payout_id: tx.reference_payout_id,
        status: tx.status,
        created_at: tx.created_at,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Credit wallet when book is received (calls edge function which handles everything)
   */
  static async creditWalletOnCollection(
    orderId: string,
    sellerId: string,
    _bookPriceInRands?: number
  ): Promise<{ success: boolean; error?: string; creditAmount?: number }> {
    try {
      // Call the edge function which handles:
      // 1. Fetching order and book details
      // 2. Calculating correct 90% credit amount
      // 3. Crediting the wallet via RPC
      // 4. Creating notifications
      // 5. Sending emails
      const { data, error } = await supabase.functions.invoke('credit-wallet-on-collection', {
        body: {
          order_id: orderId,
          seller_id: sellerId,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || "Failed to credit wallet",
        };
      }

      if (!data) {
        return {
          success: false,
          error: "No response received from wallet credit function",
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.message || data.error || "Failed to credit wallet",
        };
      }

      // Edge function handles credit_amount calculation (90% of book price)
      const creditAmount = data.credit_amount ? data.credit_amount / 100 : undefined;

      return {
        success: true,
        creditAmount,
      };
    } catch (error) {
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
