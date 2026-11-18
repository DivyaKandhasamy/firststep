-- FIRSTSTEP · Supabase schema
create extension if not exists "pgcrypto";

create table if not exists public.jobs (
  id               uuid primary key default gen_random_uuid(),
  source_url       text not null unique,          -- dedup key
  original_title   text not null,
  company_name     text not null,
  raw_description  text,
  ai_role          text,                          -- normalised role, e.g. "Software Engineer Intern"
  ai_city          text,                          -- primary city or "Remote"
  ai_work_mode     text check (ai_work_mode in ('Remote','Hybrid','On-site')),
  ai_job_type      text check (ai_job_type  in ('Internship','Full-Time')),
  ai_skills        text[] not null default '{}',  -- top 3 skills
  source_portal    text,                          -- e.g. "Internshala"
  scraped_at       timestamptz not null default now()
);

create index if not exists jobs_scraped_at_idx on public.jobs (scraped_at desc);

-- Public, read-only access for the browser (anon key).
-- Writes come from the pipeline using the service-role key, which bypasses RLS.
alter table public.jobs enable row level security;

drop policy if exists "jobs are publicly readable" on public.jobs;
create policy "jobs are publicly readable"
  on public.jobs for select
  to anon, authenticated
  using (true);
