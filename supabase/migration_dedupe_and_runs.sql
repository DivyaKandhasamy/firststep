-- Run ONCE in the Supabase SQL Editor (existing database)
alter table public.jobs add column if not exists dedupe_key text;
alter table public.jobs add column if not exists duplicate_of uuid;
create index if not exists jobs_dedupe_key_idx on public.jobs (dedupe_key);

create table if not exists public.pipeline_runs (
  id               uuid primary key default gen_random_uuid(),
  run_at           timestamptz not null default now(),
  scraped          int, new_jobs int, tagged int, duplicates int,
  requests         int, failed_requests int,
  input_tokens     bigint, output_tokens bigint, thinking_tokens bigint,
  by_model         jsonb
);
alter table public.pipeline_runs enable row level security;
