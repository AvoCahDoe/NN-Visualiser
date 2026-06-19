# Neural Network Visualizer

An interactive React application for designing, visualizing, and understanding neural network architectures. Build layer graphs dynamically, inspect output shapes and parameter counts, and step through an educational training demo.

## Architecture

```
apps/web          → React + Vite frontend (deploy this folder to Vercel)
apps/api          → Express REST API (local dev & Docker only)
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

## Deployment (Vercel)

Deploy the **React app folder** only:

| Vercel setting | Value |
|----------------|--------|
| **Root Directory** | `apps/web` |
| **Output Directory** | `dist` |
| **Framework** | Vite |

Full instructions: [VERCEL.md](VERCEL.md)

## Docker

```bash
pnpm docker:up
```

- App: http://localhost:8888
- API is proxied at `/api` through nginx (internal port 4000)

Stop containers:

```bash
pnpm docker:down
```

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
