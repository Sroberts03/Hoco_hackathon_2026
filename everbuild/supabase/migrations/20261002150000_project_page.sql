-- Everbuild: tables behind the project page (collaborators, messaging,
-- blocking, reports) and the private media bucket.
-- Run after 20261002140000_project_industry.sql.
-- As before: RLS on, no policies. Only Next.js server code (secret key) reads/writes.

-- ---------------------------------------------------------------------------
-- Collaborators
-- ---------------------------------------------------------------------------

create table public.project_collaborators (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text,
  display_order integer not null default 0,
  primary key (project_id, user_id)
);

create index project_collaborators_user_idx on public.project_collaborators (user_id);

-- ---------------------------------------------------------------------------
-- One-to-one messaging (asynchronous, no approval step)
-- ---------------------------------------------------------------------------

create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a_id uuid not null references public.users (id) on delete cascade,
  participant_b_id uuid not null references public.users (id) on delete cascade,
  -- Optional project the conversation is about.
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_a_id <> participant_b_id)
);

-- One thread per participant pair per project (or per pair with no project).
create unique index message_threads_unique_pair on public.message_threads (
  least(participant_a_id, participant_b_id),
  greatest(participant_a_id, participant_b_id),
  coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index message_threads_a_idx on public.message_threads (participant_a_id, updated_at desc);
create index message_threads_b_idx on public.message_threads (participant_b_id, updated_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index messages_thread_idx on public.messages (thread_id, created_at);
create index messages_sender_idx on public.messages (sender_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Safety
-- ---------------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null references public.users (id) on delete cascade,
  blocked_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

-- Stored for moderator review; no moderation console yet.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  target_type text not null check (target_type in ('project', 'comment', 'message', 'thread', 'user')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);

alter table public.project_collaborators enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- ---------------------------------------------------------------------------
-- Private media bucket. Files are only served through Next.js routes, which
-- check project visibility and sandbox hosted web apps.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('everbuild-media', 'everbuild-media', false, 104857600)
on conflict (id) do nothing;
