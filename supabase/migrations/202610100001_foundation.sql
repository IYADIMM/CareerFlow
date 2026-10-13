-- CareerFlow AI foundation. Review and test in an isolated Supabase project before applying.
create extension if not exists pgcrypto;

create type public.workspace_kind as enum ('personal', 'organization', 'agency');
create type public.membership_role as enum ('owner', 'administrator', 'coach', 'member', 'viewer');
create type public.evidence_status as enum ('user_declared', 'verified', 'inferred');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  kind public.workspace_kind not null,
  name text not null check (char_length(name) between 1 and 160),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_memberships_user_idx on public.organization_memberships(user_id, organization_id);

create table public.career_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  current_role text,
  years_experience smallint check (years_experience between 0 and 60),
  target_role text,
  location_preference text,
  work_mode text check (work_mode in ('remote','hybrid','onsite','flexible')),
  objective text,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, owner_user_id)
);
create index career_profiles_org_idx on public.career_profiles(organization_id);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  normalized_name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table public.career_profile_skills (
  career_profile_id uuid not null references public.career_profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  status public.evidence_status not null,
  confidence numeric(4,3) check (confidence between 0 and 1),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (career_profile_id, skill_id),
  check (not (accepted_at is not null and rejected_at is not null))
);

create table public.recommendation_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  career_profile_id uuid not null references public.career_profiles(id) on delete cascade,
  title text not null,
  explanation text not null,
  priority text not null check (priority in ('high','medium','low')),
  linked_record_type text,
  linked_record_id uuid,
  status text not null default 'open' check (status in ('open','completed','dismissed','snoozed')),
  snoozed_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recommendations_org_status_idx on public.recommendation_records(organization_id, status);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_org_created_idx on public.audit_events(organization_id, created_at desc);

-- Unapplied foundation corrected on 2026-10-13. Agency access is closed pending
-- explicit assignment/consent workflows. Organization admins do not inherit CV access.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create or replace function private.is_org_member(org_id uuid, writable boolean default false)
returns boolean language sql stable security definer set search_path = ''
as $$ select auth.uid() is not null and exists(
  select 1 from public.organization_memberships m
  where m.organization_id = org_id and m.user_id = auth.uid()
    and (not writable or m.role <> 'viewer')
) $$;
revoke all on function private.is_org_member(uuid, boolean) from public, anon;
grant execute on function private.is_org_member(uuid, boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.career_profiles enable row level security;
alter table public.career_profile_skills enable row level security;
alter table public.recommendation_records enable row level security;
alter table public.audit_events enable row level security;
alter table public.skills enable row level security;

create policy "profile owner reads" on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "profile owner inserts" on public.profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "profile owner updates" on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "members read organizations" on public.organizations for select to authenticated using (private.is_org_member(id));
create policy "members read memberships" on public.organization_memberships for select to authenticated using (private.is_org_member(organization_id));
create policy "owners read career profiles" on public.career_profiles for select to authenticated
using (owner_user_id = (select auth.uid()) and private.is_org_member(organization_id));
create policy "members create own career profile" on public.career_profiles for insert to authenticated
with check (owner_user_id = (select auth.uid()) and private.is_org_member(organization_id, true));
create policy "owners update career profiles" on public.career_profiles for update to authenticated
using (owner_user_id = (select auth.uid()) and private.is_org_member(organization_id, true))
with check (owner_user_id = (select auth.uid()) and private.is_org_member(organization_id, true));
create policy "owners read profile skills" on public.career_profile_skills for select to authenticated using (
  exists(select 1 from public.career_profiles cp where cp.id = career_profile_id and cp.owner_user_id = (select auth.uid()) and private.is_org_member(cp.organization_id))
);
create policy "profile owners manage skills" on public.career_profile_skills for all to authenticated using (
  exists(select 1 from public.career_profiles cp where cp.id = career_profile_id and cp.owner_user_id = (select auth.uid()) and private.is_org_member(cp.organization_id, true))
) with check (
  exists(select 1 from public.career_profiles cp where cp.id = career_profile_id and cp.owner_user_id = (select auth.uid()) and private.is_org_member(cp.organization_id, true))
);
create policy "owners read recommendations" on public.recommendation_records for select to authenticated using (
  private.is_org_member(organization_id) and exists(select 1 from public.career_profiles cp where cp.id=career_profile_id and cp.organization_id=recommendation_records.organization_id and cp.owner_user_id=(select auth.uid()))
);
create policy "owners update recommendations" on public.recommendation_records for update to authenticated
using (private.is_org_member(organization_id,true) and exists(select 1 from public.career_profiles cp where cp.id=career_profile_id and cp.organization_id=recommendation_records.organization_id and cp.owner_user_id=(select auth.uid())))
with check (private.is_org_member(organization_id,true) and exists(select 1 from public.career_profiles cp where cp.id=career_profile_id and cp.organization_id=recommendation_records.organization_id and cp.owner_user_id=(select auth.uid())));
create policy "actors read own audit events" on public.audit_events for select to authenticated
using (actor_user_id = (select auth.uid()) and private.is_org_member(organization_id));
create policy "authenticated read skill catalog" on public.skills for select to authenticated using (true);

-- Table grants are part of the access model; freeze ownership columns on UPDATE.
revoke all on public.profiles,public.organizations,public.organization_memberships,
public.career_profiles,public.skills,public.career_profile_skills,public.recommendation_records,public.audit_events from anon,authenticated;
grant select,insert on public.profiles to authenticated;
grant update(display_name,locale,updated_at) on public.profiles to authenticated;
grant select on public.organizations,public.organization_memberships,public.skills,public.audit_events to authenticated;
grant select,insert on public.career_profiles to authenticated;
grant update(current_role,years_experience,target_role,location_preference,work_mode,objective,version,updated_at) on public.career_profiles to authenticated;
grant select,insert,delete on public.career_profile_skills to authenticated;
grant update(status,confidence,evidence,accepted_at,rejected_at) on public.career_profile_skills to authenticated;
grant select on public.recommendation_records to authenticated;
grant update(status,snoozed_until,updated_at) on public.recommendation_records to authenticated;
