import { z } from 'zod';
import type { CareerProfile, WorkspaceState } from '../types';
import { safeReferenceUrl } from './safety.ts';

const STORAGE_KEY = 'careerflow.local.workspace.v1';

const id = z.string().min(1).max(120);
const short = z.string().max(500);
const stamp = z.string().datetime();
const status = z.enum(['saved','preparing','ready','approved','applied','screening','interviewing','offer','accepted','rejected','withdrawn','archived']);
const factStatus = z.enum(['user_provided','imported','user_confirmed','derived','suggested','unknown','conflicting']);
export const profileSchema = z.strictObject({
  id, displayName: short, email: z.string().email().max(254), currentRole: short,
  yearsExperience: z.number().int().min(0).max(60), targetRole: short, location: short,
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'flexible']), objective: z.string().max(4000),
  skills: z.array(z.strictObject({ id, name: z.string().trim().min(1).max(120), status: z.enum(['user_declared', 'verified', 'inferred']) })).max(100),
  updatedAt: stamp,
});

const documentSchema = z.strictObject({ id, name: short, sourceType: z.literal('pasted_text'), sourceText: z.string().min(1).max(80000), detectedSections: z.array(short).max(20), verificationStatus: z.enum(['needs_review', 'verified']), createdAt: stamp, version:z.number().int().positive().optional(), kind:z.enum(['master','tailored']).optional(), parentDocumentId:id.optional(), factIds:z.array(id).max(200).optional(), approvedVersion:z.number().int().positive().optional(), history:z.array(z.strictObject({ version:z.number().int().positive(),text:z.string().max(80000),at:stamp })).max(20).optional() });
const vacancySchema = z.strictObject({ id, title: short, company: short, location: short, workMode: z.enum(['remote', 'hybrid', 'onsite', 'flexible']), description: z.string().min(100).max(80000), requiredSkills: z.array(short).max(100), sourceUrl: z.string().max(2048).refine(safeReferenceUrl,'Use a public HTTPS reference URL.').optional(), importedAt: stamp, availability:z.enum(['unknown','expired','closed','unavailable']).optional(),sourceKind:z.enum(['user_content','fixture']).optional() });
const dimensionSchema = z.strictObject({ key: z.enum(['skills', 'seniority', 'location', 'workMode', 'careerDirection']), label: short, score: z.number().min(0).max(100).nullable(), explanation: short, evidence: z.array(short).max(100) });
const matchReportSchema = z.strictObject({ id, vacancyId: id, overallScore: z.number().min(0).max(100).nullable(), dimensions: z.array(dimensionSchema).max(10), strengths: z.array(short).max(100), gaps: z.array(short).max(100), seniorityWarning: short.nullable(), createdAt: stamp,rubricVersion:short.optional() });
const applicationSchema = z.strictObject({ id, vacancyId: id, status, nextAction: short, updatedAt: stamp, notes:z.string().max(8000).optional(),submission:z.strictObject({ confirmed:z.literal(true),at:stamp,evidence:z.string().trim().min(1).max(2000),documentVersions:z.array(z.strictObject({ id,version:z.number().int().positive() })).max(20) }).optional(),history:z.array(z.strictObject({from:status,to:status,at:stamp,origin:z.enum(['manual_confirmation','user','agent_preparation'])})).max(200).optional() });
const interviewPlanSchema = z.strictObject({ id, vacancyId: id, questions: z.array(z.strictObject({ id, prompt: short, focus: short, notes: z.string().max(8000).optional() })).max(30), createdAt: stamp });
const factSchema = z.strictObject({ id,category:z.enum(['employment','responsibility','achievement','education','certification','skill','language','preference']),text:z.string().min(1).max(4000),status:factStatus,sourceDocumentId:id.optional(),sourceQuote:z.string().max(4000).optional(),locked:z.boolean(),version:z.number().int().positive(),history:z.array(z.strictObject({version:z.number().int().positive(),text:z.string().max(4000),status:factStatus,at:stamp})).max(50) });

