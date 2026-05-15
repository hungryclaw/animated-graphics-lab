import { describe, expect, it } from 'vitest';
import { buildCurrentResultView } from './current-result-view';
import type { ArticleSpotState } from '../types';

const baseSpot: ArticleSpotState = {
  id: 'real-html-animation',
  priority: 1,
  anchorText: 'important paragraph',
  insertAfterParagraph: 0,
  articleExcerpt: 'important paragraph',
  visualIdea: 'Show real generated animation',
  conceptText: 'Show real generated animation',
  grammar: 'transformation',
  aspectPreset: 'articleBanner',
  durationSeconds: 7,
  rationale: 'Makes the mechanism visible.',
  captionSuggestion: 'Real generated HTML is embedded here.',
  accepted: true,
  draft: {
    interpretation: 'A generated HTML animation.',
    grammar: 'transformation',
    generatedHtml: '<!doctype html><html><body><div id="real-animation">Real animation</div></body></html>',
    notes: []
  }
};

describe('current result view', () => {
  it('preserves real generated HTML animations for the before/after results page', () => {
    const view = buildCurrentResultView({
      articleText: '# Demo\n\nThe article paragraph.',
      articlePlan: { title: 'Demo', summary: 'Current generated article.', spots: [] },
      articleSpots: [baseSpot],
      stylePreset: 'appleMinimal'
    });

    expect(view?.animations[0]).toMatchObject({
      id: 'real-html-animation',
      generatedHtml: baseSpot.draft?.generatedHtml,
      mediaKind: 'html',
      aspectPreset: 'articleBanner',
      durationSeconds: 7
    });
  });

  it('uses rendered GIFs ahead of HTML previews when a render exists', () => {
    const view = buildCurrentResultView({
      articleText: '# Demo\n\nThe article paragraph.',
      articlePlan: { title: 'Demo', summary: 'Current generated article.', spots: [] },
      articleSpots: [{ ...baseSpot, job: { id: 'job-1', status: 'done', gifUrl: 'https://cdn.example/render.gif' } }],
      stylePreset: 'appleMinimal'
    });

    expect(view?.animations[0]).toMatchObject({
      mediaKind: 'gif',
      gifUrl: 'https://cdn.example/render.gif'
    });
  });
});
