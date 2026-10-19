ALTER TABLE "reports" ADD COLUMN "assigned_agency_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "agency_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_assigned_agency_id_agencies_id_fk" FOREIGN KEY ("assigned_agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
