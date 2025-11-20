import { supabase } from "@/integrations/supabase/client";
import { ENV } from "@/config/environment";

export interface Suggestion {
  description: string;
  place_id: string;
}

export interface LocationDetails {
  address: string;
  lat: number;
  lng: number;
}

export interface PickupPoint {
  name: string;
  distance: string;
  address: string;
}

/**
 * Fetch address suggestions from the autocomplete Edge Function
 */
export const fetchSuggestions = async (searchInput: string): Promise<Suggestion[]> => {
  if (!searchInput.trim()) {
    return [];
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${ENV.VITE_SUPABASE_URL}/functions/v1/address-autocomplete?input=${encodeURIComponent(searchInput)}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ENV.VITE_SUPABASE_ANON_KEY}`,
          'apikey': ENV.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.error) {
      console.error('Error fetching suggestions:', result.error);
      return [];
    }

    return result.suggestions || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

/**
 * Fetch address details from place_id
 */
export const fetchAddressDetails = async (placeId: string): Promise<LocationDetails | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${ENV.VITE_SUPABASE_URL}/functions/v1/address-place-details?place_id=${encodeURIComponent(placeId)}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ENV.VITE_SUPABASE_ANON_KEY}`,
          'apikey': ENV.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const details: LocationDetails = await response.json();

    if (!details.address) {
      console.error('Failed to get address details');
      return null;
    }

    return details;
  } catch (error) {
    console.error('Error fetching address details:', error);
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
    console.error('Error fetching pickup points:', error);
    return [];
  }
};
