# Embark

AI-powered creative workflow tool for generating brand visuals.

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Cloudflare Pages) | https://embark.pages.dev *(check your Pages project for the exact subdomain)* |
| Worker API | https://embark-worker.gideonconcepts7.workers.dev |
| Admin panel | https://embark.pages.dev/admin |

---

## Local development

**Prerequisites:** Node 20+, `wrangler` authenticated (`npx wrangler login`).

```sh
# 1. Install root dependencies (includes concurrently)
npm install

# 2. Start both Vite (port 5173) and the local Worker (port 8787)
npm run dev
```

`/api/*` requests are proxied from Vite to the local Worker — no CORS issues.
The frontend reads `VITE_WORKER_URL` from `.env.development` (empty = use proxy).

### Apply local DB migrations and seed admin

```sh
cd worker/embark-worker

# Migrate local D1
npx wrangler d1 migrations apply embark-db

# Create admin user (prompts interactively for password)
node scripts/seed-admin.mjs
```

---

## Auto-deploy

### Frontend → Cloudflare Pages (on every push to `main`)

Cloudflare Pages is connected directly to the GitHub repo. No workflow file needed — Cloudflare's CI handles it.

**Build settings** (configured once in the Pages dashboard):

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave blank — repo root)* |
| Node version | `20` (set via `NODE_VERSION` env var) |

**Environment variables** (set in Pages → Settings → Environment variables):

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_WORKER_URL` | `https://embark-worker.gideonconcepts7.workers.dev` | Production |

> `VITE_WORKER_URL` is intentionally absent from Preview/Development — those builds
> use the Vite proxy to hit localhost instead.

### Worker → Cloudflare Workers (on every push to `main` that touches `worker/embark-worker/**`)

`.github/workflows/deploy-worker.yml` handles this. It runs D1 migrations first, then deploys.

#### One-time GitHub Actions secrets setup

Go to **GitHub → gc-technology/embrk → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token (see below) |
| `CLOUDFLARE_ACCOUNT_ID` | `4e2cc2b212dfbdae3ad79909e976148f` |

#### Creating the API token (minimum permissions)

1. Go to **Cloudflare dashboard → My Profile → API Tokens → Create Token**
2. Start from **"Create Custom Token"**
3. Add these permissions:

| Category | Permission | Access |
|----------|-----------|--------|
| Account | Cloudflare Workers Scripts | Edit |
| Account | D1 | Edit |
| Account | Account Settings | Read |

4. Set **Account Resources** → Include → your account
5. Click **Continue to summary → Create Token**
6. Copy the token — it's only shown once

---

## Remote database

### Apply migration to production

```sh
cd worker/embark-worker
npx wrangler d1 migrations apply embark-db --remote
```

### Seed production admin user

```sh
cd worker/embark-worker
node scripts/seed-admin.mjs --remote
# Will warn "⚠ PRODUCTION", then prompt for email + password (input hidden)
```

---

## Rollback

### Frontend rollback

1. Cloudflare dashboard → Pages → `embark` project → **Deployments**
2. Find the last good deployment → **⋯ menu → Rollback to this deployment**

Takes effect in ~30 seconds, no rebuild needed.

### Worker rollback

```sh
# List recent deployments and get the version ID
npx wrangler deployments list --name embark-worker

# Roll back to a specific version
npx wrangler rollback <deployment-id> --name embark-worker
```

Or via dashboard: Workers & Pages → `embark-worker` → **Deployments** tab → Rollback.

---

## Viewing deploy logs

### Cloudflare Pages build logs

Dashboard → Pages → `embark` → Deployments → click any deployment → **Build log**

### GitHub Actions logs

GitHub → gc-technology/embrk → **Actions** tab → click any workflow run

### Live Worker logs

```sh
# Stream live request logs from the deployed worker
npx wrangler tail embark-worker
```

Or dashboard: Workers & Pages → `embark-worker` → **Logs** tab.

---

## Project layout

```
embark/
├── src/                        # React frontend (Vite)
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── ProjectWorkflow.jsx
│   │   └── admin/              # Admin panel (/admin/*)
│   ├── components/workflow/    # Phase 1-4 workflow components
│   └── lib/adminApiClient.js   # Admin API calls
├── worker/embark-worker/       # Cloudflare Worker (API)
│   ├── src/
│   │   ├── index.ts            # Route handler
│   │   └── admin/              # Auth + admin CRUD routes
│   ├── migrations/             # D1 SQL migrations
│   └── scripts/seed-admin.mjs  # Admin user creation
├── .env.development            # VITE_WORKER_URL= (empty → Vite proxy)
├── .env.production             # VITE_WORKER_URL=https://...workers.dev
└── .github/workflows/
    └── deploy-worker.yml       # Worker CI/CD
```
