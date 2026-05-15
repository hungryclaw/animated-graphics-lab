import { describe, expect, it } from 'vitest';
import { buildArticleHtml, buildArticleMarkdown } from './article-export';

const directive = `<!-- AGL_GRAPHIC
id: memory-loop
type: loop
placement: replace
aspect: articleBanner
duration: 7
description: Show task to memory.
caption: Memory turns one-off work into compounding context.
-->`;
const article = `# Agent Memory

First paragraph.

${directive}

Second paragraph.`;
const spot = { id: 'memory-loop', insertAfterParagraph: 0, visualIdea: 'Show task to memory', captionSuggestion: 'Memory turns one-off work into compounding context.', directive: { raw: directive, start: article.indexOf(directive), end: article.indexOf(directive) + directive.length, placement: 'replace' as const } };

describe('article export directive replacement', () => {
  it('replaces an AGL_GRAPHIC directive with a GIF embed in markdown', () => {
    const out = buildArticleMarkdown(article, [{ ...spot, job: { gifUrl: 'visuals/memory-loop/render.gif' } }]);
    expect(out).toContain('![Memory turns one-off work into compounding context.](visuals/memory-loop/render.gif)');
    expect(out).not.toContain('AGL_GRAPHIC');
  });

  it('replaces an AGL_GRAPHIC directive with a bare GIF figure in HTML and attribution comment', () => {
    const out = buildArticleHtml(article, [{ ...spot, job: { gifUrl: 'visuals/memory-loop/render.gif' } }], 'Agent Memory');
    expect(out).toContain('<img src="visuals/memory-loop/render.gif"');
    expect(out).toContain('class="agl-animation"');
    expect(out).toContain('HyperFrames from HeyGen');
    expect(out).not.toContain('AGL_GRAPHIC');
  });
});
