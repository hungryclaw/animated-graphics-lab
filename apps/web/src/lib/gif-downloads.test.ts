import { describe, expect, it } from 'vitest';
import { buildArticleGifDownloads, gifDownloadFilename } from './gif-downloads';
import type { ArticleSpotState } from '../types';

const baseSpot: ArticleSpotState = {
  id: 'memory-loop',
  priority: 2,
  anchorText: 'memory loop',
  insertAfterParagraph: 1,
  articleExcerpt: 'excerpt',
  visualIdea: 'Show memory loop',
  conceptText: 'Show memory loop',
  grammar: 'loop',
  aspectPreset: 'articleBanner',
  durationSeconds: 7,
  rationale: 'clarifies mechanism',
  captionSuggestion: 'Memory compounds over time.',
  accepted: true
};

describe('GIF downloads', () => {
  it('creates stable readable filenames for single animation GIF downloads', () => {
    expect(gifDownloadFilename('My Article: Agent Loops!', baseSpot)).toBe('my-article-agent-loops-02-memory-loop.gif');
  });

  it('collects accepted rendered GIFs for whole-article download batches', () => {
    const downloads = buildArticleGifDownloads('My Article', [
      { ...baseSpot, job: { id: 'job-1', status: 'done', gifUrl: 'https://cdn.example/a.gif' } },
      { ...baseSpot, id: 'rejected', priority: 1, accepted: false, job: { id: 'job-2', status: 'done', gifUrl: 'https://cdn.example/b.gif' } },
      { ...baseSpot, id: 'mp4-only', priority: 3, job: { id: 'job-3', status: 'done', mp4Url: 'https://cdn.example/c.mp4' } }
    ]);

    expect(downloads).toEqual([
      { url: 'https://cdn.example/a.gif', filename: 'my-article-02-memory-loop.gif', spotId: 'memory-loop' }
    ]);
  });
});
