# Workflow Architecture

Animated Graphics Lab has three entry points over one shared workflow:

1. Cloudflare demo/docs: public explanation and optional hosted queue demo.
2. Local interactive app: Vite UI + local Worker/D1 + local render worker.
3. Autonomous agent CLI: no browser, no human approval loop required.

All three should use `packages/workflow-core` for `AGL_GRAPHIC` parsing, article export, run manifests, and workflow state naming.

## Stack per step

1. Article/topic input
   - Markdown files, pasted text, or CLI `--topic`.
2. Directive extraction / spot planning
   - `packages/workflow-core` parses `AGL_GRAPHIC`.
   - `packages/render-worker/src/article-analyzer.mjs` can plan spots with a local agent if no directives exist.
3. Agent draft generation
   - Local Codex CLI, Hermes with openai-codex, or a custom command.
   - Output is validated JSON with complete HTML/CSS/GSAP.
4. HTML validation
   - `packages/render-worker/src/draft-generator.mjs` checks HyperFrames bridge, GSAP timeline, blocked APIs, and text overlap heuristics.
5. Render
   - HyperFrames from HeyGen renders MP4 locally.
6. GIF conversion
   - ffmpeg/ffprobe converts and verifies GIF/MP4 artifacts.
7. Export
   - `packages/workflow-core` writes Markdown/HTML with relative visual paths.
8. Manifest
   - `manifest.json` records run stage, visual status, artifacts, validation, and errors.

## Update checklist

Any future workflow change must update:

- `packages/workflow-core` types/tests.
- Web UI adapter/imports.
- Worker/render-worker adapter if relevant.
- Local runner adapter.
- README/docs/in-app instructions.
- At least one example fixture.

Required public language:

- `AGL_GRAPHIC`
- `Codex subscription stays local on your device`
- `Rendered locally with HyperFrames from HeyGen`
- `Cloudflare demo/docs`
- `Autonomous agent flow`
