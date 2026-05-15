# Asset checklist

## Already prepared in this project

- Voiceover script: `voiceover.txt`
- Storyboard: `storyboard.md`
- Source claims and sample article: `source-materials.md`
- Shot list: `shot-list.md`
- HyperFrames implementation brief: `hyperframes-brief.md`

## Assets available from repo/docs

- Repo URL: `https://github.com/hungryclaw/animated-graphics-lab`
- Hosted app URL: `https://animated-graphics-lab.pages.dev`
- Existing demo article: `examples/articles/no-directives-demo.md`
- Existing docs: `docs/hackathon-judge-guide.md`, `docs/hackathon-messaging-plan.md`, `docs/demo-video-script.md`

## Need to gather manually

### 1. Real product screen recordings

Record these if the app is ready enough:

- AGL article mode with a normal article pasted in.
- Clicking the action that finds/suggests visual spots.
- The visual spot cards appearing.
- Generating a live preview.
- Revising or approving a preview.
- Render status progressing to HyperFrames/MP4/GIF.
- Export/output screen.

Minimum acceptable replacement if the live app is not stable:

- Static screenshots of the current UI.
- Simulated UI cards built directly in HyperFrames.
- Terminal/output-folder shots from the local runner.

### 2. Finished animation asset

Needed for the strongest demo:

- One actual rendered `render.mp4` from AGL.
- One actual rendered `render.gif` from AGL.

Preferred visual:

```text
stateless agent loop vs memory-backed agent loop
```

If this does not exist yet, create a simulated version in the HyperFrames demo itself, but mark it visually as a product preview rather than a real exported file.

### 3. Brand/logo assets

Gather if available:

- Animated Graphics Lab logo or mark, if one exists.
- HeyGen logo, if allowed by hackathon guidelines.
- HyperFrames wordmark/logo, if available and allowed.

If not available, use text labels only:

```text
HyperFrames from HeyGen
```

### 4. Platform visuals

Gather optional logos or create generic cards for:

- Medium
- Substack
- X
- Newsletter
- Docs

Safer default: use generic labeled cards instead of official logos, unless brand assets are already allowed and clean.

### 5. Voiceover audio

Either:

- Record your own voice for higher authenticity.
- Use TTS after approving `voiceover.txt`.

Manual recording note:

- Keep it casual and fast.
- Do not over-enunciate like a corporate explainer.
- The "polished oatmeal" line should sound amused, not bitter.

### 6. Optional terminal proof shot

Capture this tree if available after a local run:

```text
.agl/runs/demo-full/
  article.final.md
  article.final.html
  visuals/stateless-vs-memory-agent/
    render.mp4
    render.gif
```

If no local render exists yet, use a simple animated mock tree in the HyperFrames composition.

### 7. HeyGen hackathon source screenshot

Optional but useful:

- Screenshot of the HeyGen hackathon X post.

Use only as a 1-second contextual flash or not at all. The demo should be about the product, not the tweet.

## Manual gathering priority

If time is short, gather only these three:

1. One clean AGL UI screen recording showing article -> visual spot suggestions.
2. One preview/render result, even if draft quality.
3. Voiceover audio, or approval to use TTS from `voiceover.txt`.
