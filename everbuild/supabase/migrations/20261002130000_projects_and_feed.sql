-- Everbuild: projects and the tables the discovery feed reads.
-- Run after 20261002120000_users_and_profiles.sql.
-- As before: RLS on, no policies. Only Next.js server code (secret key) reads/writes.

-- ---------------------------------------------------------------------------
-- Curated tag taxonomy (mirrors src/features/projects/lib/taxonomy.ts)
-- ---------------------------------------------------------------------------

create table public.tags (
  id serial primary key,
  name text not null unique,
  category text not null,
  is_curated boolean not null default true
);

insert into public.tags (name, category) values
  ('HTML', 'Languages and fundamentals'),
  ('CSS', 'Languages and fundamentals'),
  ('JavaScript', 'Languages and fundamentals'),
  ('TypeScript', 'Languages and fundamentals'),
  ('Python', 'Languages and fundamentals'),
  ('Java', 'Languages and fundamentals'),
  ('C', 'Languages and fundamentals'),
  ('C++', 'Languages and fundamentals'),
  ('C#', 'Languages and fundamentals'),
  ('Go', 'Languages and fundamentals'),
  ('Rust', 'Languages and fundamentals'),
  ('Kotlin', 'Languages and fundamentals'),
  ('Swift', 'Languages and fundamentals'),
  ('SQL', 'Languages and fundamentals'),
  ('Algorithms', 'Languages and fundamentals'),
  ('Data Structures', 'Languages and fundamentals'),
  ('Mathematics', 'Languages and fundamentals'),
  ('Statistics', 'Languages and fundamentals'),
  ('React', 'Web and application development'),
  ('Next.js', 'Web and application development'),
  ('Vue', 'Web and application development'),
  ('Angular', 'Web and application development'),
  ('Node.js', 'Web and application development'),
  ('Express', 'Web and application development'),
  ('Django', 'Web and application development'),
  ('Flask', 'Web and application development'),
  ('REST APIs', 'Web and application development'),
  ('GraphQL', 'Web and application development'),
  ('WebSockets', 'Web and application development'),
  ('Frontend', 'Web and application development'),
  ('Backend', 'Web and application development'),
  ('Full Stack', 'Web and application development'),
  ('Mobile Development', 'Web and application development'),
  ('Desktop Applications', 'Web and application development'),
  ('Data Analysis', 'Data, AI, and computation'),
  ('Data Visualization', 'Data, AI, and computation'),
  ('Machine Learning', 'Data, AI, and computation'),
  ('Deep Learning', 'Data, AI, and computation'),
  ('Generative AI', 'Data, AI, and computation'),
  ('Natural Language Processing', 'Data, AI, and computation'),
  ('Computer Vision', 'Data, AI, and computation'),
  ('Audio Processing', 'Data, AI, and computation'),
  ('Optimization', 'Data, AI, and computation'),
  ('Simulation', 'Data, AI, and computation'),
  ('Scientific Computing', 'Data, AI, and computation'),
  ('Databases', 'Data, AI, and computation'),
  ('Data Engineering', 'Data, AI, and computation'),
  ('Distributed Systems', 'Systems and engineering practice'),
  ('Cloud', 'Systems and engineering practice'),
  ('DevOps', 'Systems and engineering practice'),
  ('Docker', 'Systems and engineering practice'),
  ('Kubernetes', 'Systems and engineering practice'),
  ('Testing', 'Systems and engineering practice'),
  ('Security', 'Systems and engineering practice'),
  ('Cryptography', 'Systems and engineering practice'),
  ('Performance', 'Systems and engineering practice'),
  ('Open Source', 'Systems and engineering practice'),
  ('Version Control', 'Systems and engineering practice'),
  ('Accessibility', 'Systems and engineering practice'),
  ('UI/UX', 'Design, media, and domains'),
  ('Graphic Design', 'Design, media, and domains'),
  ('Game Development', 'Design, media, and domains'),
  ('Animation', 'Design, media, and domains'),
  ('Video', 'Design, media, and domains'),
  ('Music', 'Design, media, and domains'),
  ('Robotics', 'Design, media, and domains'),
  ('Hardware', 'Design, media, and domains'),
  ('Education', 'Design, media, and domains'),
  ('Finance', 'Design, media, and domains'),
  ('Health', 'Design, media, and domains'),
  ('Science', 'Design, media, and domains'),
  ('Civic Technology', 'Design, media, and domains'),
  ('Social Impact', 'Design, media, and domains'),
  ('E-commerce', 'Design, media, and domains'),
  ('Product Design', 'Design, media, and domains')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null default '',
  project_type text not null check (project_type in ('web_app', 'video')),
  project_status text not null default 'in_progress'
    check (project_status in ('idea', 'in_progress', 'complete', 'maintained', 'seeking_collaborators')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  publication_destination text not null default 'active_feed'
    check (publication_destination in ('active_feed', 'archive')),
  visibility text not null default 'public' check (visibility in ('public', 'unlisted')),
  source_visibility text not null default 'private' check (source_visibility in ('private', 'public')),
  cover_asset_id uuid,
  published_at timestamptz,
  first_published_at timestamptz,
  archived_at timestamptz,
  last_republished_at timestamptz,
  looking_for text,
  general_location text,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_feed_idx on public.projects (publication_status, publication_destination, visibility);
create index projects_owner_idx on public.projects (owner_id);

-- first_published_at is immutable once set (publication-limit ledger relies on it).
create function public.projects_before_update() returns trigger
language plpgsql as $$
begin
  if old.first_published_at is not null
     and new.first_published_at is distinct from old.first_published_at then
    raise exception 'first_published_at is immutable once set';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_before_update
  before update on public.projects
  for each row execute function public.projects_before_update();

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  media_type text not null
    check (media_type in ('primary_video', 'web_app_bundle', 'source_bundle', 'cover_image', 'poster_image')),
  storage_path text not null,
  mime_type text not null,
  file_size_bytes bigint not null default 0,
  original_filename text,
  created_at timestamptz not null default now()
);

