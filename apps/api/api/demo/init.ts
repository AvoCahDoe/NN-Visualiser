import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createDemoState } from '@nnviz/nn-math';
import { assertPost } from '../_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertPost(req, res)) return;

  const learningRate = typeof req.body?.learningRate === 'number' ? req.body.learningRate : 0.5;
  res.status(200).json(createDemoState(learningRate));
}
