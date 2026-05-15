# MacBook Local Testing

Use this path when testing Animated Graphics Lab on a MacBook instead of the VPS.

The important rule: Codex subscription credentials stay local on your Mac. Cloudflare Pages is only the demo/docs surface. Rendering is powered by HyperFrames from HeyGen on your device.

## Install prerequisites

```bash
brew install node ffmpeg
node --version
npm --version
ffmpeg -version
ffprobe -version
```

Verify HyperFrames:

```bash
npx --yes hyperframes --help
```

Verify your local agent path:

```bash
codex --version
codex login
# or use Hermes with the openai-codex provider
hermes setup
hermes chat -q 'Reply with exactly: OK' --quiet
```

## Clone and install

```bash
git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install
npm run agl:doctor:mac
```

## Configure local Codex adapter

```bash
mkdir -p .agl
cp examples/configs/local-codex.example.json .agl/config.local.json
npm run agl:codex:check
```

If your Codex CLI uses different flags, edit `.agl/config.local.json`. The adapter replaces `{prompt}` with the generated prompt.

## Smoke tests

No-render export:

```bash
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --no-render --out .agl/runs/mac-no-render
open .agl/runs/mac-no-render/article.final.html
```

HyperFrames dry smoke:

```bash
npm run agl:render:test -- --dry-run --out .agl/runs/mac-render-smoke-dry
open .agl/runs/mac-render-smoke-dry/visuals/smoke/index.html
```

Full render smoke:

```bash
npm run agl:render:test -- --out .agl/runs/mac-render-smoke
open .agl/runs/mac-render-smoke/visuals/smoke/render.gif
```

Full autonomous article render:

```bash
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --render --out .agl/runs/mac-directive-demo
open .agl/runs/mac-directive-demo/article.final.html
```

Expected output:

```text
.agl/runs/mac-directive-demo/
  manifest.json
  article.input.md
  article.final.md
  article.final.html
  visuals/memory-compounding-loop/source.html
  visuals/memory-compounding-loop/index.html
  visuals/memory-compounding-loop/metadata.json
  visuals/memory-compounding-loop/render.mp4
  visuals/memory-compounding-loop/render.gif
```
