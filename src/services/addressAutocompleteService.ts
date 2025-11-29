import { supabase } from "@/integrations/supabase/client";
import { ENV } from "@/config/environment";

export interface Suggestion {
  description: string;
  place_id: string;
}

export interface AddressDetails {
  formatted_address: string;
  lat: number;
  lng: number;
  street_number: string;
  route: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

export interface PickupPoint {
  name: string;
  distance: string;
  address: string;
}

/**
 * Fetch address suggestions from the autocomplete Edge Function
 * Uses correct endpoint: /autocomplete (not /address-autocomplete)
 */
export const fetchSuggestions = async (searchInput: string): Promise<Suggestion[]> => {
  if (!searchInput.trim()) {
    return [];
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${ENV.VITE_SUPABASE_URL}/functions/v1/autocomplete?input=${encodeURIComponent(searchInput)}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ENV.VITE_SUPABASE_ANON_KEY}`,
          'apikey': ENV.VITE_SUPABASE_ANON_KEY,
        },
      }
    );

    const result = await response.json();

    if (result.error) {
      return [];
    }

    return result.suggestions || [];
  } catch (error) {
    return [];
  }
};

/**
 * Fetch parsed address details from place_id
 * Uses correct endpoint: /autocomplete-details (not /address-place-details)
 * Returns all parsed address components ready for auto-fill
 */
export const fetchAddressDetails = async (placeId: string): Promise<AddressDetails | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${ENV.VITE_SUPABASE_URL}/functions/v1/autocomplete-details?place_id=${encodeURIComponent(placeId)}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ENV.VITE_SUPABASE_ANON_KEY}`,
          'apikey': ENV.VITE_SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const details: AddressDetails = await response.json();

    if (!details.formatted_address) {
      return null;
    }

    return details;
  } catch (error) {
    return null;
  }
};

/**
 * Fetch nearby pickup points from Bob Go API
 */
export const fetchPickupPoints = async (lat: number, lng: number): Promise<PickupPoint[]> => {
  try {
    // Mock pickup points for now - replace with actual Bob Go API call
    const mockPickupPoints: PickupPoint[] = [
      {
        name: "Pep Stores - Menlyn",
        distance: "1.2 km",
        address: "Shop 123, Menlyn Park Shopping Centre, Pretoria"
      },
      {
        name: "Pep Stores - Brooklyn",
        distance: "2.5 km",
        address: "Shop 45, Brooklyn Mall, Pretoria"
      },
      {
        name: "Pep Stores - Centurion",
        distance: "5.8 km",
        address: "Shop 67, Centurion Mall, Centurion"
      }
    ];

    return mockPickupPoints;
  } catch (error) {
    return [];
  }
};
