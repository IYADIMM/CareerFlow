import { FormEvent, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CareerProfile, MatchReport, Vacancy, WorkspaceState } from './types';
import { emptyWorkspace, makeProfile, profileCompleteness } from './lib/workspace';
import { buildInterviewPlan, calculateMatch, createTextDocument, createVacancy } from './lib/intelligence';
import { AgentPage } from './AgentPage';
import { ApplicationsPage } from './ApplicationsPage';
import { EvidencePanel } from './EvidencePanel';
import { DocumentReview } from './DocumentReview';
import { api, setSession } from './lib/api';
import type { DevSession } from './lib/api';
import './app.css';
import './workflows.css';

const queryClient = new QueryClient();
const stages = [
  ['01', 'Career strategy', 'Shape a grounded direction from your experience.'],
  ['02', 'Skills', 'Turn gaps into a measurable development plan.'],
  ['03', 'CV studio', 'Create evidence-led career documents.'],
  ['04', 'Job discovery', 'Evaluate opportunities against your direction.'],
  ['05', 'Networking', 'Manage trusted professional relationships.'],
  ['06', 'Applications', 'Prepare, submit and track with intention.'],
  ['07', 'Interview prep', 'Practice relevant questions and stories.'],
  ['08', 'Assessments', 'Track interviews, tasks and feedback.'],
  ['09', 'Offers', 'Compare scope, compensation and trade-offs.'],
  ['10', 'Career growth', 'Keep momentum after the next move.'],
] as const;

function Welcome({ profile }: { profile: CareerProfile | null }) {
  return (
    <main className="welcome-page">
      <div className="ambient" aria-hidden="true" />
      <section className="welcome-card">
        <a className="app-brand" href="./index.html" aria-label="CareerFlow AI home"><BrandMark /> careerflow<span>.ai</span></a>
        <p className="eyebrow">LOCAL PRODUCT FOUNDATION / 001</p>
        <h1>Your career story.<br /><em>Finally connected.</em></h1>
        <p className="lede">Build a private career profile and see your next actions take shape. Sign in to the local development workspace to save synthetic test data. Hosted customer storage, live job sources, AI providers and payments remain unavailable.</p>
        <div className="notice"><strong>Honest demo mode</strong><span>Use synthetic information while evaluating the product. This local environment is for synthetic evaluation only.</span></div>
        <div className="welcome-actions">
          <Link className="primary-action" to={profile ? '/dashboard' : '/agent'}>{profile ? 'RETURN TO COMMAND CENTER' : 'SIGN IN TO LOCAL WORKSPACE'} <span>↗</span></Link>
          <a className="secondary-action" href="./index.html">BACK TO WEBSITE</a>
        </div>
      </section>
    </main>
  );
}

