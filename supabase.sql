-- HiveTrack schema and sample data
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
  created_at timestamptz not null default now()
);

create table hive_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  hive_id uuid references hives(id) on delete set null,
  site_id uuid references sites(id) on delete cascade not null,
  log_date date not null,
  frames_of_bees integer,
  treatments text,
  feeding text,
  brood_stores_ratio text,
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

alter table hive_logs enable row level security;
create policy "Users see own logs" on hive_logs for select using (auth.uid() = user_id);
create policy "Users insert own logs" on hive_logs for insert with check (auth.uid() = user_id);
create policy "Users update own logs" on hive_logs for update using (auth.uid() = user_id);
create policy "Users delete own logs" on hive_logs for delete using (auth.uid() = user_id);

alter table harvests enable row level security;
create policy "Users see own harvests" on harvests for select using (auth.uid() = user_id);
create policy "Users insert own harvests" on harvests for insert with check (auth.uid() = user_id);
create policy "Users update own harvests" on harvests for update using (auth.uid() = user_id);
create policy "Users delete own harvests" on harvests for delete using (auth.uid() = user_id);

-- INDEXES

create index idx_hive_logs_site on hive_logs(site_id, log_date);
create index idx_hive_logs_hive on hive_logs(hive_id, log_date);
create index idx_harvests_site on harvests(site_id, harvest_date);
create index idx_harvests_hive on harvests(hive_id, harvest_date);
create index idx_hives_site on hives(site_id);

-- SAMPLE DATA
-- Replace 'SAMPLE_USER_ID' with your actual auth.users id after signing up.
-- You can find it in Supabase Dashboard → Authentication → Users.

-- To insert sample data, run this after signing up and replacing the user id:

