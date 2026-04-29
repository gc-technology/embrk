# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite + local Worker together (run from repo root) |
| `npm run dev:worker` | Worker only (`wrangler dev` on port 8787) |
| `npm run dev:ui` | Vite only (no worker) |
| `npx wrangler deploy` | Deploy to Cloudflare |
| `npx wrangler types` | Generate TypeScript types |

Run `wrangler types` after changing bindings in wrangler.jsonc.

### How the dev URL routing works

In development, `VITE_WORKER_URL` is empty (see `.env.development`). Vite proxies
all `/api/*` requests to `http://localhost:8787` (the local wrangler dev server),
so there are no CORS issues.

In production, `VITE_WORKER_URL=https://embark-worker.gideonconcepts7.workers.dev`
is injected at build time (see `.env.production`), and the frontend fetches directly.

## D1 Admin Database

**Apply migration (local first, then production):**

> wrangler 4.x defaults to **local**. Pass `--remote` for production.

```sh
# Local (default)
npx wrangler d1 migrations apply embark-db

# Production
npx wrangler d1 migrations apply embark-db --remote
```

**Seed an admin user:**
```sh
# Local (default — safe, always prompts for password interactively)
node scripts/seed-admin.mjs

# Production (prompts for confirmation + password)
node scripts/seed-admin.mjs --remote
```

Set `EMBARK_ADMIN_EMAIL` env var to pre-fill email only. Password is always prompted — no env var fallback.

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`
