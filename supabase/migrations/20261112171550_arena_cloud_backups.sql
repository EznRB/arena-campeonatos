create table public.arena_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '[]'::jsonb,
  schema_version integer not null default 1 check (schema_version = 1),
  updated_at timestamptz not null default now(),
  constraint arena_backup_is_array check (jsonb_typeof(payload) = 'array'),
  constraint arena_backup_max_size check (octet_length(payload::text) <= 2097152)
);

alter table public.arena_backups enable row level security;
revoke all on public.arena_backups from anon, authenticated;
grant select, insert, update on public.arena_backups to authenticated;

create policy arena_backups_select_own on public.arena_backups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy arena_backups_insert_own on public.arena_backups
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy arena_backups_update_own on public.arena_backups
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.arena_backup_timestamp() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger arena_backup_updated_at before insert or update
  on public.arena_backups for each row execute function public.arena_backup_timestamp();

comment on table public.arena_backups is 'Snapshot manual por conta Arena; acesso isolado por RLS, sem acesso anon.';
