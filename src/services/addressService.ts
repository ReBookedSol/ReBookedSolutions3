import { supabase } from "@/integrations/supabase/client";
import { updateAddressValidation } from "./addressValidationService";
import { safeLogError } from "@/utils/errorHandling";
import { safeLogError as safelog, formatSupabaseError } from "@/utils/safeErrorLogger";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";

interface Address {
  complex?: string;
  unitNumber?: string;
  streetAddress?: string;
  suburb?: string;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Encrypt an address using the encrypt-address edge function
const encryptAddress = async (address: Address, options?: { save?: { table: string; target_id: string; address_type: string } }) => {
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-address', {
      body: {
        object: address,
        ...options
      }
    });

    if (error) {
      return null; // Return null instead of throwing error
    }

    return data;
  } catch (error) {
    return null; // Return null for graceful fallback
  }
};

// Decrypt an address using the improved decrypt-address edge function
const decryptAddress = async (params: { table: 'profiles' | 'orders' | 'books'; target_id: string; address_type?: 'pickup' | 'shipping' | 'delivery' }) => {
  try {
    // Use the new fetch format to target exact encrypted columns
    const { data, error } = await supabase.functions.invoke('decrypt-address', {
      body: {
        fetch: {
          table: params.table,
          target_id: params.target_id,
          address_type: params.address_type || 'pickup',
        },
      },
    });

    if (error) {
      return null;
    }

    if (data?.success) {
      return data.data || null;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

export const saveUserAddresses = async (
  userId: string,
  pickupAddress: Address,
  shippingAddress: Address,
  addressesSame: boolean,
) => {
  try {
    // First validate addresses (keep existing validation)
    const result = await updateAddressValidation(
      userId,
      pickupAddress,
      shippingAddress,
      addressesSame,
    );

    let encryptionResults = {
      pickup: false,
      shipping: false
    };

    // Try to encrypt and save pickup address
    try {
      const pickupResult = await encryptAddress(pickupAddress, {
        save: {
          table: 'profiles',
          target_id: userId,
          address_type: 'pickup'
        }
      });

      if (pickupResult && pickupResult.success) {
        encryptionResults.pickup = true;
      }
    } catch (encryptError) {
      // Encryption error
    }

    // Try to encrypt and save shipping address (if different)
    if (!addressesSame) {
      try {
        const shippingResult = await encryptAddress(shippingAddress, {
          save: {
            table: 'profiles',
            target_id: userId,
            address_type: 'shipping'
          }
        });

        if (shippingResult && shippingResult.success) {
          encryptionResults.shipping = true;
        }
      } catch (encryptError) {
        // Encryption error
      }
    } else {
      // If addresses are the same, mark shipping encryption as successful if pickup succeeded
      encryptionResults.shipping = encryptionResults.pickup;
    }

    // Only update encryption status and addresses_same flag - no plaintext storage
    const updateData: any = {
      addresses_same: addressesSame,
    };

    // Check encryption results and fail if encryption didn't work
    if (!encryptionResults.pickup) {
      updateData.encryption_status = 'failed';
      throw new Error("Failed to encrypt pickup address. Please try again.");
    } else if (!addressesSame && !encryptionResults.shipping) {
      updateData.encryption_status = 'failed';
      throw new Error("Failed to encrypt shipping address. Please try again.");
    } else {
      updateData.encryption_status = 'encrypted';
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      safeLogError("Error updating profile metadata", error);
      throw error;
    }

    return {
      pickup_address: pickupAddress,
      shipping_address: addressesSame ? pickupAddress : shippingAddress,
      addresses_same: addressesSame,
      canListBooks: result.canListBooks,
      encryption_status: {
        pickup: encryptionResults.pickup,
        shipping: encryptionResults.shipping
      }
    };
  } catch (error) {
    safeLogError("Error saving addresses", error);
    throw error;
  }
};

export const getSellerPickupAddress = async (sellerId: string) => {
  try {
    // First get the book ID for this seller to use for decryption
    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .select("id, pickup_address_encrypted")
      .eq("seller_id", sellerId)
      .limit(1)
      .maybeSingle();

    if (bookError) {
      return null;
    }

    if (!bookData) {
      return null;
    }

    if (!bookData.pickup_address_encrypted) {
      return null;
    }

    // Use the decrypt-address edge function to decrypt the data from books table
    const decryptedAddress = await decryptAddress({
      table: 'books',
      target_id: bookData.id,
      address_type: 'pickup'
    });

    if (decryptedAddress) {
      return decryptedAddress;
    }

    return null;
  } catch (error) {
    // Handle network errors
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network connection error while fetching seller address.",
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to get seller pickup address: ${errorMessage}`);
  }
};

export const getUserAddresses = async (userId: string) => {
  try {
    const mapToAddress = (raw: any) => {
      if (!raw) return null;
      return {
        // normalize common variants
        street: raw.street ?? raw.streetAddress ?? raw.line1 ?? "",
        city: raw.city ?? "",
        province: raw.province ?? raw.state ?? "",
        postalCode: raw.postalCode ?? raw.postal_code ?? raw.zip ?? "",
        country: raw.country ?? "South Africa",
        streetAddress: raw.streetAddress ?? raw.street ?? undefined,
        instructions: raw.instructions ?? raw.additional_info ?? undefined,
        additional_info: raw.additional_info ?? undefined,
      } as any;
    };

    // Decrypt pickup address directly via edge function
    let pickupAddress: any = null;
    let shippingAddress: any = null;

    try {
      const pickup = await decryptAddress({
        table: 'profiles',
        target_id: userId,
        address_type: 'pickup'
      });
      pickupAddress = mapToAddress(pickup);
    } catch (error) {
      // Failed to get pickup address
    }

    // For shipping address, try the decrypt function directly
    try {
      const shipping = await decryptAddress({
        table: 'profiles',
        target_id: userId,
        address_type: 'shipping'
      });
      shippingAddress = mapToAddress(shipping);
    } catch (error) {
      // Failed to get shipping address
    }

    // No plaintext fallback allowed

    if (pickupAddress || shippingAddress) {
      // Get addresses_same flag from profile metadata
      const { data: profileData } = await supabase
        .from("profiles")
        .select("addresses_same")
        .eq("id", userId)
        .single();

      const addressesSame = profileData?.addresses_same ?? (
        pickupAddress && shippingAddress ?
          JSON.stringify(pickupAddress) === JSON.stringify(shippingAddress) :
          !shippingAddress
      );

      return {
        pickup_address: pickupAddress,
        shipping_address: shippingAddress || pickupAddress,
        addresses_same: addressesSame,
      };
    }

    return null;
  } catch (error) {
    safelog("Error in getUserAddresses", error, {
      userId,
    });

    if (
      error instanceof TypeError &&
      (error as any).message?.includes("Failed to fetch")
    ) {
      throw new Error(
        "Network connection error. Please check your internet connection and try again.",
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to load addresses: ${errorMessage}`);
  }
};

// Update all user's book listings with new pickup address and province
export const updateBooksPickupAddress = async (
  userId: string,
  newPickupAddress: any,
): Promise<{ success: boolean; updatedCount: number; error?: string }> => {
  try {
    // Extract province from the new pickup address
    let province = null;
    if (newPickupAddress?.province) {
      province = newPickupAddress.province;
    } else if (typeof newPickupAddress === "string") {
      // Fallback for string-based addresses
      const addressStr = newPickupAddress.toLowerCase();
      if (addressStr.includes("western cape")) province = "Western Cape";
      else if (addressStr.includes("gauteng")) province = "Gauteng";
      else if (addressStr.includes("kwazulu")) province = "KwaZulu-Natal";
      else if (addressStr.includes("eastern cape")) province = "Eastern Cape";
      else if (addressStr.includes("free state")) province = "Free State";
      else if (addressStr.includes("limpopo")) province = "Limpopo";
      else if (addressStr.includes("mpumalanga")) province = "Mpumalanga";
      else if (addressStr.includes("northern cape")) province = "Northern Cape";
      else if (addressStr.includes("north west")) province = "North West";
    }

    // Get all user's books
    const { data: books, error: fetchError } = await supabase
      .from("books")
      .select("id")
      .eq("seller_id", userId);

    if (fetchError) {
      return {
        success: false,
        updatedCount: 0,
        error: fetchError.message || "Failed to fetch book listings",
      };
    }

    if (!books || books.length === 0) {
      return {
        success: true,
        updatedCount: 0,
      };
    }

    // Encrypt address for each book
    const encryptPromises = books.map(book => 
      encryptAddress(newPickupAddress, {
        save: {
          table: 'books',
          target_id: book.id,
          address_type: 'pickup'
        }
      })
    );

    await Promise.all(encryptPromises);

    // Update only province metadata - addresses are encrypted only
    const updateData: any = {};
    if (province) {
      updateData.province = province;
    }

    // Only update if we have something to update
    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        updatedCount: books.length,
      };
    }

    const { data, error } = await supabase
      .from("books")
      .update(updateData)
      .eq("seller_id", userId)
      .select("id");

    if (error) {
      return {
        success: false,
        updatedCount: 0,
        error: error.message || "Failed to update book listings",
      };
    }

    const updatedCount = data?.length || 0;

    return {
      success: true,
      updatedCount,
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Get encrypted book pickup address for shipping calculations
export const getBookPickupAddress = async (bookId: string) => {
  try {
    // Get encrypted address only - no plaintext fallback
    const decryptedAddress = await decryptAddress({
      table: 'books',
      target_id: bookId,
      address_type: 'pickup'
    });

    if (decryptedAddress) {
      return decryptedAddress;
    }

    return null;
  } catch (error) {
    throw error;
  }
};

// Get encrypted order shipping address for delivery
export const getOrderShippingAddress = async (orderId: string) => {
  try {
    // Get encrypted address only - no plaintext fallback
    const decryptedAddress = await decryptAddress({
      table: 'orders',
      target_id: orderId,
      address_type: 'shipping'
    });

    if (decryptedAddress) {
      return decryptedAddress;
    }

    return null;
  } catch (error) {
    throw error;
  }
};
