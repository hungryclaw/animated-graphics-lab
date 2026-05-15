import type { AspectPresetId } from '@agl/composition-schema';

export type AglRunMode = 'demo' | 'local-ui' | 'autonomous-agent';
export type AglWorkflowStage =
  | 'input_received'
  | 'article_prepared'
  | 'directives_found'
  | 'spots_planned'
  | 'drafts_queued'
  | 'drafts_generated'
  | 'drafts_validated'
  | 'renders_queued'
  | 'rendered'
  | 'exported'
  | 'completed'
  | 'failed';

export type AglVisualStatus =
  | 'planned'
  | 'accepted'
  | 'preview_generating'
  | 'preview_ready'
  | 'preview_failed'
  | 'render_queued'
  | 'rendering'
  | 'rendered'
  | 'render_failed'
  | 'embedded'
  | 'failed';

export type AglInputKind = 'article' | 'topic' | 'draft-with-directives';

export type AglRunManifest = {
  runId: string;
  mode: AglRunMode;
  stage: AglWorkflowStage;
  createdAt: string;
  updatedAt: string;
  input: {
    kind: AglInputKind;
    path?: string;
    title?: string;
  };
  agent: {
    kind: 'codex' | 'hermes' | 'custom' | 'none';
    command: string;
    model?: string;
  };
  render: {
    engine: 'hyperframes';
    poweredBy: 'HyperFrames from HeyGen';
    ffmpeg: boolean;
    fps?: number;
    gifFps?: number;
    gifWidth?: number;
  };
  article: {
    inputPath?: string;
    finalMarkdownPath?: string;
    finalHtmlPath?: string;
  };
  visuals: AglVisualManifest[];
  status: 'running' | 'completed' | 'failed';
  errors?: string[];
};

export type AglVisualManifest = {
  id: string;
  status: AglVisualStatus;
  directive?: {
    raw: string;
    start: number;
    end: number;
    placement: 'before' | 'after' | 'replace';
    parseStatus?: 'ok' | 'warning' | 'error';
    parseMessage?: string;
  };
  aspectPreset?: AspectPresetId | string;
  durationSeconds?: number;
  visualIdea?: string;
  caption?: string;
  sourceHtmlPath?: string;
  previewPngPath?: string;
  mp4Path?: string;
  gifPath?: string;
  metadataPath?: string;
  validation: {
    htmlSafe: boolean;
    hyperframesLint: boolean;
    ffprobeOk: boolean;
  };
  error?: string;
};

export type ExportSpot = {
  id: string;
  insertAfterParagraph: number;
  visualIdea: string;
  captionSuggestion?: string;
  draft?: { generatedHtml: string };
  job?: { gifUrl?: string; mp4Url?: string };
  directive?: { raw: string; start: number; end: number; placement: 'before' | 'after' | 'replace' };
};
