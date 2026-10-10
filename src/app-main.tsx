import { FormEvent, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CareerProfile, WorkspaceState } from './types';
import { emptyWorkspace, loadWorkspace, makeProfile, profileCompleteness, saveWorkspace } from './lib/workspace';
import './app.css';

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
        <p className="lede">Build a private career profile and see your next actions take shape. This milestone stores data in this browser only—no AI provider, cloud database, or payment account is connected.</p>
        <div className="notice"><strong>Honest demo mode</strong><span>Use synthetic information while evaluating the product. Browser data can be cleared from Settings.</span></div>
        <div className="welcome-actions">
          <Link className="primary-action" to={profile ? '/dashboard' : '/profile'}>{profile ? 'RETURN TO COMMAND CENTER' : 'CREATE LOCAL PROFILE'} <span>↗</span></Link>
          <a className="secondary-action" href="./index.html">BACK TO WEBSITE</a>
        </div>
      </section>
    </main>
  );
}

function AppOutletShell({ workspace }: { workspace: WorkspaceState }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="app-shell">
    <aside id="app-sidebar" className={menuOpen ? 'sidebar is-open' : 'sidebar'}>
      <a className="app-brand" href="./index.html"><BrandMark /> careerflow<span>.ai</span></a>
      <p className="side-label">CAREER OPERATING SYSTEM</p>
      <nav aria-label="Application navigation">
        <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Command center <span>01</span></NavLink>
        <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Career profile <span>02</span></NavLink>
        <NavLink to="/journey" onClick={() => setMenuOpen(false)}>Journey map <span>10</span></NavLink>
        <NavLink to="/settings" onClick={() => setMenuOpen(false)}>Settings <span>••</span></NavLink>
      </nav>
      <div className="side-status"><span className="status-dot" /> LOCAL DEMO MODE<p>Data stays in this browser.</p></div>
    </aside>
    <div className="app-main">
      <header className="app-header">
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="app-sidebar" onClick={() => setMenuOpen((value) => !value)}>MENU</button>
        <div><span className="context-label">PERSONAL WORKSPACE</span><strong>{workspace.profile?.displayName || 'Your workspace'}</strong></div>
        <Link to="/profile" className="header-profile" aria-label="Edit career profile">{initials(workspace.profile?.displayName || 'Career Flow')}</Link>
      </header>
      <main className="route-content"><Outlet /></main>
    </div>
  </div>;
}

function Dashboard({ workspace, update }: { workspace: WorkspaceState; update: (recipe: (state: WorkspaceState) => WorkspaceState) => void }) {
  const completion = profileCompleteness(workspace.profile);
  const activeActions = workspace.actions.filter((action) => !action.completed);
  return <>
    <PageHead eyebrow="COMMAND CENTER / TODAY" title={workspace.profile ? `Good to see you, ${workspace.profile.displayName.split(' ')[0]}.` : 'Build your career foundation.'} copy="A focused view of what matters now—and how each action supports your bigger direction." />
    <section className="metric-grid" aria-label="Career overview">
      <Metric value={`${completion}%`} label="PROFILE STRENGTH" hint={completion === 100 ? 'Core facts captured' : 'Complete your foundation'} />
      <Metric value={String(activeActions.length).padStart(2, '0')} label="PRIORITY ACTIONS" hint="Based on saved progress" />
      <Metric value="00" label="ACTIVE APPLICATIONS" hint="No applications recorded" />
      <Metric value="00" label="UPCOMING INTERVIEWS" hint="Nothing scheduled" />
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

function ProfileEditor({ profile, update }: { profile: CareerProfile | null; update: (recipe: (state: WorkspaceState) => WorkspaceState) => void }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    displayName: profile?.displayName || '', email: profile?.email || '', currentRole: profile?.currentRole || '', yearsExperience: profile?.yearsExperience || 0,
    targetRole: profile?.targetRole || '', location: profile?.location || '', workMode: profile?.workMode || 'flexible', objective: profile?.objective || '',
    skills: profile?.skills.map((skill) => skill.name).join(', ') || '',
  });
  const set = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextProfile = makeProfile({ ...form, email: form.email, yearsExperience: Number(form.yearsExperience), skills: form.skills.split(',').map((item) => item.trim()) });
    update((state) => ({ ...state, profile: nextProfile, consentAcceptedAt: state.consentAcceptedAt || new Date().toISOString(), stageProgress: [35, ...state.stageProgress.slice(1)], actions: state.actions.map((item) => item.id === 'complete-profile' ? { ...item, completed: true } : item) }));
    setSaved(true);
    window.setTimeout(() => navigate('/dashboard'), 650);
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
      <div className="form-footer"><p><span className="status-dot" /> Stored only in this browser for this milestone.</p><button className="primary-action" type="submit">{saved ? 'SAVED' : 'SAVE CAREER FOUNDATION'} <span>{saved ? '✓' : '↗'}</span></button></div>
    </form>
  </>;
}

