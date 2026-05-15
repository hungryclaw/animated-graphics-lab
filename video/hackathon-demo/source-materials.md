# Source materials

## Verified HeyGen Hackathon source

Source URL:

```text
https://x.com/HeyGen/status/2055016245305770469?s=20
```

Relevant facts from the post:

- The HeyGen Hackathon is underway.
- 130 developers, IRL and online.
- 24 hours to build scalable integrations on top of HeyGen's video platform.
- Prize categories include:
  - $3K Grand Prize
  - $1K Best AI Agent Setup
  - $1K Best Use of HeyGen

Use in video:

```text
Built for the HeyGen Hackathon
```

Do not overload the video with prize details. The script should mention the hackathon once, then move on.

## Repo facts

Repo:

```text
https://github.com/hungryclaw/animated-graphics-lab
```

Hosted demo/docs:

```text
https://animated-graphics-lab.pages.dev
```

Current repo positioning:

```text
Local-first article visualization lab that turns article ideas and agent-written AGL_GRAPHIC placeholders into live HTML/GSAP animation previews, HyperFrames renders, GIF/MP4 assets, and exported articles with visuals embedded.
```

Video-friendly positioning:

```text
Animated Graphics Lab is a local-first visual layer for AI-assisted articles. It reads article context, finds visual moments, previews them as HTML/GSAP animations, renders approved visuals with HyperFrames from HeyGen, and exports GIF/MP4 assets that work anywhere.
```

## Core workflow

Main demo path:

```text
Normal article
  -> AGL finds visual spots
  -> live HTML/GSAP previews
  -> writer approval/revision
  -> HyperFrames MP4 render
  -> GIF export
  -> publish anywhere
```

Supporting agent path:

```text
Agent-written article or topic
  -> same AGL flow
  -> local runner / integrated agent workflow
```

Do not make the main demo about tags or directive syntax. Those can be shown later in docs or as a secondary fast shot.

## Sample article for demo

Use this as the article in the screen recording or simulated UI:

```md
# Memory Makes Agents Compound

Most agents are stateless workers. They complete a task, lose the context, and repeat the same mistakes later.

The difference is not magic. It is continuity. A memory-backed agent can use previous results to make the next run better.
```

Suggested visual spots AGL should appear to find:

1. Stateless vs memory-backed agent comparison.
2. Task -> result -> memory -> improved next run loop.
3. Before/after: isolated task output vs compounding workflow.

## UI labels to show

Use short, readable labels:

- Find visual spots
- Visual spots found
- Generate preview
- Live preview
- Revise
- Approve render
- HyperFrames rendering MP4
- Converting GIF
- Export ready

## Final output labels

Use these file names in output shots:

```text
article.final.md
article.final.html
visuals/stateless-vs-memory-agent/render.mp4
visuals/stateless-vs-memory-agent/render.gif
```

## Overlay copy bank

- AI writing needs a visual layer.
- HTML embeds do not travel well.
- Finds visual spots automatically.
- Preview first.
- Render with HyperFrames.
- Export GIF + MP4.
- Publish anywhere.
- Local-first article visuals.
- HTML when you are designing. GIF when you are publishing.

## Things to avoid in source material

- Do not show `AGL_GRAPHIC` tags in the main 50-second cut.
- Do not use a neon AI brain visual.
- Do not use robot mascots.
- Do not imply it magically creates perfect design without review.
- Do not make the hosted app sound like the place where private credentials live.
- Do not overexplain Cloudflare, D1, Worker queues, or token auth in the main video.