/*
do $$
declare
  uid uuid := 'REPLACE_WITH_YOUR_USER_ID';
  site1 uuid;
  site2 uuid;
  site3 uuid;
  h1 uuid; h2 uuid; h3 uuid; h4 uuid; h5 uuid; h6 uuid; h7 uuid; h8 uuid;
begin

  -- Sites
  insert into sites (id, user_id, name, hive_count, lat, lng, location_text, main_flowering)
  values (gen_random_uuid(), uid, 'Wairarapa Mānuka Block', 3, -41.2440, 175.4580, 'End of Mikimiki Rd, Masterton', 'mānuka')
  returning id into site1;

  insert into sites (id, user_id, name, hive_count, lat, lng, location_text, main_flowering)
  values (gen_random_uuid(), uid, 'Martinborough Clover Flat', 3, -41.2193, 175.4590, 'Johnson''s farm, Martinborough', 'clover')
  returning id into site2;

  insert into sites (id, user_id, name, hive_count, lat, lng, location_text, main_flowering)
  values (gen_random_uuid(), uid, 'Rimutaka Ranges', 2, -41.1000, 175.0200, 'DOC permit area, Rimutaka Hill Rd', 'kānuka')
  returning id into site3;

  -- Hives
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'M1', site1) returning id into h1;
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'M2', site1) returning id into h2;
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'M3', site1) returning id into h3;
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'C1', site2) returning id into h4;
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'C2', site2) returning id into h5;
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'C3', site2) returning id into h6;
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'R1', site3) returning id into h7;
  insert into hives (id, user_id, name, site_id) values (gen_random_uuid(), uid, 'R2', site3) returning id into h8;

  -- Hive logs — 6 weeks of inspections (Aug–Sep 2025)
  -- Week 1: Aug 4 — site-level entries
  insert into hive_logs (user_id, site_id, hive_id, log_date, frames_of_bees, treatments, feeding, brood_stores_ratio, notes)
  values
    (uid, site1, null, '2025-08-04', 6, null, '2L sugar syrup', '40:60', 'Winter cluster looking OK'),
    (uid, site2, null, '2025-08-04', 5, null, '2L sugar syrup', '35:65', 'Light cluster, added feed'),
    (uid, site3, null, '2025-08-05', 7, null, null, '45:55', 'Strong for winter');

  -- Week 2: Aug 11 — hive-level for site 1
  insert into hive_logs (user_id, site_id, hive_id, log_date, frames_of_bees, treatments, feeding, brood_stores_ratio, notes)
  values
    (uid, site1, h1, '2025-08-11', 7, null, '1L sugar syrup', '45:55', 'Queen seen, brood expanding'),
    (uid, site1, h2, '2025-08-11', 5, null, '2L sugar syrup', '35:65', 'Slow buildup'),
    (uid, site1, h3, '2025-08-11', 6, null, '1L sugar syrup', '40:60', 'Steady');

  -- Week 3: Aug 18
  insert into hive_logs (user_id, site_id, hive_id, log_date, frames_of_bees, treatments, feeding, brood_stores_ratio, notes)
  values
    (uid, site1, null, '2025-08-18', 7, 'OA/GL strips in', null, '50:50', 'Treating for varroa, spring buildup starting'),
    (uid, site2, h4, '2025-08-18', 6, 'OA/GL strips in', '1L sugar syrup', '40:60', 'Treating'),
    (uid, site2, h5, '2025-08-18', 5, 'OA/GL strips in', '2L sugar syrup', '35:65', 'Weak, monitoring'),
    (uid, site2, h6, '2025-08-18', 7, 'OA/GL strips in', null, '50:50', 'Strong colony');

  -- Week 4: Aug 25
  insert into hive_logs (user_id, site_id, hive_id, log_date, frames_of_bees, treatments, feeding, brood_stores_ratio, notes)
  values
    (uid, site1, h1, '2025-08-25', 8, null, null, '55:45', 'Good expansion'),
    (uid, site1, h2, '2025-08-25', 6, null, '1L sugar syrup', '40:60', 'Improving'),
    (uid, site1, h3, '2025-08-25', 7, null, null, '50:50', 'Steady'),
    (uid, site3, h7, '2025-08-25', 8, null, null, '50:50', 'Bees foraging on early kānuka'),
    (uid, site3, h8, '2025-08-25', 7, null, null, '45:55', 'Good shape');

  -- Week 5: Sep 1
  insert into hive_logs (user_id, site_id, hive_id, log_date, frames_of_bees, treatments, feeding, brood_stores_ratio, notes)
  values
    (uid, site1, null, '2025-09-01', 9, 'OA/GL strips out', null, '60:40', 'Strips removed, spring flow starting'),
    (uid, site2, null, '2025-09-01', 7, 'OA/GL strips out', null, '55:45', 'Strips out, clover starting to bloom');

  -- Week 6: Sep 8
  insert into hive_logs (user_id, site_id, hive_id, log_date, frames_of_bees, treatments, feeding, brood_stores_ratio, notes)
  values
    (uid, site1, h1, '2025-09-08', 10, null, null, '65:35', 'Booming, may need super'),
    (uid, site1, h2, '2025-09-08', 7, null, null, '55:45', 'Catching up'),
    (uid, site1, h3, '2025-09-08', 8, null, null, '60:40', 'Looking good'),
    (uid, site2, h4, '2025-09-08', 8, null, null, '60:40', 'Strong on clover'),
    (uid, site2, h5, '2025-09-08', 6, null, null, '45:55', 'Still behind'),
    (uid, site2, h6, '2025-09-08', 9, null, null, '60:40', 'Ready for super'),
    (uid, site3, null, '2025-09-08', 9, null, null, '55:45', 'Kānuka in full bloom');

  -- Harvests — 2025/26 season (Jan 2026)
  insert into harvests (user_id, site_id, hive_id, season, harvest_date, kg, honey_type, notes)
  values
    (uid, site1, null, '2025/26', '2026-01-15', 120.5, 'Mānuka', 'Good yield, dark honey'),
    (uid, site1, h1, '2025/26', '2026-01-15', 48.0, 'Mānuka', 'Top producer'),
    (uid, site1, h2, '2025/26', '2026-01-15', 32.0, 'Mānuka', 'Below average'),
    (uid, site1, h3, '2025/26', '2026-01-15', 40.5, 'Mānuka', null),
    (uid, site2, null, '2025/26', '2026-01-20', 95.0, 'Clover', 'Light colour, nice flavour'),
    (uid, site2, h4, '2025/26', '2026-01-20', 38.0, 'Clover', null),
    (uid, site2, h5, '2025/26', '2026-01-20', 22.0, 'Clover', 'Weak hive, low yield'),
    (uid, site2, h6, '2025/26', '2026-01-20', 35.0, 'Clover', null),
    (uid, site3, null, '2025/26', '2026-02-01', 68.0, 'Kānuka bush blend', 'Mixed bush honey');

end $$;
*/
