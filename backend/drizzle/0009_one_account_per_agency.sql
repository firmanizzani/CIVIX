CREATE UNIQUE INDEX IF NOT EXISTS "users_one_account_per_agency"
ON "users" ("agency_id") WHERE "agency_id" IS NOT NULL;
