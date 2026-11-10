ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_subject" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_subject_unique" UNIQUE("google_subject");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_sign_in_method" CHECK ("users"."password_hash" IS NOT NULL OR "users"."google_subject" IS NOT NULL);