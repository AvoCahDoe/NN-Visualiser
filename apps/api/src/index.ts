import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { networkRouter } from './routes/network.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', networkRouter);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
