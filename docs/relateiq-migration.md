# RelateIQ Migration Notes

## What changed

- Reverse-engineered the live Base44 app shell and route structure.
- Replaced the old product framing with a RelateIQ relationship-support workspace.
- Standardized the backend around `relate-iq-growth-worker`.
- Removed runtime assumptions tied to Base44 and removed Replit-only Vite plugins from the frontend.

## New architecture

- GitHub repository: source of truth for app code and questionnaire JSON files.
- Static frontend: Vite React app under `client/`.
- Cloudflare backend: `relate-iq-growth-worker/index.ts`.
- Shared seed data and deterministic guidance: `shared/relateiq.ts`.

## Questionnaire files

Drop the real exports here when available:

- `data/relateiq/tony.questionnaire.json`
- `data/relateiq/drew.questionnaire.json`

Expected shape:

```json
{
  "person": "Tony",
  "responses": [
    {
      "questionNumber": 1,
      "prompt": "Question text",
      "answer": "Free-form answer",
      "tags": ["optional"]
    }
  ]
}
```

## Deploy

### Frontend

1. Push this repo to a new GitHub repository.
2. Set `VITE_WORKER_URL` in the frontend deployment environment to your worker URL.
3. Build with `npm run build`.

### Cloudflare Worker

1. Set the worker name and allowed origins in `relate-iq-growth-worker/wrangler.toml`.
2. Run `npm run worker:relateiq:deploy`.

## Remaining personalization step

The app is structurally migrated, but the exact Tony/Drew relationship model still needs the two real 94-question JSON files to replace the seeded placeholder summaries.
