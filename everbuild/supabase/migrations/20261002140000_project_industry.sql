-- Everbuild: one curated industry per project.
-- Run after 20261002130000_projects_and_feed.sql.
-- The list mirrors src/features/projects/lib/industries.ts. To add or rename an
-- industry, change both. Slugs are stable keys; names are display labels.

create table public.industries (
  slug text primary key,
  name text not null unique,
  display_order integer not null default 0
);

insert into public.industries (slug, name, display_order) values
  ('education', 'Education', 1),
  ('healthcare', 'Healthcare', 2),
  ('finance', 'Finance & Fintech', 3),
  ('government_civic', 'Government & Civic', 4),
  ('retail_ecommerce', 'Retail & E-commerce', 5),
  ('media_entertainment', 'Media & Entertainment', 6),
  ('gaming', 'Gaming', 7),
  ('manufacturing_hardware', 'Manufacturing & Hardware', 8),
  ('energy_climate', 'Energy & Climate', 9),
  ('transportation_logistics', 'Transportation & Logistics', 10),
  ('nonprofit_social_impact', 'Nonprofit & Social Impact', 11),
  ('research_science', 'Research & Science', 12),
  ('developer_tools', 'Developer Tools', 13),
  ('enterprise_software', 'Enterprise Software', 14),
  ('other', 'Other', 15)
on conflict (slug) do update set name = excluded.name, display_order = excluded.display_order;

alter table public.industries enable row level security;

-- Nullable: existing and draft projects may not have one yet.
alter table public.projects
  add column industry text references public.industries (slug) on update cascade;

create index projects_industry_idx on public.projects (industry);
