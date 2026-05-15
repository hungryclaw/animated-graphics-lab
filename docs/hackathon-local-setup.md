# Hackathon / Local Agent Setup

This project should be demoable by someone who clones the repo, points it at their own agent CLI, and runs the UI locally.

## Local Architecture

Run three local processes:

1. API queue
   - Cloudflare Worker via `wrangler dev`
   - Local D1 state persisted under `.wrangler/state`
   - Default URL: `http://localhost:8787`

2. Web UI
   - Vite React app
   - Default URL: `http://localhost:5173`
   - Points at `VITE_API_BASE=http://localhost:8787`

3. Local agent/render worker
   - Node worker polling the local Worker API
   - Uses the user's own agent CLI for draft generation
   - Uses HyperFrames + ffmpeg/ffprobe for rendering

No public Cloudflare deployment is required for a hackathon judge/local user.


## One-command helpers

The manual steps below are still documented for transparency, but the preferred hackathon path is:

```bash
npm run check:local
npm run setup:local
npm run db:local:migrate
npm run agent:pack
npm run smoke:local
```

- `check:local` verifies Node, npm, ffmpeg, ffprobe, Wrangler, HyperFrames, and the configured agent command.
- `setup:local` creates `apps/worker/.dev.vars`, `apps/web/.env.local`, and `.env.render-worker.local`, then prints the raw master UI key.
- `db:local:migrate` applies all D1 migrations to local Wrangler state.
- `agent:pack` writes `.agl/agent-instructions.md` for external writing agents.
- `smoke:local` starts the local API and checks `/api/health`.

## Prerequisites

- Node.js 20+
- npm
- ffmpeg and ffprobe
- A working agent CLI that can accept a prompt and print JSON
  - Default: Hermes Agent
  - Other CLIs can be wrapped using `AGL_AGENT_COMMAND` + `AGL_AGENT_ARGS_JSON`
- Optional but recommended: HyperFrames available through `npx hyperframes`

Hermes install:

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
hermes setup
hermes chat -q 'Reply with exactly: OK' --quiet
```

## Install

```bash
git clone <repo-url>
cd animated-graphics-lab
npm install
npm run build
npm test -- --runInBand
```

## Create Local Tokens

Generate raw local tokens:

```bash
MASTER_SUBMITTER_KEY="agl_master_local_$(openssl rand -hex 24)"
RENDER_WORKER_TOKEN="agl_worker_local_$(openssl rand -hex 24)"
ADMIN_KEY="agl_admin_local_$(openssl rand -hex 24)"
TOKEN_PEPPER="agl_pepper_local_$(openssl rand -hex 24)"

MASTER_SUBMITTER_KEY_HASH=$(node scripts/hash-token.mjs "$MASTER_SUBMITTER_KEY" "$TOKEN_PEPPER")
RENDER_WORKER_TOKEN_HASH=$(node scripts/hash-token.mjs "$RENDER_WORKER_TOKEN" "$TOKEN_PEPPER")
ADMIN_KEY_HASH=$(node scripts/hash-token.mjs "$ADMIN_KEY" "$TOKEN_PEPPER")
```

Create `apps/worker/.dev.vars`:

```bash
cat > apps/worker/.dev.vars <<EOF
TOKEN_PEPPER=$TOKEN_PEPPER
MASTER_SUBMITTER_KEY_HASH=$MASTER_SUBMITTER_KEY_HASH
RENDER_WORKER_TOKEN_HASH=$RENDER_WORKER_TOKEN_HASH
ADMIN_KEY_HASH=$ADMIN_KEY_HASH
APP_ORIGIN=http://localhost:5173
EOF
```

Create web env:

```bash
cat > apps/web/.env.local <<EOF
VITE_API_BASE=http://localhost:8787
EOF
```

Create render worker env:

```bash
cat > .env.render-worker.local <<EOF
AGL_API_BASE=http://localhost:8787
AGL_RENDER_WORKER_TOKEN=$RENDER_WORKER_TOKEN
AGL_WORKER_ID=local-agent-worker
AGL_JOBS_ROOT=$PWD/.agl/jobs
AGL_POLL_MS=2500

# Default Hermes-compatible agent command:
AGL_AGENT_COMMAND=hermes
AGL_AGENT_PROVIDER=openai-codex
AGL_AGENT_MODEL=gpt-5.5
EOF
```

Save the master key somewhere private. You paste it into the UI Access settings:

```bash
printf '\nMaster UI key:\n%s\n\n' "$MASTER_SUBMITTER_KEY"
```

## Initialize Local D1

```bash
npx wrangler d1 migrations apply animated_graphics_lab \
  --local \
  --persist-to .wrangler/state \
  --config apps/worker/wrangler.toml
```

If article mode has been added, also apply later migrations the same way.

## Run Locally

Terminal 1 — API:

```bash
npm run dev:api
```

Terminal 2 — render/agent worker:

```bash
set -a
source .env.render-worker.local
set +a
npm run dev:render
```

Terminal 3 — web UI:

```bash
npm run dev:web
```

Open:

```text
http://localhost:5173
```

Paste the `MASTER_SUBMITTER_KEY` into the UI. Generate a preview. Queue a render only after preview approval.

## Using Another Agent CLI

The render worker expects the agent to return JSON with:

```json
{
  "interpretation": "...",
  "grammar": "sequence",
  "generatedHtml": "<!doctype html>...",
  "notes": ["..."]
}
```

For Hermes, no custom args are required.

For another CLI, set a command and a JSON argument template. `{prompt}` is replaced with the generated prompt:

```bash
AGL_AGENT_COMMAND=/path/to/my-agent
AGL_AGENT_ARGS_JSON='["--prompt", "{prompt}", "--json"]'
```

Example wrapper script approach:

```bash
cat > ./my-agent-wrapper <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
PROMPT="$1"
# Call any local/remote agent here. It must print only the expected JSON.
my-agent generate --json --prompt "$PROMPT"
EOF
chmod +x ./my-agent-wrapper

AGL_AGENT_COMMAND=$PWD/my-agent-wrapper
AGL_AGENT_ARGS_JSON='["{prompt}"]'
```

## Hackathon Demo Script

1. Paste a full article.
2. Click `Find visualization spots`.
3. Show the 3-5 grounded suggestions.
4. Generate one spot preview.
5. Ask for a visual change.
6. Show preview updates before render.
7. Queue render.
8. Export the article HTML/Markdown with the animation inserted.

## Local-First Design Requirements

For hackathon readiness, keep these true:

- The app runs without Cloudflare account deployment.
- The UI can point at any API base via `VITE_API_BASE`.
- The worker can use any agent CLI via `AGL_AGENT_COMMAND` / `AGL_AGENT_ARGS_JSON`.
- Secrets are generated locally and never committed.
- R2/public object storage is optional, not required for the demo.
- Export works in-browser using Blob downloads even when no public storage exists.
