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
  const [savedLocker, setSavedLocker] = useState<BobGoLocation | null>(null);
  const [isLoadingLockers, setIsLoadingLockers] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSavedLockers();

    const setupRealtimeListener = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const subscription = supabase
          .from("profiles")
          .on("UPDATE", (payload) => {
            if (payload.new.id === user.id) {
              setSavedLocker(payload.new.preferred_delivery_locker_data || null);
            }
          })
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up realtime listener:", error);
      }
    };

    setupRealtimeListener().then(unsubscribe => {
      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
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
        .select("preferred_delivery_locker_data")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn("Failed to load saved locker:", error);
        return;
      }

      if (profile?.preferred_delivery_locker_data) {
        setSavedLocker(profile.preferred_delivery_locker_data as BobGoLocation);
      } else {
        setSavedLocker(null);
      }
    } catch (error) {
      console.error("Error loading saved locker:", error);
    } finally {
      setIsLoadingLockers(false);
    }
  };

  const handleDeleteLocker = async () => {
    try {
      setIsDeleting(true);
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

      setSavedLocker(null);
      toast.success("Locker removed from profile");
    } catch (error) {
      console.error("Error deleting locker:", error);
      toast.error("Failed to remove locker");
    } finally {
      setIsDeleting(false);
    }
  };

  const LockerCard = ({
    locker,
    isDeleting,
    onDelete,
  }: {
    locker: BobGoLocation;
    isDeleting: boolean;
    onDelete: () => void;
  }) => {
    const renderFieldValue = (value: any): string => {
      if (value === null || value === undefined) return "—";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "number") {
        if (Number.isFinite(value)) {
          return value.toString();
        }
        return "—";
      }
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    };

    // Get all locker fields, excluding empty values and certain fields
    const excludeFields = ["image_url", "pickup_point_provider_logo_url"];
    const fields = Object.entries(locker)
      .filter(
        ([key, value]) =>
          !excludeFields.includes(key) &&
          value !== null &&
          value !== undefined &&
          value !== "" &&
          typeof value !== "object"
      )
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    return (
      <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            Saved Locker
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Main Location Info */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{locker.name || "—"}</h3>
              <p className="text-sm text-gray-700">
                {locker.full_address || locker.address || "—"}
              </p>
            </div>

            {/* All Locker Fields */}
            {fields.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {fields.map(([key, value]) => (
                  <div
                    key={key}
                    className="pb-3 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      {key === "phone" || key === "contact_phone" ? (
                        <>
                          <Phone className="h-3.5 w-3.5" />
                          {key.replace(/_/g, " ")}
                        </>
                      ) : key === "trading_hours" ? (
                        <>
                          <Clock className="h-3.5 w-3.5" />
                          {key.replace(/_/g, " ")}
                        </>
                      ) : (
                        key.replace(/_/g, " ")
                      )}
                    </p>
                    {key === "phone" || key === "contact_phone" ? (
                      <a
                        href={`tel:${value}`}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-1"
                      >
                        {renderFieldValue(value)}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700 mt-1">
                        {renderFieldValue(value)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-100">
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

  if (!savedLocker) {
    return (
      <Card className="border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-600" />
            Saved Locker
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No saved locker yet. Search and save a locker location to see it here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <LockerCard
      locker={savedLocker}
      isDeleting={isDeleting}
      onDelete={handleDeleteLocker}
    />
  );
};

export default SavedLockersCard;
