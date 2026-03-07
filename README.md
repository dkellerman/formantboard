# FormantBoard

Vocal synthesizer WIP

<https://formantboard.vercel.app>

## Dev setup

- `pnpm i`
- `pnpm dev`

## AI Dev Setup

The AI payload generator now runs through a Vercel Function at `/api/ai`, so the OpenAI key stays server-side.

- Set `OPENAI_API_KEY` in Vercel project env vars for production.
- Run `vercel pull --yes` once after linking the repo to a Vercel project so local dev/build picks up project settings.
- For local development, pull env vars locally with `vercel env pull .env.local`, or otherwise provide `OPENAI_API_KEY` before starting Vercel dev.
- Run `pnpm dev:vercel` when you need the app and the server function together.
- `pnpm dev` still runs the Vite app only.
