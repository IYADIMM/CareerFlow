export type EvidenceStatus = 'user_declared' | 'verified' | 'inferred';
export type FactStatus = 'user_provided' | 'imported' | 'user_confirmed' | 'derived' | 'suggested' | 'unknown' | 'conflicting';
export interface CareerFact {
  id: string; category: 'employment' | 'responsibility' | 'achievement' | 'education' | 'certification' | 'skill' | 'language' | 'preference';
  text: string; status: FactStatus; sourceDocumentId?: string; sourceQuote?: string; locked: boolean;
  version: number; history: Array<{ version: number; text: string; status: FactStatus; at: string }>;
}

export interface CareerProfile {
  id: string;
  displayName: string;
  email: string;
  currentRole: string;
  yearsExperience: number;
  targetRole: string;
  location: string;
  workMode: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  objective: string;
  skills: Array<{ id: string; name: string; status: EvidenceStatus }>;
  updatedAt: string;
}

export interface ActionItem {
  id: string;
  title: string;
  explanation: string;
  priority: 'high' | 'medium' | 'low';
  href: string;
  completed: boolean;
  snoozedUntil?: string;
}

export interface CareerDocument {
  id: string;
  name: string;
  sourceType: 'pasted_text';
  sourceText: string;
  detectedSections: string[];
  verificationStatus: 'needs_review' | 'verified';
  createdAt: string;
  version?: number;
  kind?: 'master' | 'tailored';
  parentDocumentId?: string;
  factIds?: string[];
  approvedVersion?: number;
  history?: Array<{ version: number; text: string; at: string }>;
}

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: CareerProfile['workMode'];
  description: string;
  requiredSkills: string[];
  sourceUrl?: string;
  importedAt: string;
  availability?: 'unknown' | 'expired' | 'closed' | 'unavailable';
  sourceKind?: 'user_content' | 'fixture';
}

export interface MatchDimension {
  key: 'skills' | 'seniority' | 'location' | 'workMode' | 'careerDirection';
  label: string;
  score: number | null;
  explanation: string;
  evidence: string[];
}

export interface MatchReport {
  id: string;
  vacancyId: string;
  overallScore: number | null;
  dimensions: MatchDimension[];
  strengths: string[];
  gaps: string[];
  seniorityWarning: string | null;
  createdAt: string;
  rubricVersion?: string;
}

export type ApplicationStatus = 'saved' | 'preparing' | 'ready' | 'approved' | 'applied' | 'screening' | 'interviewing' | 'offer' | 'accepted' | 'rejected' | 'withdrawn' | 'archived';

export interface ApplicationRecord {
  id: string;
  vacancyId: string;
  status: ApplicationStatus;
  nextAction: string;
  updatedAt: string;
  notes?: string;
  submission?: { confirmed: true; at: string; evidence: string; documentVersions: Array<{ id: string; version: number }> };
  history?: Array<{ from: ApplicationStatus; to: ApplicationStatus; at: string; origin: 'manual_confirmation' | 'user' | 'agent_preparation' }>;
}

export interface InterviewPlan {
  id: string;
  vacancyId: string;
  questions: Array<{ id: string; prompt: string; focus: string; notes?: string }>;
  createdAt: string;
}

export interface WorkspaceState {
  profile: CareerProfile | null;
  actions: ActionItem[];
  stageProgress: number[];
  consentAcceptedAt: string | null;
  documents: CareerDocument[];
  vacancies: Vacancy[];
  matchReports: MatchReport[];
  applications: ApplicationRecord[];
  interviewPlans: InterviewPlan[];
  facts?: CareerFact[];
}
