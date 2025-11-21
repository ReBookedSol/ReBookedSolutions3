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
  const [wantToChangeLocker, setWantToChangeLocker] = useState(false);

  // Pre-commit checklist states
  const [isPackagedSecurely, setIsPackagedSecurely] = useState(false);
  const [canFulfillOrder, setCanFulfillOrder] = useState(false);

  // Load saved locker when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadSavedLocker();
    }
  }, [isDialogOpen]);

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

  // Auto-select locker method with saved locker
  const handleSelectLockerMethod = (currentSavedLocker: BobGoLocation | null) => {
    setDeliveryMethod("locker");
    // Automatically select the saved locker if it exists
    if (currentSavedLocker) {
      setSelectedLocker(currentSavedLocker);
    }
  };

  // Check if order is already committed
  const isAlreadyCommitted =
    orderStatus === "committed" ||
    orderStatus === "courier_scheduled" ||
    orderStatus === "shipped";

  // Check if form is valid
  const isFormValid =
    isPackagedSecurely &&
    canFulfillOrder &&
    (deliveryMethod === "home" || (deliveryMethod === "locker" && (selectedLocker || (savedLocker && !wantToChangeLocker))));

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
        } : {}),
      };

      let data, error;

      // Use the basic commit-to-sale function directly
      try {
        console.log("📞 Using commit-to-sale function...");

        // Use basic commit data for the original function
        const basicCommitData = {
          order_id: orderId,
          seller_id: sellerId,
        };

        const result = await supabase.functions.invoke(
          "commit-to-sale",
          {
            body: basicCommitData,
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

          {/* Delivery Method Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Choose Delivery Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryMethod} onValueChange={(value) => {
                setDeliveryMethod(value as "home" | "locker");
                if (value === "home") {
                  setSelectedLocker(null);
                }
              }}>
                <div className="space-y-4">
                  {/* Home Pick-Up Option */}
                  <div
                    className={`flex items-start space-x-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      deliveryMethod === "home"
                        ? "bg-blue-50 border-blue-500"
                        : "bg-gray-50 border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => {
                      setDeliveryMethod("home");
                      setSelectedLocker(null);
                    }}
                  >
                    <RadioGroupItem value="home" className="mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <Label className="flex items-center gap-2 font-medium text-sm sm:text-base cursor-pointer">
                        <Home className="w-4 h-4 flex-shrink-0" />
                        <span>Home Pick-Up (Courier Collection)</span>
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Our courier will collect the book from your address at a scheduled time.
                      </p>
                    </div>
                  </div>

                  {/* Locker Drop-Off Option */}
                  <div
                    className={`flex items-start space-x-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      deliveryMethod === "locker"
                        ? "bg-purple-50 border-purple-500"
                        : "bg-gray-50 border-gray-200 hover:border-purple-300"
                    }`}
                    onClick={() => handleSelectLockerMethod(savedLocker)}
                  >
                    <RadioGroupItem value="locker" className="mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <Label className="flex items-center gap-2 font-medium text-sm sm:text-base cursor-pointer">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>BobGo Locker Drop-Off</span>
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Drop the book at a nearby BobGo location. Buyer will collect from there.
                      </p>
                    </div>
                  </div>

                  {/* Locker Selection UI - Only show if locker method is selected */}
                  {deliveryMethod === "locker" && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {isLoadingSavedLocker ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      </div>
                    ) : (
                      <>
                        {/* Show saved locker if available and not changing */}
                        {savedLocker && !wantToChangeLocker && (
                          <div className="p-4 bg-white border-2 border-green-300 rounded-lg">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  Your Saved Locker
                                </p>
                                <p className="text-sm text-gray-700 mt-2">{savedLocker.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{savedLocker.address || savedLocker.full_address}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setWantToChangeLocker(true)}
                              className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              Change Locker
                            </button>
                          </div>
                        )}

                        {/* Search for lockers if no saved locker or user wants to change */}
                        {!savedLocker || wantToChangeLocker ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              {savedLocker && wantToChangeLocker ? "Search for a different locker:" : "Search for a locker near you:"}
                            </p>
                            <BobGoLockerSelector
                              onLockerSelect={setSelectedLocker}
                              selectedLockerId={selectedLocker?.id}
                              title="Select a Locker Location"
                              description="Search for an address and select a nearby locker location for drop-off"
                              showCardLayout={false}
                            />
                          </div>
                        ) : null}

                        {/* Selected Locker Summary - Only show if searching for different locker */}
                        {selectedLocker && selectedLocker.id !== savedLocker?.id && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Selected: {selectedLocker.name}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              {selectedLocker.address || selectedLocker.full_address}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  )}
                </div>
              </RadioGroup>
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
            disabled={isCommitting || !isFormValid}
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
                  {deliveryMethod === "home"
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
