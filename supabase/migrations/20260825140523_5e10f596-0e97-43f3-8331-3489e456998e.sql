-- Backups de administración: códigos de confirmación e historial de exportaciones.
create table if not exists public.admin_backup_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  requested_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.admin_backup_codes enable row level security;
revoke all on public.admin_backup_codes from anon, authenticated;
grant all on public.admin_backup_codes to service_role;
-- Solo service_role (server) accede: ninguna policy para anon/authenticated.

create table if not exists public.admin_backups (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references auth.users(id) on delete set null,
  email text not null,
  size_bytes integer,
  status text not null default 'success' check (status = any (array['success','failed'])),
  created_at timestamptz not null default now()
);

alter table public.admin_backups enable row level security;
revoke all on public.admin_backups from anon, authenticated;
grant select on public.admin_backups to authenticated;
grant all on public.admin_backups to service_role;

create policy "admin read backups history"
  on public.admin_backups for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));