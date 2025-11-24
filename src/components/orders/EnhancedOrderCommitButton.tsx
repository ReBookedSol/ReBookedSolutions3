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
  Package,
  Clock,
  DollarSign,
  Info,
  QrCode,
  MapPin
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FallbackCommitService from "@/services/fallbackCommitService";
import BobGoLockerSelector from "@/components/checkout/BobGoLockerSelector";
import { BobGoLocation } from "@/services/bobgoLocationsService";

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
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "locker">("home");
  const [selectedLocker, setSelectedLocker] = useState<BobGoLocation | null>(null);
  const [savedLocker, setSavedLocker] = useState<BobGoLocation | null>(null);
  const [isLoadingSavedLocker, setIsLoadingSavedLocker] = useState(false);
  const [buyerDeliveryType, setBuyerDeliveryType] = useState<string | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [preferredPickupMethod, setPreferredPickupMethod] = useState<"locker" | "pickup" | null>(null);
  const [isLoadingPreference, setIsLoadingPreference] = useState(false);

  // Pre-commit checklist states
  const [isPackagedSecurely, setIsPackagedSecurely] = useState(false);
  const [canFulfillOrder, setCanFulfillOrder] = useState(false);

  // Load seller's preferred pickup method, buyer's delivery type, and saved locker when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadPreferredPickupMethod();
      fetchBuyerDeliveryType();
      loadSavedLocker();
    }
  }, [isDialogOpen]);

  const loadPreferredPickupMethod = async () => {
    try {
      setIsLoadingPreference(true);

      // Fetch seller's preferred pickup method
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("preferred_pickup_method")
        .eq("id", sellerId)
        .single();

      if (error) {
        console.warn("Failed to load seller's preferred pickup method:", error);
        // Default to locker if not set
        setPreferredPickupMethod("locker");
        return;
      }

      if (profile?.preferred_pickup_method) {
        setPreferredPickupMethod(profile.preferred_pickup_method);
        console.log("✅ Seller's preferred pickup method:", profile.preferred_pickup_method);
      } else {
        // Default to locker if not set
        setPreferredPickupMethod("locker");
      }
    } catch (error) {
      console.error("Error loading preferred pickup method:", error);
      setPreferredPickupMethod("locker");
    } finally {
      setIsLoadingPreference(false);
    }
  };

  const fetchBuyerDeliveryType = async () => {
    try {
      setIsLoadingOrder(true);

      // Fetch the order to check the buyer's delivery type
      const { data: order, error } = await supabase
        .from("orders")
        .select("delivery_type")
        .eq("id", orderId)
        .single();

      if (error) {
        console.warn("Failed to load order delivery type:", error);
        setBuyerDeliveryType(null);
        return;
      }

      if (order?.delivery_type) {
        setBuyerDeliveryType(order.delivery_type);
        console.log("✅ Buyer's delivery type:", order.delivery_type);
      }
    } catch (error) {
      console.error("Error loading order delivery type:", error);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const loadSavedLocker = async () => {
    try {
      setIsLoadingSavedLocker(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingSavedLocker(false);
        return;
      }

      // Fetch user profile with locker preferences
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("preferred_delivery_locker_data")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn("Failed to load saved locker:", error);
        setIsLoadingSavedLocker(false);
        return;
      }

      if (profile?.preferred_delivery_locker_data) {
        const lockerData = profile.preferred_delivery_locker_data as BobGoLocation;
        setSavedLocker(lockerData);
        console.log("✅ Loaded saved locker from profile:", lockerData);
      }
    } catch (error) {
      console.error("Error loading saved locker:", error);
    } finally {
      setIsLoadingSavedLocker(false);
    }
  };

  // Set delivery method based on preferred pickup method
  useEffect(() => {
    if (preferredPickupMethod) {
      if (preferredPickupMethod === "locker") {
        setDeliveryMethod("locker");
        // Auto-select saved locker if available
        if (savedLocker) {
          setSelectedLocker(savedLocker);
        }
      } else if (preferredPickupMethod === "pickup") {
        setDeliveryMethod("home");
        setSelectedLocker(null);
      }
    }
  }, [preferredPickupMethod, savedLocker]);

  // Check if order is already committed
  const isAlreadyCommitted =
    orderStatus === "committed" ||
    orderStatus === "courier_scheduled" ||
    orderStatus === "shipped";

  // Check if form is valid based on preferred method
  const isFormValid =
    isPackagedSecurely &&
    canFulfillOrder &&
    preferredPickupMethod &&
    ((preferredPickupMethod === "pickup" && deliveryMethod === "home") ||
      (preferredPickupMethod === "locker" && deliveryMethod === "locker" && (selectedLocker || savedLocker)));

  const handleCommit = async () => {
    setIsCommitting(true);
    setIsDialogOpen(false);

    try {
      console.log(`🚀 Committing to sale for order: ${orderId} with delivery method: ${deliveryMethod}`);

      // Use saved locker if no custom locker selected and we're not changing
      const lockerToUse = selectedLocker || (savedLocker && !wantToChangeLocker ? savedLocker : null);

      if (deliveryMethod === "locker" && lockerToUse) {
        console.log(`📍 Using locker: ${lockerToUse.id} - ${lockerToUse.name}`);
      }

      // Prepare the commit data with delivery method and locker info
      const commitData = {
        order_id: orderId,
        seller_id: sellerId,
        delivery_method: deliveryMethod,
        ...(deliveryMethod === "locker" && lockerToUse ? {
          locker_id: lockerToUse.id,
          locker_name: lockerToUse.name,
          locker_address: lockerToUse.address || lockerToUse.full_address,
          locker_data: lockerToUse,
        } : {}),
      };

      let data, error;

      // Use the basic commit-to-sale function directly
      try {
        console.log("📞 Using commit-to-sale function...");

        const result = await supabase.functions.invoke(
          "commit-to-sale",
          {
            body: commitData,
          },
        );
        data = result.data;
        error = result.error;

      } catch (originalError) {
        console.warn("⚠️ Commit function failed, using fallback service:", originalError);

        // Final fallback to direct database service
        const fallbackResult = await FallbackCommitService.commitToSale({
          order_id: orderId,
          seller_id: sellerId,
          delivery_method: deliveryMethod,
          ...(deliveryMethod === "locker" && selectedLocker ? {
            locker_id: selectedLocker.id,
          } : {}),
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
        console.error("Supabase function error:", error);

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
        console.error("Commit function returned error:", data);
        throw new Error(data?.error || "Failed to commit to sale");
      }

      console.log("Commit successful:", data);

      // Show success message based on delivery method
      if (deliveryMethod === "locker") {
        toast.success(`Order committed! Drop-off at ${lockerToUse?.name}`, {
          duration: 5000,
        });

        toast.info(
          `Seller to drop book at: ${lockerToUse?.address || lockerToUse?.full_address}. Details sent to email.`,
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
      console.error("Commit error:", error);

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
            <span className="line-clamp-2 sm:line-clamp-none">Commit to Sale - Enhanced Options</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            You are about to commit to selling <strong>"{bookTitle}"</strong> to {buyerName}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 mt-4">
          {/* Pre-commit Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Pre-Commit Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="packaged-securely"
                  checked={isPackagedSecurely}
                  onCheckedChange={(checked) => setIsPackagedSecurely(checked as boolean)}
                  className="mt-1 flex-shrink-0"
                />
                <Label htmlFor="packaged-securely" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                  I confirm this item is packaged securely (e.g., padded envelope or sturdy box).
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="can-fulfill"
                  checked={canFulfillOrder}
                  onCheckedChange={(checked) => setCanFulfillOrder(checked as boolean)}
                  className="mt-1 flex-shrink-0"
                />
                <Label htmlFor="can-fulfill" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                  I commit to fulfilling this order and understand my obligations.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Method Display - Shows only the preferred method */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Delivery Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPreference ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : preferredPickupMethod === "locker" ? (
                // Show Locker Drop-Off (Preferred)
                <div className="p-4 border-2 border-purple-500 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-purple-600 text-white flex-shrink-0 mt-1">Preferred</Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        BobGo Locker Drop-Off
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        Drop the book at your preferred BobGo locker location. This is the method we used to calculate your rates.
                      </p>
                    </div>
                  </div>

                  {/* Locker Selection Section */}
                  {isLoadingSavedLocker ? (
                    <div className="flex items-center justify-center py-4 mt-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : savedLocker ? (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <div className="p-3 bg-white border border-green-300 rounded-lg">
                        <p className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          Your Locker
                        </p>
                        <p className="text-sm text-gray-700 mt-2">{savedLocker.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{savedLocker.address || savedLocker.full_address}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : preferredPickupMethod === "pickup" ? (
                // Show Home Pick-Up (Preferred)
                <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600 text-white flex-shrink-0 mt-1">Preferred</Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <Home className="w-4 h-4 flex-shrink-0" />
                        Home Pick-Up (Courier Collection)
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        Our courier will collect the book from your address at a scheduled time. This is the method we used to calculate your rates.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Alert for incompatible buyer delivery type */}
              {buyerDeliveryType === "door" && preferredPickupMethod === "locker" && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <AlertDescription className="text-amber-800 text-xs sm:text-sm">
                    Note: The buyer selected home delivery, but your preference is locker drop-off. You'll need to use your preferred locker location for this order.
                  </AlertDescription>
                </Alert>
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
              <li>• You'll receive pickup details via email</li>
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
            disabled={isCommitting || !isFormValid || isLoadingPreference}
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
                <span className="truncate">
                  {preferredPickupMethod === "pickup"
                    ? "Commit with Home Pick-Up"
                    : "Commit with Locker Drop-Off"}
                </span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EnhancedOrderCommitButton;
