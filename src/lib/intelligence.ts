import type { CareerDocument, CareerProfile, InterviewPlan, MatchDimension, MatchReport, Vacancy } from '../types';
import { safeReferenceUrl } from './safety.ts';

const sectionMatchers: Array<[string, RegExp]> = [
  ['Professional summary', /\b(summary|profile|objective)\b/i],
  ['Experience', /\b(experience|employment|career history)\b/i],
  ['Education', /\b(education|academic|degree)\b/i],
  ['Skills', /\b(skills|competencies|expertise)\b/i],
  ['Certifications', /\b(certifications?|licenses?)\b/i],
  ['Achievements', /\b(achievements?|accomplishments?|awards?)\b/i],
];

export function createTextDocument(name: string, sourceText: string): CareerDocument {
  const text = sourceText.trim();
  if (text.length < 120) throw new Error('Add at least 120 characters so the document can be reviewed meaningfully.');
  if (text.length > 80_000) throw new Error('Text import is limited to 80,000 characters.');
  const detectedSections = sectionMatchers.filter(([, matcher]) => matcher.test(text)).map(([label]) => label);
  return { id: crypto.randomUUID(), name: name.trim() || 'Master CV', sourceType: 'pasted_text', sourceText: text, detectedSections, verificationStatus: 'needs_review', version:1,kind:'master',history:[],createdAt: new Date().toISOString() };
}

export function createVacancy(input: Omit<Vacancy, 'id' | 'importedAt' | 'requiredSkills'> & { requiredSkills: string[] }): Vacancy {
  if (input.description.trim().length < 100) throw new Error('Add at least 100 characters of vacancy text for a meaningful comparison.');
  if (input.sourceUrl && !safeReferenceUrl(input.sourceUrl)) throw new Error('Use a public HTTPS source URL. Internal addresses and other protocols are not supported.');
  return { ...input, title: input.title.trim(), company: input.company.trim(), description: input.description.trim(), requiredSkills: unique(input.requiredSkills.map(normalizeDisplay).filter(Boolean)), id: crypto.randomUUID(), importedAt: new Date().toISOString(), availability:'unknown',sourceKind:'user_content' };
}

const seniorityTerms: Array<[number, RegExp]> = [
  [6, /\b(chief|c-suite|ceo|cfo|coo|cto|president)\b/i],
  [5, /\b(vice president|vp|general manager|managing director)\b/i],
  [4, /\b(director|head of|regional lead)\b/i],
  [3, /\b(senior manager|lead|principal)\b/i],
  [2, /\b(manager|specialist|consultant)\b/i],
  [1, /\b(associate|coordinator|analyst|executive)\b/i],
  [0, /\b(intern|assistant|trainee|junior)\b/i],
];

export function seniorityRank(title: string) { return seniorityTerms.find(([, matcher]) => matcher.test(title))?.[0] ?? 2; }
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();
const normalizeDisplay = (value: string) => value.trim().replace(/\s+/g, ' ');
const unique = (values: string[]) => [...new Set(values)];

