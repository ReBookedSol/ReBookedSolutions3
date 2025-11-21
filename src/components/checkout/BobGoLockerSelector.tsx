import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Loader2,
  Clock,
  Phone,
  Navigation,
  Info,
  CheckCircle,
  Save,
} from "lucide-react";
import { fetchSuggestions, fetchAddressDetails, type Suggestion } from "@/services/addressAutocompleteService";
import { getBobGoLocations, type BobGoLocation } from "@/services/bobgoLocationsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BobGoLockerSelectorProps {
  onLockerSelect: (locker: BobGoLocation) => void;
  selectedLockerId?: string;
  title?: string;
  description?: string;
  showCardLayout?: boolean;
}

const BobGoLockerSelector: React.FC<BobGoLockerSelectorProps> = ({
  onLockerSelect,
  selectedLockerId,
  title = "BobGo Pickup Locations",
  description = "Find and select a nearby BobGo pickup location for your deliveries",
  showCardLayout = true,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState<BobGoLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [savingLockerId, setSavingLockerId] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search for addresses
  const handleSearch = async (value: string) => {
    setSearchInput(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await fetchSuggestions(value);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Handle address selection and fetch BobGo locations
  const handleSelectAddress = async (placeId: string, description: string) => {
    setSearchInput(description);
    setSelectedAddress(description);
    setShowDropdown(false);

    try {
      setIsLoadingLocations(true);
      const details = await fetchAddressDetails(placeId);

      if (details && details.lat && details.lng) {
        // Fetch nearby BobGo locations
        const nearbyLocations = await getBobGoLocations(details.lat, details.lng, 5);
        setLocations(nearbyLocations);
        setShowLocations(true);
      } else {
        console.error("Failed to get coordinates from address");
        setLocations([]);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Save locker to profile
  const handleSaveLockerToProfile = async (location: BobGoLocation) => {
    try {
      setSavingLockerId(location.id || "");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save a locker");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_delivery_locker_data: location,
          preferred_delivery_locker_saved_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Locker saved to your profile! 🎉", {
        description: `${location.name} is now your preferred delivery locker`,
      });
    } catch (error) {
      console.error("Error saving locker:", error);
      toast.error("Failed to save locker to profile");
    } finally {
      setSavingLockerId(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const content = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {description}
      </p>

      {/* Address Search Input */}
      <div className="relative" ref={dropdownRef}>
        <Label htmlFor="bobgo-locker-search">Search Address</Label>
        <div className="relative mt-2">
          <Input
            id="bobgo-locker-search"
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Enter an address to find nearby locations..."
            className="pr-10"
          />
          {/* Mini Loading Indicator */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                onClick={() =>
                  handleSelectAddress(suggestion.place_id, suggestion.description)
                }
                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b last:border-b-0 text-sm"
                type="button"
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoadingLocations && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      )}

      {/* BobGo Locations List */}
      {locations.length > 0 && !isLoadingLocations && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">
            {locations.length} locations found
            {selectedAddress && ` near ${selectedAddress}`}
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
            {locations.map((location, index) => {
              const isSelected = selectedLockerId === location.id;
              return (
                <div
                  key={location.id || index}
                  className={`p-4 bg-white border-2 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                    isSelected
                      ? "border-purple-500 bg-purple-50"
                      : "border-purple-200"
                  }`}
                  onClick={() => onLockerSelect(location)}
                >
                  {/* Header Section with Image in Corner */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      {/* Location Name */}
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        {location.name || location.human_name || location.location_name || location.title || `Location ${index + 1}`}
                      </h4>
                      {/* Type Badge */}
                      {location.type && (
                        <Badge className="mt-2 bg-purple-100 text-purple-800">
                          {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                        </Badge>
                      )}
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="flex items-center gap-1 mt-2 text-purple-600 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Selected
                        </div>
                      )}
                    </div>

                    {/* Image in Corner - Clickable */}
                    {(location.image_url || location.pickup_point_provider_logo_url) && (
                      <div
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(location.image_url || location.pickup_point_provider_logo_url || null);
                        }}
                      >
                        <img
                          src={location.image_url || location.pickup_point_provider_logo_url}
                          alt={location.name || "Location image"}
                          className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Main Content Grid */}
                  <div className="space-y-3">
                    {/* Full Address */}
                    {(location.full_address || location.address) && (
                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                          {location.full_address || location.address}
                        </p>
                      </div>
                    )}

                    {/* Operating Hours */}
                    {location.trading_hours && (
                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Operating Hours
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {location.trading_hours}
                        </p>
                      </div>
                    )}

                    {/* Description/Instructions */}
                    {location.description && (
                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {location.description}
                        </p>
                      </div>
                    )}

                    {/* Provider Info */}
                    {location.pickup_point_provider_name && (
                      <div className="pb-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</p>
                        <div className="flex items-center gap-2 mt-1">
                          {location.pickup_point_provider_logo_url && (
                            <img
                              src={location.pickup_point_provider_logo_url}
                              alt="Provider logo"
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm text-gray-700 font-medium">
                            {location.pickup_point_provider_name}
                          </span>
                          {location.provider_slug && (
                            <span className="text-xs text-gray-500">({location.provider_slug})</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
                      {/* Latitude/Longitude */}
                      {(location.lat || location.lng) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coordinates</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}
                          </p>
                        </div>
                      )}

                      {/* Distance */}
                      {(location.distance || location.distance_km) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distance</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {typeof location.distance === "number"
                              ? `${location.distance.toFixed(1)} km`
                              : typeof location.distance_km === "number"
                              ? `${location.distance_km.toFixed(1)} km`
                              : location.distance || location.distance_km}
                          </p>
                        </div>
                      )}

                      {/* ID */}
                      {location.id && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</p>
                          <p className="text-sm text-gray-700 mt-1 font-mono">
                            {location.id}
                          </p>
                        </div>
                      )}

                      {/* Provider ID */}
                      {location.provider_id && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider ID</p>
                          <p className="text-sm text-gray-700 mt-1 font-mono">
                            {location.provider_id}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Contact and Status */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Phone */}
                      {(location.phone || location.contact_phone || location.telephone) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" /> Phone
                          </p>
                          <a
                            href={`tel:${location.phone || location.contact_phone || location.telephone}`}
                            className="text-sm text-purple-600 hover:text-purple-700 mt-1 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {location.phone || location.contact_phone || location.telephone}
                          </a>
                        </div>
                      )}

                      {/* Status */}
                      {location.active !== undefined && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                          <Badge className={`mt-1 inline-block ${location.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {location.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Locations Found */}
      {selectedAddress && locations.length === 0 && !isLoadingLocations && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No BobGo locations found near the selected address. Try searching
            another location or contact support for assistance.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert - Show when no search has been done yet */}
      {!selectedAddress && locations.length === 0 && !isLoadingLocations && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Search for an address above to find nearby BobGo pickup locations.
            Click on any location to select it for delivery.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  if (showCardLayout) {
    return (
      <>
        <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-purple-600" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {content}
          </CardContent>
        </Card>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Location Image</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                >
                  ×
                </button>
              </div>
              <div className="p-4 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Location"
                  className="w-full h-auto rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {content}
      {/* Image Modal for non-card layout */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Location Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-light"
              >
                ×
              </button>
            </div>
            <div className="p-4 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Location"
                className="w-full h-auto rounded"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BobGoLockerSelector;
