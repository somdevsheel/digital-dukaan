-- Assumes the baseline migration generated from schema.prisma (creating businesses,
-- addresses, delivery_partners, etc.) has already run. This migration adds the PostGIS
-- geography columns Prisma models as `Unsupported("geography(Point, 4326)")` — see
-- Database Design §4.5 for why this can't be schema-managed by Prisma directly.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- One trigger function, reused across every lat/lng-bearing table via CREATE TRIGGER below,
-- rather than three near-identical functions.
CREATE OR REPLACE FUNCTION sync_geog_from_lat_lng()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS geog geography(Point, 4326);
UPDATE businesses SET geog = ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography;
CREATE TRIGGER trg_businesses_sync_geog
  BEFORE INSERT OR UPDATE OF latitude, longitude ON businesses
  FOR EACH ROW EXECUTE FUNCTION sync_geog_from_lat_lng();
CREATE INDEX IF NOT EXISTS idx_businesses_geog ON businesses USING GIST (geog);

-- addresses
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS geog geography(Point, 4326);
UPDATE addresses SET geog = ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography;
CREATE TRIGGER trg_addresses_sync_geog
  BEFORE INSERT OR UPDATE OF latitude, longitude ON addresses
  FOR EACH ROW EXECUTE FUNCTION sync_geog_from_lat_lng();
CREATE INDEX IF NOT EXISTS idx_addresses_geog ON addresses USING GIST (geog);

-- delivery_partners (current_latitude/current_longitude are nullable — a partner who has
-- never gone online has no position yet, so the trigger only fires once both are set)
ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS geog geography(Point, 4326);
CREATE OR REPLACE FUNCTION sync_delivery_partner_geog()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_latitude IS NOT NULL AND NEW.current_longitude IS NOT NULL THEN
    NEW.geog := ST_SetSRID(ST_MakePoint(NEW.current_longitude::float8, NEW.current_latitude::float8), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_delivery_partners_sync_geog
  BEFORE INSERT OR UPDATE OF current_latitude, current_longitude ON delivery_partners
  FOR EACH ROW EXECUTE FUNCTION sync_delivery_partner_geog();
CREATE INDEX IF NOT EXISTS idx_delivery_partners_geog ON delivery_partners USING GIST (geog);
