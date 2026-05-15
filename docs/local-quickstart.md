# Local Quickstart

This is the shortest path to run Animated Graphics Lab locally without deploying Cloudflare Pages or Workers. The hosted Cloudflare page is a demo/docs surface; private Codex subscription access and full rendering stay on your own device.

Rendered locally with HyperFrames from HeyGen.

## Prerequisites

Required:

- Node.js 20+
- npm
- ffmpeg and ffprobe
- Wrangler through npm/npx
- HyperFrames through `npx hyperframes`

Recommended for master/local-agent mode:

- Hermes Agent, Codex CLI, or another CLI configured with `AGL_AGENT_COMMAND` and `AGL_AGENT_ARGS_JSON`

Codex local adapter:

```bash
codex --version
codex login
mkdir -p .agl
cp examples/configs/local-codex.example.json .agl/config.local.json
npm run agl:codex:check
```

The Codex subscription stays local on your device. Do not paste Codex secrets into Cloudflare.

Hermes install:

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
hermes setup
hermes chat -q 'Reply with exactly: OK' --quiet
```

## Install

For most local users, this should be a two-command setup after cloning:

```bash
git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install
npm run local:setup
```

That default path configures Hermes as the local render worker agent with provider `openai-codex` and model `gpt-5.5`.

If you want the render worker to call the local Codex CLI directly instead:

```bash
git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install
codex login
npm run local:setup:codex
```

For another local LLM/agent CLI, set `AGL_AGENT_COMMAND` and `AGL_AGENT_ARGS_JSON`, then run:

```bash
export AGL_AGENT_COMMAND=/path/to/my-agent
export AGL_AGENT_ARGS_JSON='["--prompt","{prompt}","--json"]'
npm run local:setup:custom
```

`npm run local:setup` runs the local prerequisite check, generates local env files, migrates the local D1 database, builds the app, and runs the test suite.

It also prints a `MASTER_SUBMITTER_KEY`. Paste that key into the app's Access settings.

If you are developing from your own fork:

```bash
git clone git@github.com:<your-user>/animated-graphics-lab.git
cd animated-graphics-lab
git remote add upstream https://github.com/hungryclaw/animated-graphics-lab.git
git fetch upstream
git checkout -b local-design-systems
npm install
npm run local:setup
```

## Run locally

Start the Worker API, render worker, and Vite UI with one command:

```bash
npm run local:dev
```

Open:

```text
http://localhost:5173
```

`npm run local:dev` loads `.env.render-worker.local` for the render worker, starts all three local processes, prefixes their logs, and stops them together on Ctrl+C.

If you need to debug one process at a time, the old three-terminal flow still works:

```bash
npm run dev:api
```

```bash
set -a
source .env.render-worker.local
set +a
npm run dev:render
```

```bash
npm run dev:web
```

## Non-agentic article flow

Use this when you want the app to analyze an article and propose visuals.

1. Paste a complete article into article mode.
2. Paste the `MASTER_SUBMITTER_KEY` into Access settings.
3. Click `Find visualization spots`.
4. Review the 3-5 suggested spots.
5. Generate one preview at a time.
6. Revise previews until they match the article.
7. Render approved previews.
8. Export HTML or Markdown.

## Agentic article flow

Use this when a writing agent already inserted placeholders.

1. Install the agent pack:

```bash
npm run agent:pack
```

2. Give `.agl/agent-instructions.md` to your writing agent.
3. Ask the agent to write an article with `AGL_GRAPHIC` placeholders.
4. Paste the article into AGL.
5. Click `Import graphic placeholders`.
6. Review, preview, revise, render, and export.

## Autonomous agent flow

Use this when the article visualizer should run without a browser or human approval loop.

```bash
npm run agl:doctor:mac
npm run agl:render:test -- --dry-run
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --no-render --out .agl/runs/demo-no-render
```

Full local render after Codex + HyperFrames are verified:

```bash
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --render --out .agl/runs/demo-full
```

The runner writes `manifest.json`, `article.final.md`, `article.final.html`, source HTML, and rendered GIF/MP4 artifacts under `.agl/runs/<run-id>`.

## Using a different local agent CLI

The render worker defaults to Hermes. To use a different CLI, set:

```bash
export AGL_AGENT_COMMAND=/path/to/my-agent
export AGL_AGENT_ARGS_JSON='["--prompt", "{prompt}", "--json"]'
```

The command must print JSON with:

```json
{
  "interpretation": "...",
  "grammar": "sequence",
  "generatedHtml": "<!doctype html>...",
  "notes": ["..."]
}
```

## Local artifacts

R2/public object storage is optional. If R2 is not configured, the local worker still renders files under the local jobs directory (`.agl/jobs` by default). Export can preserve pending markers when a rendered URL is not available.

## Verify setup

```bash
npm run check:local
npm run smoke:local
```