function AppOutletShell({ workspace, authenticated }: { workspace: WorkspaceState; authenticated: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location=useLocation();
  const mainRef=useRef<HTMLElement>(null),menuRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{setMenuOpen(false);mainRef.current?.focus();},[location.pathname]);
  useEffect(()=>{if(!menuOpen)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMenuOpen(false);menuRef.current?.focus();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[menuOpen]);
  return <div className="app-shell">
    <a href="#main-content" className="skip-link" onClick={e=>{e.preventDefault();mainRef.current?.focus();}}>Skip to main content</a>
    <aside id="app-sidebar" className={menuOpen ? 'sidebar is-open' : 'sidebar'}>
      <a className="app-brand" href="./index.html"><BrandMark /> careerflow<span>.ai</span></a>
      <button className="menu-button close-menu" type="button" onClick={() => setMenuOpen(false)}>CLOSE NAVIGATION</button>
      <p className="side-label">CAREER OPERATING SYSTEM</p>
      <nav aria-label="Application navigation">
        <NavLink to="/agent" onClick={() => setMenuOpen(false)}>Opportunity Agent <span>↗</span></NavLink>
        <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Command center <span>01</span></NavLink>
        <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Career profile <span>02</span></NavLink>
        <NavLink to="/cv" onClick={() => setMenuOpen(false)}>CV studio <span>03</span></NavLink>
        <NavLink to="/jobs" onClick={() => setMenuOpen(false)}>Job matches <span>04</span></NavLink>
        <NavLink to="/applications" onClick={() => setMenuOpen(false)}>Applications <span>06</span></NavLink>
        <NavLink to="/interviews" onClick={() => setMenuOpen(false)}>Interview prep <span>07</span></NavLink>
        <NavLink to="/journey" onClick={() => setMenuOpen(false)}>Journey map <span>10</span></NavLink>
        <NavLink to="/settings" onClick={() => setMenuOpen(false)}>Settings <span>••</span></NavLink>
      </nav>
      <div className="side-status"><span className="status-dot" /> {authenticated ? 'LOCAL ACCOUNT' : 'SIGNED OUT'}<p>{authenticated ? 'Saved in your tenant database.' : 'Sign in to save synthetic test data.'}</p></div>
    </aside>
    <div className="app-main">
      <header className="app-header">
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="app-sidebar" ref={menuRef} onClick={() => setMenuOpen((value) => !value)}>MENU</button>
        <div><span className="context-label">PERSONAL WORKSPACE</span><strong>{workspace.profile?.displayName || 'Your workspace'}</strong></div>
        <Link to="/profile" className="header-profile" aria-label="Edit career profile">{initials(workspace.profile?.displayName || 'Career Flow')}</Link>
      </header>
      <main id="main-content" tabIndex={-1} ref={mainRef} className="route-content"><Outlet /></main>
    </div>
  </div>;
}

function Dashboard({ workspace, update }: { workspace: WorkspaceState; update: (recipe: (state: WorkspaceState) => WorkspaceState) => Promise<void> }) {
  const completion = profileCompleteness(workspace.profile);
  const activeActions = workspace.actions.filter((action) => !action.completed);
  return <>
    <PageHead eyebrow="COMMAND CENTER / TODAY" title={workspace.profile ? `Good to see you, ${workspace.profile.displayName.split(' ')[0]}.` : 'Build your career foundation.'} copy="A focused view of what matters now—and how each action supports your bigger direction." />
    <section className="metric-grid" aria-label="Career overview">
      <Metric value={`${completion}%`} label="PROFILE STRENGTH" hint={completion === 100 ? 'Core facts captured' : 'Complete your foundation'} />
      <Metric value={String(activeActions.length).padStart(2, '0')} label="PRIORITY ACTIONS" hint="Based on saved progress" />
      <Metric value={String(workspace.applications.filter((item) => !['accepted','rejected','withdrawn','archived'].includes(item.status)).length).padStart(2, '0')} label="ACTIVE APPLICATIONS" hint={workspace.applications.length ? 'Tracked in your pipeline' : 'No applications recorded'} />
      <Metric value={String(workspace.interviewPlans.length).padStart(2, '0')} label="INTERVIEW PLANS" hint={workspace.interviewPlans.length ? 'Practice plans prepared' : 'Nothing prepared'} />
    </section>
    <div className="dashboard-grid">
      <section className="panel action-panel">
        <div className="panel-head"><div><p className="eyebrow">SMART ACTION ENGINE</p><h2>Your next best moves</h2></div><span>{activeActions.length} OPEN</span></div>
        {activeActions.length ? activeActions.map((action) => <article className="action-row" key={action.id}>
          <span className={`priority ${action.priority}`}>{action.priority}</span>
          <div><h3>{action.title}</h3><p>{action.explanation}</p><Link to={action.href}>CONTINUE <span>↗</span></Link></div>
          <button type="button" onClick={() => update((state) => ({ ...state, actions: state.actions.map((item) => item.id === action.id ? { ...item, completed: true } : item) }))} aria-label={`Mark ${action.title} complete`}>✓</button>
        </article>) : <Empty title="You are clear for now." copy="New recommendations will appear when your saved career activity creates a meaningful next step." />}
      </section>
      <section className="panel objective-panel">
        <p className="eyebrow">CURRENT DIRECTION</p>
        <h2>{workspace.profile?.targetRole || 'No target role yet'}</h2>
        <p>{workspace.profile?.objective || 'Define an objective so CareerFlow can keep every later workflow aligned.'}</p>
        <Link to="/profile">{workspace.profile ? 'REFINE DIRECTION' : 'CREATE PROFILE'} <span>↗</span></Link>
        <div className="objective-orbit" aria-hidden="true"><span /><span /><i /></div>
      </section>
    </div>
    <section className="journey-summary">
      <div className="panel-head"><div><p className="eyebrow">TEN-STAGE JOURNEY</p><h2>One profile. Every move connected.</h2></div><Link to="/journey">EXPLORE MAP ↗</Link></div>
      <div className="mini-stages">{stages.map(([number, name], index) => <div key={number} className={index === 0 && workspace.profile ? 'started' : ''}><span>{number}</span><i /><p>{name}</p></div>)}</div>
    </section>
  </>;
}

function ProfileEditor({ profile, update }: { profile: CareerProfile | null; update: (recipe: (state: WorkspaceState) => WorkspaceState) => Promise<void> }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [saving,setSaving]=useState(false);
  const [profileError, setProfileError] = useState('');
  const [form, setForm] = useState({
    displayName: profile?.displayName || '', email: profile?.email || '', currentRole: profile?.currentRole || '', yearsExperience: profile?.yearsExperience || 0,
    targetRole: profile?.targetRole || '', location: profile?.location || '', workMode: profile?.workMode || 'flexible', objective: profile?.objective || '',
    skills: profile?.skills.map((skill) => skill.name).join(', ') || '',
  });
  const set = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setProfileError('');
    const nextProfile = makeProfile({ ...form, email: form.email, yearsExperience: Number(form.yearsExperience), skills: form.skills.split(',').map((item) => item.trim()) }, profile);
    try { await update((state) => ({ ...state, profile: nextProfile, consentAcceptedAt: state.consentAcceptedAt || new Date().toISOString(), stageProgress: [35, ...state.stageProgress.slice(1)], actions: state.actions.map((item) => item.id === 'complete-profile' ? { ...item, completed: true } : item) })); }
    catch { setProfileError('Your changes could not be saved. Review the workspace error and try again.'); setSaving(false); return; }
    setSaved(true);
    setSaving(false); navigate('/dashboard');
  };
  return <>
    <PageHead eyebrow="CAREER DIGITAL TWIN / FOUNDATION" title="Tell the truth of your experience." copy="Start with user-declared facts. AI-inferred competencies will always remain separately labeled and reviewable when that service is connected." />
    <form className="profile-form panel" onSubmit={submit}>
      <div className="form-section"><p className="eyebrow">01 / IDENTITY</p><div className="form-grid">
        <Field label="Preferred name"><input required value={form.displayName} onChange={(e) => set('displayName', e.target.value)} autoComplete="name" /></Field>
        <Field label="Email"><input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></Field>
        <Field label="Current or most recent role"><input required value={form.currentRole} onChange={(e) => set('currentRole', e.target.value)} /></Field>
        <Field label="Years of experience"><input required type="number" min="0" max="60" value={form.yearsExperience} onChange={(e) => set('yearsExperience', Number(e.target.value))} /></Field>
      </div></div>
      <div className="form-section"><p className="eyebrow">02 / DIRECTION</p><div className="form-grid">
        <Field label="Target role"><input required value={form.targetRole} onChange={(e) => set('targetRole', e.target.value)} /></Field>
        <Field label="Preferred location"><input required value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Working preference"><select value={form.workMode} onChange={(e) => set('workMode', e.target.value)}><option value="flexible">Flexible</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></Field>
        <Field label="Skills (comma separated)"><input required value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Commercial strategy, negotiation" /></Field>
        <Field label="Career objective" wide><textarea required rows={4} value={form.objective} onChange={(e) => set('objective', e.target.value)} placeholder="What should your next chapter make possible?" /></Field>
      </div></div>
      {profileError && <p className="form-error" role="alert">{profileError}</p>}<div className="form-footer"><p><span className="status-dot" /> Uses the workspace storage mode shown in navigation.</p><button className="primary-action" type="submit" disabled={saving}>{saving ? 'SAVING…' : saved ? 'SAVED' : 'SAVE CAREER FOUNDATION'} <span>{saved ? '✓' : '↗'}</span></button></div>
    </form>
  </>;
}

