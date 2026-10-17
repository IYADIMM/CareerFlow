import type { WorkspaceState } from '../src/types.ts';
import { validateTransition } from '../src/lib/applications.ts';
import { calculateMatch } from '../src/lib/intelligence.ts';

export function reconcileWorkspace(previous: WorkspaceState, next: WorkspaceState): WorkspaceState {
  const now=new Date().toISOString();
  if (previous.profile && next.profile && previous.profile.id!==next.profile.id) throw new Error('Profile identity cannot be reassigned.');
  for (const skill of next.profile?.skills || []) {
    const old=previous.profile?.skills.find(item=>item.name.toLowerCase()===skill.name.toLowerCase());
    if (old && old.id!==skill.id) throw new Error('Existing skill identity must be preserved.');
  }
  const changedFacts=new Set<string>();
  next.facts=(next.facts || []).map(fact=>{
    const old=previous.facts?.find(item=>item.id===fact.id);
    const changed=!!old && (old.text!==fact.text || old.status!==fact.status || old.sourceDocumentId!==fact.sourceDocumentId || old.sourceQuote!==fact.sourceQuote);
    if (old?.locked && (changed || !fact.locked && old.text!==fact.text)) throw new Error('Unlock this fact in a separate save before changing it.');
    if (fact.sourceDocumentId) {
      const source=next.documents.find(document=>document.id===fact.sourceDocumentId);
      if (!fact.sourceQuote || !source?.sourceText.includes(fact.sourceQuote)) throw new Error('Source quote must occur in the selected document.');
    }
    if (changed) changedFacts.add(fact.id);
    return {...fact,version:old ? old.version+(changed?1:0):1,history:old ? changed ? [...old.history,{version:old.version,text:old.text,status:old.status,at:now}].slice(-50):old.history:[]};
  });
  for (const fact of previous.facts || []) if (!next.facts.some(item=>item.id===fact.id)) { if (fact.locked && next.profile) throw new Error('Unlock the fact before deleting it.'); changedFacts.add(fact.id); }
  next.documents=next.documents.map(document=>{
    const old=previous.documents.find(item=>item.id===document.id);
    if (old && (old.parentDocumentId!==document.parentDocumentId || (old.kind || 'master')!==(document.kind || 'master'))) throw new Error('Document source binding cannot change.');
    const changed=!!old && (old.sourceText!==document.sourceText || old.name!==document.name || JSON.stringify(old.factIds)!==JSON.stringify(document.factIds));
    const evidenceChanged=document.factIds?.some(id=>changedFacts.has(id) || !next.facts?.some(f=>f.id===id));
    const version=old ? (old.version || 1)+(changed?1:0):1;
    const confirmed=document.verificationStatus==='verified' && !changed && !evidenceChanged;
    return {...document,version,verificationStatus:confirmed?'verified':'needs_review',approvedVersion:confirmed?version:undefined,history:old ? changed ? [...(old.history || []),{version:old.version || 1,text:old.sourceText,at:now}].slice(-20):old.history || []:[]};
  });
  next.applications=next.applications.map(application=>{
    const old=previous.applications.find(item=>item.id===application.id);
    validateTransition(old,application);
    if (application.status==='applied' && old?.status!=='applied') for (const version of application.submission?.documentVersions || []) {
      const document=next.documents.find(item=>item.id===version.id);
      if (!document || document.approvedVersion!==version.version || document.version!==version.version) throw new Error('Only the exact approved document versions can be recorded as submitted.');
    }
    const changed=old && old.status!==application.status;
    return {...application,submission:old?.submission || application.submission,history:changed ? [...(old.history || []),{from:old.status,to:application.status,at:now,origin:application.status==='applied'?'manual_confirmation' as const:'user' as const}].slice(-200):old?.history || [],updatedAt:old && JSON.stringify({...old,updatedAt:''})===JSON.stringify({...application,updatedAt:''}) ? old.updatedAt:now};
  });
  // Reports and progress are derived from saved records, never trusted client statistics.
  if (next.profile) next.matchReports=next.matchReports.map(report=>({...calculateMatch(next.profile!,next.vacancies.find(v=>v.id===report.vacancyId)!),id:report.id,createdAt:report.createdAt}));
  next.stageProgress=[next.profile?100:0,0,next.documents.some(d=>d.approvedVersion===d.version)?100:0,next.matchReports.length?100:0,0,next.applications.length?100:0,next.interviewPlans.length?100:0,0,0,0];
  return next;
}
