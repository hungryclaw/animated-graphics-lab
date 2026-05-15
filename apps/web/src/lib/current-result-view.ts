import type { StylePresetId } from '@agl/composition-schema';
import type { ArticleSpotState, ArticleVisualizationPlan } from '../types';

export type CurrentArticleResult = {
  articleText: string;
  articlePlan: ArticleVisualizationPlan | null;
  articleSpots: ArticleSpotState[];
  stylePreset: StylePresetId;
};

export type ResultAnimation = {
  id: string;
  label: string;
  grammar: 'sequence' | 'loop' | 'comparison' | 'stack' | 'transformation' | 'network' | 'timeline' | 'metaphor';
  insertAfterParagraph: number;
  caption: string;
  mediaKind?: 'gif' | 'mp4' | 'html' | 'placeholder';
  gifUrl?: string;
  mp4Url?: string;
  generatedHtml?: string;
  aspectPreset?: string;
  durationSeconds?: number;
};

export type CurrentResultView = {
  id: string;
  title: string;
  articleTitle: string;
  markdown: string;
  sourceLabel: string;
  stylePreset: StylePresetId;
  createdAt: string;
  summary: string;
  animations: ResultAnimation[];
  tags: string[];
  isCurrent: true;
};

const grammarIds = new Set(['sequence', 'loop', 'comparison', 'stack', 'transformation', 'network', 'timeline', 'metaphor']);

function normalizeGrammar(value: string): ResultAnimation['grammar'] {
  return grammarIds.has(value) ? value as ResultAnimation['grammar'] : 'metaphor';
}

function markdownTitle(markdown: string) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, '').trim().match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Untitled article';
}

function mediaForSpot(spot: ArticleSpotState): Pick<ResultAnimation, 'mediaKind'|'gifUrl'|'mp4Url'|'generatedHtml'|'aspectPreset'|'durationSeconds'> {
  if (spot.job?.status === 'done' && spot.job.gifUrl) return { mediaKind: 'gif', gifUrl: spot.job.gifUrl, aspectPreset: spot.aspectPreset, durationSeconds: spot.durationSeconds };
  if (spot.job?.status === 'done' && spot.job.mp4Url) return { mediaKind: 'mp4', mp4Url: spot.job.mp4Url, aspectPreset: spot.aspectPreset, durationSeconds: spot.durationSeconds };
  if (spot.draft?.generatedHtml) return { mediaKind: 'html', generatedHtml: spot.draft.generatedHtml, aspectPreset: spot.aspectPreset, durationSeconds: spot.durationSeconds };
  return { mediaKind: 'placeholder', aspectPreset: spot.aspectPreset, durationSeconds: spot.durationSeconds };
}

export function buildCurrentResultView(current?: CurrentArticleResult): CurrentResultView | null {
  if (!current?.articleText.trim() || !current.articlePlan) return null;
  const acceptedSpots = current.articleSpots.filter(spot => spot.accepted);
  if (!acceptedSpots.length) return null;
  const articleTitle = current.articlePlan.title || markdownTitle(current.articleText);
  return {
    id: 'current-workspace-before-after',
    title: `${articleTitle} · current workspace`,
    articleTitle,
    markdown: current.articleText,
    sourceLabel: 'Current app state',
    stylePreset: current.stylePreset,
    createdAt: 'current session',
    summary: current.articlePlan.summary || 'The article currently open in the app, shown before and after its accepted animation slots are inserted.',
    tags: ['current article', 'local state', 'rendered example'],
    isCurrent: true,
    animations: acceptedSpots
      .sort((a, b) => a.insertAfterParagraph - b.insertAfterParagraph || a.priority - b.priority)
      .map(spot => ({
        id: spot.id,
        label: spot.captionSuggestion || spot.visualIdea,
        grammar: normalizeGrammar(spot.grammar),
        insertAfterParagraph: spot.insertAfterParagraph,
        caption: spot.captionSuggestion || spot.rationale || spot.visualIdea,
        ...mediaForSpot(spot)
      }))
  };
}
