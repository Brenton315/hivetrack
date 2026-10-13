-- HiveHQ schema
-- Run this in Supabase SQL Editor after creating your project.

-- TABLES

create table sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  hive_count integer not null default 0,
  lat double precision,
  lng double precision,
  location_text text,
  main_flowering text,
  created_at timestamptz not null default now()
);

create table hives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  site_id uuid references sites(id) on delete set null,
  queen_breed text,
  queen_year integer,
  notes text,
  created_at timestamptz not null default now()
);

create table hive_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  hive_id uuid references hives(id) on delete set null,
  site_id uuid references sites(id) on delete cascade not null,
  event_type text not null check (event_type in ('feed', 'treatment', 'box_added', 'inspection', 'move', 'cost')),
  event_date date not null,
  data jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table harvests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  hive_id uuid references hives(id) on delete set null,
  site_id uuid references sites(id) on delete cascade not null,
  season text not null,
  harvest_date date not null,
  kg numeric(8,2) not null,
  honey_type text,
  notes text,
  created_at timestamptz not null default now()
);

-- ROW LEVEL SECURITY

alter table sites enable row level security;
create policy "Users see own sites" on sites for select using (auth.uid() = user_id);
create policy "Users insert own sites" on sites for insert with check (auth.uid() = user_id);
create policy "Users update own sites" on sites for update using (auth.uid() = user_id);
create policy "Users delete own sites" on sites for delete using (auth.uid() = user_id);

alter table hives enable row level security;
create policy "Users see own hives" on hives for select using (auth.uid() = user_id);
create policy "Users insert own hives" on hives for insert with check (auth.uid() = user_id);
create policy "Users update own hives" on hives for update using (auth.uid() = user_id);
create policy "Users delete own hives" on hives for delete using (auth.uid() = user_id);

alter table hive_events enable row level security;
create policy "Users see own events" on hive_events for select using (auth.uid() = user_id);
create policy "Users insert own events" on hive_events for insert with check (auth.uid() = user_id);
create policy "Users update own events" on hive_events for update using (auth.uid() = user_id);
create policy "Users delete own events" on hive_events for delete using (auth.uid() = user_id);

alter table harvests enable row level security;
create policy "Users see own harvests" on harvests for select using (auth.uid() = user_id);
create policy "Users insert own harvests" on harvests for insert with check (auth.uid() = user_id);
create policy "Users update own harvests" on harvests for update using (auth.uid() = user_id);
create policy "Users delete own harvests" on harvests for delete using (auth.uid() = user_id);

-- INDEXES

create index idx_hive_events_site on hive_events(site_id, event_date);
create index idx_hive_events_hive on hive_events(hive_id, event_date);
create index idx_hive_events_type on hive_events(event_type, event_date);
create index idx_harvests_site on harvests(site_id, harvest_date);
create index idx_harvests_hive on harvests(hive_id, harvest_date);
create index idx_hives_site on hives(site_id);
