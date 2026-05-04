-- Add TravelerType enum
CREATE TYPE "TravelerType" AS ENUM ('ADULT', 'CHILD');

-- Add adultPrice and childPrice to packages (with temporary default from pricePerPax)
ALTER TABLE "packages"
  ADD COLUMN "adultPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "childPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Migrate existing pricePerPax → adultPrice (child gets 70% by default)
UPDATE "packages" SET "adultPrice" = "pricePerPax", "childPrice" = ROUND("pricePerPax" * 0.7, 2);

-- Drop pricePerPax
ALTER TABLE "packages" DROP COLUMN "pricePerPax";

-- Remove the temporary column defaults
ALTER TABLE "packages"
  ALTER COLUMN "adultPrice" DROP DEFAULT,
  ALTER COLUMN "childPrice" DROP DEFAULT;

-- Add travelerType to booking_travelers
ALTER TABLE "booking_travelers"
  ADD COLUMN "travelerType" "TravelerType" NOT NULL DEFAULT 'ADULT';
