import { useState } from "react";
import { Label } from "@/components/ui/label";
import ManualAddressInput, {
  AddressData as GoogleAddressData,
} from "@/components/ManualAddressInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, AlertCircle } from "lucide-react";

interface AddressData {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

interface PickupAddressInputProps {
  onAddressUpdate: (address: Address) => void;
  initialAddress?: Address;
  error?: string;
  className?: string;
}

const PickupAddressInput = ({
  onAddressUpdate,
  initialAddress,
  error,
  className = "",
}: PickupAddressInputProps) => {
  const [address, setAddress] = useState<Address>(
    initialAddress || {
      street: "",
      city: "",
      province: "",
      postalCode: "",
    },
  );

  const [hasSelectedAddress, setHasSelectedAddress] = useState(
    !!initialAddress?.street,
  );

  const handleAddressSelect = (addressData: GoogleAddressData) => {
    const newAddress: Address = {
      street: addressData.street || "",
      city: addressData.city || "",
      province: addressData.province || "",
      postalCode: addressData.postalCode || "",
    };

    setAddress(newAddress);
    setHasSelectedAddress(true);
    onAddressUpdate(newAddress);
  };

  const formatAddressForDisplay = (addr: Address) => {
    if (!addr.street) return "";
    return `${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`;
  };

  const isAddressComplete =
    address.street && address.city && address.province && address.postalCode;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-base font-medium">
          Pickup Address <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-600">
          This is where buyers will collect the book from you.
        </p>
      </div>

      {/* Address Entry - Manual Only */}
      <ManualAddressInput
        onAddressSelect={handleAddressSelect}
        placeholder="Enter your pickup address..."
        required
        defaultValue={{
          formattedAddress: formatAddressForDisplay(address),
          street: address.street,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: "South Africa",
        }}
      />

      {/* Address Confirmation */}
      {hasSelectedAddress && isAddressComplete && (
        <Alert className="border-green-200 bg-green-50">
          <MapPin className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Pickup Address Confirmed:</strong>
            <br />
            {formatAddressForDisplay(address)}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if address incomplete */}
      {!isAddressComplete && (error || hasSelectedAddress) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Please ensure all address fields are completed before creating your
            listing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PickupAddressInput;
