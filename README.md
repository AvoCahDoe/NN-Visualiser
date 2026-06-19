# Neural Network Visualizer

An interactive React application for designing, visualizing, and understanding neural network architectures. Build layer graphs dynamically, inspect output shapes and parameter counts, and step through an educational training demo.

## Architecture

```
apps/web     → React + Vite frontend (deploy to Vercel)
apps/api     → Express REST API (deploy to Railway/Render/Fly)
packages/shared   → Zod schemas & shared types
packages/nn-math  → Shape calculations & demo training steps
```

## Features

- **Visual editor** — React Flow canvas with drag-and-drop layers, connections, auto-layout
- **Layer types** — Input, Dense, Conv2D, MaxPool2D, Flatten, Dropout, Output
- **Shape math** — Output dimensions, parameter counts, KaTeX formulas
- **Training demo** — Step-through forward/backward pass on XOR (illustrative only)
- **Browser storage** — Auto-save projects to localStorage, JSON import/export
- **Example templates** — Simple MLP and MNIST-style CNN

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Install & Run

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:5180
- API: http://localhost:4000

### Build

```bash
pnpm build
```

### Docker

```bash
pnpm docker:up
```

- App: http://localhost:8888
- API is proxied at `/api` through nginx (internal port 4000)

Stop containers:

```bash
pnpm docker:down
```

## Deployment

### Vercel (recommended)

Full-stack deploy: React app + serverless API.

1. Import the repo on [Vercel](https://vercel.com/new)
2. Set **Root Directory** to `apps/web`
3. Leave **Output Directory** blank (uses `vercel.json` → `dist`)
4. Leave `VITE_API_URL` **unset** — `/api/*` routes are included
5. Deploy

See [VERCEL.md](VERCEL.md) for troubleshooting.

### Backend (optional — separate host)

The Express app in `apps/api` is for local dev and Docker. On Vercel, API logic runs as serverless functions in `apps/web/api/`. To use a standalone API instead:

1. Deploy `apps/api` to Railway / Render / Fly
2. Set `VITE_API_URL=https://your-api-url.com` in Vercel

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/validate` | Validate architecture |
| POST | `/api/shapes` | Compute output shapes |
| POST | `/api/demo/init` | Initialize training demo |
| POST | `/api/demo/step` | Advance demo step |

## Tech Stack

**Frontend:** React 19, Vite, React Flow, Zustand, TanStack Query, Tailwind CSS, Framer Motion, KaTeX, mathjs

**Backend:** Express, Helmet, CORS, Zod

## License

MIT
