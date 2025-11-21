import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Clock,
  Phone,
  Trash2,
  Edit,
  Loader2,
  Info,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BobGoLocation } from "@/services/bobgoLocationsService";

interface SavedLockersCardProps {
  isLoading?: boolean;
  onEdit?: () => void;
}

const SavedLockersCard: React.FC<SavedLockersCardProps> = ({
  isLoading = false,
  onEdit,
}) => {
  const [savedDeliveryLocker, setSavedDeliveryLocker] = useState<BobGoLocation | null>(null);
  const [savedPickupLocker, setSavedPickupLocker] = useState<BobGoLocation | null>(null);
  const [isLoadingLockers, setIsLoadingLockers] = useState(true);
  const [isDeletingDelivery, setIsDeletingDelivery] = useState(false);
  const [isDeletingPickup, setIsDeletingPickup] = useState(false);

  useEffect(() => {
    loadSavedLockers();
  }, []);

  const loadSavedLockers = async () => {
    try {
      setIsLoadingLockers(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("preferred_delivery_locker_data, preferred_pickup_locker_data")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn("Failed to load saved lockers:", error);
        return;
      }

      if (profile?.preferred_delivery_locker_data) {
        setSavedDeliveryLocker(profile.preferred_delivery_locker_data as BobGoLocation);
      }
      if (profile?.preferred_pickup_locker_data) {
        setSavedPickupLocker(profile.preferred_pickup_locker_data as BobGoLocation);
      }
    } catch (error) {
      console.error("Error loading saved lockers:", error);
    } finally {
      setIsLoadingLockers(false);
    }
  };

  const handleDeleteDeliveryLocker = async () => {
    try {
      setIsDeletingDelivery(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_delivery_locker_data: null,
          preferred_delivery_locker_saved_at: null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSavedDeliveryLocker(null);
      toast.success("Delivery locker removed from profile");
    } catch (error) {
      console.error("Error deleting delivery locker:", error);
      toast.error("Failed to remove delivery locker");
    } finally {
      setIsDeletingDelivery(false);
    }
  };

  const handleDeletePickupLocker = async () => {
    try {
      setIsDeletingPickup(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_pickup_locker_data: null,
          preferred_pickup_locker_saved_at: null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSavedPickupLocker(null);
      toast.success("Pickup locker removed from profile");
    } catch (error) {
      console.error("Error deleting pickup locker:", error);
      toast.error("Failed to remove pickup locker");
    } finally {
      setIsDeletingPickup(false);
    }
  };

  const LockerCard = ({
    locker,
    type,
    isDeleting,
    onDelete,
  }: {
    locker: BobGoLocation;
    type: "delivery" | "pickup";
    isDeleting: boolean;
    onDelete: () => void;
  }) => {
    const bgColor = type === "delivery" ? "bg-purple-50" : "bg-blue-50";
    const borderColor = type === "delivery" ? "border-purple-200" : "border-blue-200";
    const iconColor = type === "delivery" ? "text-purple-600" : "text-blue-600";
    const headerGradient =
      type === "delivery"
        ? "from-purple-50 to-purple-100"
        : "from-blue-50 to-blue-100";
    const typeLabel =
      type === "delivery" ? "Delivery Locker" : "Pickup Locker";

    return (
      <Card className={`border-2 ${borderColor} hover:shadow-lg transition-shadow`}>
        <CardHeader className={`bg-gradient-to-r ${headerGradient}`}>
          <CardTitle className="flex items-center gap-2">
            <MapPin className={`h-5 w-5 ${iconColor}`} />
            {typeLabel}
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Location Name */}
            <div className={`p-4 ${bgColor} rounded-lg border ${borderColor}`}>
              <h3 className="font-semibold text-gray-900 mb-2">{locker.name}</h3>
              {locker.full_address || locker.address ? (
                <p className="text-sm text-gray-700">
                  {locker.full_address || locker.address}
                </p>
              ) : null}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider */}
              {locker.pickup_point_provider_name && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Provider
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {locker.pickup_point_provider_name}
                  </p>
                </div>
              )}

              {/* Trading Hours */}
              {locker.trading_hours && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Hours
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {locker.trading_hours}
                  </p>
                </div>
              )}

              {/* Phone */}
              {(locker.phone || locker.contact_phone) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Phone
                  </p>
                  <a
                    href={`tel:${locker.phone || locker.contact_phone}`}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-1"
                  >
                    {locker.phone || locker.contact_phone}
                  </a>
                </div>
              )}

              {/* Distance */}
              {locker.distance && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Distance
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {typeof locker.distance === "number"
                      ? `${locker.distance.toFixed(1)} km`
                      : locker.distance}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {locker.description && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{locker.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={onDelete}
                disabled={isDeleting}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </>
                )}
              </Button>
              {onEdit && (
                <Button
                  onClick={onEdit}
                  variant="outline"
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || isLoadingLockers) {
    return (
      <Card className="border-2 border-gray-100">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!savedDeliveryLocker && !savedPickupLocker) {
    return (
      <Card className="border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-600" />
            Saved Lockers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No saved locker locations yet. Save a locker during checkout to see it here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gray-100">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-600" />
          Saved Lockers
          <Badge className="bg-blue-100 text-blue-800">
            {(savedDeliveryLocker ? 1 : 0) + (savedPickupLocker ? 1 : 0)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {savedDeliveryLocker && (
            <LockerCard
              locker={savedDeliveryLocker}
              type="delivery"
              isDeleting={isDeletingDelivery}
              onDelete={handleDeleteDeliveryLocker}
            />
          )}

          {savedPickupLocker && (
            <LockerCard
              locker={savedPickupLocker}
              type="pickup"
              isDeleting={isDeletingPickup}
              onDelete={handleDeletePickupLocker}
            />
          )}

          {(savedDeliveryLocker || savedPickupLocker) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These saved lockers will be suggested during checkout for faster ordering.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedLockersCard;
