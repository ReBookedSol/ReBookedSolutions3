import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import usePlacesLibrary from '@/hooks/usePlacesLibrary';

export interface AddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  additional_info?: string;
}

interface GooglePlacesAutocompleteProps {
  onAddressSelect: (addressData: AddressData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultValue?: Partial<AddressData>;
}

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  onAddressSelect,
  label = 'Address',
  placeholder = 'Start typing an address...',
  required = false,
  error,
  className = '',
  defaultValue = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.BasicPlaceAutocompleteElement | null>(null);
  const detailsRef = useRef<google.maps.places.PlaceDetailsElement | null>(null);

  const { isLoaded: placesLoaded, error: placesError } = usePlacesLibrary();

  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue?.formattedAddress || '');
  const [isInitializing, setIsInitializing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Extract address components from place details
  const extractAddressData = async (placeId: string): Promise<AddressData | null> => {
    try {
      if (!window.google?.maps?.places?.PlaceDetailsElement) {
        throw new Error('PlaceDetailsElement not available');
      }

      // Create a temporary details element to fetch place data
      const request: google.maps.places.FetchPlaceRequest = {
        fields: ['formatted_address', 'address_component', 'geometry'],
        placeId: placeId,
      };

      const { place } = await window.google.maps.places.Place.fetchFields(request);

      if (!place.formattedAddress) {
        throw new Error('Could not fetch place details');
      }

      // Extract address components
      let street = '';
      let city = '';
      let province = '';
      let postalCode = '';

      if (place.addressComponents) {
        place.addressComponents.forEach((component) => {
          const type = component.types[0];
          if (type === 'street_number') {
            street = component.longText + ' ';
          } else if (type === 'route') {
            street += component.longText;
          } else if (type === 'locality') {
            city = component.longText;
          } else if (type === 'administrative_area_level_1') {
            province = component.longText;
          } else if (type === 'postal_code') {
            postalCode = component.longText;
          }
        });
      }

      // Normalize province name to South African provinces
      const normalizedProvince =
        SA_PROVINCES.find(
          (p) =>
            p.toLowerCase().includes(province.toLowerCase()) ||
            province.toLowerCase().includes(p.toLowerCase()),
        ) || province;

      const addressData: AddressData = {
        formattedAddress: place.formattedAddress,
        street: street.trim() || place.formattedAddress.split(',')[0],
        city: city || '',
        province: normalizedProvince || '',
        postalCode: postalCode || '',
        country: 'South Africa',
      };

      return addressData;
    } catch (err) {
      return null;
    }
  };

  // Initialize the Places autocomplete element
  const initializeAutocomplete = async () => {
    if (!placesLoaded || !containerRef.current || isInitializing) return;

    setIsInitializing(true);
    try {
      if (!window.google?.maps?.places?.BasicPlaceAutocompleteElement) {
        throw new Error('BasicPlaceAutocompleteElement not available');
      }

      // Create the Basic Place Autocomplete element
      autocompleteRef.current = new window.google.maps.places.BasicPlaceAutocompleteElement({
        includedRegionCodes: ['za'], // South Africa only
      });

      // Add listener for place selection
      autocompleteRef.current.addEventListener('gmp-placeselect', async () => {
        const placeId = autocompleteRef.current?.value;
        if (!placeId) return;

        try {
          const addressData = await extractAddressData(placeId);
          if (addressData) {
            setSelectedAddress(addressData);
            setInputValue(addressData.formattedAddress);
            onAddressSelect(addressData);
            setLocalError(null);
          } else {
            setLocalError('Could not extract address details. Please try again.');
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setLocalError(`Failed to process address: ${errorMsg}`);
        }
      });

      // Append the autocomplete element to the container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(autocompleteRef.current);
      }

      setIsInitializing(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setLocalError(`Failed to initialize autocomplete: ${errorMsg}`);
      setIsInitializing(false);
    }
  };

  // Initialize when Places library is loaded
  useEffect(() => {
    if (placesLoaded && !placesError) {
      initializeAutocomplete();
    }
  }, [placesLoaded, placesError]);

  // Set default value if provided
  useEffect(() => {
    if (defaultValue?.formattedAddress) {
      setInputValue(defaultValue.formattedAddress);
      setSelectedAddress(defaultValue as AddressData);
    }
  }, []);

  // Show loading state while Places library is loading
  if (!placesLoaded && !placesError) {
    return (
      <div className={`space-y-4 ${className}`}>
        {label && (
          <Label className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Loading address search...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayError = placesError || localError || error;

  if (placesError && !placesLoaded) {
    return (
      <div className={`space-y-4 ${className}`}>
        {label && (
          <Label className="text-base font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Address search is temporarily unavailable. Please enter your address manually.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-4">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter your full address manually..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={error ? 'border-red-500' : ''}
              required={required}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <Card>
        <CardContent className="p-4">
          <div ref={containerRef} className="w-full" />
          <p className="text-xs text-gray-500 mt-2">
            Start typing your address and select from the suggestions
          </p>
        </CardContent>
      </Card>

      {displayError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{displayError}</AlertDescription>
        </Alert>
      )}

      {selectedAddress && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-1">Selected Address:</p>
                <p className="text-sm text-green-700">{selectedAddress.formattedAddress}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-green-600">
                  <span>
                    <strong>City:</strong> {selectedAddress.city}
                  </span>
                  <span>
                    <strong>Province:</strong> {selectedAddress.province}
                  </span>
                  <span>
                    <strong>Postal:</strong> {selectedAddress.postalCode}
                  </span>
                  <span>
                    <strong>Country:</strong> {selectedAddress.country}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
