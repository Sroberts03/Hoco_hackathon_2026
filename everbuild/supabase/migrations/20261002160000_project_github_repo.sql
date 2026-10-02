-- Everbuild: web apps can run straight from a public GitHub repo (booted in
-- the browser by a StackBlitz embed) instead of an uploaded bundle.
-- Run after 20261002150000_project_page.sql.

-- Canonical form, without the github.com/ prefix:
--   owner/repo                     repo root on the default branch
--   owner/repo/tree/<ref>/<path>   a branch and optional subfolder
alter table public.projects
  add column github_repo text
    check (github_repo ~ '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})/[A-Za-z0-9._-]{1,100}(?:/tree/[A-Za-z0-9._/-]+)?$');
