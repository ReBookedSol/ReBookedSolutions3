import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ENV } from "@/config/environment";
import { fetchSuggestions, fetchAddressDetails, type Suggestion } from "@/services/addressAutocompleteService";

export interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  additional_info?: string;
}

interface AddressFormData {
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

interface ManualAddressInputProps {
  onAddressSelect: (addressData: AddressData) => void;
  label?: string;
  required?: boolean;
  defaultValue?: Partial<AddressData>;
  className?: string;
}

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export const ManualAddressInput = ({
  onAddressSelect,
  label = "Address",
  required = false,
  defaultValue = {},
  className = "",
}: ManualAddressInputProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState(
    defaultValue?.additional_info || ""
  );
  const [formData, setFormData] = useState<AddressFormData>({
    street_address: defaultValue?.street || "",
    city: defaultValue?.city || "",
    province: defaultValue?.province || "",
    postal_code: defaultValue?.postalCode || "",
    country: defaultValue?.country || "South Africa",
  });

  const debounceTimer = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get Supabase credentials
  const SUPABASE_URL = ENV.VITE_SUPABASE_URL;
  const ANON_KEY = ENV.VITE_SUPABASE_ANON_KEY;

  // Fetch suggestions as user types
  const handleSearch = async (value: string) => {
    setSearchInput(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Set new timer for debouncing (300ms as per guide)
    debounceTimer.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await fetchSuggestions(value);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Handle suggestion selection and auto-fill
  const handleSelectSuggestion = async (placeId: string, description: string) => {
    setSearchInput(description);
    setShowDropdown(false);

    try {
      setIsLoading(true);
      const details = await fetchAddressDetails(placeId);

      if (details) {
        // Parse the formatted address
        // Format: "Street Number Street Name, Suburb, City, Postal Code, Country"
        const parts = details.address.split(',').map(p => p.trim());

        let streetAddr = parts[0] || '';
        if (parts[1] && !parts[1].match(/^\d+$/)) {
          streetAddr = `${parts[0]}, ${parts[1]}`;
        }

        const city = parts[2] || parts[1] || '';
        const postalCode = parts[3] || '';

        // Auto-fill the form fields
        setFormData({
          street_address: streetAddr,
          city: city,
          province: "",
          postal_code: postalCode,
          country: "South Africa",
        });
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
    } finally {
      setIsLoading(false);
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

  // Trigger callback when form is valid
  useEffect(() => {
    if (
      formData.street_address &&
      formData.city &&
      formData.province &&
      formData.postal_code
    ) {
      const addressData: AddressData = {
        formattedAddress: `${formData.street_address}, ${formData.city}, ${formData.province}, ${formData.postal_code}, ${formData.country}`,
        street: formData.street_address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postal_code,
        country: formData.country,
        additional_info: additionalInfo || undefined,
      };
      onAddressSelect(addressData);
    }
  }, [formData, additionalInfo]);

  return (
    <div className={`w-full max-w-2xl space-y-6 ${className}`}>
      {label && (
        <Label className="text-base font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* Address Search Input */}
      <div className="relative" ref={dropdownRef}>
        <Label htmlFor="address-search">Search Address</Label>
        <Input
          id="address-search"
          type="text"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Start typing an address..."
          className="mt-2"
          disabled={isLoading}
        />

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                onClick={() =>
                  handleSelectSuggestion(suggestion.place_id, suggestion.description)
                }
                className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b last:border-b-0"
                type="button"
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Auto-filled Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            value={formData.street_address}
            onChange={(e) =>
              setFormData({ ...formData, street_address: e.target.value })
            }
            placeholder="Street address"
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="City"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              value={formData.province}
              onChange={(e) =>
                setFormData({ ...formData, province: e.target.value })
              }
              placeholder="Province"
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal">Postal Code</Label>
            <Input
              id="postal"
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value })
              }
              placeholder="Postal code"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              placeholder="Country"
              className="mt-2"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="additional_info">Additional Information (Optional)</Label>
          <textarea
            id="additional_info"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="e.g., Building entrance details, security gate code, special instructions..."
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Include any helpful details for pickup/delivery (gate codes, building access, etc.)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualAddressInput;
