import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DemoStateSchema } from '@nnviz/shared';
import { getDemoStep, advanceDemoStep, resetDemoState } from '@nnviz/nn-math';
import { assertPost } from '../_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertPost(req, res)) return;

  const parsed = DemoStateSchema.safeParse(req.body?.state);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid demo state', details: parsed.error.flatten() });
    return;
  }

  const action = req.body?.action ?? 'next';
  let state = parsed.data;

  if (action === 'reset') {
    state = resetDemoState(state);
  } else if (action === 'next') {
    state = advanceDemoStep(state);
  } else if (action === 'prev') {
    state = { ...state, currentStep: Math.max(0, state.currentStep - 1) };
  }

  const step = getDemoStep(state, state.currentStep);
  res.status(200).json({ state, step });
}
