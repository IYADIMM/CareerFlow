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

create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.organization_memberships m where m.organization_id = org_id and m.user_id = auth.uid()) $$;

create or replace function public.has_org_role(org_id uuid, allowed public.membership_role[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.organization_memberships m where m.organization_id = org_id and m.user_id = auth.uid() and m.role = any(allowed)) $$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.career_profiles enable row level security;
alter table public.career_profile_skills enable row level security;
alter table public.recommendation_records enable row level security;
alter table public.audit_events enable row level security;

create policy "profile owner reads" on public.profiles for select using (user_id = auth.uid());
create policy "profile owner updates" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members read organizations" on public.organizations for select using (public.is_org_member(id));
create policy "members read memberships" on public.organization_memberships for select using (public.is_org_member(organization_id));
create policy "admins manage memberships" on public.organization_memberships for all
using (public.has_org_role(organization_id, array['owner','administrator']::public.membership_role[]))
with check (public.has_org_role(organization_id, array['owner','administrator']::public.membership_role[]));
create policy "members read career profiles" on public.career_profiles for select using (public.is_org_member(organization_id));
create policy "members create own career profile" on public.career_profiles for insert with check (owner_user_id = auth.uid() and public.is_org_member(organization_id));
create policy "owners or coaches update career profiles" on public.career_profiles for update
using (owner_user_id = auth.uid() or public.has_org_role(organization_id, array['owner','administrator','coach']::public.membership_role[]))
with check (owner_user_id = auth.uid() or public.has_org_role(organization_id, array['owner','administrator','coach']::public.membership_role[]));
create policy "members read profile skills" on public.career_profile_skills for select using (
  exists(select 1 from public.career_profiles cp where cp.id = career_profile_id and public.is_org_member(cp.organization_id))
);
create policy "profile owners manage skills" on public.career_profile_skills for all using (
  exists(select 1 from public.career_profiles cp where cp.id = career_profile_id and cp.owner_user_id = auth.uid())
) with check (
  exists(select 1 from public.career_profiles cp where cp.id = career_profile_id and cp.owner_user_id = auth.uid())
);
create policy "members read recommendations" on public.recommendation_records for select using (public.is_org_member(organization_id));
create policy "members update recommendations" on public.recommendation_records for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "admins read audit events" on public.audit_events for select using (
  public.has_org_role(organization_id, array['owner','administrator']::public.membership_role[])
);

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.membership_role[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.membership_role[]) to authenticated;

