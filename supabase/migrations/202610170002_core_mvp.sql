-- CareerFlow Core MVP hosted model. Apply only after 202610100001_foundation.sql.
-- This source is prepared but intentionally not marked executed without an isolated project.

create type public.fact_status as enum ('user_provided','imported','user_confirmed','derived','suggested','unknown','conflicting');
create type public.document_kind as enum ('master','tailored','cover_letter','outreach');
create type public.application_status as enum ('saved','preparing','ready','approved','applied','screening','interviewing','offer','accepted','rejected','withdrawn','archived');
create type public.agent_run_status as enum ('created','planning','discovering','validating','matching','preparing','awaiting_approval','executing_authorized_action','verifying','completed','paused','cancelled','failed','expired');

create table public.career_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 240),
  kind public.document_kind not null default 'master',
  source_type text not null check (source_type in ('pdf','docx','txt','pasted_text','generated')),
  mime_type text not null,
  storage_path text,
  extracted_text text not null default '' check (char_length(extracted_text) <= 500000),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  verification_status text not null default 'needs_review' check (verification_status in ('needs_review','verified')),
  version integer not null default 1 check (version > 0),
  approved_version integer check (approved_version is null or approved_version = version),
  parent_document_id uuid references public.career_documents(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((source_type = 'pasted_text' and storage_path is null) or source_type <> 'pasted_text')
);
create index career_documents_owner_idx on public.career_documents(organization_id, owner_user_id, updated_at desc);

create table public.career_document_versions (
  document_id uuid not null references public.career_documents(id) on delete cascade,
  version integer not null check (version > 0),
  storage_path text,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  extracted_text text not null default '' check (char_length(extracted_text) <= 500000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  primary key (document_id, version),
  check ((approved_at is null and approved_by is null) or (approved_at is not null and approved_by is not null))
);

create table public.career_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  career_profile_id uuid not null references public.career_profiles(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('employment','responsibility','achievement','education','certification','skill','language','preference','project','award','publication','volunteering','strength','value','goal')),
  claim text not null check (char_length(claim) between 1 and 4000),
  status public.fact_status not null,
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  source_document_id uuid references public.career_documents(id) on delete set null,
  source_quote text check (char_length(source_quote) <= 4000),
  confidence numeric(4,3) check (confidence between 0 and 1),
  locked boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_document_id is null or source_quote is not null)
);
create index career_facts_profile_idx on public.career_facts(career_profile_id, category, updated_at desc);

create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  source_kind text not null check (source_kind in ('user_content','licensed','permitted_public','fixture')),
  source_name text not null,
  source_vacancy_id text,
  canonical_url text,
  title text not null,
  company text not null,
  location text,
  work_mode text check (work_mode in ('remote','hybrid','onsite','flexible')),
  description text not null check (char_length(description) <= 150000),
  requirements jsonb not null default '[]'::jsonb check (jsonb_typeof(requirements) = 'array'),
  provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(provenance) = 'object'),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  first_seen_at timestamptz not null,
  last_verified_at timestamptz,
  availability text not null default 'unknown' check (availability in ('unknown','open','expired','closed','unavailable')),
  created_at timestamptz not null default now(),
  unique (organization_id, owner_user_id, source_name, source_vacancy_id)
);
create index vacancies_owner_freshness_idx on public.vacancies(organization_id, owner_user_id, last_verified_at desc);

create table public.match_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  vacancy_id uuid not null references public.vacancies(id) on delete cascade,
  career_profile_id uuid not null references public.career_profiles(id) on delete cascade,
  overall_score numeric(5,2) check (overall_score between 0 and 100),
  rubric_version text not null,
  dimensions jsonb not null check (jsonb_typeof(dimensions) = 'array'),
  strengths jsonb not null default '[]'::jsonb check (jsonb_typeof(strengths) = 'array'),
  gaps jsonb not null default '[]'::jsonb check (jsonb_typeof(gaps) = 'array'),
  uncertainty jsonb not null default '[]'::jsonb check (jsonb_typeof(uncertainty) = 'array'),
  source_snapshot_sha256 text not null check (source_snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index match_reports_vacancy_idx on public.match_reports(organization_id, owner_user_id, vacancy_id, created_at desc);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  vacancy_id uuid not null references public.vacancies(id) on delete restrict,
  status public.application_status not null default 'saved',
  next_action text not null,
  next_action_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 20000),
  submitted_at timestamptz,
  submission_evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, owner_user_id, vacancy_id),
  check ((status <> 'applied' and submitted_at is null) or (status = 'applied' and submitted_at is not null and submission_evidence is not null))
);
create index applications_owner_status_idx on public.applications(organization_id, owner_user_id, status, updated_at desc);

