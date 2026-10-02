-- Private company candidate stages. Business logic stays in Next.js.
create table public.company_candidates (
  company_id uuid not null references public.company_profiles(user_id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(user_id) on delete cascade,
  stage text not null default 'potential_candidate'
    check (stage in ('potential_candidate', 'messaged', 'scheduling_interview', 'interview_scheduled', 'uninterested', 'hired')),
  created_at timestamptz not null default now(),
  primary key (company_id, creator_id)
);

alter table public.company_candidates enable row level security;

-- Include projects saved before the candidate board was introduced.
insert into public.company_candidates (company_id, creator_id)
select distinct s.user_id, p.owner_id
from public.saved_projects s
join public.projects p on p.id = s.project_id
join public.company_profiles company on company.user_id = s.user_id
join public.creator_profiles creator on creator.user_id = p.owner_id
on conflict (company_id, creator_id) do nothing;
