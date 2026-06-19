import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertGet } from './_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertGet(req, res)) return;
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