create index project_media_project_idx on public.project_media (project_id);

alter table public.projects
  add constraint projects_cover_asset_fk
  foreign key (cover_asset_id) references public.project_media (id) on delete set null;

create table public.project_tags (
  project_id uuid not null references public.projects (id) on delete cascade,
  tag_id integer not null references public.tags (id) on delete cascade,
  primary key (project_id, tag_id)
);

create index project_tags_tag_idx on public.project_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Engagement signals used by ranking
-- ---------------------------------------------------------------------------

create table public.saved_projects (
  user_id uuid not null references public.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create index saved_projects_project_idx on public.saved_projects (project_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  hidden_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index comments_project_idx on public.comments (project_id, created_at);

create table public.project_views (
  id bigserial primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  -- user id or short-lived anonymous session id; never exposed publicly
  viewer_key text not null,
  viewed_at timestamptz not null default now()
);

create index project_views_debounce_idx on public.project_views (project_id, viewer_key, viewed_at desc);

-- Saved default feed filters (used by company accounts).
create table public.feed_preferences (
  user_id uuid primary key references public.users (id) on delete cascade,
  filters jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Read model for ranking: one row of counts per project.
create view public.project_engagement as
select
  p.id as project_id,
  p.views_count,
  (select count(*) from public.comments c
     where c.project_id = p.id and c.deleted_at is null and c.hidden_at is null)::int as comment_count,
  (select count(*) from public.saved_projects s where s.project_id = p.id)::int as save_count
from public.projects p;

-- ---------------------------------------------------------------------------
-- Lock down direct API access
-- ---------------------------------------------------------------------------

alter table public.tags enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.project_tags enable row level security;
alter table public.saved_projects enable row level security;
alter table public.comments enable row level security;
alter table public.project_views enable row level security;
alter table public.feed_preferences enable row level security;

-- Views run with the owner's rights, so close them to the public API roles.
revoke all on public.project_engagement from anon, authenticated;