create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  origin text not null check (origin in ('user','manual_confirmation','agent_preparation','system')),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now()
);

create table public.interview_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  vacancy_id uuid not null references public.vacancies(id) on delete cascade,
  questions jsonb not null check (jsonb_typeof(questions) = 'array'),
  evidence_links jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_links) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null,
  scope jsonb not null check (jsonb_typeof(scope) = 'object'),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  check (expires_at is null or expires_at > granted_at)
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  consent_id uuid not null references public.consent_records(id) on delete restrict,
  status public.agent_run_status not null default 'created',
  goal text not null check (char_length(goal) between 5 and 500),
  input_snapshot jsonb not null check (jsonb_typeof(input_snapshot) = 'object'),
  input_sha256 text not null check (input_sha256 ~ '^[0-9a-f]{64}$'),
  budget_cents integer not null default 0 check (budget_cents >= 0),
  usage jsonb not null default '{}'::jsonb check (jsonb_typeof(usage) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index agent_runs_owner_status_idx on public.agent_runs(organization_id, owner_user_id, status, created_at desc);

create table public.agent_checkpoints (
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  revision integer not null check (revision >= 0),
  status public.agent_run_status not null,
  step text not null,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now(),
  primary key (run_id, revision)
);

create table public.agent_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  approved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > approved_at)
);

-- Candidate data is owner-only. Membership alone never grants career-data access.
alter table public.career_documents enable row level security;
alter table public.career_document_versions enable row level security;
alter table public.career_facts enable row level security;
alter table public.vacancies enable row level security;
alter table public.match_reports enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.interview_plans enable row level security;
alter table public.consent_records enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_checkpoints enable row level security;
alter table public.agent_approvals enable row level security;

create or replace function private.owns_candidate_record(org_id uuid, record_owner uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select record_owner = auth.uid() and private.is_org_member(org_id) $$;
revoke all on function private.owns_candidate_record(uuid,uuid) from public, anon;
grant execute on function private.owns_candidate_record(uuid,uuid) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['career_documents','career_facts','vacancies','match_reports','applications','application_events','interview_plans','consent_records','agent_runs','agent_approvals'] loop
    execute format('create policy %I on public.%I for select to authenticated using (private.owns_candidate_record(organization_id, owner_user_id))', table_name || '_owner_select', table_name);
  end loop;
end $$;

create policy "document owner reads versions" on public.career_document_versions for select to authenticated using (
  exists(select 1 from public.career_documents d where d.id=document_id and private.owns_candidate_record(d.organization_id,d.owner_user_id))
);
create policy "run owner reads checkpoints" on public.agent_checkpoints for select to authenticated using (
  exists(select 1 from public.agent_runs r where r.id=run_id and private.owns_candidate_record(r.organization_id,r.owner_user_id))
);

-- Writes are expected through a validated server boundary. Direct clients receive read-only grants.
revoke all on public.career_documents,public.career_document_versions,public.career_facts,public.vacancies,
public.match_reports,public.applications,public.application_events,public.interview_plans,public.consent_records,
public.agent_runs,public.agent_checkpoints,public.agent_approvals from anon,authenticated;
grant select on public.career_documents,public.career_document_versions,public.career_facts,public.vacancies,
public.match_reports,public.applications,public.application_events,public.interview_plans,public.consent_records,
public.agent_runs,public.agent_checkpoints,public.agent_approvals to authenticated;

-- Originals remain in a private bucket under <user-id>/<document-id>/<version>/<filename>.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('career-documents','career-documents',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "document owner reads private objects" on storage.objects for select to authenticated using (
  bucket_id='career-documents' and owner_id=(select auth.uid()::text) and (storage.foldername(name))[1]=(select auth.uid())::text
);
-- Uploads/deletes are server-mediated; no authenticated INSERT/UPDATE/DELETE storage policy is granted.
