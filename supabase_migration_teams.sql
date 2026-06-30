-- ============================================================
-- MIGRATION: Add teams table and normalize matches.awayteam
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Create the teams table
create table if not exists public.teams (
  id bigint generated always as identity not null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint teams_pkey primary key (id),
  constraint teams_name_key unique (name)
) TABLESPACE pg_default;

-- Step 2: Add awayteam_id column to matches table
alter table public.matches 
add column if not exists awayteam_id bigint null;

-- Step 3: Add foreign key constraint
alter table public.matches 
add constraint matches_awayteam_id_fkey 
foreign key (awayteam_id) references public.teams (id) on delete set null;

-- Step 4: Migrate existing awayteam text values into the teams table
insert into public.teams (name)
select distinct awayteam 
from public.matches 
where awayteam is not null and awayteam != ''
on conflict (name) do nothing;

-- Step 5: Update matches.awayteam_id to link to the teams table
update public.matches m
set awayteam_id = t.id
from public.teams t
where m.awayteam = t.name 
  and m.awayteam_id is null;

-- ============================================================
-- Done! Your existing data is now migrated.
-- The awayteam text column is kept for backward compatibility.
-- Going forward, new matches will auto-populate both columns.
-- ============================================================
