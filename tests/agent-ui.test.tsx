import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentPage } from '../src/AgentPage';
import { emptyWorkspace } from '../src/lib/workspace';
afterEach(()=>{ cleanup(); vi.unstubAllGlobals(); });
it('announces authentication failures and prevents short-password registration',async()=>{
  const fetchMock=vi.fn().mockResolvedValue({ ok:false,json:async()=>({ error:'Email or password is incorrect.' }) }); vi.stubGlobal('fetch',fetchMock);
  render(<MemoryRouter><AgentPage workspace={structuredClone(emptyWorkspace)} session={null} connect={vi.fn()} disconnect={vi.fn()} /></MemoryRouter>);
  expect(screen.getByRole('button',{ name:'CREATE LOCAL ACCOUNT ↗' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Email'),{ target:{ value:'fixture@example.test' } });
  fireEvent.change(screen.getByLabelText('Password (12+ characters)'),{ target:{ value:'test-password-12345' } });
  fireEvent.click(screen.getByRole('button',{ name:'SIGN IN' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/login');
});
