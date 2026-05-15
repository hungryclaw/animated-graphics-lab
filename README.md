# Animated Graphics Lab

Local-first article visualization lab that turns article ideas and agent-written `AGL_GRAPHIC` placeholders into live HTML/GSAP animation previews, HyperFrames renders, GIF/MP4 assets, and exported articles with visuals embedded.

Hosted Cloudflare app:

```text
https://animated-graphics-lab.pages.dev
```

That hosted page is now intentionally positioned as the demo + documentation hub. The full private flow — Codex subscription access, local files, local rendering, and artifact export — runs on your own device.

Rendered locally with HyperFrames from HeyGen.

## What it does

Animated Graphics Lab supports three paths over one shared workflow contract:

1. Cloud demo/docs: paste an article or directive example, see the UX and instructions.
2. Local interactive app: run the Worker API, Vite UI, D1 dev state, and render worker on your machine.
3. Autonomous agent CLI: run article -> directives/spots -> draft HTML -> HyperFrames render -> ffmpeg GIF -> exported Markdown/HTML without opening the browser.

The core rule still holds for interactive mode: preview first, render only after approval. Autonomous mode uses the same contracts but accepts valid spots automatically.


## Design systems

Choose a built-in visual style or paste a `DESIGN.md` file. AGL normalizes the design into animation-aware tokens so browser previews, revisions, local agent prompts, and HyperFrames renders keep the same visual language. Style previews are deterministic and run locally in the UI with no API key.

## Stack

- `apps/web`: React + Vite + TypeScript UI with article mode, live previews, directive import, instructions, and export.
- `apps/worker`: Cloudflare Worker API with D1 queues, local Wrangler dev, hashed-token auth, optional R2 upload storage, and worker polling endpoints.
- `packages/composition-schema`: shared Zod schemas, aspect presets, style presets, and directive types.
- `packages/workflow-core`: shared AGL directive parsing, article export, run manifest, and workflow state types used by the web UI and local runner.
- `packages/render-worker`: local pull worker that uses Hermes or any configured agent CLI, writes safe HTML/GSAP, renders with HyperFrames from HeyGen, and converts GIFs with ffmpeg.
- `packages/local-runner`: autonomous CLI for local MacBook/device runs, Codex/Hermes/custom agent adapters, HyperFrames render smoke test, and artifact export.

## Quickstart: autonomous local flow

```bash
git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install
npm run agl:doctor:mac
cp examples/configs/local-codex.example.json .agl/config.local.json
npm run agl:codex:check
npm run agl:render:test -- --dry-run
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --no-render --out .agl/runs/demo-no-render
```

Full local render after Codex + HyperFrames are verified:

```bash
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --render --out .agl/runs/demo-full
```

Output shape:

```text
.agl/runs/<run-id>/
  manifest.json
  article.input.md
  article.final.md
  article.final.html
  visuals/<id>/
    source.html
    index.html
    metadata.json
    render.mp4
    render.gif
```

Codex subscription credentials stay local on your device. Do not paste Codex secrets into Cloudflare.

## Quickstart: local interactive app

```bash
git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install
npm run local:setup
npm run local:dev
```

Use `npm run local:setup:codex` instead of `local:setup` if you want the render worker to call the local Codex CLI directly. Run `codex login` first. For another local agent CLI, set `AGL_AGENT_COMMAND` and `AGL_AGENT_ARGS_JSON`, then run `npm run local:setup:custom`.

Open:

```text
http://localhost:5173
```

`npm run local:setup` checks prerequisites, creates local env files, migrates local D1, builds, and tests. `npm run local:dev` starts the Wrangler Worker API, local render worker, and Vite UI in one terminal.

If you are developing from a fork:

```bash
git clone git@github.com:<your-user>/animated-graphics-lab.git
cd animated-graphics-lab
git remote add upstream https://github.com/hungryclaw/animated-graphics-lab.git
git fetch upstream
git checkout -b my-agl-changes
npm install
npm run local:setup
npm run local:dev
```

Paste the `MASTER_SUBMITTER_KEY` printed by `npm run local:setup` into Access settings.

## Quickstart: agentic article placeholders

Install the local agent instruction pack:

```bash
npm run agent:pack
```

Give `.agl/agent-instructions.md` to your writing agent. The agent should write normal Markdown plus comments like this:

```md
<!-- AGL_GRAPHIC
id: memory-loop
type: loop
description: Show task -> result -> memory -> improved next task as a simple loop.
caption: Memory turns one-off work into compounding progress.
placement: after
aspect: articleBanner
duration: 7
avoid:
  - colored background panel
  - fake dashboard chrome
-->
```

Paste the article into AGL and click `Import graphic placeholders`, or run it through `npm run agl:run` for the autonomous path.

## Local commands

```bash
npm run check:local       # verify Node, npm, ffmpeg, ffprobe, wrangler, HyperFrames, agent command
npm run agl:doctor:mac    # Mac-focused local readiness check
npm run setup:local       # generate local env files and raw UI key
npm run db:local:migrate  # apply D1 migrations to local Wrangler state
npm run agent:pack        # write .agl/agent-instructions.md and example prompt
npm run smoke:local       # start local API and check /api/health
npm run agl:codex:check   # check local Codex CLI availability; optional prompt probe
npm run agl:render:test   # render a known-good HyperFrames smoke graphic
npm run agl:run           # autonomous local article visualizer
npm run dev:api
npm run dev:web
npm run dev:render
npm run build
npm test -- --runInBand
```

## Documentation

- `docs/agents.md` — how writing agents should use `AGL_GRAPHIC`.
- `docs/agent-instruction-pack.md` — copy-paste instruction pack for external agents.
- `docs/local-quickstart.md` — local user setup.
- `docs/macbook-local-testing.md` — MacBook/Codex/HyperFrames local validation path.
- `docs/workflow-architecture.md` — shared workflow architecture and update discipline.
- `docs/hackathon-judge-guide.md` — short hackathon evaluation path.
- `docs/hackathon-local-setup.md` — detailed local architecture and setup.
- `docs/troubleshooting.md` — common setup issues.

The hosted app also has an Instructions page with copyable snippets.

## Architecture

```text
Article/topic or agent draft
  -> shared packages/workflow-core contract
  -> Cloudflare demo UI OR local interactive UI OR autonomous CLI
  -> local Codex/Hermes/custom agent adapter
  -> safe HTML/CSS/GSAP draft
  -> browser live preview or autonomous validation
  -> HyperFrames from HeyGen MP4 render
  -> ffmpeg GIF conversion
  -> article HTML/Markdown export
```

## Cloudflare deployment

Cloudflare Pages is the public demo/docs surface. The Worker/D1 queue can still support remote demo jobs, but private Codex subscription access and full local rendering should run on the user's device.

Create D1:

```bash
cd apps/worker
npx wrangler d1 create animated_graphics_lab
# put the generated database_id into wrangler.toml
npx wrangler d1 migrations apply animated_graphics_lab --remote
```

Generate raw secrets and hash them with the same pepper:

```bash
openssl rand -base64 48 # raw MASTER_SUBMITTER_KEY
openssl rand -base64 48 # raw RENDER_WORKER_TOKEN
openssl rand -base64 48 # raw ADMIN_KEY
node scripts/hash-token.mjs 'raw-key-here' 'pepper-here'
```

Set Worker secrets and deploy as before with `npm run cf:*` scripts. R2/object storage is optional. The app degrades gracefully when R2 is not configured.

## Render worker / agent adapter

Default Hermes setup:

```bash
export AGL_API_BASE='https://animated-graphics-lab-api.<account>.workers.dev'
export AGL_RENDER_WORKER_TOKEN='raw render worker token'
export AGL_WORKER_ID='local-agent-worker'
export AGL_AGENT_COMMAND='hermes'
export AGL_AGENT_PROVIDER='openai-codex'
export AGL_AGENT_MODEL='gpt-5.5'
npm run start --workspace @agl/render-worker
```

Generic agent CLI:

```bash
export AGL_AGENT_COMMAND='/path/to/my-agent'
export AGL_AGENT_ARGS_JSON='["--prompt", "{prompt}", "--json"]'
npm run start --workspace @agl/render-worker
```

The agent command must print the expected JSON draft object.

## Security notes

- Codex subscription credentials stay local on the user's device.
- Raw UI/worker/admin keys are never committed.
- Worker auth stores hashes with a pepper.
- The render worker is pull-based; no inbound tunnel is required.
- Generated HTML is validated before render.
- R2 uploads are optional.

## Hackathon status

This repo is intended to be runnable by judges locally without a Cloudflare account. Hosted deployment is a convenience, not a requirement.

## License

MIT
