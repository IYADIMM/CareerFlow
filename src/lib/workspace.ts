import { z } from 'zod';
import type { CareerProfile, WorkspaceState } from '../types';

const STORAGE_KEY = 'careerflow.local.workspace.v1';

export const profileSchema = z.object({
  id: z.string(), displayName: z.string(), email: z.string().email(), currentRole: z.string(),
  yearsExperience: z.number().int().min(0).max(60), targetRole: z.string(), location: z.string(),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'flexible']), objective: z.string(),
  skills: z.array(z.object({ id: z.string(), name: z.string(), status: z.enum(['user_declared', 'verified', 'inferred']) })),
  updatedAt: z.string(),
});

const documentSchema = z.object({ id: z.string(), name: z.string(), sourceType: z.literal('pasted_text'), sourceText: z.string(), detectedSections: z.array(z.string()), verificationStatus: z.enum(['needs_review', 'verified']), createdAt: z.string() });
const vacancySchema = z.object({ id: z.string(), title: z.string(), company: z.string(), location: z.string(), workMode: z.enum(['remote', 'hybrid', 'onsite', 'flexible']), description: z.string(), requiredSkills: z.array(z.string()), sourceUrl: z.string().optional(), importedAt: z.string() });
const dimensionSchema = z.object({ key: z.enum(['skills', 'seniority', 'location', 'workMode', 'careerDirection']), label: z.string(), score: z.number().min(0).max(100), explanation: z.string(), evidence: z.array(z.string()) });
const matchReportSchema = z.object({ id: z.string(), vacancyId: z.string(), overallScore: z.number().min(0).max(100), dimensions: z.array(dimensionSchema), strengths: z.array(z.string()), gaps: z.array(z.string()), seniorityWarning: z.string().nullable(), createdAt: z.string() });
const applicationSchema = z.object({ id: z.string(), vacancyId: z.string(), status: z.enum(['saved', 'preparing', 'ready', 'applied', 'screening', 'interviewing', 'offer', 'accepted', 'rejected', 'withdrawn', 'archived']), nextAction: z.string(), updatedAt: z.string() });
const interviewPlanSchema = z.object({ id: z.string(), vacancyId: z.string(), questions: z.array(z.object({ id: z.string(), prompt: z.string(), focus: z.string(), notes: z.string().optional() })), createdAt: z.string() });

export const workspaceSchema = z.object({
  profile: profileSchema.nullable(),
  actions: z.array(z.object({
    id: z.string(), title: z.string(), explanation: z.string(),
    priority: z.enum(['high', 'medium', 'low']), href: z.string(), completed: z.boolean(), snoozedUntil: z.string().optional(),
  })),
  stageProgress: z.array(z.number().min(0).max(100)).length(10),
  consentAcceptedAt: z.string().nullable(),
  documents: z.array(documentSchema).default([]),
  vacancies: z.array(vacancySchema).default([]),
  matchReports: z.array(matchReportSchema).default([]),
  applications: z.array(applicationSchema).default([]),
  interviewPlans: z.array(interviewPlanSchema).default([]),
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
    skills: [...new Set(input.skills.map(name => name.trim()).filter(Boolean))].map((name) => existing?.skills.find(skill => skill.name.toLowerCase() === name.toLowerCase()) || ({ id: crypto.randomUUID(), name, status: 'user_declared' as const })),
  };
}
