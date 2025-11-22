import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Plus,
  Edit,
  Truck,
  Home,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Package,
  Loader2,
  Info,
  Trash2,
} from "lucide-react";
import ManualAddressInput from "@/components/ManualAddressInput";
import type { AddressData as GoogleAddressData } from "@/components/ManualAddressInput";
import { AddressData, Address } from "@/types/address";
import { handleAddressError } from "@/utils/errorDisplayUtils";
import BobGoLocationsSection from "./BobGoLocationsSection";
import SavedLockersCard from "./SavedLockersCard";

interface ModernAddressTabProps {
  addressData: AddressData | null;
  onSaveAddresses?: (
    pickup: Address,
    shipping: Address,
    same: boolean,
  ) => Promise<void>;
  isLoading?: boolean;
}

const ModernAddressTab = ({
  addressData,
  onSaveAddresses,
  isLoading = false,
}: ModernAddressTabProps) => {
  const savedLockersCardRef = useRef<{ loadSavedLockers: () => Promise<void> } | null>(null);
  const [editMode, setEditMode] = useState<
    "none" | "pickup" | "shipping" | "both"
  >("none");
  const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [sameAsPickup, setSameAsPickup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<"pickup" | "shipping" | null>(null);

  useEffect(() => {
    if (addressData) {
      setPickupAddress(addressData.pickup_address);
      setShippingAddress(addressData.shipping_address);
      setSameAsPickup(addressData.addresses_same || false);
    }
  }, [addressData]);

  // Small optimization: prefill addresses quickly without awaiting heavy decrypt flows elsewhere
  useEffect(() => {
    // if no address data yet, attempt a lightweight cached fetch (non-blocking)
    let cancelled = false;
    const tryPrefetch = async () => {
      if (addressData) return;
      try {
        const cacheKey = `cached_address_${window?.__USER_ID__}`;
        const cached = cacheKey ? (window as any)?.localStorage?.getItem?.(cacheKey) : null;
        if (cached && !cancelled) {
          const parsed = JSON.parse(cached);
          setPickupAddress(parsed.pickup_address || null);
          setShippingAddress(parsed.shipping_address || null);
          setSameAsPickup(parsed.addresses_same || false);
        }
      } catch (e) {
        // ignore cache failures
      }
    };
    tryPrefetch();
    return () => { cancelled = true; };
  }, []);

  const formatAddress = (address: Address | null | undefined) => {
    if (!address) return null;
    return `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`;
  };

  const handleSave = async () => {
    if (!pickupAddress || !shippingAddress || !onSaveAddresses) return;

    setIsSaving(true);
    try {
      await onSaveAddresses(pickupAddress, shippingAddress, sameAsPickup);
      setEditMode("none");
    } catch (error) {
      const formattedError = handleAddressError(error, "save");
      console.error(formattedError.developerMessage, formattedError.originalError);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (mode: "pickup" | "shipping" | "both") => {
    setEditMode(mode);
    // Initialize addresses if they don't exist
    if (!pickupAddress) {
      setPickupAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "South Africa",
      });
    }
    if (!shippingAddress) {
      setShippingAddress({
        street: "",
        city: "",
        province: "",
        postalCode: "",
        country: "South Africa",
      });
    }
  };

  const handleDeletePickupAddress = async () => {
    setPickupAddress(null);
    setSameAsPickup(false);
    setDeleteConfirm(null);

    // Attempt to save the deletion
    if (onSaveAddresses && shippingAddress) {
      setIsSaving(true);
      try {
        await onSaveAddresses(
          {
            street: "",
            city: "",
            province: "",
            postalCode: "",
            country: "South Africa",
          },
          shippingAddress,
          false
        );
      } catch (error) {
        const formattedError = handleAddressError(error, "delete");
        console.error(formattedError.developerMessage, formattedError.originalError);
        // Restore the address if deletion fails
        if (addressData?.pickup_address) {
          setPickupAddress(addressData.pickup_address);
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteShippingAddress = async () => {
    setShippingAddress(null);
    setSameAsPickup(false);
    setDeleteConfirm(null);

    // Attempt to save the deletion
    if (onSaveAddresses && pickupAddress) {
      setIsSaving(true);
      try {
        await onSaveAddresses(
          pickupAddress,
          {
            street: "",
            city: "",
            province: "",
            postalCode: "",
            country: "South Africa",
          },
          false
        );
      } catch (error) {
        const formattedError = handleAddressError(error, "delete");
        console.error(formattedError.developerMessage, formattedError.originalError);
        // Restore the address if deletion fails
        if (addressData?.shipping_address) {
          setShippingAddress(addressData.shipping_address);
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePickupAddressChange = useCallback((address: GoogleAddressData) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setPickupAddress(formattedAddress);
  }, []);

  // Sync shipping address when pickup address changes and "use pickup for shipping" is checked
  useEffect(() => {
    if (sameAsPickup && pickupAddress) {
      setShippingAddress({
        street: pickupAddress.street,
        city: pickupAddress.city,
        province: pickupAddress.province,
        postalCode: pickupAddress.postalCode,
        country: pickupAddress.country,
      });
    }
  }, [sameAsPickup, pickupAddress]);

  const handleShippingAddressChange = useCallback((address: GoogleAddressData) => {
    const formattedAddress: Address = {
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    };
    setShippingAddress(formattedAddress);
  }, []);

  if (isLoading) {
    return (
      <Card className="border-2 border-orange-100 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-orange-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
          <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
            <MapPin className="h-6 w-6 text-orange-600" />
            Address Management
            {pickupAddress && shippingAddress && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Saved Lockers Section - Moved to Top */}
      <SavedLockersCard ref={savedLockersCardRef} isLoading={isLoading} />

      {/* Locker Recommendation Alert */}
      <Alert className="bg-blue-50 border-blue-300">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <span className="font-semibold">Pro Tip: Using the locker system is easier and safer!</span> Avoid unnecessary rescheduling with couriers, and get paid faster since books are delivered quickly. The locker system is the fastest way to complete deliveries.
        </AlertDescription>
      </Alert>

      {/* BobGo Locations Section - Moved to Top */}
      <BobGoLocationsSection onLockerSaved={() => savedLockersCardRef.current?.loadSavedLockers()} />

      {/* Address Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Address */}
        <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Pickup Address
              {pickupAddress && (
                <Badge
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Where our couriers can pick up your books
              </p>

              {pickupAddress && editMode !== "pickup" && editMode !== "both" ? (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">
                          Current Address
                        </p>
                        <p className="text-sm text-blue-800 mt-1">
                          {formatAddress(pickupAddress)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {deleteConfirm === "pickup" ? (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-3">
                      <p className="text-sm text-red-800">
                        Are you sure you want to delete this pickup address? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDeletePickupAddress}
                          variant="destructive"
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(null)}
                          variant="outline"
                          className="flex-1"
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEditing("pickup")}
                        variant="outline"
                        className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm("pickup")}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ) : editMode === "pickup" || editMode === "both" ? (
                <div className="space-y-4">
                  <ManualAddressInput
                    label="Pickup Address"
                    required
                    onAddressSelect={handlePickupAddressChange}
                    defaultValue={
                      pickupAddress
                        ? {
                            formattedAddress: `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.province}, ${pickupAddress.postalCode}`,
                            street: pickupAddress.street,
                            city: pickupAddress.city,
                            province: pickupAddress.province,
                            postalCode: pickupAddress.postalCode,
                            country: pickupAddress.country,
                          }
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600 mb-2">
                    No Pickup Address Set
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a pickup address to start selling books
                  </p>
                  <Button
                    onClick={() => startEditing("pickup")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pickup Address
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Shipping Address
              {shippingAddress && (
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Where you want to receive books that are shipped to you
              </p>

              {shippingAddress &&
              editMode !== "shipping" &&
              editMode !== "both" ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <Navigation className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">
                          Current Address
                        </p>
                        <p className="text-sm text-green-800 mt-1">
                          {formatAddress(shippingAddress)}
                        </p>
                        {sameAsPickup && (
                          <Badge className="mt-2 bg-green-100 text-green-800 border-0">
                            Same as pickup address
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {deleteConfirm === "shipping" ? (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-3">
                      <p className="text-sm text-red-800">
                        Are you sure you want to delete this shipping address? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDeleteShippingAddress}
                          variant="destructive"
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(null)}
                          variant="outline"
                          className="flex-1"
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEditing("shipping")}
                        variant="outline"
                        className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm("shipping")}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ) : editMode === "shipping" || editMode === "both" ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="same-as-pickup"
                      checked={sameAsPickup}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsPickup(checked);
                        if (checked && pickupAddress) {
                          // Explicitly set shipping address to match pickup address
                          setShippingAddress({
                            street: pickupAddress.street,
                            city: pickupAddress.city,
                            province: pickupAddress.province,
                            postalCode: pickupAddress.postalCode,
                            country: pickupAddress.country,
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor="same-as-pickup"
                      className="text-sm font-medium"
                    >
                      Use pickup address for shipping
                    </label>
                  </div>

                  {!sameAsPickup && (
                    <ManualAddressInput
                      label="Shipping Address"
                      required
                      onAddressSelect={handleShippingAddressChange}
                      defaultValue={
                        shippingAddress
                          ? {
                              formattedAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}`,
                              street: shippingAddress.street,
                              city: shippingAddress.city,
                              province: shippingAddress.province,
                              postalCode: shippingAddress.postalCode,
                              country: shippingAddress.country,
                            }
                          : undefined
                      }
                    />
                  )}

                  {sameAsPickup && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Your shipping address will be the same as your pickup
                        address.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600 mb-2">
                    No Shipping Address Set
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add a shipping address to receive deliveries
                  </p>
                  <Button
                    onClick={() => startEditing("shipping")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shipping Address
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons for Edit Mode */}
      {editMode !== "none" && (
        <Card className="border-2 border-purple-100">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                onClick={() => setEditMode("none")}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!pickupAddress || !shippingAddress || isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Addresses"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Setup */}
      {!pickupAddress && !shippingAddress && editMode === "none" && (
        <Card className="border-2 border-indigo-100">
          <CardContent className="p-6 text-center">
            <MapPin className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Address Setup
            </h3>
            <p className="text-gray-600 mb-6">
              Set up both addresses at once to get started quickly
            </p>
            <Button
              onClick={() => startEditing("both")}
              className="bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Set Up Both Addresses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernAddressTab;
