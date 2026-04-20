# RelateIQ Cloudflare Worker

Backend worker for the GitHub-managed RelateIQ rebuild.

## Endpoints

- `GET /health`
- `GET /api/state`
- `POST /api/coach`
- `POST /api/check-in`
- `POST /api/repair`
- `POST /api/questionnaire/preview`
- `POST /api/questionnaire/upload`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create local vars file:

```bash
cp relate-iq-growth-worker/.dev.vars.example relate-iq-growth-worker/.dev.vars
```

3. Start worker dev server:

```bash
npm run worker:relateiq:dev
```

## Deploy

```bash
npm run worker:relateiq:deploy
```

Questionnaire uploads are stored in Cloudflare KV under the `QUESTIONNAIRES` binding.
