import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NetworkArchitectureSchema } from '@nnviz/shared';
import { computeShapeChain } from '@nnviz/nn-math';
import { assertPost } from './_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertPost(req, res)) return;

  const parsed = NetworkArchitectureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid architecture', details: parsed.error.flatten() });
    return;
  }

  const shapes = computeShapeChain(parsed.data);
  const totalParams = shapes.reduce((sum, s) => sum + s.paramCount, 0);
  res.status(200).json({ shapes, totalParams });
}
