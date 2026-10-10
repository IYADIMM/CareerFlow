import { describe, expect, it } from 'vitest';
import { emptyWorkspace, loadWorkspace, makeProfile, profileCompleteness, saveWorkspace } from '../src/lib/workspace';

describe('workspace repository', () => {
  it('falls back safely when persisted data is malformed', () => {
    const storage = { getItem: () => '{bad json' };
    expect(loadWorkspace(storage)).toEqual(emptyWorkspace);
  });

  it('round-trips validated state', () => {
    let value: string | null = null;
    const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
    saveWorkspace(emptyWorkspace, storage);
    expect(loadWorkspace(storage)).toEqual(emptyWorkspace);
  });

  it('marks user-entered skills as declared, never verified', () => {
    const profile = makeProfile({ displayName: 'Demo User', email: 'demo@example.com', currentRole: 'Manager', yearsExperience: 8, targetRole: 'Director', location: 'Dubai', workMode: 'hybrid', objective: 'Lead a larger commercial team', skills: ['Negotiation'] });
    expect(profile.skills[0].status).toBe('user_declared');
    expect(profileCompleteness(profile)).toBe(100);
  });
});

