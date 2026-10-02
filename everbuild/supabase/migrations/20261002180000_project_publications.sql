-- Everbuild: first-publication ledger behind the rolling publication limit.
-- Run after 20261002170000_profile_locations.sql.
-- As before: RLS on, no policies. Only Next.js server code (secret key) reads/writes.
--
-- One row per project, written the first time it is published. Rows are never
-- updated, and project_id has no foreign key, so archiving, deleting, or
-- republishing a project never frees a slot. Rows only go away when the
-- creator's account is deleted.

create table public.project_publications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users (id) on delete cascade,
  project_id uuid not null unique,
  first_published_at timestamptz not null,
  destination text not null check (destination in ('active_feed', 'archive')),
  created_at timestamptz not null default now()
);

create index project_publications_window_idx on public.project_publications (creator_id, first_published_at desc);

create function public.project_publications_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'project_publications rows are immutable';
end;
$$;

create trigger project_publications_immutable
  before update on public.project_publications
  for each row execute function public.project_publications_immutable();

alter table public.project_publications enable row level security;

-- Backfill projects that were published before the ledger existed.
insert into public.project_publications (creator_id, project_id, first_published_at, destination)
select owner_id, id, first_published_at, publication_destination
from public.projects
where first_published_at is not null
on conflict (project_id) do nothing;
