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
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

const decryptAddress = async (params: { table: string; target_id: string; address_type?: string }) => {
  const isMobile = isMobileDevice();

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


    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select(`${encryptedColumn}, address_encryption_version`)
      .eq('id', target_id)
      .maybeSingle();

    if (fetchError) {
      return null;
    }

    if (!record || !record[encryptedColumn]) {
      return null;
    }

    const encryptedData = record[encryptedColumn];

    let bundle;
    try {
      bundle = typeof encryptedData === 'string' ? JSON.parse(encryptedData) : encryptedData;
    } catch (parseError) {
      return null;
    }

    if (!bundle.ciphertext || !bundle.iv || !bundle.authTag) {
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

      if (error) {
        return null;
      }

      if (data?.success && data?.data) {
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  } catch (error) {
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
      return null;
    }

    return data as any;
  } catch (error) {
    return null;
  }
};

export const getSellerDeliveryAddress = async (
  sellerId: string,
): Promise<CheckoutAddress | null> => {
  try {
    if (!sellerId || typeof sellerId !== 'string' || sellerId.length < 10) {
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
    }

    return null;
  } catch (error) {
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

    return null;
  } catch (error) {
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

    return { success: true };
  } catch (error) {
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

    return { success: true };
  } catch (error) {
    throw error;
  }
};