function CvStudio({ workspace, update, reload }: { workspace: WorkspaceState; update: (recipe: (state: WorkspaceState) => WorkspaceState) => Promise<void>; reload:()=>Promise<void> }) {
  const [name, setName] = useState('Master CV');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const document = createTextDocument(name, text);
      await update((state) => ({
        ...state,
        documents: [document, ...state.documents],
        stageProgress: state.stageProgress.map((value, index) => index === 2 ? Math.max(value, 35) : value),
        actions: uniqueActions([...state.actions, { id: `verify-${document.id}`, title: 'Verify your imported CV', explanation: 'Confirm the source document before any future tailoring workflow reuses its facts.', priority: 'high', href: '/cv', completed: false }]),
      }));
      setText(''); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The document could not be imported.'); }
  };
  const verify = (id: string) => update((state) => ({
    ...state,
    documents: state.documents.map((document) => document.id === id ? { ...document, verificationStatus: 'verified' as const } : document),
    stageProgress: state.stageProgress.map((value, index) => index === 2 ? Math.max(value, 60) : value),
    actions: state.actions.map((action) => action.id === `verify-${id}` ? { ...action, completed: true } : action),
  }));
  return <>
    <PageHead eyebrow="CV STUDIO / TRUTH FIRST" title="Build from evidence, not invention." copy="Paste CV text for a deterministic structure check. Source review is your confirmation, not independent employment verification. Sharing with third parties is disabled." />
    <div className="workspace-grid">
      <form className="panel workflow-form" onSubmit={submit}>
        <div className="panel-head"><div><p className="eyebrow">TEXT IMPORT / WORKING LOCALLY</p><h2>Add a source CV</h2></div><span>PDF + DOCX NEXT</span></div>
        <div className="form-section"><div className="form-grid">
          <Field label="Document name" wide><input required value={name} onChange={(event) => setName(event.target.value)} /></Field>
          <Field label="CV text" wide><textarea required rows={14} value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste CV content here. Include headings such as Summary, Experience, Education and Skills." /></Field>
        </div>{error && <p className="form-error" role="alert">{error}</p>}</div>
        <div className="form-footer"><p>Maximum 80,000 characters · saved in your authenticated workspace</p><button className="primary-action" type="submit">IMPORT FOR REVIEW ↗</button></div>
      </form>
      <section className="panel records-panel">
        <div className="panel-head"><div><p className="eyebrow">SOURCE DOCUMENTS</p><h2>{workspace.documents.length ? 'Verification queue' : 'No CV imported yet'}</h2></div><span>{workspace.documents.length} FILES</span></div>
        {workspace.documents.length ? workspace.documents.map((document) => <article className="record-card" key={document.id}>
          <div className="record-title"><span className={`status-chip ${document.verificationStatus}`}>{document.verificationStatus === 'verified' ? 'user-confirmed' : 'needs review'}</span><h3>{document.name}</h3></div>
          <p>{document.detectedSections.length ? `Detected headings: ${document.detectedSections.join(', ')}.` : 'No standard section headings detected. Review the source manually.'}</p>
          <details><summary>Read source text</summary><pre className="source-text">{document.sourceText}</pre></details>
          <span className="record-meta">{document.sourceText.length.toLocaleString()} CHARACTERS · PASTED TEXT</span>
          {document.verificationStatus === 'needs_review' && <button type="button" className="text-action" onClick={() => verify(document.id)}>I HAVE REVIEWED THIS SOURCE ✓</button>}
        </article>) : <Empty title="Bring your own evidence." copy="Paste CV text to create the first reviewable document record. PDF and DOCX parsing require the next secure file-processing slice." />}
      </section>
    </div>
    <DocumentReview workspace={workspace} update={update} reload={reload} />
  </>;
}

