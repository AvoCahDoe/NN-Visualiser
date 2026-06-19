# Deploy to Vercel

## Your project is likely using Root Directory `apps/api`

If build logs show `@nnviz/api` and `pnpm run build`, that is expected — **this repo now redirects that to the React app build**.

After pulling latest, `pnpm run build` in `apps/api` runs the **web** build and outputs to `apps/web/dist`.

## Recommended Vercel settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` *(preferred)* or `apps/api` *(works with latest config)* |
| **Output Directory** | `dist` if root is `apps/web`, or leave empty if root is `apps/api` |
| **Build Command** | *(leave empty — uses `vercel.json`)* |
| **Framework** | Vite |

If you set a custom **Build Command** to `pnpm run build`, that is fine with the latest code — it builds the React app.

## Environment variables

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | Leave **empty** |

## Success check

Build logs should show:

```
@nnviz/web build
tsc -b && vite build
✓ built in ...
```

You should **not** see `apps/api` running `tsc` alone.

## Repo root deploy

If **Root Directory** is empty, root `vercel.json` builds `apps/web/dist`. Serverless routes live in `apps/web/api/` when using `apps/web` as root, or `apps/api/api/` when using `apps/api` as root.
