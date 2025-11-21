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
  X,
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    onImageSelect,
  }: {
    locker: BobGoLocation;
    isDeleting: boolean;
    onDelete: () => void;
    onImageSelect: (imageUrl: string) => void;
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
    const excludeFields = [
      "image_url",
      "pickup_point_provider_logo_url",
      "address",  // Use full_address instead
      "compartment_errors",
      "human_name",
      "provider_slug",
      "id",
      "od",
      "created_at",
      "updated_at"
    ];
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
      <Card className="border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-white py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-blue-600" />
              {locker.name || "Saved Locker"}
            </CardTitle>
            <Badge className="bg-green-100 text-green-700 text-xs font-medium">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-5">
            {/* Image and Basic Info Row */}
            <div className="flex gap-5">
              {/* Image */}
              <div className="flex-shrink-0">
                {(locker.image_url || locker.pickup_point_provider_logo_url) ? (
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageSelect(locker.image_url || locker.pickup_point_provider_logo_url || "")}
                  >
                    <img
                      src={locker.image_url || locker.pickup_point_provider_logo_url}
                      alt={locker.name}
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 mb-1">Full Address</p>
                <p className="text-sm text-gray-600 leading-relaxed break-words">
                  {locker.full_address || "—"}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            {fields.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {fields.map(([key, value]) => {
                  // Skip certain verbose and technical fields
                  if (["description", "lat", "lng", "provider_id", "type", "full_address", "location_id"].includes(key)) {
                    return null;
                  }

                  // Skip if no value
                  if (!value) return null;

                  return (
                    <div key={key} className="flex flex-col">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        {key === "phone" || key === "contact_phone" ? (
                          <>
                            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span>Contact</span>
                          </>
                        ) : key === "trading_hours" ? (
                          <>
                            <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span>Hours</span>
                          </>
                        ) : (
                          <span>{formatFieldName(key)}</span>
                        )}
                      </p>
                      {key === "phone" || key === "contact_phone" ? (
                        <a
                          href={`tel:${value}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium break-words"
                        >
                          {renderFieldValue(value)}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-700 break-words">
                          {renderFieldValue(value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-4 border-t border-gray-100">
              <Button
                onClick={onDelete}
                disabled={isDeleting}
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm font-medium"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Locker
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
    <>
      <LockerCard
        locker={savedLocker}
        isDeleting={isDeleting}
        onDelete={handleDeleteLocker}
        onImageSelect={setSelectedImage}
        onImageDownload={handleDownloadImage}
      />

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Locker Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-light"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center justify-center max-h-96 overflow-auto">
              <img
                src={selectedImage}
                alt="Locker location"
                className="w-full h-auto rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <Button
                onClick={() => handleDownloadImage(selectedImage, savedLocker?.name || "locker")}
                disabled={isDownloading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Image
                  </>
                )}
              </Button>
              <Button
                onClick={() => setSelectedImage(null)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SavedLockersCard;