export const workspaceSchema = z.strictObject({
  profile: profileSchema.nullable(),
  actions: z.array(z.strictObject({
    id, title: short, explanation: short,
    priority: z.enum(['high', 'medium', 'low']), href: z.enum(['/profile','/journey','/cv','/jobs','/applications','/interviews']), completed: z.boolean(), snoozedUntil: stamp.optional(),
  })).max(500),
  stageProgress: z.array(z.number().min(0).max(100)).length(10),
  consentAcceptedAt: z.string().nullable(),
  documents: z.array(documentSchema).max(50).default([]),
  vacancies: z.array(vacancySchema).max(200).default([]),
  matchReports: z.array(matchReportSchema).max(200).default([]),
  applications: z.array(applicationSchema).max(200).default([]),
  interviewPlans: z.array(interviewPlanSchema).max(200).default([]),
  facts:z.array(factSchema).max(200).optional(),
}).superRefine((state,ctx)=>{
  const bad=(message:string)=>ctx.addIssue({code:'custom',message});
  for (const list of [state.documents,state.vacancies,state.applications,state.matchReports,state.interviewPlans,state.facts || [],state.profile?.skills || []]) if (new Set(list.map(x=>x.id)).size!==list.length) bad('Duplicate record IDs.');
  const vacancyIds=new Set(state.vacancies.map(x=>x.id)), documentIds=new Set(state.documents.map(x=>x.id));
  for (const item of [...state.applications,...state.matchReports,...state.interviewPlans]) if (!vacancyIds.has(item.vacancyId)) bad('Referenced vacancy is missing.');
  if (new Set(state.applications.map(x=>x.vacancyId)).size!==state.applications.length) bad('An application already exists for this vacancy.');
  for (const fact of state.facts || []) if (fact.sourceDocumentId && !documentIds.has(fact.sourceDocumentId)) bad('Fact source document is missing.');
  for (const document of state.documents) if (document.parentDocumentId && (!documentIds.has(document.parentDocumentId) || document.parentDocumentId===document.id)) bad('Master source document is missing.');
});

export const emptyWorkspace: WorkspaceState = {
  profile: null,
  consentAcceptedAt: null,
  stageProgress: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  actions: [
    { id: 'complete-profile', title: 'Build your career foundation', explanation: 'Add the facts CareerFlow needs before it can support later workflows.', priority: 'high', href: '/profile', completed: false },
    { id: 'review-journey', title: 'Explore your ten-stage journey', explanation: 'See how every career workflow connects without forcing a linear path.', priority: 'medium', href: '/journey', completed: false },
  ],
  documents: [],
  vacancies: [],
  matchReports: [],
  applications: [],
  interviewPlans: [],
};

export function loadWorkspace(storage: Pick<Storage, 'getItem'> = localStorage): WorkspaceState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(emptyWorkspace);
    return workspaceSchema.parse(JSON.parse(raw));
  } catch {
    return structuredClone(emptyWorkspace);
  }
}

export function saveWorkspace(state: WorkspaceState, storage: Pick<Storage, 'setItem'> = localStorage) {
  workspaceSchema.parse(state);
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function profileCompleteness(profile: CareerProfile | null) {
  if (!profile) return 0;
  const values = [profile.displayName, profile.email, profile.currentRole, profile.targetRole, profile.location, profile.objective];
  const filled = values.filter((value) => value.trim().length > 0).length;
  return Math.round(((filled + (profile.skills.length > 0 ? 1 : 0)) / 7) * 100);
}

export function makeProfile(input: Omit<CareerProfile, 'id' | 'updatedAt' | 'skills'> & { skills: string[] }, existing?: CareerProfile | null): CareerProfile {
  return {
    ...input,
    id: existing?.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
    skills: [...new Map(input.skills.map(name => name.trim()).filter(Boolean).map(name=>[name.toLowerCase(),name])).values()].map((name) => existing?.skills.find(skill => skill.name.toLowerCase() === name.toLowerCase()) || ({ id: crypto.randomUUID(), name, status: 'user_declared' as const })),
  };
}
