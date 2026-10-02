-- Structured, privacy-preserving profile locations.
-- general_location remains as a display/search fallback for existing data.

alter table public.users
  add column if not exists location_city text,
  add column if not exists location_region text,
  add column if not exists location_country text;

create index if not exists users_location_idx
  on public.users (location_country, location_region, location_city);
