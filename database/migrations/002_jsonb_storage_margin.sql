-- The API enforces 2 MiB of compact UTF-8 JSON. PostgreSQL's JSONB text adds
-- formatting spaces, so leave storage headroom without raising the API limit.
ALTER TABLE public.arena_backups DROP CONSTRAINT IF EXISTS arena_backup_size;
ALTER TABLE public.arena_backups ADD CONSTRAINT arena_backup_size CHECK (octet_length(payload::text) <= 4194304);
