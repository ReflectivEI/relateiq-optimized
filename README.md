# RelateIQ

RelateIQ is a GitHub-managed relationship-intelligence app with a Cloudflare worker backend and Cloudflare-hosted questionnaire storage.

## Stack

- Vite + React frontend
- Cloudflare Worker API
- Shared deterministic relationship data model for Tony and Drew

## Local development

```bash
npm install
npm run worker:relateiq:dev
npm run dev
```

The frontend expects the worker at `http://127.0.0.1:8787` during local development.

## Deploy

- Worker: `npm run worker:relateiq:deploy`
- Frontend: build with `VITE_WORKER_URL=<worker-url> npm run build`

See [docs/relateiq-migration.md](/Users/anthonyabdelmalak/dev/relateiq-growth/docs/relateiq-migration.md) for architecture notes and questionnaire file expectations.