function JobMatches({ workspace, update }: { workspace: WorkspaceState; update: (recipe: (state: WorkspaceState) => WorkspaceState) => Promise<void> }) {
  const [form, setForm] = useState({ title: '', company: '', location: workspace.profile?.location || '', workMode: 'flexible' as CareerProfile['workMode'], requiredSkills: '', description: '', sourceUrl: '' });
  const [error, setError] = useState('');
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!workspace.profile) { setError('Create a career profile before generating a match report.'); return; }
    try {
      const vacancy = createVacancy({ ...form, requiredSkills: form.requiredSkills.split(',') });
      const report = calculateMatch(workspace.profile, vacancy);
      if (workspace.vacancies.some(v=>v.title.toLowerCase()===vacancy.title.toLowerCase() && v.company.toLowerCase()===vacancy.company.toLowerCase() && v.description===vacancy.description)) throw new Error('This vacancy is already saved. Review its existing report.');
      await update((state) => ({
        ...state, vacancies: [vacancy, ...state.vacancies], matchReports: [report, ...state.matchReports],
        stageProgress: state.stageProgress.map((value, index) => index === 3 ? Math.max(value, 55) : value),
        actions: uniqueActions([...state.actions, { id: `review-match-${report.id}`, title: `Review ${vacancy.title} evidence`, explanation: 'Check the strengths, gaps and seniority signal before deciding whether to apply.', priority: report.seniorityWarning ? 'high' : 'medium', href: '/jobs', completed: false }]),
      }));
      setForm((current) => ({ ...current, title: '', company: '', requiredSkills: '', description: '', sourceUrl: '' })); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The vacancy could not be imported.'); }
  };
  const saveApplication = (vacancy: Vacancy, report: MatchReport) => update((state) => {
    if (state.applications.some((item) => item.vacancyId === vacancy.id)) return state;
    return {
      ...state,
      applications: [{ id: crypto.randomUUID(), vacancyId: vacancy.id, status: 'saved', nextAction: report.seniorityWarning ? 'Review seniority warning before preparing the application.' : 'Review evidence and select the best CV source.', updatedAt: new Date().toISOString() }, ...state.applications],
      stageProgress: state.stageProgress.map((value, index) => index === 5 ? Math.max(value, 20) : value),
      actions: uniqueActions([...state.actions, { id: `prepare-${vacancy.id}`, title: `Prepare ${vacancy.title} application`, explanation: 'Review the saved opportunity and move it into preparation when the evidence is ready.', priority: 'high', href: '/applications', completed: false }]),
    };
  });
  return <>
    <PageHead eyebrow="JOB INTELLIGENCE / EXPLAINABLE BASELINE" title="Is it a fit—and is it a forward move?" copy="Import vacancy text and compare it with user-declared profile evidence. Scores are deterministic estimates, not hiring predictions or live vacancy validation." />
    <form className="panel workflow-form" onSubmit={submit}>
      <div className="panel-head"><div><p className="eyebrow">MANUAL VACANCY IMPORT</p><h2>Evaluate an opportunity</h2></div><span>NO SCRAPING</span></div>
      <div className="form-section"><div className="form-grid">
        <Field label="Role title"><input required value={form.title} onChange={(event) => set('title', event.target.value)} /></Field>
        <Field label="Employer"><input required value={form.company} onChange={(event) => set('company', event.target.value)} /></Field>
        <Field label="Location"><input required value={form.location} onChange={(event) => set('location', event.target.value)} /></Field>
        <Field label="Working model"><select value={form.workMode} onChange={(event) => set('workMode', event.target.value)}><option value="flexible">Flexible / unspecified</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></Field>
        <Field label="Required skills (comma separated)" wide><input required value={form.requiredSkills} onChange={(event) => set('requiredSkills', event.target.value)} placeholder="Commercial strategy, negotiation, team leadership" /></Field>
        <Field label="Source URL (optional)" wide><input type="url" value={form.sourceUrl} onChange={(event) => set('sourceUrl', event.target.value)} placeholder="https://employer.example/jobs/..." /></Field>
        <Field label="Vacancy description" wide><textarea required rows={9} value={form.description} onChange={(event) => set('description', event.target.value)} /></Field>
      </div>{error && <p className="form-error" role="alert">{error}</p>}</div>
      <div className="form-footer"><p>Uses saved profile facts · no external data calls</p><button className="primary-action" type="submit">GENERATE EXPLAINABLE MATCH ↗</button></div>
    </form>
    <section className="match-list">
      {workspace.matchReports.map((report) => {
        const vacancy = workspace.vacancies.find((item) => item.id === report.vacancyId);
        if (!vacancy) return null;
        const tracked = workspace.applications.some((item) => item.vacancyId === vacancy.id);
        return <article className="panel match-report" key={report.id}>
          <div className="match-summary"><div><p className="eyebrow">ILLUSTRATIVE MATCH ESTIMATE</p><h2>{vacancy.title}</h2><p>{vacancy.company} · {vacancy.location} · {vacancy.workMode}</p></div><strong>{report.overallScore ?? 'Unknown'}{report.overallScore!==null && <span>%</span>}</strong></div>
          {report.seniorityWarning && <div className="warning-box"><span>!</span><div><strong>Seniority protection signal</strong><p>{report.seniorityWarning}</p></div></div>}
          <div className="dimension-grid">{report.dimensions.map((dimension) => <div key={dimension.key}><span>{dimension.label}</span><strong>{dimension.score===null?'Unknown':`${dimension.score}%`}</strong><div><i style={{ width: `${dimension.score || 0}%` }} /></div><p>{dimension.explanation}</p></div>)}</div>
          <div className="evidence-grid"><div><p className="eyebrow">STRENGTHS</p>{report.strengths.length ? report.strengths.map((item) => <p key={item}>+ {item}</p>) : <p>No confirmed strengths yet.</p>}</div><div><p className="eyebrow">GAPS / UNCERTAINTY</p>{report.gaps.length ? report.gaps.map((item) => <p key={item}>— {item}</p>) : <p>No stated gaps from this limited comparison.</p>}</div></div>
          <p className="mode-note">Availability: {vacancy.availability || 'unknown'} · User-supplied content; URL has not been retrieved. Imported {new Date(vacancy.importedAt).toLocaleString()}.</p><p className="mode-note">{report.rubricVersion}</p><div className="report-footer"><span>This baseline uses titles, declared skills and preferences only.</span><button className="primary-action" type="button" disabled={tracked} onClick={() => saveApplication(vacancy, report)}>{tracked ? 'SAVED TO PIPELINE ✓' : 'SAVE TO APPLICATIONS ↗'}</button></div>
        </article>;
      })}
      {!workspace.matchReports.length && <section className="panel"><Empty title="No match reports yet." copy="Import a real vacancy description above. CareerFlow will show exactly which saved facts influenced each dimension." /></section>}
    </section>
  </>;
}

