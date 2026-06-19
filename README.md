# Neural Network Visualizer

An interactive React application for designing, visualizing, and understanding neural network architectures.

## Architecture

```
apps/web          → React + Vite frontend
apps/api          → Express REST API
packages/shared   → Zod schemas & shared types
packages/nn-math  → Shape calculations & demo training steps
```

## Quick start

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:5180
- API: http://localhost:4000

```bash
pnpm build
```

## Docker (local)

```bash
pnpm docker:up
```

App: http://localhost:8888

## Container registry (GHCR)

Images are published on push to `main`:

```bash
docker pull ghcr.io/avocahdoe/nn-visualiser/web:latest
docker pull ghcr.io/avocahdoe/nn-visualiser/api:latest
```

Run with compose:

```bash
docker compose up -d
```

Or pull from GHCR by updating `docker-compose.yml` image references.

## Vercel

| Setting | Value |
|---------|--------|
| Root Directory | `apps/web` |
| Output Directory | `dist` |
| Framework | Vite |

Leave build/install commands empty — `apps/web/vercel.json` handles the monorepo build.

## License

MIT
