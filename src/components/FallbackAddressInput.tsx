import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Keyboard,
  MapIcon,
  Wifi,
  WifiOff
} from "lucide-react";
import ManualAddressInput, {
  AddressData as GoogleAddressData,
} from "@/components/ManualAddressInput";

export interface FallbackAddressData {
  formattedAddress: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  source: 'google_maps' | 'manual_entry';
  timestamp: string;
}

interface FallbackAddressInputProps {
  onAddressSelect: (addressData: FallbackAddressData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  defaultValue?: Partial<FallbackAddressData>;
  showMethodIndicator?: boolean;
  autoFallback?: boolean; // Automatically switch to manual if Google Maps fails
}

const southAfricanProvinces = [
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

const FallbackAddressInput: React.FC<FallbackAddressInputProps> = ({
  onAddressSelect,
  label = "Address",
  placeholder = "Start typing an address...",
  required = false,
  error,
  className = "",
  defaultValue,
  showMethodIndicator = true,
  autoFallback = true,
}) => {
  const [inputMethod, setInputMethod] = useState<'manual'>('manual');
  
  // Manual address state
  const [manualAddress, setManualAddress] = useState({
    street: defaultValue?.street || "",
    city: defaultValue?.city || "",
    province: defaultValue?.province || "",
    postalCode: defaultValue?.postalCode || "",
  });

  const [selectedAddress, setSelectedAddress] = useState<FallbackAddressData | null>(null);


  const activeMethod = 'manual';

  // Handle manual address selection
  const handleManualAddressSelect = (addressData: GoogleAddressData) => {
    const fallbackData: FallbackAddressData = {
      formattedAddress: addressData.formattedAddress,
      street: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
      country: addressData.country,
      source: 'manual_entry',
      timestamp: new Date().toISOString(),
    };

    setSelectedAddress(fallbackData);

    // Update manual fields too (for consistency)
    setManualAddress({
      street: addressData.street,
      city: addressData.city,
      province: addressData.province,
      postalCode: addressData.postalCode,
    });

    onAddressSelect(fallbackData);
  };

  // Handle manual address input
  const handleManualUpdate = (field: keyof typeof manualAddress, value: string) => {
    const newAddress = { ...manualAddress, [field]: value };
    setManualAddress(newAddress);

    // Check if address is complete
    const isComplete = Object.values(newAddress).every(val => val.trim() !== "");
    
    if (isComplete) {
      const formattedAddress = [
        newAddress.street,
        newAddress.city,
        newAddress.province,
        newAddress.postalCode,
        "South Africa"
      ].filter(Boolean).join(", ");

      const fallbackData: FallbackAddressData = {
        formattedAddress,
        street: newAddress.street,
        city: newAddress.city,
        province: newAddress.province,
        postalCode: newAddress.postalCode,
        country: "South Africa",
        source: 'manual_entry',
        timestamp: new Date().toISOString(),
      };

      setSelectedAddress(fallbackData);
      onAddressSelect(fallbackData);
    }
  };

  // Toggle between methods
  const handleMethodToggle = (method: 'google' | 'manual') => {
    setInputMethod(method);
    if (method === 'manual') {
      setForceManual(true);
    } else {
      setForceManual(false);
    }
  };

  const renderMethodIndicator = () => {
    if (!showMethodIndicator) return null;

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            Manual Entry
          </Badge>
        </div>
      </div>
    );
  };

  const renderAddressPreview = () => {
    if (!selectedAddress) return null;

    return (
      <Card className="bg-green-50 border-green-200 mt-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-green-800">
                  Address Saved
                </p>
                <Badge variant="outline" className="text-xs">
                  Manual Entry
                </Badge>
              </div>
              <p className="text-sm text-green-700">
                {selectedAddress.formattedAddress}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-green-600">
                <span><strong>City:</strong> {selectedAddress.city}</span>
                <span><strong>Province:</strong> {selectedAddress.province}</span>
                <span><strong>Postal:</strong> {selectedAddress.postalCode}</span>
                <span><strong>Country:</strong> {selectedAddress.country}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <Label className="text-base font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {renderMethodIndicator()}

      {/* Address Input - Manual Only */}
      <ManualAddressInput
        onAddressSelect={handleManualAddressSelect}
        label={undefined}
        placeholder={placeholder}
        required={required}
        defaultValue={{
          formattedAddress: defaultValue?.formattedAddress || "",
          street: defaultValue?.street || "",
          city: defaultValue?.city || "",
          province: defaultValue?.province || "",
          postalCode: defaultValue?.postalCode || "",
          country: defaultValue?.country || "South Africa",
        }}
      />

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {renderAddressPreview()}
    </div>
  );
};

export default FallbackAddressInput;
