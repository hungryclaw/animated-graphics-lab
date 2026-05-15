# Agent Instructions for Animated Graphics Lab

Animated Graphics Lab (AGL) lets writing agents mark places in an article where a short animation would help the reader. The agent writes normal Markdown plus `AGL_GRAPHIC` comments. A human then opens AGL, imports those comments as editable graphic requests, previews each animation, revises it, renders it, and exports the final article.

The agent does not render anything. It only places structured placeholders.

## Agent flow

1. Write the article normally.
2. When a visual would clarify a mechanism, add an `AGL_GRAPHIC` comment at that exact point.
3. Keep the placeholder self-contained: the animation brief should make sense even if AGL only sees that block and the nearby paragraph.
4. Use 2-5 visuals for a normal article.
5. The human pastes the finished draft into AGL and clicks `Import graphic placeholders`.
6. The human previews each imported visual, then either queues a local render worker job or exports a local HyperFrames render bundle.

## Full directive format

```md
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
```

## Shorthand format

```md
<!-- AGL_GRAPHIC: Animate messy notes becoming a structured outline. -->
```

## JSON format

```md
<!-- AGL_GRAPHIC {"id":"eval-loop","type":"loop","description":"Show prompt -> output -> evaluator -> improved prompt.","caption":"Evaluation closes the improvement loop."} -->
```

## Supported fields

| Field | Purpose | Example |
| --- | --- | --- |
| `id` | Stable graphic identifier | `memory-loop` |
| `type` | Visual grammar | `loop`, `sequence`, `comparison`, `stack`, `transformation`, `timeline`, `system` |
| `description` | Self-contained animation brief | `Show task -> result -> memory -> improved next task.` |
| `caption` | Optional article caption | `Memory compounds agent work.` |
| `placement` | Where to place output relative to the comment | `replace`, `before`, `after` |
| `aspect` | Output shape | `articleBanner`, `wideBanner`, `landscape`, `square`, `verticalShort` |
| `duration` | Seconds | `7` |
| `style` | Style hint | `article-native`, `terminal-dark`, `linear` |
| `must_include` | Required visual elements | list |
| `avoid` | Things to avoid | list |

## Good visual candidates

Use placeholders for:

- Workflows and pipelines.
- Loops and feedback cycles.
- Before/after transformations.
- Comparisons between two approaches.
- Layered systems.
- Timelines where order matters.

Skip placeholders for:

- Generic decoration.
- Aesthetic-only section breaks.
- Obvious claims.
- Quotes that are already clear as text.

## Minimal graphic rules

AGL works best when graphics are bare and article-native.

Prefer:

- Clean diagram objects.
- Transparent backgrounds.
- Text only when needed.
- One idea per animation.

Avoid:

- Full-canvas color backgrounds.
- Fake browser/app chrome.
- Titles that repeat article headings.
- Decorative particles, confetti, and AI-glow.
- Dense labels.

## How a human uses your draft in AGL

1. Paste the article into AGL article mode.
2. AGL detects `AGL_GRAPHIC` comments.
3. Click `Import graphic placeholders`.
4. Review each spot.
5. Generate live preview.
6. Revise the preview if needed.
7. Render approved graphics or export a render bundle for local HyperFrames rendering.
8. Export HTML or Markdown with visuals embedded or pending markers preserved.

## Install the instruction pack locally

From the AGL repo:

```bash
npm run agent:pack
```

This writes:

```text
.agl/agent-instructions.md
.agl/example-article-prompt.md
```

Then point your agent at the instruction file. Example with Hermes:

```bash
hermes chat -f .agl/example-article-prompt.md
```

For other CLIs, paste `.agl/agent-instructions.md` into project instructions or pass it as context.
