import type { ApplicationStatus, ApplicationRecord } from '../types.ts';
export const statusLabels: Record<ApplicationStatus,string> = { saved:'Saved',preparing:'Preparing',ready:'Ready for review',approved:'Approved',applied:'Submitted — user confirmed',screening:'Screening',interviewing:'Interviewing',offer:'Offer',accepted:'Accepted',rejected:'Rejected',withdrawn:'Withdrawn',archived:'Closed' };
export const transitions: Record<ApplicationStatus,ApplicationStatus[]> = {
  saved:['preparing','withdrawn','archived'], preparing:['saved','ready','withdrawn','archived'], ready:['preparing','approved','withdrawn','archived'],
  approved:['preparing','applied','withdrawn','archived'], applied:['screening','interviewing','offer','rejected','withdrawn','archived'],
  screening:['interviewing','offer','rejected','withdrawn','archived'], interviewing:['offer','rejected','withdrawn','archived'],
  offer:['accepted','rejected','withdrawn','archived'], accepted:['archived'], rejected:['archived'], withdrawn:['archived'], archived:['saved'],
};
export function validateTransition(previous: ApplicationRecord | undefined, next: ApplicationRecord) {
  if (!previous && next.status !== 'saved') throw new Error('New applications must start as saved.');
  if (previous && previous.vacancyId !== next.vacancyId) throw new Error('Application vacancy cannot be reassigned.');
  if (previous && next.status !== previous.status && !transitions[previous.status].includes(next.status)) throw new Error('Invalid application transition.');
  if (next.status === 'applied' && previous?.status !== 'applied' && (!next.submission?.confirmed || !next.submission.evidence.trim() || Date.parse(next.submission.at) > Date.now())) throw new Error('Submission needs explicit confirmation, date and evidence.');
}
