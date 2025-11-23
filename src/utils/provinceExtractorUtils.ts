/**
 * Extract province from a locker address string
 * The address format is typically: "Location Name, street address parts, suburb, city, postal_code, PROVINCE, COUNTRY"
 * The province is the second-last part before the country code (ZA)
 * @param address - The full address string from locker data
 * @returns Province name or null if extraction fails
 */
export function extractProvinceFromLockerAddress(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return null;
  }

  // Split the address by comma and filter out empty parts
  const parts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);

  if (parts.length < 2) {
    return null;
  }

  // The province is typically the second-last part (before the country code "ZA")
  // If the last part is "ZA", return the second-last part
  const lastPart = parts[parts.length - 1];
  if (lastPart === 'ZA' && parts.length >= 3) {
    return parts[parts.length - 2];
  }

  // If there's no explicit "ZA" country code, return the second-last part anyway
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return null;
}

/**
 * Get the province from a locker location data object
 * Tries to extract from either the "address" or "full_address" field
 * @param lockerData - The locker location data object
 * @returns Province name or null if extraction fails
 */
export function getProvinceFromLocker(lockerData: any): string | null {
  if (!lockerData) {
    return null;
  }

  // Try the address field first
  if (lockerData.address) {
    const province = extractProvinceFromLockerAddress(lockerData.address);
    if (province) {
      return province;
    }
  }

  // Try the full_address field as fallback
  if (lockerData.full_address) {
    const province = extractProvinceFromLockerAddress(lockerData.full_address);
    if (province) {
      return province;
    }
  }

  return null;
}
