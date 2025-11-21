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

    let subscription: any = null;

    const setupRealtimeListener = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Create unique channel name with timestamp to avoid conflicts
        const channelName = `profiles:${user.id}:${Date.now()}`;

        subscription = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${user.id}`,
            },
            (payload: any) => {
              setSavedLocker(payload.new.preferred_delivery_locker_data || null);
            }
          )
          .subscribe();
      } catch (error) {
        console.error("Error setting up realtime listener:", error instanceof Error ? error.message : String(error));
      }
    };

    setupRealtimeListener();

    return () => {
      if (subscription) {
        subscription.unsubscribe().catch((err: any) => {
          console.debug("Error unsubscribing from channel:", err instanceof Error ? err.message : String(err));
        });
      }
    };
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
      if (typeof value === "object") return JSON.stringify(value, null, 2);
      return String(value);
    };

    const formatFieldName = (key: string): string => {
      return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Get all locker fields, excluding empty values and certain fields
    const excludeFields = ["image_url", "pickup_point_provider_logo_url"];
    const fields = Object.entries(locker)
      .filter(
        ([key, value]) =>
          !excludeFields.includes(key) &&
          value !== null &&
          value !== undefined &&
          value !== ""
      )
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    return (
      <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-purple-600" />
            Saved Locker
            <Badge className="bg-green-100 text-green-800 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left: Image Section */}
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              {(locker.image_url || locker.pickup_point_provider_logo_url) ? (
                <img
                  src={locker.image_url || locker.pickup_point_provider_logo_url}
                  alt={locker.name}
                  className="h-28 w-28 sm:h-32 sm:w-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-28 w-28 sm:h-32 sm:w-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Right: Information Section */}
            <div className="flex-1">
              {/* Main Location Info */}
              <div className="mb-3">
                <h3 className="font-bold text-base text-gray-900 mb-1 break-words">{locker.name || "—"}</h3>
                <p className="text-xs text-gray-600 break-words">
                  {locker.full_address || locker.address || "—"}
                </p>
              </div>

              {/* Fields Grid */}
              {fields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                  {fields.map(([key, value]) => {
                    // Skip certain verbose fields
                    if (["description", "lat", "lng", "provider_id", "type"].includes(key)) {
                      return null;
                    }

                    return (
                      <div key={key} className="flex flex-col min-w-0">
                        <p className="font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1 flex-wrap">
                          {key === "phone" || key === "contact_phone" ? (
                            <>
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{formatFieldName(key)}</span>
                            </>
                          ) : key === "trading_hours" ? (
                            <>
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span>{formatFieldName(key)}</span>
                            </>
                          ) : (
                            <span>{formatFieldName(key)}</span>
                          )}
                        </p>
                        {key === "phone" || key === "contact_phone" ? (
                          <a
                            href={`tel:${value}`}
                            className="text-purple-600 hover:text-purple-700 font-medium break-words text-xs"
                          >
                            {renderFieldValue(value)}
                          </a>
                        ) : typeof value === "object" ? (
                          <span className="text-gray-600 text-xs break-words">
                            {JSON.stringify(value)}
                          </span>
                        ) : (
                          <p className="text-gray-700 text-xs break-words">
                            {renderFieldValue(value)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Button
                  onClick={onDelete}
                  disabled={isDeleting}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 text-xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || isLoadingLockers) {
    return (
      <Card className="border-2 border-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!savedLocker) {
    return (
      <Card className="border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-gray-600" />
            Saved Locker
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Alert className="py-2 px-3">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
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
