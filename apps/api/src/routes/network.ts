import { Router, type IRouter } from 'express';
import {
  NetworkArchitectureSchema,
  DemoStateSchema,
} from '@nnviz/shared';
import {
  validateArchitecture,
  computeShapeChain,
  createDemoState,
  getDemoStep,
  advanceDemoStep,
  resetDemoState,
} from '@nnviz/nn-math';

export const networkRouter: IRouter = Router();

networkRouter.post('/validate', (req, res) => {
  const parsed = NetworkArchitectureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid architecture', details: parsed.error.flatten() });
    return;
  }
  const result = validateArchitecture(parsed.data);
  res.json(result);
});

networkRouter.post('/shapes', (req, res) => {
  const parsed = NetworkArchitectureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid architecture', details: parsed.error.flatten() });
    return;
  }
  const shapes = computeShapeChain(parsed.data);
  const totalParams = shapes.reduce((sum: number, s) => sum + s.paramCount, 0);
  res.json({ shapes, totalParams });
});

networkRouter.post('/demo/init', (req, res) => {
  const learningRate = typeof req.body?.learningRate === 'number' ? req.body.learningRate : 0.5;
  const state = createDemoState(learningRate);
  res.json(state);
});

networkRouter.post('/demo/step', (req, res) => {
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
  res.json({ state, step });
});
