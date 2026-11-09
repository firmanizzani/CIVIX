-- Match installations that use UUIDs as well as those that use text report IDs.
DO $$
DECLARE
  report_id_type text;
BEGIN
  SELECT format_type(atttypid, atttypmod) INTO STRICT report_id_type
  FROM pg_attribute
  WHERE attrelid = 'public.reports'::regclass AND attname = 'id' AND NOT attisdropped;

  EXECUTE format(
    'CREATE TABLE public.report_evidence_checks (
      report_id %s PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
      photos jsonb NOT NULL,
      nearby jsonb NOT NULL
    )', report_id_type
  );
END $$;
--> statement-breakpoint
ALTER TABLE public.report_evidence_checks ENABLE ROW LEVEL SECURITY;