export function calculateMatch(profile: CareerProfile, vacancy: Vacancy): MatchReport {
  const profileSkills = profile.skills.filter(skill=>skill.status!=='inferred').map((skill) => normalized(skill.name));
  const required = vacancy.requiredSkills.map(normalized);
  const matched = vacancy.requiredSkills.filter((_, index) => profileSkills.includes(required[index]));
  const missing = vacancy.requiredSkills.filter((skill) => !matched.includes(skill));
  const skillsScore = required.length ? Math.round((matched.length / required.length) * 100) : null;
  const currentRank = Math.max(seniorityRank(profile.currentRole), seniorityRank(profile.targetRole));
  const vacancyRank = seniorityRank(vacancy.title);
  const rankDelta = vacancyRank - currentRank;
  const seniorityScore = rankDelta >= 0 ? Math.max(65, 100 - rankDelta * 10) : Math.max(20, 70 + rankDelta * 25);
  const locationMatch = normalized(vacancy.location).includes(normalized(profile.location)) || vacancy.workMode === 'remote' || profile.workMode === 'flexible';
  const workModeMatch = profile.workMode === 'flexible' || vacancy.workMode === 'flexible' || profile.workMode === vacancy.workMode;
  const targetWords = normalized(profile.targetRole).split(' ').filter((word) => word.length > 3);
  const titleText = normalized(vacancy.title);
  const careerMatch = targetWords.some((word) => titleText.includes(word));
  const dimensions: MatchDimension[] = [
    { key: 'skills', label: 'Technical fit', score: skillsScore, explanation: `${matched.length} of ${required.length || 0} stated requirements connect to user-declared skills.`, evidence: matched.length ? matched : ['No confirmed skill overlap'] },
    { key: 'seniority', label: 'Seniority fit', score: seniorityScore, explanation: rankDelta < 0 ? 'The vacancy title signals less scope than the current or target direction.' : 'The vacancy title appears broadly consistent with the current or target level.', evidence: [`Current: ${profile.currentRole}`, `Target: ${profile.targetRole}`, `Vacancy: ${vacancy.title}`] },
    { key: 'location', label: 'Location fit', score: locationMatch ? 100 : 45, explanation: locationMatch ? 'The location or remote model fits the saved preference.' : 'The vacancy location differs from the saved preference.', evidence: [`Preference: ${profile.location}`, `Vacancy: ${vacancy.location}`] },
    { key: 'workMode', label: 'Working model fit', score: workModeMatch ? 100 : 35, explanation: workModeMatch ? 'The working model fits the saved preference.' : 'The working model conflicts with the saved preference.', evidence: [`Preference: ${profile.workMode}`, `Vacancy: ${vacancy.workMode}`] },
    { key: 'careerDirection', label: 'Career direction', score: careerMatch ? 90 : 55, explanation: careerMatch ? 'The vacancy title overlaps with the saved target direction.' : 'The title does not clearly align with the saved target role.', evidence: [`Target: ${profile.targetRole}`, `Vacancy: ${vacancy.title}`] },
  ];
  const weights: Record<MatchDimension['key'], number> = { skills: .35, seniority: .25, location: .1, workMode: .1, careerDirection: .2 };
  const overallScore = skillsScore===null ? null : Math.round(dimensions.reduce((sum, item) => sum + (item.score || 0) * weights[item.key], 0));
  return {
    id: crypto.randomUUID(), vacancyId: vacancy.id, overallScore, dimensions,rubricVersion:'manual-v2: skills35/seniority25/location10/workMode10/direction20; unknown requirements=no overall score',
    strengths: [matched.length ? `User-stated overlap (not independently verified): ${matched.join(', ')}` : '', locationMatch ? 'Location preference is compatible.' : '', workModeMatch ? 'Working model is compatible.' : ''].filter(Boolean),
    gaps: [missing.length ? `Unverified requirements: ${missing.join(', ')}` : '', !careerMatch ? 'Role title needs a closer career-direction review.' : ''].filter(Boolean),
    seniorityWarning: rankDelta < 0 ? `Seniority review recommended: “${vacancy.title}” may represent a lower level than “${profile.currentRole}” or your target direction.` : null,
    createdAt: new Date().toISOString(),
  };
}

export function buildInterviewPlan(profile: CareerProfile, vacancy: Vacancy): InterviewPlan {
  const prompts = [
    [`What attracted you to the ${vacancy.title} role at ${vacancy.company}?`, 'Motivation and career direction'],
    [`Describe a result that best demonstrates your readiness for ${vacancy.title}.`, 'Evidence and measurable impact'],
    [`Tell me about a time you influenced a difficult stakeholder.`, 'Communication and negotiation'],
    [`Which requirement in this role would stretch you most, and how would you close that gap?`, 'Self-awareness and learning'],
    [`What scope and decision-making responsibility are you looking for next?`, 'Seniority alignment'],
  ];
  return { id: crypto.randomUUID(), vacancyId: vacancy.id, questions: prompts.map(([prompt, focus]) => ({ id: crypto.randomUUID(), prompt, focus: `${focus}. Keep examples grounded in ${profile.displayName}'s verified or declared experience.` })), createdAt: new Date().toISOString() };
}
