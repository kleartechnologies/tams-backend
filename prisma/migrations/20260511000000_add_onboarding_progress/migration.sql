ALTER TABLE "users"
  ADD COLUMN "onboardingProgress" JSONB NOT NULL DEFAULT '{}';
