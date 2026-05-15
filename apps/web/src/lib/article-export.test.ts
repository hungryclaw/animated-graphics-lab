import { describe, expect, it } from 'vitest';
import { buildArticleHtml, buildArticleMarkdown } from './article-export';

const directive = `<!-- AGL_GRAPHIC
id: memory-loop
description: Show task to result to memory to improved next task.
caption: Memory turns one-off work into compounding context.
-->`;
const article = `# Agent Memory

Agents improve when work leaves reusable context.

${directive}

The next run starts from a better position.`;

const spot = {
  id: 'memory-loop',
  insertAfterParagraph: 2,
  visualIdea: 'Show task to result to memory to improved next task.',
  captionSuggestion: 'Memory turns one-off work into compounding context.',
  directive: { raw: directive, start: article.indexOf(directive), end: article.indexOf(directive) + directive.length, placement: 'replace' as const }
};

describe('article export directive replacement', () => {
  it('replaces an AGL_GRAPHIC directive with a GIF embed in markdown', () => {
    const out = buildArticleMarkdown(article, [{ ...spot, job: { gifUrl: 'memory-loop.gif' } }]);
    expect(out).toContain('![Memory turns one-off work into compounding context.](memory-loop.gif)');
    expect(out).not.toContain('AGL_GRAPHIC');
  });

  it('replaces an AGL_GRAPHIC directive with a bare GIF figure in HTML', () => {
    const out = buildArticleHtml(article, [{ ...spot, job: { gifUrl: 'memory-loop.gif' } }], 'Agent Memory');
    expect(out).toContain('<img src="memory-loop.gif"');
    expect(out).toContain('class="agl-animation"');
    expect(out).not.toContain('AGL_GRAPHIC');
    expect(out).toContain('.agl-animation{margin:32px 0;padding:0;border:0;border-radius:0;background:transparent}');
  });

  it('preserves unresolved directive intent as pending markdown', () => {
    const out = buildArticleMarkdown(article, [spot]);
    expect(out).toContain('AGL_GRAPHIC_PENDING');
    expect(out).toContain('Show task to result to memory');
    expect(out).not.toContain('AGL_GRAPHIC\nid: memory-loop');
  });
});
