-- Run ONCE in Supabase SQL Editor (for an existing jobs table)
alter table public.jobs add column if not exists posted_at timestamptz;
alter table public.jobs add column if not exists listed_at timestamptz
  generated always as (coalesce(posted_at, scraped_at)) stored;
create index if not exists jobs_listed_at_idx on public.jobs (listed_at desc);
