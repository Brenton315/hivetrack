-- Migration 002: Organizations, memberships, and org-level RLS
-- Run this in Supabase SQL Editor

-- ORGANIZATIONS
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table organizations enable row level security;

-- MEMBERSHIPS (links users to orgs with roles)
create type org_role as enum ('owner', 'head_beekeeper', 'staff');

create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role org_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

alter table memberships enable row level security;

-- Helper function: get org_ids the current user belongs to
create or replace function user_org_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select org_id from memberships where user_id = auth.uid()
$$;

-- Helper function: check if user has a specific role in an org
create or replace function user_has_role(p_org_id uuid, p_role org_role)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid()
      and org_id = p_org_id
      and role = p_role
  )
$$;

-- Add org_id to existing tables
alter table sites add column org_id uuid references organizations(id) on delete cascade;
alter table hives add column org_id uuid references organizations(id) on delete cascade;
alter table hive_events add column org_id uuid references organizations(id) on delete cascade;
alter table harvests add column org_id uuid references organizations(id) on delete cascade;

-- Create indexes on org_id
create index idx_sites_org on sites(org_id);
create index idx_hives_org on hives(org_id);
create index idx_hive_events_org on hive_events(org_id);
create index idx_harvests_org on harvests(org_id);
create index idx_memberships_user on memberships(user_id);
create index idx_memberships_org on memberships(org_id);

-- ORGANIZATION RLS: members can see their own orgs
create policy "Members see own orgs"
  on organizations for select
  using (id in (select user_org_ids()));

create policy "Anyone can create an org"
  on organizations for insert
  with check (auth.uid() = created_by);

create policy "Owners can update org"
  on organizations for update
  using (user_has_role(id, 'owner'));

-- MEMBERSHIP RLS
create policy "Members see org memberships"
  on memberships for select
  using (org_id in (select user_org_ids()));

create policy "Owners manage memberships"
  on memberships for insert
  with check (user_has_role(org_id, 'owner'));

create policy "Owners update memberships"
  on memberships for update
  using (user_has_role(org_id, 'owner'));

create policy "Owners delete memberships"
  on memberships for delete
  using (user_has_role(org_id, 'owner'));

-- UPDATE EXISTING TABLE RLS
-- Sites: org members can see, owner/head_beekeeper can write
drop policy if exists "Users see own sites" on sites;
drop policy if exists "Users insert own sites" on sites;
drop policy if exists "Users update own sites" on sites;
drop policy if exists "Users delete own sites" on sites;

create policy "Org members see sites"
  on sites for select
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members insert sites"
  on sites for insert
  with check (
    org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid())
  );

create policy "Org members update sites"
  on sites for update
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members delete sites"
  on sites for delete
  using (
    user_has_role(org_id, 'owner') or (org_id is null and user_id = auth.uid())
  );

-- Hives
drop policy if exists "Users see own hives" on hives;
drop policy if exists "Users insert own hives" on hives;
drop policy if exists "Users update own hives" on hives;
drop policy if exists "Users delete own hives" on hives;

create policy "Org members see hives"
  on hives for select
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members insert hives"
  on hives for insert
  with check (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members update hives"
  on hives for update
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members delete hives"
  on hives for delete
  using (user_has_role(org_id, 'owner') or (org_id is null and user_id = auth.uid()));

-- Hive events
drop policy if exists "Users see own events" on hive_events;
drop policy if exists "Users insert own events" on hive_events;
drop policy if exists "Users update own events" on hive_events;
drop policy if exists "Users delete own events" on hive_events;

create policy "Org members see events"
  on hive_events for select
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members insert events"
  on hive_events for insert
  with check (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members update events"
  on hive_events for update
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members delete events"
  on hive_events for delete
  using (user_has_role(org_id, 'owner') or (org_id is null and user_id = auth.uid()));

-- Harvests
drop policy if exists "Users see own harvests" on harvests;
drop policy if exists "Users insert own harvests" on harvests;
drop policy if exists "Users update own harvests" on harvests;
drop policy if exists "Users delete own harvests" on harvests;

create policy "Org members see harvests"
  on harvests for select
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members insert harvests"
  on harvests for insert
  with check (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members update harvests"
  on harvests for update
  using (org_id in (select user_org_ids()) or (org_id is null and user_id = auth.uid()));

create policy "Org members delete harvests"
  on harvests for delete
  using (user_has_role(org_id, 'owner') or (org_id is null and user_id = auth.uid()));

-- Auto-create org + owner membership on signup (via trigger)
create or replace function handle_new_user_org()
returns trigger
language plpgsql
security definer
as $$
declare
  new_org_id uuid;
begin
  insert into organizations (name, created_by)
  values (coalesce(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 1) || '''s Apiary'), new.id)
  returning id into new_org_id;

  insert into memberships (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_org();
