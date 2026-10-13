-- Prepared regression suite; run with supabase test db in an isolated project.
-- Not executed in this milestone: no Supabase project/PostgreSQL runtime exists.
begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(6);
insert into auth.users(id,email) values
('11111111-1111-4111-8111-111111111111','rls-a@example.test'),
('22222222-2222-4222-8222-222222222222','rls-b@example.test');
insert into public.organizations(id,kind,name,created_by) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','personal','A','11111111-1111-4111-8111-111111111111'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','personal','B','22222222-2222-4222-8222-222222222222');
insert into public.organization_memberships values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','owner',now()),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','coach',now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','owner',now());
insert into public.career_profiles(id,organization_id,owner_user_id,current_role) values
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Director A'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Director B');
select extensions.ok(not has_table_privilege('anon','public.career_profiles','SELECT'),'Anon lacks profile grant');
select extensions.ok(not has_column_privilege('authenticated','public.career_profiles','organization_id','UPDATE'),'Tenant ownership is immutable for clients');
select extensions.ok(not has_table_privilege('authenticated','public.organization_memberships','UPDATE'),'Client cannot elevate membership');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select extensions.is((select count(*)::integer from public.career_profiles),1,'A sees only own profile');
select extensions.lives_ok($$update public.career_profiles set current_role='Updated A' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,'Owner can edit mutable fields');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select extensions.is((select count(*)::integer from public.career_profiles where organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),0,'Coach without consent cannot read A');
select * from extensions.finish();
rollback;
