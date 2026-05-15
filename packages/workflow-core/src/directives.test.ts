import { describe, expect, it } from 'vitest';
import { directiveToSpot, extractGraphicDirectives, stripGraphicDirectives } from './directives';

const article = `# Agent Memory

Agents improve when context compounds.

<!-- AGL_GRAPHIC
id: memory-loop
type: loop
priority: 1
placement: replace
aspect: articleBanner
duration: 7
style: article-native
description: Show task output turning into reusable memory and improving the next task.
caption: Memory turns one-off work into compounding context.
must_include:
  - Task
  - Memory
  - Better next answer
avoid:
  - robot mascot
-->

That loop changes the economics.`;

describe('graphic directives', () => {
  it('extracts yamlish AGL_GRAPHIC blocks', () => {
    const directives = extractGraphicDirectives(article);
    expect(directives).toHaveLength(1);
    expect(directives[0].id).toBe('memory-loop');
    expect(directives[0].type).toBe('loop');
    expect(directives[0].parseStatus).toBe('ok');
  });

  it('converts directives into article visual spots', () => {
    const spot = directiveToSpot(extractGraphicDirectives(article)[0], article);
    expect(spot.accepted).toBe(true);
    expect(spot.conceptText).toContain('transparent stage/background');
    expect(spot.directive?.placement).toBe('replace');
  });

  it('strips graphic directives', () => {
    expect(stripGraphicDirectives(article)).not.toContain('AGL_GRAPHIC');
  });
});
