import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BookImageCarousel from "@/components/BookImageCarousel";

import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TruckIcon,
  ShoppingCart,
  DollarSign,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrderActionsPanel from "./OrderActionsPanel";
import { Order as BaseOrder } from "@/services/orderCancellationService";
import { logError } from "@/utils/errorLogging";
import OrderCompletionCard from "./OrderCompletionCard";

// Extend the base Order shape with additional fields used in UI
export type Order = BaseOrder & {
  tracking_number?: string | null;
  tracking_data?: any;
  selected_courier_name?: string | null;
  selected_service_name?: string | null;
  cancellation_reason?: string | null;
  updated_at?: string | null;
  cancelled_at?: string | null;
  total_amount?: number;
  delivery_data?: any;
  book?: {
    id?: string;
    title?: string;
    author?: string;
    price?: number;
    image_url?: string | null;
    additional_images?: string[] | null;
  };
  buyer?: {
    id?: string;
    full_name?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  seller?: {
    id?: string;
    full_name?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
};

interface OrderManagementViewProps {}

interface CollapsibleOrderState {
  [key: string]: boolean;
}

const OrderManagementView: React.FC<OrderManagementViewProps> = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<CollapsibleOrderState>({});
  const [selectedOrderForGallery, setSelectedOrderForGallery] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, book_id, buyer_id, seller_id, status, delivery_status, created_at, updated_at,
          cancelled_at, cancellation_reason, tracking_number, tracking_data,
          selected_courier_name, selected_service_name, total_amount, delivery_data,
          buyer_full_name, buyer_email, seller_full_name, seller_email
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (ordersError) {
        logError("Error fetching orders", ordersError);
        toast.error(ordersError.message || "Failed to load orders");
        return;
      }

      // Get unique book IDs
      const bookIds = (ordersData || [])
        .map((o: any) => o.book_id)
        .filter((id: string | null): id is string => !!id);

      let bookMap: { [key: string]: any } = {};

      // Fetch books if we have book IDs
      if (bookIds.length > 0) {
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("id, title, author, price, image_url, additional_images")
          .in("id", bookIds);

        if (booksError) {
          logError("Error fetching books", booksError);
          // Continue anyway - we'll show orders without book data
        } else {
          bookMap = Object.fromEntries((booksData || []).map((b: any) => [b.id, b]));
        }
      }

      // Map orders with book data
      const mappedOrders = (ordersData || [])
        .map((o: any) => {
          const book = o.book_id ? bookMap[o.book_id] : null;
          return {
            ...o,
            book: book ? {
              id: book.id,
              title: book.title,
              author: book.author,
              price: book.price,
              image_url: book.image_url,
              additional_images: Array.isArray(book.additional_images) ? book.additional_images : [],
            } : null,
            // Map buyer/seller fields to match the Order type
            buyer: o.buyer_id ? {
              id: o.buyer_id,
              full_name: o.buyer_full_name,
              name: o.buyer_full_name,
              email: o.buyer_email,
            } : null,
            seller: o.seller_id ? {
              id: o.seller_id,
              full_name: o.seller_full_name,
              name: o.seller_full_name,
              email: o.seller_email,
            } : null,
          };
        })
        .filter((o: any) => !!(o.book?.title));

      // Deduplicate by order id to prevent duplicates
      const seenIds = new Set<string>();
      const realOrders = mappedOrders.filter((o: any) => {
        if (seenIds.has(o.id)) {
          console.warn("Duplicate order detected and filtered:", o.id);
          return false;
        }
        seenIds.add(o.id);
        return true;
      });

      setOrders(realOrders as Order[]);
    } catch (err: any) {
      logError("Error fetching orders (catch block)", err);
      toast.error(err?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (order: Order): "buyer" | "seller" => {
    return order.buyer_id === user?.id ? "buyer" : "seller";
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => ["pending", "pending_commit", "confirmed"].includes(o.status)).length,
      active: orders.filter((o) =>
        ["committed", "pending_delivery", "in_transit", "confirmed", "dispatched"].includes(o.status),
      ).length,
      completed: orders.filter((o) => ["delivered", "completed"].includes(o.status)).length,
      cancelled: orders.filter((o) => ["cancelled"].includes(o.status)).length,
    };
    return stats;
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "";
    try { return new Date(d).toLocaleString(); } catch { return d as string; }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getBookImages = (order: Order): string[] => {
    const images: string[] = [];

    // Add primary image
    if (order.book?.image_url) {
      images.push(order.book.image_url);
    }

    // Add additional images
    if (order.book?.additional_images && Array.isArray(order.book.additional_images)) {
      images.push(...order.book.additional_images.filter(Boolean));
    }

    // Return unique images and filter out empty strings
    return [...new Set(images)].filter(Boolean);
  };

  const handleFeedbackSubmitted = useCallback(() => {
    fetchOrders();
  }, []);

  const OrderHeaderDetails: React.FC<{ order: Order }> = ({ order }) => {
    const role = getUserRole(order);
    const img = order.book?.additional_images?.[0] || order.book?.image_url || "/placeholder.svg";
    const otherPartyName = role === "buyer"
      ? (order.seller?.full_name || order.seller?.name || "Seller")
      : (order.buyer?.full_name || order.buyer?.name || "Buyer");

    const bookImages = getBookImages(order);
    const hasMultipleImages = bookImages.length > 1;

    return (
      <div className="flex gap-4">
        <button
          onClick={() => setSelectedOrderForGallery(order)}
          className={`w-16 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 transition-all ${
            hasMultipleImages ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-book-600' : ''
          }`}
          title={hasMultipleImages ? "Click to view all photos" : undefined}
        >
          <img
            src={img}
            alt={order.book?.title || "Book"}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
          />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                {order.book?.title || "Unknown Book"}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">
                {order.book?.author ? `by ${order.book.author}` : ""}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Order #{order.id.slice(-8)} • {role === "buyer" ? "Seller" : "Buyer"}: {otherPartyName}
              </p>
            </div>
            <div className="text-right">
              {typeof order.book?.price === "number" && (
                <div className="text-lg font-semibold text-emerald-600">R{order.book.price}</div>
              )}
              <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OrderShipmentSummary: React.FC<{ order: Order }> = ({ order }) => {
    const courier = order.selected_courier_name || order.delivery_data?.provider;
    const service = order.selected_service_name || order.delivery_data?.service_level;
    const tracking = order.tracking_number || order.tracking_data?.tracking_number;
    const deliveryProgress = (order.delivery_status || "").toLowerCase();
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-gray-500">Order status</div>
            <div className="font-medium capitalize flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{order.status.replaceAll("_", " ")}</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-500">Tracking</div>
            <div className="font-mono text-gray-700 break-all">{tracking || "—"}</div>
            {tracking && (
              <div className="text-xs mt-1">
                <a
                  href={`https://track.bobgo.co.za/${encodeURIComponent(tracking)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  Open in BobGo
                </a>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-gray-500">Courier / Service</div>
            <div className="font-medium flex flex-wrap items-center gap-2">
              {courier ? <Badge variant="outline">{courier}</Badge> : <span>—</span>}
              {service ? <Badge variant="outline">{service}</Badge> : null}
            </div>
          </div>
        </div>

        <div>
          <div className="text-gray-500">Delivery progress</div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${deliveryProgress === "delivered" ? "bg-green-500" : deliveryProgress === "in_transit" ? "bg-blue-500" : deliveryProgress === "pickup_failed" ? "bg-red-500" : "bg-amber-500"}`} />
            <span className="capitalize">{deliveryProgress || "pending"}</span>
          </div>
        </div>

        {order.tracking_data?.events && Array.isArray(order.tracking_data.events) && order.tracking_data.events.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Recent tracking events</div>
            <ul className="text-xs space-y-1 max-h-32 overflow-auto pr-1">
              {order.tracking_data.events.slice(-5).reverse().map((ev: any, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="whitespace-nowrap">{formatDate(ev.timestamp || ev.date_time)}</span>
                  <span className="capitalize">{(ev.status || ev.description || "").toString().toLowerCase()}</span>
                  {ev.location && <span className="text-gray-400">• {ev.location}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-2">
          {!tracking && (
            <span>Tracking link will appear once assigned</span>
          )}
        </div>
      </div>
    );
  };

  const OrderTimeline: React.FC<{ order: Order }> = ({ order }) => {
    const committed = [
      "committed",
      "pending_delivery",
      "in_transit",
      "completed",
      "confirmed",
      "dispatched",
      "delivered",
    ].includes(order.status);

    const deliveryStatus = (order.delivery_status || "created").toLowerCase();
    const steps = ["created", "collected", "in_transit", "out_for_delivery", "delivered"] as const;

    const statusToIndex: Record<string, number> = {
      created: 0,
      pending: 0,
      pickup_scheduled: 0,
      collected: 1,
      picked_up: 1,
      in_transit: 2,
      out_for_delivery: 3,
      delivered: 4,
    };

    const currentIndex = statusToIndex[deliveryStatus] ?? 0;

    return (
      <div className="space-y-3">
        {/* Keep green status indicator for committed vs not committed */}
        <div className="flex items-center space-x-2 text-sm">
          <div
            className={`w-3 h-3 rounded-full ${
              order.status === "pending_commit" ? "bg-amber-500" : committed ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span>{order.status === "pending_commit" ? "Not Committed" : "Committed"}</span>
        </div>

        {/* Delivery stages */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step, idx) => (
            <div key={step} className="flex flex-col items-center text-xs">
              <div
                className={`w-3 h-3 rounded-full ${
                  idx < currentIndex
                    ? "bg-green-500"
                    : idx === currentIndex
                    ? deliveryStatus === "pickup_failed"
                      ? "bg-red-500"
                      : "bg-blue-500"
                    : "bg-gray-300"
                }`}
              />
              <span className="mt-1 capitalize text-gray-600">
                {step.replaceAll("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const OrderCard: React.FC<{ order: Order; isCollapsible?: boolean }> = ({ order, isCollapsible = false }) => {
    const userRole = getUserRole(order);
    // For collapsible orders (completed/cancelled), default to collapsed (false)
    // For active orders, default to expanded (true)
    const isExpanded = isCollapsible ? (expandedOrders[order.id] ?? false) : (expandedOrders[order.id] ?? true);

    const handleToggle = () => {
      if (isCollapsible) {
        toggleOrderExpand(order.id);
      }
    };

    return (
      <Card className="mb-4 border border-gray-200 shadow-sm rounded-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <OrderHeaderDetails order={order} />
            </div>
            {isCollapsible && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggle}
                className="ml-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View More
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            {order.delivery_status === "pickup_failed" && userRole === "seller" && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Action Required:</strong> Courier attempted pickup but you were unavailable. Please reschedule or cancel within 24 hours.
                </AlertDescription>
              </Alert>
            )}

            {order.delivery_status === "pickup_failed" && userRole === "buyer" && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Pickup Delayed:</strong> The seller missed the scheduled pickup. We'll update you once they take action.
                </AlertDescription>
              </Alert>
            )}

            {order.delivery_status === "rescheduled_by_seller" && (
              <Alert className="border-blue-200 bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Pickup Rescheduled</strong>
                </AlertDescription>
              </Alert>
            )}

            <Separator />
            <OrderTimeline order={order} />
            <Separator />
            <OrderShipmentSummary order={order} />
            <Separator />

            <OrderActionsPanel order={order} userRole={userRole} onOrderUpdate={fetchOrders} />

            {userRole === "buyer" && (["delivered", "completed"].includes(order.status) || order.delivery_status === "delivered") && (
              <>
                <Separator />
                <OrderCompletionCard
                  orderId={order.id}
                  bookTitle={order.book?.title || "Book"}
                  sellerName={order.seller?.name || "Seller"}
                  deliveredDate={order.updated_at}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                  totalAmount={order.total_amount || 0}
                  sellerId={order.seller_id || ""}
                />
              </>
            )}

            <Separator />
            {["delivered", "completed"].includes(order.status) && userRole === "seller" && (
              <div className="text-xs text-gray-500">Completed on {formatDate(order.updated_at)}</div>
            )}
            {order.status === "cancelled" && (
              <div className="text-xs text-red-600">Cancelled: {order.cancellation_reason || "Cancelled"} {order.cancelled_at ? `• ${formatDate(order.cancelled_at)}` : ""}</div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  const stats = getOrderStats();

  const renderImageGalleryModal = () => {
    if (!selectedOrderForGallery) return null;

    const bookImages = getBookImages(selectedOrderForGallery);

    return (
      <Dialog open={!!selectedOrderForGallery} onOpenChange={(open) => {
        if (!open) setSelectedOrderForGallery(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrderForGallery.book?.title || "Book Photos"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {bookImages.length > 0 ? (
              <BookImageCarousel images={bookImages} />
            ) : (
              <div className="aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No images available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading orders...</span>
      </div>
    );
  }

  // Group orders into Active, Completed, Cancelled
  const activeOrders = orders.filter((o) => !["cancelled", "delivered", "completed"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "completed"].includes(o.status));
  const cancelledOrders = orders.filter((o) => ["cancelled"].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TruckIcon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{stats.cancelled}</p>
            <p className="text-sm text-gray-600">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Active Orders</h3>
        {activeOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-base font-semibold mb-2">No active orders</h4>
              <p className="text-gray-600">New orders will appear here once created or committed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} isCollapsible={false} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Completed Orders</h3>
        {completedOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p className="text-gray-600">No completed orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} isCollapsible={true} />
            ))}
          </div>
        )}
      </div>

      {/* Cancelled Orders */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Cancelled Orders</h3>
        {cancelledOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-gray-600">No cancelled orders.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cancelledOrders.map((order) => (
              <OrderCard key={order.id} order={order} isCollapsible={true} />
            ))}
          </div>
        )}
      </div>

      {renderImageGalleryModal()}
    </div>
  );
};

export default OrderManagementView;
