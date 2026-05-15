import { describe, expect, it } from 'vitest';
import { parseDesignMdToAglDesignSystem } from './design-md';

describe('DESIGN.md to AGL design system', () => {
  it('extracts base DESIGN.md tokens', () => {
    const input = `---
version: alpha
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
    fontSize: 3rem
    fontWeight: 760
    lineHeight: 1.05
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 450
rounded:
  md: 18px
  lg: 32px
---

## Overview

Warm editorial explainers.
`;
    const parsed = parseDesignMdToAglDesignSystem(input);
    expect(parsed.source).toBe('design-md');
    expect(parsed.label).toBe('Hungry Editorial');
    expect(parsed.colors.text).toBe('#111114');
    expect(parsed.colors.accent).toBe('#ff6b35');
    expect(parsed.colors.bg).toBe('#fffaf3');
    expect(parsed.typography.font).toContain('Inter');
    expect(parsed.shape.radius).toBe(32);
    expect(parsed.motion.personality).toBe('calm');
  });

  it('honors optional agl motion/composition extension', () => {
    const input = `---
name: Terminal Article
colors:
  primary: "#d9ffe8"
  secondary: "#76a58d"
  tertiary: "#35f6a5"
  neutral: "#05070b"
agl:
  motion:
    personality: technical
    easing: steps(1)
    glow: strong
    particleDensity: medium
  composition:
    backgroundPolicy: soft-card
    diagramDensity: dense
    preferredGrammars:
      - sequence
      - loop
    avoid:
      - pastel cards
---
`;
    const parsed = parseDesignMdToAglDesignSystem(input);
    expect(parsed.motion.personality).toBe('technical');
    expect(parsed.motion.glow).toBe('strong');
    expect(parsed.composition.backgroundPolicy).toBe('soft-card');
    expect(parsed.composition.preferredGrammars).toEqual(['sequence', 'loop']);
    expect(parsed.composition.avoid).toContain('pastel cards');
  });

  it('infers useful tokens from markdown-only DESIGN.md prose', () => {
    const input = `## Overview

Ferrari's marketing site reads as cinematic editorial. The base canvas is **near-black** (\`{colors.canvas}\` — #181818) holding pure white display type. The single brand voltage is **Rosso Corsa** (\`{colors.primary}\` — #da291c), used scarcely.

## Colors

- **Rosso Corsa** (\`{colors.primary}\` — #da291c): The iconic racing red.
- **Canvas** (\`{colors.canvas}\` — #181818): Near-black page floor.
- **Canvas Elevated** (\`{colors.canvas-elevated}\` — #303030): Cards and panels.
- **Hairline** (\`{colors.hairline}\` — #303030): 1px divider.
- **Ink** (\`{colors.ink}\` — #ffffff): Display.
- **Body** (\`{colors.body}\` — #969696): Default running-text.

## Typography

**FerrariSans** is the licensed single sans family. Open-source substitute: **Inter** at weight 500.

| Token | Size | Weight |
|---|---|---|
| \`{typography.display-mega}\` | 80px | 500 |
| \`{typography.body-md}\` | 14px | 400 |

## Shapes

| Token | Value |
|---|---|
| \`{rounded.none}\` | 0px |

Sharp \`{rounded.none}\` (0px) corners on every CTA, card, and band.

## Do's and Don'ts

### Don't
- Don't use pure black canvas.
`;
    const parsed = parseDesignMdToAglDesignSystem(input);
    expect(parsed.label).toBe('Ferrari Imported');
    expect(parsed.colors.bg).toBe('#181818');
    expect(parsed.colors.text).toBe('#ffffff');
    expect(parsed.colors.accent).toBe('#da291c');
    expect(parsed.colors.surface).toBe('#303030');
    expect(parsed.shape.radius).toBe(0);
    expect(parsed.motion.personality).toBe('cinematic');
    expect(parsed.composition.backgroundPolicy).toBe('full-bleed');
    expect(parsed.composition.avoid).toContain("Don't use pure black canvas.");
  });
});
