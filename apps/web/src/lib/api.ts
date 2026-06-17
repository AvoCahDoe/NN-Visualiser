const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

import type { NetworkArchitecture, ValidationResult, ShapeResult, DemoState, DemoStep } from '@nnviz/shared';

export const api = {
  health: () => fetchJson<{ status: string }>('/api/health'),

  validate: (architecture: NetworkArchitecture) =>
    fetchJson<ValidationResult>('/api/validate', {
      method: 'POST',
      body: JSON.stringify(architecture),
    }),

  shapes: (architecture: NetworkArchitecture) =>
    fetchJson<{ shapes: ShapeResult[]; totalParams: number }>('/api/shapes', {
      method: 'POST',
      body: JSON.stringify(architecture),
    }),

  demoInit: (learningRate?: number) =>
    fetchJson<DemoState>('/api/demo/init', {
      method: 'POST',
      body: JSON.stringify({ learningRate }),
    }),

  demoStep: (state: DemoState, action: 'next' | 'prev' | 'reset' = 'next') =>
    fetchJson<{ state: DemoState; step: DemoStep | null }>('/api/demo/step', {
      method: 'POST',
      body: JSON.stringify({ state, action }),
    }),
};
