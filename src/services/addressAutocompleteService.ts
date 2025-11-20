import { supabase } from '@/lib/supabase';

export interface AddressSuggestion {
  description: string;
  place_id: string;
}

export interface ParsedAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  province?: string;
  lat?: number;
  lng?: number;
}

/**
 * Get address autocomplete suggestions from the address-autocomplete Edge Function
 */
export async function getAddressSuggestions(input: string): Promise<AddressSuggestion[]> {
  try {
    if (!input || input.trim().length === 0) {
      return [];
    }

    const { data, error } = await supabase.functions.invoke('address-autocomplete', {
      body: {
        input: input.trim(),
      },
    });

    if (error) {
      console.error('Error fetching address suggestions:', error);
      return [];
    }

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
 * Returns the formatted address which needs to be parsed
 */
export async function getAddressDetails(placeId: string): Promise<{
  address: string;
  lat: number;
  lng: number;
} | null> {
  try {
    const { data, error } = await supabase.functions.invoke('address-place-details', {
      body: {
        place_id: placeId,
      },
    });

    if (error) {
      console.error('Error fetching address details:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in getAddressDetails:', err);
    return null;
  }
}

/**
 * Parse a formatted address into its components
 * Expected format: "85 Flamingo Rd, Kikuyu Estate, Midrand, 2090, South Africa"
 * 
 * Mapping:
 * - Street Address: first two parts combined (85 Flamingo Rd, Kikuyu Estate)
 * - City: third part (Midrand)
 * - Postal Code: fourth part (2090)
 * - Country: fifth part (South Africa)
 */
export function parseFormattedAddress(formattedAddress: string): Partial<ParsedAddress> {
  try {
    const parts = formattedAddress.split(',').map(part => part.trim());
    
    if (parts.length < 2) {
      console.warn('Address does not have expected format:', formattedAddress);
      return { country: 'South Africa' };
    }

    const parsed: Partial<ParsedAddress> = {
      country: 'South Africa',
    };

    // Combine first two parts as street address
    if (parts.length >= 2) {
      parsed.street = `${parts[0]}, ${parts[1]}`;
    } else if (parts.length === 1) {
      parsed.street = parts[0];
    }

    // Third part is city
    if (parts.length >= 3) {
      parsed.city = parts[2];
    }

    // Fourth part is postal code
    if (parts.length >= 4) {
      parsed.postalCode = parts[3];
    }

    // Fifth part is country (or use default)
    if (parts.length >= 5) {
      parsed.country = parts[4];
    }

    return parsed;
  } catch (err) {
    console.error('Error parsing address:', err);
    return { country: 'South Africa' };
  }
}

/**
 * Complete flow: get autocomplete suggestions and parse the selected address
 */
export async function selectAddressSuggestion(
  placeId: string,
  lat?: number,
  lng?: number
): Promise<ParsedAddress | null> {
  try {
    const details = await getAddressDetails(placeId);
    
    if (!details) {
      return null;
    }

    const parsed = parseFormattedAddress(details.address);

    return {
      street: parsed.street || '',
      city: parsed.city || '',
      postalCode: parsed.postalCode || '',
      country: parsed.country || 'South Africa',
      lat: lat || details.lat,
      lng: lng || details.lng,
    };
  } catch (err) {
    console.error('Error selecting address suggestion:', err);
    return null;
  }
}
