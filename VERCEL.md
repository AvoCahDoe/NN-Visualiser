# Vercel deployment

Deploy the full app (React frontend + API) from the **repository root**.

## Quick deploy

1. Import the repo on [vercel.com/new](https://vercel.com/new)
2. Leave **Root Directory** empty (repo root)
3. Vercel reads `vercel.json` at the repo root — no extra config needed
4. Leave `VITE_API_URL` **unset** — same-origin `/api/*` serverless routes are included

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Leave empty on Vercel. Set only if using a separate Express API host. |

## What gets deployed

| Path | Source |
|------|--------|
| Static frontend | `apps/web/dist` (Vite build) |
| `/api/*` | `api/` serverless functions at repo root |

## API routes

- `GET /api/health`
- `POST /api/validate`
- `POST /api/shapes`
- `POST /api/demo/init`
- `POST /api/demo/step`

## CLI

```bash
pnpm install
npx vercel
```

## Local dev

- Frontend: `pnpm dev` → http://localhost:5180
- API (local): Express on http://localhost:4000, proxied via Vite `/api`
