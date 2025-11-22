import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BankingService } from "@/services/bankingService";
import type { BankingRequirementsStatus } from "@/types/banking";
import { useAuth } from "@/contexts/AuthContext";
import BobGoLockerSelector from "@/components/checkout/BobGoLockerSelector";
import { BobGoLocation } from "@/services/bobgoLocationsService";
import { toast } from "sonner";

interface BankingRequirementCheckProps {
  onCanProceed: (canProceed: boolean) => void;
  children?: React.ReactNode;
}

const BankingRequirementCheck: React.FC<BankingRequirementCheckProps> = ({
  onCanProceed,
  children,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bankingStatus, setBankingStatus] =
    useState<BankingRequirementsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocker, setSelectedLocker] = useState<BobGoLocation | null>(null);
  const [isSavingLocker, setIsSavingLocker] = useState(false);

  useEffect(() => {
    if (user) {
      checkRequirements();
    }
  }, [user]);

  const handleSaveLocker = async (locker: BobGoLocation) => {
    if (!user) {
      toast.error("You must be logged in to save a locker");
      return;
    }

    try {
      setIsSavingLocker(true);

      // Check if a locker is already saved
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("preferred_delivery_locker_data")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      const hasSavedLocker = profile?.preferred_delivery_locker_data;

      // If a locker is already saved, show confirmation
      if (hasSavedLocker) {
        const oldLockerName = (hasSavedLocker as any)?.name || "your saved locker";
        const proceed = window.confirm(
          `You already have "${oldLockerName}" saved as your locker.\n\nDo you want to replace it with "${locker.name}"?`
        );
        if (!proceed) {
          setIsSavingLocker(false);
          return;
        }
      }

      // Update user profile with full locker data
      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_delivery_locker_data: locker,
          preferred_delivery_locker_saved_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setSelectedLocker(null);
      toast.success("Locker saved! 🎉", {
        description: `${locker.name} is now saved to your profile`,
      });

      // Refresh requirements to allow listing
      await checkRequirements(true);
    } catch (error) {
      console.error("Error saving locker:", error);
      toast.error("Failed to save locker to profile");
    } finally {
      setIsSavingLocker(false);
    }
  };

  const checkRequirements = async (forceRefresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("🔍 Checking listing requirements for user:", user.id, forceRefresh ? "(forced refresh)" : "");

      // Check for saved locker
      let hasSavedLocker = false;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_delivery_locker_data")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.preferred_delivery_locker_data) {
          const lockerData = profile.preferred_delivery_locker_data as any;
          if (lockerData.id && lockerData.name) {
            hasSavedLocker = true;
            console.log("📍 User has saved locker");
          }
        }
      } catch (error) {
        console.warn("Failed to check saved locker:", error);
      }

      // Check pickup address from seller requirements
      const requirements = await BankingService.getSellerRequirements(user.id);

      console.log("✅ Locker result:", hasSavedLocker, "📍 Address result:", requirements);

      // User can list if they have EITHER locker OR pickup address
      const canList = hasSavedLocker || requirements.hasPickupAddress;

      const status: BankingRequirementsStatus = {
        hasBankingInfo: true, // Not checked anymore - banking is not required
        hasPickupAddress: requirements.hasPickupAddress,
        isVerified: true,
        canListBooks: canList,
        missingRequirements: canList ? [] : [
          ...(hasSavedLocker ? [] : ["Locker saved OR "]),
          ...(requirements.hasPickupAddress ? [] : ["Pickup address required"]),
        ],
      };

      console.log("📊 Final listing requirements status:", status);

      setBankingStatus(status);
      onCanProceed(status.canListBooks);
    } catch (error) {
      console.error("Error checking listing requirements:", error);
      onCanProceed(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-book-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bankingStatus) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to verify selling requirements. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (bankingStatus.canListBooks) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Setup Required to List Books
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-700">
            To list books for sale, you need to save either a BobGo locker or a pickup address:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0">
                {bankingStatus.hasPickupAddress ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Pickup Address</h4>
                <p className="text-sm text-gray-600">
                  Address for book pickup and delivery arrangements
                </p>
              </div>
              <div className="flex-shrink-0">
                {bankingStatus.hasPickupAddress ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-500 text-red-700"
                  >
                    Missing
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-center text-gray-600 font-medium">OR</p>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">BobGo Locker</h4>
                <p className="text-sm text-gray-600">
                  Save a BobGo pickup point as alternative to address
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge
                  variant="outline"
                  className="border-blue-500 text-blue-700"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Optional
                </Badge>
              </div>
            </div>

            {/* Locker Search Section */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Search for a BobGo Locker
              </h4>
              <BobGoLockerSelector
                onLockerSelect={handleSaveLocker}
                selectedLockerId={selectedLocker?.id}
                title="Find a Locker Location"
                description="Search for an address and select a nearby locker location to save to your profile."
                showCardLayout={false}
              />
              {isSavingLocker && (
                <div className="mt-3 flex items-center gap-2 text-blue-700 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving locker to your profile...
                </div>
              )}
            </div>
          </div>

          {bankingStatus.missingRequirements.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="text-sm">
                  Please save either a BobGo locker or a pickup address in your profile to start listing books.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate("/profile?tab=addresses")}
              className="bg-book-600 hover:bg-book-700 flex-1 btn-mobile"
            >
              <MapPin className="btn-mobile-icon" />
              <span className="btn-mobile-text">Add Address (Alternative)</span>
              <ArrowRight className="btn-mobile-icon" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/books")}
              className="flex-1 btn-mobile"
            >
              <span className="btn-mobile-text">Browse Books Instead</span>
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Delivery Options at Checkout
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>With Address:</strong> Buyer can choose pickup or delivery</li>
              <li>• <strong>With Locker Only:</strong> Buyer can only use locker delivery</li>
              <li>• <strong>With Both:</strong> Buyer can choose between all options</li>
              <li>• All payments go to your wallet (10% platform fee applied)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankingRequirementCheck;
