# Design Systems in Animated Graphics Lab

Animated Graphics Lab supports two design-system sources:

1. Built-in animation design presets.
2. Imported `DESIGN.md` files.

Built-in presets are fastest for demos. `DESIGN.md` is best when you want article graphics to match a publication, project, or brand system without asking the model to improvise style from prose.

## Built-in presets

Visible labels are intentionally generic, not brand names:

- Soft Minimal
- Precision SaaS
- Gradient Editorial
- Terminal Glow
- Sketch Explainer
- Brutalist Pop
- Warm Editorial
- Mono Technical
- Cinematic Dark
- Blueprint System
- Calm Document
- Emerald Console

Each preset normalizes into AGL animation-aware tokens: palette, type, radius, stroke, shadow, motion personality, diagram density, background policy, prompt hints, and avoid rules.

## DESIGN.md support

AGL reads YAML frontmatter from regular `DESIGN.md` files for:

- colors
- typography
- radius
- stroke/border width
- shadow/elevation
- component node surface tokens

AGL then normalizes those values into the internal `AglDesignSystem` model used by previews, prompt generation, revisions, and render jobs.

## AGL extension block

`DESIGN.md` may include an optional `agl:` block for animation-specific behavior:

```yaml
---
name: Hungry Editorial
description: Warm article-native explainers.
colors:
  primary: "#111114"
  secondary: "#686868"
  tertiary: "#ff6b35"
  neutral: "#fffaf3"
typography:
  h1:
    fontFamily: Inter
    fontWeight: 760
  body-md:
    fontFamily: Inter
    fontWeight: 450
rounded:
  md: 18px
  lg: 32px
agl:
  motion:
    personality: calm
    easing: power3.out
    durationScale: 1
    stagger: 0.08
    glow: subtle
    particleDensity: low
  composition:
    backgroundPolicy: transparent
    diagramDensity: balanced
    preferredGrammars:
      - loop
      - transformation
      - comparison
    avoid:
      - fake dashboard chrome
      - huge colored background panels
---
```

## Why AGL extends DESIGN.md

`DESIGN.md` describes visual identity. Animated article graphics also need animation identity: motion pacing, diagram density, background policy, safe composition rules, and what to avoid. The normalized AGL layer keeps Cloudflare demo, local UI, local agent worker, and render jobs aligned.

## UX behavior

- The style selector shows real deterministic mini visualizations, not color swatches.
- Hover, keyboard focus, and click update a larger preview rail.
- Pasted `DESIGN.md` gets the same preview treatment as built-ins.
- Design lock is on by default so revisions/restyles keep the same visual language.
