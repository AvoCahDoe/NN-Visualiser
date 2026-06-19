import type { VercelRequest, VercelResponse } from '@vercel/node';

export function assertPost(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

export function assertGet(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}
