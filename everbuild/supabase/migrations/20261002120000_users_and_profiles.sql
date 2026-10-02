-- Everbuild: users and profiles.
-- Business rules live in the Next.js server code. RLS is enabled with no
-- policies, so the browser cannot query these tables directly; the Next.js
-- server reads and writes them with the service-role key.

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('creator', 'company')),
  display_name text not null,
  avatar_path text,
  general_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creator_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  bio text,
  interests text[] not null default '{}',
  education text,
  availability text not null default 'open_to_collaboration'
    check (availability in ('open_to_work', 'open_to_freelance', 'open_to_collaboration', 'not_currently_available')),
  links jsonb not null default '{}'::jsonb
);

create table public.company_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  company_name text not null,
  description text,
  industry_tags text[] not null default '{}',
  interests text[] not null default '{}',
  website text,
  links jsonb not null default '{}'::jsonb,
  -- Demo flag for now; a future verification service will set these.
  is_verified boolean not null default false,
  verified_at timestamptz,
  verification_source text
);

alter table public.users enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.company_profiles enable row level security;
