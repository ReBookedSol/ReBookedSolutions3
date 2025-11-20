import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Loader2,
  Clock,
  Phone,
  Navigation,
  Info,
} from "lucide-react";
import { fetchSuggestions, fetchAddressDetails, type Suggestion } from "@/services/addressAutocompleteService";
import { getBobGoLocations, type BobGoLocation } from "@/services/bobgoLocationsService";

const BobGoLocationsSection: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState<BobGoLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(false);
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

  return (
    <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-purple-600" />
          BobGo Pickup Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Find and select a nearby BobGo pickup location for your deliveries
          </p>

          {/* Address Search Input */}
          <div className="relative" ref={dropdownRef}>
            <Label htmlFor="bobgo-address-search">Search Address</Label>
            <div className="relative mt-2">
              <Input
                id="bobgo-address-search"
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
                  return (
                    <div
                      key={location.id || index}
                      onClick={() => {
                        console.log("Selected location:", location);
                      }}
                      className="p-4 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 cursor-pointer transition-all"
                    >
                      {/* Header with name and icon */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">
                              {location.name || location.location_name || location.title || `Location ${index + 1}`}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Content grid */}
                      <div className="space-y-2 text-sm">
                        {/* Address */}
                        {(location.address || location.street_address) && (
                          <div className="pb-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                            <p className="text-gray-800 mt-1">
                              {location.address || location.street_address}
                            </p>
                          </div>
                        )}

                        {/* Coordinates */}
                        {(location.latitude || location.longitude) && (
                          <div className="pb-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase">Coordinates</p>
                            <p className="text-gray-800 mt-1">
                              {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                            </p>
                          </div>
                        )}

                        {/* Distance */}
                        {(location.distance || location.distance_km) && (
                          <div className="pb-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase">Distance</p>
                            <p className="text-gray-800 mt-1">
                              {typeof location.distance === "number"
                                ? `${location.distance.toFixed(1)} km`
                                : typeof location.distance_km === "number"
                                ? `${location.distance_km.toFixed(1)} km`
                                : location.distance || location.distance_km}
                            </p>
                          </div>
                        )}

                        {/* Phone */}
                        {(location.phone || location.contact_phone || location.telephone) && (
                          <div className="pb-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                            <p className="text-gray-800 mt-1 flex items-center gap-2">
                              <Phone className="h-4 w-4 text-purple-600" />
                              {location.phone || location.contact_phone || location.telephone}
                            </p>
                          </div>
                        )}

                        {/* Hours */}
                        {(location.hours || location.operating_hours || location.working_hours) && (
                          <div className="pb-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase">Operating Hours</p>
                            <p className="text-gray-800 mt-1 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-purple-600" />
                              {location.hours || location.operating_hours || location.working_hours}
                            </p>
                          </div>
                        )}

                        {/* Email */}
                        {(location.email || location.contact_email) && (
                          <div className="pb-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                            <p className="text-gray-800 mt-1 break-all">
                              {location.email || location.contact_email}
                            </p>
                          </div>
                        )}

                        {/* Status */}
                        {(location.status || location.is_active !== undefined) && (
                          <div className="pb-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                            <Badge className={`mt-1 ${location.is_active || location.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {location.status || (location.is_active ? 'Active' : 'Inactive')}
                            </Badge>
                          </div>
                        )}

                        {/* All other fields */}
                        {Object.entries(location).map(([key, value]) => {
                          // Skip already displayed fields
                          const skippedFields = [
                            'id', 'name', 'address', 'street_address', 'latitude', 'longitude',
                            'distance', 'distance_km', 'phone', 'contact_phone', 'telephone',
                            'hours', 'operating_hours', 'working_hours', 'email', 'contact_email',
                            'status', 'is_active', 'location_name', 'title'
                          ];

                          if (skippedFields.includes(key.toLowerCase()) || !value) {
                            return null;
                          }

                          // Format the value
                          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

                          return (
                            <div key={key} className="pb-2 border-b border-gray-100">
                              <p className="text-xs font-medium text-gray-500 uppercase">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-gray-800 mt-1 break-words">
                                {displayValue}
                              </p>
                            </div>
                          );
                        })}
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
                another location or use the pickup/shipping address options above.
              </AlertDescription>
            </Alert>
          )}

          {/* Info Alert - Show when no search has been done yet */}
          {!selectedAddress && locations.length === 0 && !isLoadingLocations && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Search for an address above to find nearby BobGo pickup locations.
                Click on any location to select it as your preference.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BobGoLocationsSection;
