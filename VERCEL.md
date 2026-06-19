# Deploy to Vercel

This is a **pnpm monorepo**. The React app lives in `apps/web`. Deploy that folder only.

## Vercel project settings

In [Vercel → Project Settings → General](https://vercel.com/docs/projects/project-configuration):

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Vite |
| **Build Command** | *(leave empty — uses `apps/web/vercel.json`)* |
| **Output Directory** | `dist` |
| **Install Command** | *(leave empty — uses `apps/web/vercel.json`)* |

The `apps/web/vercel.json` file runs `pnpm install` and `pnpm vercel-build` from the repo root so workspace packages (`packages/shared`, `packages/nn-math`) are built before Vite.

## Environment variables

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | Leave **empty** (same-origin `/api/*` serverless routes in `apps/web/api/`) |

## What gets deployed

```
apps/web/
├── dist/          ← Vite build output (static React app)
└── api/           ← Serverless functions (/api/health, /api/validate, …)
```

## CLI

```bash
pnpm install
cd apps/web
npx vercel
```

## Troubleshooting

**"No Output Directory named dist found"**

- Root Directory **must** be `apps/web` (not the repo root).
- Output Directory **must** be `dist` (relative to `apps/web`).
- Remove any conflicting overrides in the Vercel dashboard.

**Build fails on workspace packages**

Ensure install runs from the monorepo root. `apps/web/vercel.json` uses `cd ../.. && pnpm install` — do not change Root Directory to the repo root.
