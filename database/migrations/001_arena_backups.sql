CREATE TABLE IF NOT EXISTS public.arena_backups (
  user_id text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT arena_backup_array CHECK (jsonb_typeof(payload) = 'array'),
  CONSTRAINT arena_backup_size CHECK (octet_length(payload::text) <= 2097152)
);
ALTER TABLE public.arena_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.arena_backups FROM PUBLIC;
COMMENT ON TABLE public.arena_backups IS 'Server-only access. Every operation is scoped to the user verified by Neon Auth; no Data API exposure.';
