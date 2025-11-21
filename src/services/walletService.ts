import { supabase } from "@/integrations/supabase/client";
import { EMAIL_STYLES, EMAIL_FOOTER } from "@/utils/emailStyles";

function generateSellerCreditEmailHTML(data: {
  sellerName: string;
  bookTitle: string;
  bookPrice: number;
  creditAmount: number;
  orderId: string;
  newBalance: number;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>💰 Payment Received - Credit Added to Your Account</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Payment Received!</h1>
      <p>Your book has been delivered and credit has been added</p>
    </div>

    <p>Hello ${data.sellerName},</p>

    <p><strong>Great news!</strong> Your book <strong>"${data.bookTitle}"</strong> has been successfully delivered and received by the buyer. Your payment is now available in your wallet!</p>

    <div class="info-box-success">
      <h3 style="margin-top: 0; color: #10b981;">✅ Payment Confirmed</h3>
      <p style="margin: 0;"><strong>Credit has been added to your account!</strong></p>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0;">📋 Transaction Details</h3>
      <p><strong>Book Title:</strong> ${data.bookTitle}</p>
      <p><strong>Book Price:</strong> R${data.bookPrice.toFixed(2)}</p>
      <p><strong>Commission Rate:</strong> 10% (You keep 90%)</p>
      <p style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;"><strong>Credit Added:</strong> <span style="font-size: 1.2em; color: #10b981;">R${data.creditAmount.toFixed(2)}</span></p>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
    </div>

    <div class="info-box-success">
      <h3 style="margin-top: 0; color: #10b981;">💳 Your New Wallet Balance</h3>
      <p style="margin: 0; font-size: 1.1em; color: #10b981;"><strong>R${data.newBalance.toFixed(2)}</strong></p>
    </div>

    <h3>💡 What You Can Do Next:</h3>
    <ul>
      <li><strong>List More Books:</strong> Add more books to your inventory and earn from sales</li>
      <li><strong>Request Payout:</strong> Once you have accumulated funds, you can request a withdrawal to your bank account</li>
      <li><strong>View Transactions:</strong> Check your wallet history anytime in your profile</li>
      <li><strong>Track Orders:</strong> Monitor all your sales and deliveries</li>
    </ul>

    <h3>📊 Payment Methods:</h3>
    <p>You have two options to receive your funds:</p>
    <ol>
      <li><strong>Direct Bank Transfer:</strong> If you've set up banking details, payments are sent directly to your account within 1-2 business days</li>
      <li><strong>Wallet Credit:</strong> Funds are held in your wallet and can be used for future purchases or withdrawn anytime</li>
    </ol>

    <h3>🚀 Ready to Make More Sales?</h3>
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://rebookedsolutions.co.za/profile?tab=overview" class="btn">
        View Your Wallet & Profile
      </a>
    </p>

    <p style="color: #1f4e3d;"><strong>Questions?</strong> Contact us at <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a></p>

    <p>Thank you for selling on ReBooked Solutions!</p>
    <p>Best regards,<br><strong>The ReBooked Solutions Team</strong></p>

    ${EMAIL_FOOTER}
  </div>
</body>
</html>`;
}

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
        console.warn("Error fetching wallet balance:", error);
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
        available_balance: Math.floor(balance.available_balance / 100),
        pending_balance: Math.floor(balance.pending_balance / 100),
        total_earned: Math.floor(balance.total_earned / 100),
      };
    } catch (error) {
      console.error("Error in getWalletBalance:", error);
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
        console.warn("Error fetching user wallet balance:", error);
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
        available_balance: Math.floor(balance.available_balance / 100),
        pending_balance: Math.floor(balance.pending_balance / 100),
        total_earned: Math.floor(balance.total_earned / 100),
      };
    } catch (error) {
      console.error("Error in getUserWalletBalance:", error);
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/credit-wallet-on-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          seller_id: sellerId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Error crediting wallet:", result);
        return {
          success: false,
          error: result.message || result.error || "Failed to credit wallet",
        };
      }

      // Edge function handles credit_amount calculation (90% of book price)
      const creditAmount = result.credit_amount ? result.credit_amount / 100 : undefined;

      return {
        success: true,
        creditAmount,
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
