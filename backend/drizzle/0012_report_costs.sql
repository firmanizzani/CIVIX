CREATE TABLE IF NOT EXISTS "report_cost_revisions" (
	"id" varchar(40) PRIMARY KEY DEFAULT 'rcost_' || replace(gen_random_uuid()::text, '-', '') NOT NULL,
	"report_id" varchar(40) NOT NULL,
	"amount" numeric(15, 0) NOT NULL,
	"funding_source" varchar(20) NOT NULL,
	"funding_note" varchar(200),
	"breakdown" text NOT NULL,
	"reason" text NOT NULL,
	"recorded_by" varchar(40),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_costs" (
	"report_id" varchar(40) PRIMARY KEY NOT NULL,
	"amount" numeric(15, 0) NOT NULL,
	"funding_source" varchar(20) NOT NULL,
	"funding_note" varchar(200),
	"breakdown" text NOT NULL,
	"agency_id" varchar(40) NOT NULL,
	"recorded_by" varchar(40),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_costs_amount_range" CHECK ("report_costs"."amount" >= 0 AND "report_costs"."amount" <= 999999999999999),
	CONSTRAINT "report_costs_funding_source" CHECK ("report_costs"."funding_source" IN ('apbd', 'other')),
	CONSTRAINT "report_costs_funding_note" CHECK ("report_costs"."funding_source" != 'other' OR length(trim("report_costs"."funding_note")) > 0 AND "report_costs"."funding_note" IS NOT NULL),
	CONSTRAINT "report_costs_breakdown" CHECK (length(trim("report_costs"."breakdown")) BETWEEN 5 AND 2000)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_cost_revisions" ADD CONSTRAINT "report_cost_revisions_report_id_report_costs_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."report_costs"("report_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_cost_revisions" ADD CONSTRAINT "report_cost_revisions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_costs" ADD CONSTRAINT "report_costs_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_costs" ADD CONSTRAINT "report_costs_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_costs" ADD CONSTRAINT "report_costs_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cost_revisions_report_time" ON "report_cost_revisions" USING btree ("report_id","recorded_at");
--> statement-breakpoint
ALTER TABLE "report_costs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "report_cost_revisions" ENABLE ROW LEVEL SECURITY;