function InterviewPrep({ workspace, update }: { workspace: WorkspaceState; update: (recipe: (state: WorkspaceState) => WorkspaceState) => Promise<void> }) {
  const [vacancyId, setVacancyId] = useState(workspace.applications[0]?.vacancyId || '');
  const createPlan = () => {
    const vacancy = workspace.vacancies.find((item) => item.id === vacancyId);
    if (!vacancy || !workspace.profile || workspace.interviewPlans.some((item) => item.vacancyId === vacancy.id)) return;
    const plan = buildInterviewPlan(workspace.profile, vacancy);
    update((state) => ({ ...state, interviewPlans: [plan, ...state.interviewPlans], stageProgress: state.stageProgress.map((value, index) => index === 6 ? Math.max(value, 40) : value) }));
  };
  return <>
    <PageHead eyebrow="INTERVIEW PREPARATION / DETERMINISTIC" title="Prepare stories that are true—and relevant." copy="Create a role-specific practice plan from your saved opportunity. These prompts are deterministic coaching aids, not AI scoring or outcome predictions." />
    <section className="panel interview-builder"><div><p className="eyebrow">BUILD A PRACTICE PLAN</p><h2>Select a tracked opportunity</h2><p>CareerFlow will prepare questions around motivation, evidence, stakeholder influence, gaps and seniority.</p></div><div className="builder-actions"><select aria-label="Tracked opportunity" value={vacancyId} onChange={(event) => setVacancyId(event.target.value)}><option value="">Choose an opportunity</option>{workspace.applications.map((application) => { const vacancy = workspace.vacancies.find((item) => item.id === application.vacancyId); return vacancy ? <option key={vacancy.id} value={vacancy.id}>{vacancy.title} · {vacancy.company}</option> : null; })}</select><button className="primary-action" type="button" disabled={!vacancyId || workspace.interviewPlans.some((item) => item.vacancyId === vacancyId)} onClick={createPlan}>CREATE PRACTICE PLAN ↗</button></div></section>
    <section className="interview-plans">{workspace.interviewPlans.map((plan) => { const vacancy = workspace.vacancies.find((item) => item.id === plan.vacancyId); return <article className="panel" key={plan.id}><div className="panel-head"><div><p className="eyebrow">PRACTICE PLAN</p><h2>{vacancy?.title || 'Opportunity'}</h2></div><span>{plan.questions.length} QUESTIONS</span></div><ol>{plan.questions.map((question) => <li key={question.id}><span>{String(plan.questions.indexOf(question) + 1).padStart(2, '0')}</span><div><h3>{question.prompt}</h3><p>{question.focus}</p><textarea aria-label={`Notes for ${question.prompt}`} defaultValue={question.notes || ''} onBlur={(event) => { const notes = event.target.value; update((state) => ({ ...state, interviewPlans: state.interviewPlans.map(item => item.id === plan.id ? { ...item, questions: item.questions.map(answer => answer.id === question.id ? { ...answer, notes } : answer) } : item) })); }} rows={3} placeholder="Draft a truthful example or evidence note…" /></div></li>)}</ol></article>; })}{!workspace.interviewPlans.length && <section className="panel"><Empty title="No interview plan prepared." copy="Track an application first, then create a focused question set here." /></section>}</section>
  </>;
}

