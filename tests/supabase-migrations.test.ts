// @vitest-environment node
import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration=readFileSync(resolve('supabase/migrations/202610170002_core_mvp.sql'),'utf8');
const created=[...migration.matchAll(/create table public\.([a-z_]+)/g)].map(match=>match[1]);

describe('hosted core migration guardrails',()=>{
  it('enables RLS on every public table introduced by the migration',()=>{
    expect(created.length).toBeGreaterThan(10);
    for(const table of created)expect(migration,`${table} must enable RLS`).toMatch(new RegExp(`alter table public\\.${table} enable row level security`));
  });
  it('keeps document storage private and server-mediated',()=>{
    expect(migration).toContain("values ('career-documents','career-documents',false");
    expect(migration).not.toMatch(/storage\.objects for insert to authenticated/i);
    expect(migration).not.toMatch(/storage\.objects for (all|update|delete) to authenticated/i);
    expect(migration).toContain('owner_id=(select auth.uid()::text)');
    expect(migration).toContain('(storage.foldername(name))[1]=(select auth.uid())::text');
  });
  it('does not grant direct client writes to candidate tables',()=>{
    expect(migration).not.toMatch(/grant\s+(insert|update|delete|all).*career_documents.*authenticated/i);
    expect(migration).toContain('Membership alone never grants career-data access');
  });
});
