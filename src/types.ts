export type EvidenceStatus = 'user_declared' | 'verified' | 'inferred';

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

export interface WorkspaceState {
  profile: CareerProfile | null;
  actions: ActionItem[];
  stageProgress: number[];
  consentAcceptedAt: string | null;
}

