import { describe, expect, it } from 'vitest';
import { directiveToSpot, extractGraphicDirectives, stripGraphicDirectives } from './graphic-directives';

const article = `# Agentic Draft

First paragraph explains the direct answer path.

<!-- AGL_GRAPHIC
id: tool-use-threshold
type: comparison
placement: replace
aspect: articleBanner
duration: 7
description: Show direct answer versus tool use, with uncertainty and stakes deciding when tools are worth it.
caption: Tool use is a tradeoff, not a default.
avoid:
  - robot mascot
  - colored background panel
must_include:
  - direct answer
  - verified tool call
-->

Second paragraph continues after the visual.`;

describe('graphic directives', () => {
  it('extracts YAML-ish AGL_GRAPHIC comments with lists and offsets', () => {
    const directives = extractGraphicDirectives(article);
    expect(directives).toHaveLength(1);
    expect(directives[0]).toMatchObject({
      id: 'tool-use-threshold',
      type: 'comparison',
      placement: 'replace',
      aspect: 'articleBanner',
      duration: 7,
      caption: 'Tool use is a tradeoff, not a default.',
      parseStatus: 'ok'
    });
    expect(directives[0].description).toContain('direct answer versus tool use');
    expect(directives[0].avoid).toEqual(['robot mascot', 'colored background panel']);
    expect(directives[0].must_include).toEqual(['direct answer', 'verified tool call']);
    expect(directives[0].start).toBeGreaterThan(0);
    expect(directives[0].end).toBeGreaterThan(directives[0].start);
    expect(directives[0].paragraphIndex).toBe(2);
  });

  it('extracts shorthand directives and generates a stable id', () => {
    const directives = extractGraphicDirectives('Intro.\n\n<!-- AGL_GRAPHIC: Animate messy notes becoming a structured outline. -->');
    expect(directives).toHaveLength(1);
    expect(directives[0].description).toBe('Animate messy notes becoming a structured outline.');
    expect(directives[0].id).toBe('animate-messy-notes-becoming-a-structured-outline');
    expect(directives[0].type).toBe('metaphor');
  });

  it('extracts JSON directives', () => {
    const directives = extractGraphicDirectives('Text\n\n<!-- AGL_GRAPHIC {"id":"eval-loop","type":"loop","description":"Show prompt to output to evaluator to improved prompt."} -->');
    expect(directives[0]).toMatchObject({ id: 'eval-loop', type: 'loop', description: 'Show prompt to output to evaluator to improved prompt.' });
  });

  it('keeps malformed directives as error cards instead of dropping them', () => {
    const directives = extractGraphicDirectives('Text\n\n<!-- AGL_GRAPHIC\nid: missing-description\n-->');
    expect(directives).toHaveLength(1);
    expect(directives[0].parseStatus).toBe('error');
    expect(directives[0].parseMessage).toMatch(/description/i);
  });

  it('maps directives to editable article spots with directive metadata', () => {
    const directive = extractGraphicDirectives(article)[0];
    const spot = directiveToSpot(directive, article, 1);
    expect(spot.id).toBe('tool-use-threshold');
    expect(spot.accepted).toBe(true);
    expect(spot.grammar).toBe('comparison');
    expect(spot.aspectPreset).toBe('articleBanner');
    expect(spot.durationSeconds).toBe(7);
    expect(spot.conceptText).toContain('Must include: direct answer; verified tool call');
    expect(spot.conceptText).toContain('Avoid: robot mascot; colored background panel');
    expect(spot.directive?.raw).toContain('AGL_GRAPHIC');
  });

  it('strips directives when a clean article body is needed', () => {
    expect(stripGraphicDirectives(article)).not.toContain('AGL_GRAPHIC');
    expect(stripGraphicDirectives(article)).toContain('Second paragraph continues');
  });
});
