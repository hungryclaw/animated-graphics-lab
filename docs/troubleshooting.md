# Troubleshooting

## `npm run check:local` says Node is too old

Install Node.js 20 or newer. Then rerun:

```bash
node --version
npm run check:local
```

## ffmpeg or ffprobe is missing

macOS:

```bash
brew install ffmpeg
```

Debian/Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

## HyperFrames check fails

Try:

```bash
npx --yes hyperframes --help
```

If it works manually but the checker fails, rerun after npm has warmed the npx cache.

## Wrangler local D1 migration fails

Run:

```bash
npm run db:local:migrate
```

If the local state is corrupted, remove local Wrangler state and rerun migrations:

```bash
rm -rf .wrangler/state
npm run db:local:migrate
```

## API starts but UI cannot reach it

Check `apps/web/.env.local` contains:

```text
VITE_API_BASE=http://localhost:8787
```

Restart `npm run dev:web` after changing env files.

## Unauthorized in the UI

Run setup again and paste the printed master key into Access settings:

```bash
npm run setup:local -- --force
```

Do not paste hashed keys. The UI needs the raw `MASTER_SUBMITTER_KEY` printed by setup.

## Agent jobs stay queued

Make sure the render worker is running:

```bash
set -a
source .env.render-worker.local
set +a
npm run dev:render
```

If using Hermes, verify:

```bash
hermes chat -q 'Reply with exactly: OK' --quiet
```

If using another agent CLI, check `AGL_AGENT_COMMAND` and `AGL_AGENT_ARGS_JSON`.

## R2 upload says `r2_not_configured`

That is allowed for local/hackathon mode. R2 is optional. Local rendering and article export still work; public artifact hosting is just disabled.

## Blank preview

Open browser devtools and check console errors. A valid generated preview should expose:

```js
window.__timelines.main
window.__hf.seek(t)
```

Regenerate the preview if the generated HTML failed validation.
