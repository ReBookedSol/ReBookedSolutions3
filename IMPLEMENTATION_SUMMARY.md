# Implementation Summary: Rate Calculation and Province Display

## Overview
Updated the application to:
1. Use seller's preferred_delivery_locker address as a fallback when calculating shipment rates
2. Display seller's province on book cards, using locker province as fallback if physical address is missing

## Changes Made

### 1. Created Province Extraction Utility
**File**: `src/utils/provinceExtractorUtils.ts`

New utility functions to extract province from locker address data:
- `extractProvinceFromLockerAddress(address: string)`: Extracts province from a comma-separated address string
  - The province is typically the second-last part of the address (before the country code "ZA")
  - Example: "Location, street, suburb, city, postal_code, **PROVINCE**, ZA"
  
- `getProvinceFromLocker(lockerData: any)`: Wrapper to extract province from locker object
  - Tries both `address` and `full_address` fields
  - Returns null if extraction fails

### 2. Updated Book Fetching Service
**File**: `src/services/book/bookQueries.ts`

Updated profile fetches to include locker data:
- Modified profile queries to select `preferred_delivery_locker_data` and `pickup_address_encrypted`
- Updated in three locations:
  1. `getBooks()` - for listing all books
  2. `getBookById()` - for single book detail
  3. `getUserBooksWithFallback()` - for user's own books

Profile data is now passed to the book mapper with locker information.

### 3. Updated Book Types
**File**: `src/services/book/bookTypes.ts`

Extended `ProfileData` interface to include:
- `preferred_delivery_locker_data?: any` - Contains the seller's saved locker information
- `has_pickup_address?: boolean` - Flag indicating if seller has encrypted address

### 4. Updated Book Mapper
**File**: `src/services/book/bookMapper.ts`

Enhanced province determination logic:
- First, uses the book's stored `province` field (from seller's address)
- If not available, extracts province from seller's `preferred_delivery_locker_data`
- Falls back to null if neither source provides a province

This ensures book cards display province information even when sellers only have a locker address configured.

### 5. Updated Address Service
**File**: `src/services/simplifiedAddressService.ts`

Enhanced `getSellerDeliveryAddress()` function:
- Already had fallback logic to use seller's preferred locker when physical address is missing
- Updated to use the new utility function to extract province from locker address
- This ensures rate calculations use the correct province for locker-based origins

### 6. Updated Checkout Flow
**File**: `src/components/checkout/CheckoutFlow.tsx`

Enhanced buyer's locker delivery address handling:
- Added import for province extraction utility
- Updated delivery address extraction to use utility function when getting province from buyer's locker
- Ensures buyer's locker province is correctly extracted for display in order summary

## How It Works

### Rate Calculation Flow
1. When initiating checkout, `CheckoutFlow` calls `getSellerDeliveryAddress(sellerId)`
2. This function attempts to retrieve seller's physical address (encrypted)
3. If physical address is missing, it falls back to seller's `preferred_delivery_locker_data`
4. The locker address is converted to a standard `CheckoutAddress` format with extracted province
5. This address is passed to `Step2DeliveryOptions` which uses it to calculate shipping rates
6. The `getAllDeliveryQuotes()` service receives the complete address (whether from physical address or locker)
7. BobGo rates are calculated using the correct origin and destination

**Formula** (implicit in the code):
```
origin = seller.address ?? seller.preferred_locker.address
destination = buyer.address OR buyer.chosen_locker.address
```

### Province Display on Book Cards
1. When fetching books, the mapper retrieves seller profile data including locker information
2. For each book, the mapper determines the province:
   - Uses book's stored `province` (from seller's address when book was created)
   - Falls back to extracted province from seller's `preferred_delivery_locker_data`
3. Book cards display the determined province with a map pin icon

**Formula** (in `bookMapper.ts`):
```typescript
province = book.province ?? extractProvinceFromLocker(seller.preferred_delivery_locker_data)
```

## Testing Recommendations

### Test Case 1: Rate Calculation with Seller's Physical Address
1. Create a book listing with a seller who has a physical address
2. Go through checkout and select delivery options
3. Verify shipping rates are calculated correctly

### Test Case 2: Rate Calculation with Seller's Locker Only
1. Create a book listing with a seller who:
   - Does NOT have a physical address
   - HAS a preferred_delivery_locker saved (set in profile settings)
2. Go through checkout and select delivery options
3. Verify shipping rates are calculated (origin should be locker address)
4. Check that the province is correctly extracted from the locker address
5. Verify locker-to-door and locker-to-locker rates are correctly calculated

### Test Case 3: Province Display on Book Listing
1. List books from sellers with physical addresses
2. Verify province is displayed on book cards
3. List books from sellers with only locker addresses
4. Verify province is still displayed (extracted from locker)
5. Filter books by province and verify filtering works correctly

### Test Case 4: Checkout with Buyer's Locker Delivery
1. During checkout, select a buyer's locker for delivery
2. Verify the locker's province is correctly extracted
3. Verify rates are recalculated correctly for locker delivery
4. Verify the province is displayed in the order summary

### Test Case 5: Edge Cases
1. Test with incomplete locker data (missing address fields)
2. Test with malformed address strings
3. Test with sellers who have neither address nor locker
4. Verify error handling and fallback behavior

## Notes

- The province extraction utility handles South African address format (assumes "ZA" as last component)
- The implementation is transparent to existing code - existing validations and error handling remain intact
- The `getSellerDeliveryAddress()` function already had locker fallback; we just improved province extraction
- Book mapper gracefully handles missing locker data - province is just null if not available
