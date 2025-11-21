import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  MapPin,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Save,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BobGoLockerSelector from "@/components/checkout/BobGoLockerSelector";
import { BobGoLocation } from "@/services/bobgoLocationsService";

interface Step1point5DeliveryMethodProps {
  bookTitle: string;
  onSelectDeliveryMethod: (
    method: "home" | "locker",
    locker?: BobGoLocation | null
  ) => void;
  onBack: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

const Step1point5DeliveryMethod: React.FC<Step1point5DeliveryMethodProps> = ({
  bookTitle,
  onSelectDeliveryMethod,
  onBack,
  onCancel,
  loading = false,
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "locker">("home");
  const [selectedLocker, setSelectedLocker] = useState<BobGoLocation | null>(null);
  const [savedLocker, setSavedLocker] = useState<BobGoLocation | null>(null);
  const [isLoadingSavedLocker, setIsLoadingSavedLocker] = useState(true);
  const [isSavingLocker, setIsSavingLocker] = useState(false);

  // Load saved locker from profile on mount
  useEffect(() => {
    loadSavedLocker();
  }, []);

  // Auto-select delivery method based on saved locker
  useEffect(() => {
    if (savedLocker && !selectedLocker) {
      setDeliveryMethod("locker");
      setSelectedLocker(savedLocker);
    }
  }, [savedLocker, selectedLocker]);

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

  const handleSaveLockerToProfile = async () => {
    if (!selectedLocker) {
      toast.error("Please select a locker first");
      return;
    }

    try {
      setIsSavingLocker(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save locker");
        return;
      }

      // Update user profile with locker preference
      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_delivery_locker_location_id: parseInt(selectedLocker.id || "0"),
          preferred_delivery_locker_provider_slug: selectedLocker.provider_slug || "bobgo",
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setSavedLocker(selectedLocker);
      toast.success("Locker saved to your profile! 🎉", {
        description: `You can use ${selectedLocker.name} for future orders`,
      });
    } catch (error) {
      console.error("Error saving locker:", error);
      toast.error("Failed to save locker to profile");
    } finally {
      setIsSavingLocker(false);
    }
  };

  const handleProceed = () => {
    if (deliveryMethod === "home") {
      onSelectDeliveryMethod("home", null);
    } else if (deliveryMethod === "locker") {
      if (!selectedLocker) {
        toast.error("Please select a locker location");
        return;
      }
      onSelectDeliveryMethod("locker", selectedLocker);
    }
  };

  if (isLoadingSavedLocker) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Loading your preferences...</h3>
            <p className="text-gray-600">Checking for saved locker location</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          How would you like your order delivered?
        </h1>
        <p className="text-gray-600">
          Choose where {bookTitle} will be dropped off
        </p>
      </div>

      {/* Delivery Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={deliveryMethod} onValueChange={(value) => {
            setDeliveryMethod(value as "home" | "locker");
            if (value === "home") {
              setSelectedLocker(null);
            }
          }}>
            {/* Home Delivery Option */}
            <div
              className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                deliveryMethod === "home"
                  ? "bg-blue-50 border-blue-500"
                  : "bg-gray-50 border-gray-200 hover:border-blue-300"
              }`}
            >
              <RadioGroupItem
                value="home"
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <Label className="flex items-center gap-2 font-medium text-base cursor-pointer">
                  <Home className="w-5 h-5 flex-shrink-0" />
                  <span>Home Delivery</span>
                </Label>
                <p className="text-sm text-gray-600 mt-2">
                  The seller will arrange courier pickup from their address. The book will be delivered to your address.
                </p>
              </div>
            </div>

            {/* Locker Drop-Off Option */}
            <div
              className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                deliveryMethod === "locker"
                  ? "bg-purple-50 border-purple-500"
                  : "bg-gray-50 border-gray-200 hover:border-purple-300"
              }`}
            >
              <RadioGroupItem
                value="locker"
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <Label className="flex items-center gap-2 font-medium text-base cursor-pointer">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span>BobGo Locker Drop-Off</span>
                </Label>
                <p className="text-sm text-gray-600 mt-2">
                  The seller will drop the book at a nearby BobGo pickup location. You'll collect it from there.
                </p>

                {/* Show if user has saved locker and locker method is selected */}
                {savedLocker && deliveryMethod === "locker" && (
                  <Badge className="mt-3 bg-green-100 text-green-800 flex w-fit gap-1">
                    <CheckCircle className="w-3 h-3" />
                    You have a saved locker
                  </Badge>
                )}
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Locker Selection - Only show if locker method is selected */}
      {deliveryMethod === "locker" && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Select Your Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show saved locker option if available */}
            {savedLocker && (
              <div className="p-4 bg-white border-2 border-green-300 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Your Saved Locker
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{savedLocker.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{savedLocker.address}</p>
                  </div>
                  <Button
                    variant={selectedLocker?.id === savedLocker.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLocker(savedLocker)}
                    className="flex-shrink-0"
                  >
                    {selectedLocker?.id === savedLocker.id ? "Selected" : "Use This"}
                  </Button>
                </div>
              </div>
            )}

            {/* Search for other lockers */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {savedLocker ? "Search for a different locker:" : "Search for a locker near you:"}
              </p>
              <BobGoLockerSelector
                onLockerSelect={setSelectedLocker}
                selectedLockerId={selectedLocker?.id}
                title="Find BobGo Pickup Locations"
                description="Enter an address and we'll show you nearby BobGo locations where you can pick up your order."
                showCardLayout={false}
              />
            </div>

            {/* Selected Locker Summary */}
            {selectedLocker && selectedLocker.id !== savedLocker?.id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Selected: {selectedLocker.name}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {selectedLocker.address || selectedLocker.full_address}
                </p>

                {/* Save to Profile Button - Only show if not already saved */}
                {selectedLocker.id !== savedLocker?.id && (
                  <Button
                    onClick={handleSaveLockerToProfile}
                    disabled={isSavingLocker}
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                  >
                    {isSavingLocker ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save to My Profile
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can update your saved locker anytime by selecting a different location and clicking "Save to My Profile".
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6">
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Button
          onClick={handleProceed}
          disabled={loading || (deliveryMethod === "locker" && !selectedLocker)}
        >
          Next: Select Address
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step1point5DeliveryMethod;
