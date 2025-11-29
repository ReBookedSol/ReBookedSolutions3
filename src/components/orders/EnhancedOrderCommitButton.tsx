import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Home,
  MapPin,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FallbackCommitService from "@/services/fallbackCommitService";

interface EnhancedOrderCommitButtonProps {
  orderId: string;
  sellerId: string;
  bookTitle?: string;
  buyerName?: string;
  orderStatus?: string;
  onCommitSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

const EnhancedOrderCommitButton: React.FC<EnhancedOrderCommitButtonProps> = ({
  orderId,
  sellerId,
  bookTitle = "this book",
  buyerName = "the buyer",
  orderStatus,
  onCommitSuccess,
  disabled = false,
  className = "",
}) => {
  const [isCommitting, setIsCommitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pickupType, setPickupType] = useState<"door" | "locker" | null>(null);
  const [deliveryType, setDeliveryType] = useState<"door" | "locker" | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  // Load order details to get original pickup and delivery types
  useEffect(() => {
    if (isDialogOpen) {
      fetchOrderDetails();
    }
  }, [isDialogOpen]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoadingOrder(true);

      // Fetch the order to get the original pickup_type and delivery_type
      const { data: order, error } = await supabase
        .from("orders")
        .select("pickup_type, delivery_type")
        .eq("id", orderId)
        .single();

      if (error) {
        setPickupType("door");
        setDeliveryType("door");
        return;
      }

      if (order) {
        setPickupType(order.pickup_type || "door");
        setDeliveryType(order.delivery_type || "door");
      }
    } catch (error) {
      setPickupType("door");
      setDeliveryType("door");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Check if order is already committed
  const isAlreadyCommitted =
    orderStatus === "committed" ||
    orderStatus === "courier_scheduled" ||
    orderStatus === "shipped";

  const handleCommit = async () => {
    setIsCommitting(true);
    setIsDialogOpen(false);

    try {
      // Prepare the commit data
      const commitData = {
        order_id: orderId,
        seller_id: sellerId,
      };

      let data, error;

      // Use the basic commit-to-sale function directly
      try {
        const result = await supabase.functions.invoke(
          "commit-to-sale",
          {
            body: commitData,
          },
        );
        data = result.data;
        error = result.error;

      } catch (originalError) {

        // Final fallback to direct database service
        const fallbackResult = await FallbackCommitService.commitToSale({
          order_id: orderId,
          seller_id: sellerId,
        });

        if (fallbackResult.success) {
          data = fallbackResult.data;
          error = null;

          toast.info("Using backup commit mode - your order is being processed.", {
            duration: 5000,
          });
        } else {
          throw new Error(fallbackResult.error || "All commit methods failed");
        }
      }

      if (error) {
        // More specific error handling for edge functions
        let errorMessage = "Failed to call commit function";
        if (error.message?.includes('FunctionsFetchError')) {
          errorMessage = "Edge Function service is temporarily unavailable. Please try again.";
        } else if (error.message?.includes('CORS')) {
          errorMessage = "CORS error - Edge Function configuration issue";
        } else {
          errorMessage = error.message || errorMessage;
        }

        throw new Error(errorMessage);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to commit to sale");
      }

      // Show success message based on pickup type
      if (pickupType === "locker") {
        toast.success("Order committed! Book will be dropped at locker.", {
          duration: 5000,
        });

        toast.info(
          "Locker details and pickup instructions sent to your email.",
          {
            duration: 7000,
          },
        );
      } else {
        toast.success("Order committed! Courier pickup will be scheduled automatically.", {
          duration: 5000,
        });

        toast.info(
          "Pickup details sent to your email.",
          {
            duration: 7000,
          },
        );
      }

      // Call success callback
      onCommitSuccess?.();
    } catch (error: unknown) {
      let errorMessage = "Failed to commit to sale";
      const errorObj = error as Error;

      // Handle specific error messages
      if (errorObj.message?.includes("already committed")) {
        errorMessage = "This order has already been committed";
        toast.error(errorMessage, {
          description: "Please refresh the page to see the latest status.",
        });
      } else if (errorObj.message?.includes("not found")) {
        errorMessage = "Order not found or access denied";
        toast.error(errorMessage, {
          description: "Please check if you have permission to commit this order.",
        });
      } else if (errorObj.message?.includes("FunctionsFetchError") || errorObj.message?.includes("Edge Function")) {
        errorMessage = "Service temporarily unavailable";
        toast.error(errorMessage, {
          description: "The commit service is temporarily down. Please try again in a few minutes.",
          duration: 10000,
        });
      } else if (errorObj.message?.includes("Failed to send a request")) {
        errorMessage = "Network connection issue";
        toast.error(errorMessage, {
          description: "Please check your internet connection and try again.",
          duration: 8000,
        });
      } else {
        toast.error(errorMessage, {
          description: errorObj.message || "Please try again or contact support.",
          duration: 8000,
        });
      }
    } finally {
      setIsCommitting(false);
    }
  };

  // If already committed, show status
  if (isAlreadyCommitted) {
    return (
      <Button
        variant="outline"
        disabled
        className={`${className} cursor-not-allowed opacity-60 min-h-[44px] px-3 sm:px-4 text-sm sm:text-base`}
      >
        <CheckCircle className="w-4 h-4 mr-1 sm:mr-2 text-green-600 flex-shrink-0" />
        <span className="truncate">Already Committed</span>
      </Button>
    );
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          disabled={disabled || isCommitting}
          className={`${className} bg-green-600 hover:bg-green-700 text-white min-h-[44px] px-3 sm:px-4 text-sm sm:text-base`}
        >
          {isCommitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin flex-shrink-0" />
              <span className="truncate">Committing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Commit to Sale</span>
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="line-clamp-2 sm:line-clamp-none">Commit to Sale</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            You are about to commit to selling <strong>"{bookTitle}"</strong> to {buyerName}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 mt-4">
          {/* Delivery Method Display - Shows the original method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Delivery Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingOrder ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : pickupType === "locker" ? (
                // Show Locker Drop-Off
                <div className="p-4 border-2 border-purple-500 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-purple-600 text-white flex-shrink-0 mt-1">Pickup Method</Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        BobGo Locker Drop-Off
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        You selected locker drop-off when creating this order. The book will be dropped at your designated locker location.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Show Home Pick-Up
                <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600 text-white flex-shrink-0 mt-1">Pickup Method</Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <Home className="w-4 h-4 flex-shrink-0" />
                        Home Pick-Up (Courier Collection)
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        You selected home pick-up when creating this order. Our courier will collect the book from your address.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Standard Information */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">
              What happens after commitment:
            </h4>
            <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
              <li>• Courier pickup will be automatically scheduled</li>
              <li>• You'll receive pickup/drop-off details via email</li>
              <li>• You must be available during pickup time window</li>
              <li>• Standard payment processing timeline</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-xs sm:text-sm text-amber-700">
              <strong>Important:</strong> Once committed, you are obligated to fulfill this order.
              Failure to complete the pickup may result in penalties.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={isCommitting}
            className="w-full sm:w-auto text-sm sm:text-base min-h-[44px]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCommit}
            disabled={isCommitting || isLoadingOrder}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-sm sm:text-base min-h-[44px]"
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                <span>Committing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Confirm Commitment</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EnhancedOrderCommitButton;
