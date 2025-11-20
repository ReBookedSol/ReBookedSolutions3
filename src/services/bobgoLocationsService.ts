import { ENV } from "@/config/environment";

export interface BobGoLocation {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  hours?: string;
  phone?: string;
  [key: string]: any;
}

/**
 * Calculate bounding box from a center point
 * radiusKm: radius in kilometers (default 5km)
 */
function calculateBoundingBox(lat: number, lng: number, radiusKm: number = 5) {
  const latOffset = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lngOffset = radiusKm / (111 * Math.cos((lat * Math.PI) / 180)); // Adjust for latitude

  return {
    min_lat: lat - latOffset,
    max_lat: lat + latOffset,
    min_lng: lng - lngOffset,
    max_lng: lng + lngOffset,
  };
}

/**
 * Fetch nearby BobGo locations based on coordinates
 */
export async function getBobGoLocations(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<BobGoLocation[]> {
  try {
    const bounds = calculateBoundingBox(latitude, longitude, radiusKm);

    const params = new URLSearchParams();
    params.append("min_lat", bounds.min_lat.toString());
    params.append("max_lat", bounds.max_lat.toString());
    params.append("min_lng", bounds.min_lng.toString());
    params.append("max_lng", bounds.max_lng.toString());

    const response = await fetch(
      `${ENV.VITE_SUPABASE_URL}/functions/v1/bobgo-get-locations?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${ENV.VITE_SUPABASE_ANON_KEY}`,
          'apikey': ENV.VITE_SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch BobGo locations:", response.statusText);
      return [];
    }

    const data = await response.json();
    
    // The response structure depends on BobGo API, but typically:
    // { success: true, data: [...locations...] }
    // or { locations: [...] }
    const locations = data.data || data.locations || [];
    
    return Array.isArray(locations) ? locations : [];
  } catch (error) {
    console.error("Error fetching BobGo locations:", error);
    return [];
  }
}