function Journey({ workspace }: { workspace: WorkspaceState }) {
  return <>
    <PageHead eyebrow="CAREER JOURNEY / 01—10" title="Move across your career, not through a funnel." copy="Stages can progress together. Profile, documents, manual matching, applications and interview preparation are connected locally. Skills plans, networking, assessments, offers and growth remain roadmap modules. Activity indicators are not career-success scores." />
    <section className="metro panel" aria-label="Ten-stage career journey">
      {stages.map(([number, name, description], index) => <article key={number} className={workspace.stageProgress[index] > 0 ? 'active' : ''}>
        <div className="station"><span>{number}</span><i /></div><div><p className="eyebrow">STAGE {number} / {workspace.stageProgress[index]>0?'ACTIVITY RECORDED':'NOT STARTED'}</p><h2>{name}</h2><p>{description}</p>{stageRoute(index) && <Link to={stageRoute(index)!}>OPEN WORKFLOW ↗</Link>}</div>
      </article>)}
    </section>
  </>;
}

function Settings({ reset, authenticated }: { reset: () => Promise<void>; authenticated: boolean }) {
  const [confirming, setConfirming] = useState(false);
  return <>
    <PageHead eyebrow="WORKSPACE / SETTINGS" title="You stay in control." copy="Review how this local milestone handles your information and remove it whenever you choose." />
    <p><a href="./policy.html">Privacy, terms and release limitations</a></p><section className="panel settings-panel"><div><p className="eyebrow">DATA MODE</p><h2>{authenticated ? 'Authenticated development database' : 'Signed out'}</h2><p>{authenticated ? 'Your personal workspace is saved in a tenant-isolated SQLite database on this computer.' : 'Sign in to save synthetic test data. Candidate records are not written to browser storage.'} AI, live vacancy sources and billing are not connected.</p></div><div className="danger-zone"><h3>Clear current workspace records</h3><p>This removes the current profile, CV text, manual jobs, applications and interview notes. {authenticated ? 'Agent drafts, approvals and audit history remain in the development database; this is not account deletion.' : 'This affects only this browser demo.'}</p>{confirming ? <div className="confirm-row"><button type="button" className="danger-button" onClick={() => { void reset().then(() => { location.hash = '#/dashboard'; }).catch(() => {}); }}>YES, CLEAR WORKSPACE</button><button type="button" onClick={() => setConfirming(false)}>CANCEL</button></div> : <button type="button" className="danger-button" onClick={() => setConfirming(true)}>CLEAR WORKSPACE RECORDS</button>}</div></section>
  </>;
}

