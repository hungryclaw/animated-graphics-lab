# Hackathon Judge Guide

Animated Graphics Lab is a local-first article visualizer. It turns a pasted article, or an agent-written article containing `AGL_GRAPHIC` placeholders, into editable live HTML/GSAP animation previews and rendered GIF/MP4 article embeds.

## What to evaluate

- Agent-native writing workflow: external agents can mark visual opportunities without rendering anything.
- Preview-before-render: users see and revise live browser animations before spending render time.
- Local-first architecture: API, D1 queue, render worker, and frontend can all run locally.
- Deterministic export: approved HTML/GSAP is rendered by HyperFrames and converted with ffmpeg.
- Article-native output: final preview/export removes generator UI chrome.

## Hosted demo

Production app:

```text
https://animated-graphics-lab.pages.dev
```

The hosted app can show the UI and import placeholder drafts. Rendering depends on the configured private render worker and available credentials.

## Five-minute agentic demo

Paste this into article mode:

```md
# Memory Makes Agents Compound

Most agents are stateless workers. They complete a task, lose the context, and repeat the same mistakes later.

<!-- AGL_GRAPHIC
id: stateless-vs-memory-agent
type: comparison
description: Compare a stateless agent loop that forgets each task with a memory-backed agent loop that improves after every task.
caption: Memory turns isolated tasks into compounding progress.
placement: after
aspect: articleBanner
duration: 7
must_include:
  - stateless loop
  - memory layer
  - improved next run
avoid:
  - full colored background
  - fake dashboard chrome
-->

The difference is not magic. It is simply continuity.
```

Expected:

1. The app detects one `AGL_GRAPHIC` request.
2. Click `Import graphic placeholders`.
3. A visual spot card appears.
4. Generate preview.
5. Revise if desired.
6. Render when approved.
7. Export HTML/Markdown.

## Design-system demo path

1. Open the app.
2. Expand Options.
3. Hover/focus styles to see live mini visualization previews.
4. Click `Compare styles`.
5. Paste the example `DESIGN.md` from `docs/design-systems.md` and import it.
6. Generate preview.

Expected: built-in and imported designs are visually distinct, use generic labels, and require no API key for style inspection.

## Local judging path

Default local setup uses Hermes with the `openai-codex` provider:

```bash
git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install
npm run local:setup
npm run local:dev
```

For direct local Codex CLI mode:

```bash
git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install
codex login
npm run local:setup:codex
npm run local:dev
```

Open `http://localhost:5173` and paste the `MASTER_SUBMITTER_KEY` printed by setup into Access settings.

If a judge needs to debug individual processes, the manual three-terminal commands are in `docs/local-quickstart.md`.

## Architecture

```text
Article / agent draft
  -> React/Vite UI
  -> Cloudflare Worker API running locally through wrangler dev
  -> D1 queue
  -> local render/agent worker
  -> Hermes or custom agent CLI for HTML/GSAP draft generation
  -> HyperFrames MP4 render
  -> ffmpeg GIF conversion
  -> HTML/Markdown export
```

## Known limitations

- R2/object storage is optional and may be unavailable in the public demo environment.
- Final rendering requires local ffmpeg/ffprobe and HyperFrames.
- Master/local-agent mode quality depends on the configured local agent CLI.
- BYOK mode requires the user to provide provider keys.
