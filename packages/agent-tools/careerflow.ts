import { createHash } from 'node:crypto';
import type { AgentTool, Draft } from '../agent-core/index.ts';
import type { CareerProfile } from '../../src/types.ts';
export interface TargetCompany { id: string; name: string; source: 'fixture'; enabled: boolean }
export interface SourceVacancy { id: string; company: string; title: string; url: string; publishedAt: string; observedAt: string; description: string; permission: 'fixture' | 'licensed' | 'unknown'; salary?: { annual: number; currency: string } }
export interface SourceAdapter { id: string; permission: 'fixture' | 'licensed'; discover(companies: TargetCompany[], now: Date): SourceVacancy[] }
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const requirementVocabulary = ['commercial strategy','negotiation','team leadership','procurement','financial planning','python','project management'];
export function extractRequirements(description: string) {
  // Ignore text outside the labeled Requirements block. It remains untrusted data.
  const block = description.split(/Requirements:/i)[1]?.split(/\n\s*\n/)[0] || '';
  return requirementVocabulary.filter(skill => new RegExp(`\\b${skill}\\b`, 'i').test(block));
}
export const fixtureSource: SourceAdapter = {
  id: 'careerflow-fixtures-v1', permission: 'fixture',
  discover(companies, now) {
    const wanted = companies.filter(c => c.enabled).map(c => c.name);
    const stamp = (days: number) => new Date(now.getTime() - days * 86400_000).toISOString();
    const records: SourceVacancy[] = [
      { id: 'demo-director', company: 'Demo Meridian', title: 'Commercial Director', url: 'https://meridian.example.invalid/jobs/director', publishedAt: stamp(2), observedAt: stamp(0), description: 'Lead the regional commercial function.\nRequirements: commercial strategy; negotiation; team leadership.\n\nDevelop an evidence-led regional plan.', permission: 'fixture', salary: { annual: 300000, currency: 'AED' } },
      { id: 'demo-director-repost', company: 'Demo Meridian', title: 'Commercial Director', url: 'https://meridian.example.invalid/jobs/director-repost', publishedAt: stamp(1), observedAt: stamp(0), description: 'Lead the regional commercial function.\nRequirements: commercial strategy; negotiation; team leadership.\n\nDevelop an evidence-led regional plan.', permission: 'fixture' },
      { id: 'demo-assistant', company: 'Demo Horizon', title: 'Commercial Assistant', url: 'https://horizon.example.invalid/jobs/assistant', publishedAt: stamp(3), observedAt: stamp(0), description: 'Support the commercial operations team.\nRequirements: negotiation; procurement.\n\nReport to a team supervisor.', permission: 'fixture' },
      { id: 'demo-expired', company: 'Demo Meridian', title: 'Commercial Manager', url: 'https://meridian.example.invalid/jobs/expired', publishedAt: stamp(65), observedAt: stamp(0), description: 'A historic vacancy.\nRequirements: commercial strategy.\n\nDo not treat as currently available.', permission: 'fixture' },
    ];
    return records.filter(record => wanted.includes(record.company));
  },
};
export function verifySource(vacancy: SourceVacancy, now: Date): string | null {
  let url: URL;
  try { url = new URL(vacancy.url); } catch { return 'Invalid source URL'; }
  if (vacancy.permission !== 'fixture') return 'A live licensed adapter has not been authorized';
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.example.invalid') || url.username || url.password) return 'Fixture provenance boundary failed';
  const age = (now.getTime() - Date.parse(vacancy.publishedAt)) / 86400_000;
  const observedAge = (now.getTime() - Date.parse(vacancy.observedAt)) / 86400_000;
  if (!Number.isFinite(age) || age < 0 || age > 30 || !Number.isFinite(observedAge) || observedAge < 0 || observedAge > 1) return 'Vacancy is stale or has invalid dates';
  return null;
}
export const discoverTool: AgentTool<{ companies: TargetCompany[]; now: Date }, SourceVacancy[]> = {
  name: 'careerflow.fixture-discovery', action: 'read', maxAttempts: 2,
  async execute(input) { return fixtureSource.discover(input.companies, input.now); },
};
export function deduplicate(records: SourceVacancy[]) {
  const seen = new Set<string>(); let duplicates = 0;
  const vacancies = records.filter(record => {
    const key = digest(`${normalize(record.company)}:${normalize(record.title)}:${normalize(record.description)}`);
    if (seen.has(key)) { duplicates++; return false; } seen.add(key); return true;
  });
  return { vacancies, duplicates };
}
function rank(title: string): number | null {
  const terms: Array<[RegExp, number]> = [[/\bchief|\bpresident|\bceo\b/i,6],[/vice president|general manager/i,5],[/director|head of/i,4],[/senior manager|principal/i,3],[/manager/i,2],[/analyst|associate|coordinator/i,1],[/assistant|intern|trainee/i,0]];
  return terms.find(([pattern]) => pattern.test(title))?.[1] ?? null;
}
export function prepareDraft(profile: CareerProfile, vacancy: SourceVacancy, targetSalary?: { annual: number; currency: string }): Draft {
  const requirements = extractRequirements(vacancy.description);
  const usable = profile.skills.filter(skill => skill.status !== 'inferred');
  const overlap = requirements.filter(requirement => usable.some(skill => normalize(skill.name) === requirement));
  const gaps = requirements.filter(requirement => !overlap.includes(requirement));
  const current = rank(profile.currentRole), target = rank(vacancy.title);
  const seniorityWarning = current !== null && target !== null && target < current ? 'This role title signals reduced seniority. Reporting level, team scope and budget still need human review.' : null;
  const compensation = targetSalary && vacancy.salary && targetSalary.currency === vacancy.salary.currency ? { score: Math.min(100, Math.round(vacancy.salary.annual / targetSalary.annual * 100)), explanation: `Synthetic annual ${vacancy.salary.annual} ${vacancy.salary.currency}; target ${targetSalary.annual}. Excludes noncash benefits.` } : { score: null, explanation: 'Unknown: comparable salary evidence or target currency is missing.' };
  const direction = normalize(vacancy.title) === normalize(profile.targetRole);
  const skillsScore = requirements.length ? Math.round(100 * overlap.length / requirements.length) : 0;
  const score = Math.round(skillsScore * .6 + (seniorityWarning ? 20 : 70) * .2 + (direction ? 100 : 40) * .2);
  const evidence = [`Name: ${profile.displayName}`, `Current role: ${profile.currentRole}`, `Experience: ${profile.yearsExperience} years`, ...overlap.map(skill => `Declared skill: ${skill}`)];
  // The draft is composed only from candidate evidence; vacancy text cannot inject qualifications.
  const text = `${profile.displayName}\n${profile.currentRole} | ${profile.yearsExperience} years of experience\n\nRelevant declared skills\n${overlap.length ? overlap.map(skill => `- ${skill}`).join('\n') : '- No confirmed overlap yet'}\n\nCareer objective (user-declared)\n${profile.objective}\n\nReview note: This draft includes only saved candidate statements. Employment chronology and achievements must be added from verified source records.`;
  return { vacancyId: vacancy.id, text, evidence, gaps, score, seniorityWarning, compensation, hash: digest(text + vacancy.id) };
}