function PageHead({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <header className="page-head"><p className="eyebrow">{eyebrow}</p><div><h1>{title}</h1><p>{copy}</p></div></header>; }
function Metric({ value, label, hint }: { value: string; label: string; hint: string }) { return <article className="metric"><strong>{value}</strong><p>{label}</p><span>{hint}</span></article>; }
function Empty({ title, copy }: { title: string; copy: string }) { return <div className="empty"><span>✓</span><div><h3>{title}</h3><p>{copy}</p></div></div>; }
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? 'field wide' : 'field'}><span>{label}</span>{children}</label>; }
function BrandMark() { return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
function uniqueActions(actions: WorkspaceState['actions']) { return [...new Map(actions.map((action) => [action.id, action])).values()]; }
function stageRoute(index: number) { return ({ 0: '/profile', 2: '/cv', 3: '/jobs', 5: '/applications', 6: '/interviews' } as Record<number, string | undefined>)[index]; }

// Use the outlet-aware shell in the route tree.
function Root() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => structuredClone(emptyWorkspace));
  const [session, setDevSession] = useState<DevSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [saveError,setSaveError] = useState('');
  const [saving,setSaving]=useState(false),[savedMessage,setSavedMessage]=useState('');
  const epoch=useRef(0);
  const current = useRef(workspace), revision = useRef(0), queue = useRef(Promise.resolve());
  const apply = (state: WorkspaceState) => { current.current = state; setWorkspace(state); };
  const connect = async (next: DevSession) => { epoch.current++; setSession(next); const stored = await api<{ state: WorkspaceState; revision: number }>('/workspace'); revision.current = stored.revision; apply(stored.state); setDevSession(next); setSaveError(''); };
  const disconnect = () => { epoch.current++; setSession(null); setDevSession(null); revision.current=0; apply(structuredClone(emptyWorkspace)); };
  useEffect(() => { api<DevSession>('/auth/session').then(connect).catch(()=>{}).finally(()=>setSessionReady(true)); },[]);
  const update = (recipe: (state: WorkspaceState) => WorkspaceState) => {
    const expectedEpoch=epoch.current;
    setSaving(true);setSavedMessage('');
    const save = queue.current.then(async () => {
      if (!session) throw new Error('Sign in to the local account before saving. Use synthetic data only.');
      if(expectedEpoch!==epoch.current)throw new Error('Session changed. Review and save again.');
      const next = recipe(current.current);
      if (session) { const stored = await api<{ state: WorkspaceState; revision: number }>('/workspace','PUT',{ state:next,revision:revision.current }); if(expectedEpoch!==epoch.current)throw new Error('Session changed during save. Sign in again to verify the saved version.');revision.current=stored.revision; apply(stored.state); }
      setSaveError(''); setSavedMessage('Changes saved.');
    }).finally(()=>setSaving(false));
    queue.current = save.catch(reason=>setSaveError(reason instanceof Error ? reason.message : 'Could not save workspace.'));
    return save;
  };
  const reset = () => update(() => structuredClone(emptyWorkspace));
  const routes = { workspace, update, reset };
  if (!sessionReady) return <main className="welcome-page"><p role="status">Restoring your workspace…</p></main>;
  return <><div className="save-status" role="status">{saving?'Saving your changes…':savedMessage}</div>{saveError && <div className="global-error" role="alert">Save failed: {saveError} Your input remains available in the form. <Link to="/agent">SIGN IN</Link> <button onClick={()=>void api<DevSession>('/auth/session').then(connect).catch(e=>setSaveError(e.message))}>RELOAD SAVED WORKSPACE</button></div>}<Routes>
    <Route path="/welcome" element={<Welcome profile={routes.workspace.profile} />} />
    <Route element={<AppOutletShell workspace={routes.workspace} authenticated={!!session} />}>
      <Route path="/agent" element={<AgentPage workspace={workspace} session={session} connect={connect} disconnect={disconnect} reload={()=>connect(session!)} />} />
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard workspace={routes.workspace} update={routes.update} />} />
      <Route path="/profile" element={<><ProfileEditor profile={routes.workspace.profile} update={routes.update} /><EvidencePanel workspace={workspace} update={update} /></>} />
      <Route path="/cv" element={<CvStudio workspace={routes.workspace} update={routes.update} reload={()=>connect(session!)} />} />
      <Route path="/jobs" element={<JobMatches workspace={routes.workspace} update={routes.update} />} />
      <Route path="/applications" element={<ApplicationsPage workspace={routes.workspace} update={routes.update} />} />
      <Route path="/interviews" element={<InterviewPrep workspace={routes.workspace} update={routes.update} />} />
      <Route path="/journey" element={<Journey workspace={routes.workspace} />} />
      <Route path="/settings" element={<Settings reset={routes.reset} authenticated={!!session} />} />
    </Route>
    <Route path="*" element={<Navigate to={routes.workspace.profile ? '/dashboard' : '/welcome'} replace />} />
  </Routes></>;
}

createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><HashRouter><Root /></HashRouter></QueryClientProvider>);
