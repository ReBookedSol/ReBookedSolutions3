-- Add locker preference columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_pickup_locker_location_id integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_pickup_locker_provider_slug text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_delivery_locker_location_id integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_delivery_locker_provider_slug text;

-- Add comments for clarity
COMMENT ON COLUMN profiles.preferred_pickup_locker_location_id IS 'BobGo locker location ID where seller prefers to drop off parcels';
COMMENT ON COLUMN profiles.preferred_pickup_locker_provider_slug IS 'BobGo provider slug for preferred pickup locker';
COMMENT ON COLUMN profiles.preferred_delivery_locker_location_id IS 'BobGo locker location ID where buyer prefers to receive parcels';
COMMENT ON COLUMN profiles.preferred_delivery_locker_provider_slug IS 'BobGo provider slug for preferred delivery locker';
