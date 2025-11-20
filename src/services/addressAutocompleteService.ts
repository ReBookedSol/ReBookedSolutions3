import { ENV } from '@/config/environment';

export interface AddressSuggestion {
  description: string;
  place_id: string;
}

export interface ParsedAddress {
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * Get the Edge Function URL base
 */
function getEdgeFunctionUrl(functionName: string): string {
  return `${ENV.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
}

/**
 * Get authorization headers for Edge Function calls
 */
function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ENV.VITE_SUPABASE_ANON_KEY}`,
  };
}

/**
 * Get address autocomplete suggestions from the address-autocomplete Edge Function
 */
export async function getAddressSuggestions(input: string): Promise<AddressSuggestion[]> {
  try {
    if (!input || input.trim().length === 0) {
      return [];
    }

    const url = new URL(getEdgeFunctionUrl('address-autocomplete'));
    url.searchParams.set('input', input.trim());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      console.error('Error fetching address suggestions:', response.statusText);
      return [];
    }

    const data = await response.json();

    if (!data || !data.suggestions) {
      return [];
    }

    return data.suggestions;
  } catch (err) {
    console.error('Error in getAddressSuggestions:', err);
    return [];
  }
}

/**
 * Get full address details from place_id
 * Returns structured address components ready for form auto-fill
 */
export async function getAddressDetails(placeId: string): Promise<ParsedAddress | null> {
  try {
    const url = new URL(getEdgeFunctionUrl('address-place-details'));
    url.searchParams.set('place_id', placeId);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      console.error('Error fetching address details:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error('Address details error:', data.error);
      return null;
    }

    // Parse the response and ensure all required fields are present
    const parsed: ParsedAddress = {
      street_address: data.street_address || '',
      city: data.city || '',
      province: data.province || '',
      postal_code: data.postal_code || '',
      country: data.country || 'South Africa',
      lat: data.lat || 0,
      lng: data.lng || 0,
    };

    return parsed;
  } catch (err) {
    console.error('Error in getAddressDetails:', err);
    return null;
  }
}

/**
 * Complete flow: select an address and get its parsed details
 */
export async function selectAddressSuggestion(placeId: string): Promise<ParsedAddress | null> {
  try {
    return await getAddressDetails(placeId);
  } catch (err) {
    console.error('Error selecting address suggestion:', err);
    return null;
  }
}
