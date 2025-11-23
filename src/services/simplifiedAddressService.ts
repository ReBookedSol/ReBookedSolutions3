import { supabase } from "@/integrations/supabase/client";
import { CheckoutAddress } from "@/types/checkout";
import { getProvinceFromLocker } from "@/utils/provinceExtractorUtils";

interface SimpleAddress {
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
}

const isMobileDevice = () => {
  return typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
};

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes('404') || errorMsg.includes('Not Found') ||
          errorMsg.includes('401') || errorMsg.includes('403')) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

const decryptAddress = async (params: { table: string; target_id: string; address_type?: string }) => {
  const isMobile = isMobileDevice();
  console.log(`🔐 Fetching encrypted data for decryption (${isMobile ? 'MOBILE' : 'DESKTOP'}) with params:`, params);

  try {
    const { table, target_id, address_type } = params;
    let encryptedColumn: string;

    switch (address_type || 'pickup') {
      case 'pickup':
        encryptedColumn = 'pickup_address_encrypted';
        break;
      case 'shipping':
        encryptedColumn = 'shipping_address_encrypted';
        break;
      case 'delivery':
        encryptedColumn = 'delivery_address_encrypted';
        break;
      default:
        throw new Error('Invalid address_type');
    }

    console.log(`🔍 Fetching encrypted data from ${table}.${encryptedColumn} for ID: ${target_id}`);

    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select(`${encryptedColumn}, address_encryption_version`)
      .eq('id', target_id)
      .maybeSingle();

    if (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : JSON.stringify(fetchError);
      console.error("❌ Error fetching encrypted data:", errorMsg);
      return null;
    }

    if (!record || !record[encryptedColumn]) {
      console.log("❌ No encrypted data found");
      return null;
    }

    const encryptedData = record[encryptedColumn];
    console.log("✅ Found encrypted data, preparing to decrypt...");

    let bundle;
    try {
      bundle = typeof encryptedData === 'string' ? JSON.parse(encryptedData) : encryptedData;
    } catch (parseError) {
      console.error("❌ Invalid encrypted data format:", parseError);
      return null;
    }

    if (!bundle.ciphertext || !bundle.iv || !bundle.authTag) {
      console.error("❌ Encrypted bundle missing required fields:", Object.keys(bundle));
      return null;
    }

    const makeRequest = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isMobile ? 15000 : 10000);

      try {
        const requestBody = {
          encryptedData: bundle.ciphertext,
          iv: bundle.iv,
          authTag: bundle.authTag,
          aad: bundle.aad,
          version: bundle.version || record.address_encryption_version || 1
        };

        console.log("🔍 Sending encrypted data to edge function:", {
          ...requestBody,
          encryptedData: `${requestBody.encryptedData.substring(0, 20)}...`,
          iv: `${requestBody.iv.substring(0, 12)}...`,
          authTag: `${requestBody.authTag.substring(0, 12)}...`
        });

        const { data, error } = await supabase.functions.invoke('decrypt-address', {
          body: requestBody,
          headers: {
            'Content-Type': 'application/json',
            ...(isMobile && { 'X-Mobile-Request': 'true' })
          }
        });

        clearTimeout(timeoutId);
        return { data, error } as const;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    try {
      const { data, error } = await (isMobile ? retryWithBackoff(makeRequest, 3, 1000) : makeRequest());

      console.log("🔐 Edge function response:", {
        data: data ? { success: data.success, hasData: !!data.data } : null,
        error: error ? { message: (error as any).message, status: (error as any).status } : null
      });

      if (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        console.warn("❌ Decryption error:", errorMsg);
        return null;
      }

      if (data?.success && data?.data) {
        console.log("✅ Decryption successful");
        return data.data;
      } else {
        console.warn("❌ Decryption failed:", data?.error?.message || "Unknown error");
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`🔐 Decryption service error on ${isMobile ? 'mobile' : 'desktop'}:`, errorMsg);
      return null;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(`🔐 Decryption service error on ${isMobile ? 'mobile' : 'desktop'}:`, errorMsg);
    return null;
  }
};

const encryptAddress = async (address: SimpleAddress, options?: { save?: { table: string; target_id: string; address_type: string } }) => {
  try {
    const { data, error } = await supabase.functions.invoke('encrypt-address', {
      body: {
        object: address,
        ...options
      }
    });

    if (error) {
      console.warn("Encryption not available:", (error as any).message);
      return null;
    }

    return data as any;
  } catch (error) {
    console.warn("Encryption service unavailable:", error instanceof Error ? error.message : String(error));
    return null;
  }
};

export const getSellerDeliveryAddress = async (
  sellerId: string,
): Promise<CheckoutAddress | null> => {
  try {
    console.log("🔍 getSellerDeliveryAddress called for seller:", sellerId);

    if (!sellerId || typeof sellerId !== 'string' || sellerId.length < 10) {
      console.error("❌ Invalid seller ID provided:", sellerId);
      return null;
    }

    const decryptedAddress = await decryptAddress({
      table: 'profiles',
      target_id: sellerId,
      address_type: 'pickup'
    });

    if (decryptedAddress) {
      const address = {
        street: decryptedAddress.streetAddress || decryptedAddress.street || "",
        city: decryptedAddress.city || "",
        province: decryptedAddress.province || "",
        postal_code: decryptedAddress.postalCode || decryptedAddress.postal_code || "",
        country: "South Africa",
      };
      return address;
    }

    console.log("❌ No encrypted address found for seller, attempting alternative encrypted source (books)...");

    try {
      const { getSellerPickupAddress } = await import("@/services/addressService");
      const fallbackAddress = await getSellerPickupAddress(sellerId);
      if (fallbackAddress) {
        const mappedAddress = {
          street: fallbackAddress.streetAddress || fallbackAddress.street || fallbackAddress.line1 || "",
          city: fallbackAddress.city || "",
          province: fallbackAddress.province || fallbackAddress.state || "",
          postal_code: fallbackAddress.postalCode || fallbackAddress.postal_code || fallbackAddress.zip || "",
          country: "South Africa",
        };
        if (mappedAddress.street && mappedAddress.city && mappedAddress.province && mappedAddress.postal_code) {
          return mappedAddress;
        }
      }
    } catch (fallbackError) {
      console.error("❌ Alternative encrypted address source failed:", fallbackError);
    }

    console.log("❌ No physical address found for seller");
    return null;
  } catch (error) {
    console.error("❌ Error getting seller address:", error);
    return null;
  }
};

export const getSimpleUserAddresses = async (userId: string) => {
  try {
    const [decryptedPickup, decryptedShipping] = await Promise.all([
      decryptAddress({ table: 'profiles', target_id: userId, address_type: 'pickup' }),
      decryptAddress({ table: 'profiles', target_id: userId, address_type: 'shipping' })
    ]);

    if (decryptedPickup || decryptedShipping) {
      return {
        pickup_address: decryptedPickup,
        shipping_address: decryptedShipping || decryptedPickup,
      };
    }

    console.log("❌ No encrypted addresses found for user");
    return null;
  } catch (error) {
    console.error("Error getting addresses:", error);
    return null;
  }
};

export const saveSimpleUserAddresses = async (
  userId: string,
  pickupAddress: SimpleAddress,
  shippingAddress: SimpleAddress,
  addressesAreSame: boolean = false,
) => {
  try {
    let pickupEncrypted = false;
    let shippingEncrypted = false;

    if (pickupAddress) {
      try {
        const result = await encryptAddress(pickupAddress, {
          save: { table: 'profiles', target_id: userId, address_type: 'pickup' }
        });
        if (result && (result as any).success) {
          pickupEncrypted = true;
        }
      } catch (encryptError) {
        console.error("❌ Pickup address encryption failed:", encryptError);
      }
    }

    if (shippingAddress && !addressesAreSame) {
      try {
        const result = await encryptAddress(shippingAddress, {
          save: { table: 'profiles', target_id: userId, address_type: 'shipping' }
        });
        if (result && (result as any).success) {
          shippingEncrypted = true;
        }
      } catch (encryptError) {
        console.error("❌ Shipping address encryption failed:", encryptError);
      }
    } else {
      shippingEncrypted = pickupEncrypted;
    }

    if (pickupAddress && !pickupEncrypted) {
      throw new Error("Failed to encrypt pickup address. Address not saved for security reasons.");
    }
    if (shippingAddress && !addressesAreSame && !shippingEncrypted) {
      throw new Error("Failed to encrypt shipping address. Address not saved for security reasons.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        addresses_same: addressesAreSame,
        encryption_status: 'encrypted'
      })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    console.log("✅ Addresses encrypted and saved successfully");
    return { success: true };
  } catch (error) {
    console.error("Error saving addresses:", error);
    throw error;
  }
};

export const saveOrderShippingAddress = async (
  orderId: string,
  shippingAddress: SimpleAddress
) => {
  try {
    const result = await encryptAddress(shippingAddress, {
      save: { table: 'orders', target_id: orderId, address_type: 'shipping' }
    });

    if (!result || !(result as any).success) {
      throw new Error("Failed to encrypt shipping address for order");
    }

    console.log("✅ Order shipping address encrypted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error saving order shipping address:", error);
    throw error;
  }
};
