const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

export interface RefundRequest {
  transaction: string;
  amount?: number; // In kobo, optional for full refund
  customer_note?: string;
  merchant_note?: string;
}

export interface RefundResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Process a refund via Paystack API
 */
export async function refundTransaction(
  transactionId: string,
  amountKobo: number | null = null,
  reason: string = "",
): Promise<RefundResponse> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY environment variable not set");
    }

    const url = "https://api.paystack.co/refund";

    const body: RefundRequest = {
      transaction: transactionId,
    };

    if (amountKobo) {
      body.amount = amountKobo;
    }

    if (reason) {
      body.customer_note = reason;
      body.merchant_note = `Refund processed: ${reason}`;
    }


    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message || "Refund failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown refund error",
    };
  }
}

/**
 * Get refund status from Paystack
 */
export async function getRefundStatus(
  refundId: string,
): Promise<RefundResponse> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY environment variable not set");
    }

    const url = `https://api.paystack.co/refund/${refundId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message || "Failed to get refund status",
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check refund status",
    };
  }
}

/**
 * Helper to convert Rands to Kobo
 */
export function randsToKobo(rands: number): number {
  return Math.round(rands * 100);
}

/**
 * Helper to convert Kobo to Rands
 */
export function koboToRands(kobo: number): number {
  return kobo / 100;
}
