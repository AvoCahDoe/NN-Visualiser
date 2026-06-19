# Deploy to Vercel

## Your site is already live (verified via Vercel MCP)

**Production URL:** https://nn-visualiser-git-main-avocahdoes-projects.vercel.app

The last **successful** deployment used commit `5e1ccf4` with Root Directory **`apps/web`**.

## Why redeploys fail

Failed builds show:

```
Commit: c2df77d
> @nnviz/api@1.0.0 build
> tsc
```

That happens when you **Redeploy an old failed deployment** from commit `c2df77d`, which:

- Uses Root Directory **`apps/api`** (Express, not React)
- Runs `tsc` instead of the Vite build

**Do not** click "Redeploy" on old failed deployments.

## Fix production (pick one)

### Option A — Promote the working deployment (fastest)

1. Open [Vercel → nn-visualiser → Deployments](https://vercel.com/avocahdoes-projects/nn-visualiser)
2. Find the deployment with status **Ready** and commit message `..` (`5e1ccf4`)
3. Click **⋯ → Promote to Production**

### Option B — Redeploy latest `main`

1. Push any commit to `main` (or use **Deploy** → **Redeploy** on the **Ready** `5e1ccf4` deployment)
2. Ensure commit is **`5e1ccf4` or newer** — not `c2df77d`

### Option C — Fix project settings (recommended)

In **Project Settings → General**:

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Vite |
| **Build Command** | *(empty — uses `vercel.json`)* |
| **Output Directory** | `dist` |
| **Install Command** | *(empty — uses `vercel.json`)* |

Then deploy from latest `main`.

## Expected successful build log

```
Running "install" command: `pnpm install --dir ../..`...
> @nnviz/web@1.0.0 vercel-build
> pnpm --dir ../.. --filter @nnviz/web... build
packages/shared build: Done
packages/nn-math build: Done
apps/web build$ tsc -b && vite build
✓ built in ...
```

## Environment variables

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | Leave **empty** |
