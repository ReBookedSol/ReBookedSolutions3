import { supabase } from "@/integrations/supabase/client";

export interface OrderSummary {
  totalOrders: number;
  pendingCommits: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface OrderWithDetails {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_status?: string;
  cancelled_at?: string;
  book?: {
    title: string;
    author: string;
    isbn?: string;
  };
  buyer?: {
    name: string;
    email: string;
  };
  seller?: {
    name: string;
    email: string;
  };
}

/**
 * Get comprehensive order summary for a user
 */
export async function getUserOrderSummary(userId: string): Promise<OrderSummary> {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, status")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (error) {
      console.error("Error fetching order summary:", error);
      return {
        totalOrders: 0,
        pendingCommits: 0,
        activeOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
      };
    }

    const summary: OrderSummary = {
      totalOrders: orders?.length || 0,
      pendingCommits: orders?.filter(o => ["pending_commit", "pending"].includes(o.status)).length || 0,
      activeOrders: orders?.filter(o => ["committed", "pending_delivery", "in_transit"].includes(o.status)).length || 0,
      completedOrders: orders?.filter(o => o.status === "completed").length || 0,
      cancelledOrders: orders?.filter(o => o.status === "cancelled").length || 0,
    };

    return summary;
  } catch (error) {
    console.error("Failed to get order summary:", error);
    return {
      totalOrders: 0,
      pendingCommits: 0,
      activeOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    };
  }
}

/**
 * Get detailed orders for a user with proper error handling
 */
export async function getUserOrdersWithDetails(
  userId: string,
  statusFilter?: string
): Promise<OrderWithDetails[]> {
  try {
    let query = supabase
      .from("orders")
      .select(`
        id,
        buyer_id,
        seller_id,
        status,
        total_amount,
        created_at,
        delivery_status,
        cancelled_at,
        buyer_full_name,
        buyer_email,
        seller_full_name,
        seller_email,
        book:books(title, author, isbn)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "pending") {
        query = query.in("status", ["pending_commit", "pending"]);
      } else if (statusFilter === "active") {
        query = query.in("status", ["committed", "pending_delivery", "in_transit"]);
      } else if (statusFilter === "completed") {
        query = query.eq("status", "completed");
      } else if (statusFilter === "cancelled") {
        query = query.eq("status", "cancelled");
      }
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching detailed orders:", error);
      throw error;
    }

    // Map the database fields to the expected interface
    return (orders || []).map((order: any) => ({
      ...order,
      buyer: order.buyer_id ? {
        name: order.buyer_full_name,
        email: order.buyer_email,
      } : null,
      seller: order.seller_id ? {
        name: order.seller_full_name,
        email: order.seller_email,
      } : null,
    }));
  } catch (error) {
    console.error("Failed to get user orders:", error);
    throw error;
  }
}

/**
 * Check if user can cancel an order
 * Aligned with server-side blocked statuses: ['collected', 'in transit', 'out for delivery', 'delivered']
 */
export function canCancelOrder(order: OrderWithDetails, userId: string): {
  canCancel: boolean;
  reason?: string;
} {
  // Only buyers can cancel orders
  if (order.buyer_id !== userId) {
    return { canCancel: false, reason: "Only buyers can cancel orders" };
  }

  // Block cancellation for committed orders - user must contact support
  const orderStatusLower = (order.status || "").toLowerCase();
  if (orderStatusLower === "committed") {
    return { canCancel: false, reason: "Once confirmed by the seller, please contact support if you need to cancel this order." };
  }

  // Check order status - block only the statuses that the server blocks
  const blockedOrderStatuses = ["collected", "in transit", "out for delivery", "delivered"];
  if (blockedOrderStatuses.includes(orderStatusLower)) {
    return { canCancel: false, reason: `Cannot cancel - your order is "${order.status}"` };
  }

  // Check delivery status - block only the statuses that the server blocks
  const blockedDeliveryStatuses = ["collected", "in transit", "out for delivery", "delivered"];
  const deliveryStatusLower = (order.delivery_status || "").toLowerCase();
  if (blockedDeliveryStatuses.includes(deliveryStatusLower)) {
    return { canCancel: false, reason: "Cannot cancel - book has already been collected/delivered" };
  }

  return { canCancel: true };
}

/**
 * Format order status for display
 */
export function getOrderStatusDisplay(status: string): {
  label: string;
  color: "default" | "secondary" | "destructive" | "outline";
} {
  switch (status) {
    case "pending_commit":
      return { label: "Waiting for Seller", color: "outline" };
    case "committed":
      return { label: "Seller Confirmed", color: "default" };
    case "pending_delivery":
      return { label: "Arranging Pickup", color: "secondary" };
    case "in_transit":
      return { label: "In Transit", color: "default" };
    case "completed":
      return { label: "Completed", color: "default" };
    case "cancelled":
      return { label: "Cancelled", color: "destructive" };
    default:
      return { label: status, color: "outline" };
  }
}

/**
 * Get order flow explanation for users
 */
export function getOrderFlowExplanation(): string[] {
  return [
    "📖 You purchase a book from a seller",
    "⏳ Seller has 48 hours to confirm they have the book",
    "📦 Once confirmed, courier pickup is arranged automatically", 
    "🚚 Book is collected from seller and delivered to you",
    "✅ You can cancel anytime before the book is collected",
    "💰 Cancellations result in automatic full refunds"
  ];
}