function Journey({ workspace }: { workspace: WorkspaceState }) {
  return <>
    <PageHead eyebrow="CAREER JOURNEY / 01—10" title="Move across your career, not through a funnel." copy="Stages can progress together. This first milestone activates the shared profile foundation; later vertical slices will connect jobs, documents, applications, interviews and offers to the same evidence model." />
    <section className="metro panel" aria-label="Ten-stage career journey">
      {stages.map(([number, name, description], index) => <article key={number} className={workspace.stageProgress[index] > 0 ? 'active' : ''}>
        <div className="station"><span>{number}</span><i /></div><div><p className="eyebrow">STAGE {number} / {workspace.stageProgress[index]}%</p><h2>{name}</h2><p>{description}</p>{index === 0 && <Link to="/profile">CONTINUE STAGE ↗</Link>}</div>
      </article>)}
    </section>
  </>;
}

function Settings({ reset }: { reset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return <>
    <PageHead eyebrow="WORKSPACE / SETTINGS" title="You stay in control." copy="Review how this local milestone handles your information and remove it whenever you choose." />
    <section className="panel settings-panel"><div><p className="eyebrow">DATA MODE</p><h2>Browser-local storage</h2><p>No server, Supabase project, AI provider or billing account is connected. This demo persists only through localStorage in this browser profile.</p></div><div className="danger-zone"><h3>Delete local workspace</h3><p>This permanently removes the saved profile and progress from this browser.</p>{confirming ? <div className="confirm-row"><button type="button" className="danger-button" onClick={() => { reset(); location.hash = '#/welcome'; }}>YES, DELETE</button><button type="button" onClick={() => setConfirming(false)}>CANCEL</button></div> : <button type="button" className="danger-button" onClick={() => setConfirming(true)}>DELETE LOCAL DATA</button>}</div></section>
  </>;
}

function PageHead({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <header className="page-head"><p className="eyebrow">{eyebrow}</p><div><h1>{title}</h1><p>{copy}</p></div></header>; }
function Metric({ value, label, hint }: { value: string; label: string; hint: string }) { return <article className="metric"><strong>{value}</strong><p>{label}</p><span>{hint}</span></article>; }
function Empty({ title, copy }: { title: string; copy: string }) { return <div className="empty"><span>✓</span><div><h3>{title}</h3><p>{copy}</p></div></div>; }
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? 'field wide' : 'field'}><span>{label}</span>{children}</label>; }
function BrandMark() { return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }

// Use the outlet-aware shell in the route tree.
function Root() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace());
  const update = (recipe: (state: WorkspaceState) => WorkspaceState) => setWorkspace((current) => { const next = recipe(current); saveWorkspace(next); return next; });
  const reset = () => { const next = structuredClone(emptyWorkspace); saveWorkspace(next); setWorkspace(next); };
  const routes = useMemo(() => ({ workspace, update, reset }), [workspace]);
  return <Routes>
    <Route path="/welcome" element={<Welcome profile={routes.workspace.profile} />} />
    <Route element={<AppOutletShell workspace={routes.workspace} />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard workspace={routes.workspace} update={routes.update} />} />
      <Route path="/profile" element={<ProfileEditor profile={routes.workspace.profile} update={routes.update} />} />
      <Route path="/journey" element={<Journey workspace={routes.workspace} />} />
      <Route path="/settings" element={<Settings reset={routes.reset} />} />
    </Route>
    <Route path="*" element={<Navigate to={routes.workspace.profile ? '/dashboard' : '/welcome'} replace />} />
  </Routes>;
}

createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><HashRouter><Root /></HashRouter></QueryClientProvider>);

