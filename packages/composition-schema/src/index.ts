import { z } from 'zod';
import { AglDesignSystemSchema } from './design-systems.js';

export const aspectRatios = {
  articleBanner: { id: 'articleBanner', label: 'Article banner', width: 1920, height: 540, format: 'gif+mp4' },
  wideBanner: { id: 'wideBanner', label: 'Wide banner', width: 1920, height: 720, format: 'gif+mp4' },
  square: { id: 'square', label: 'Square social', width: 1080, height: 1080, format: 'gif+mp4' },
  verticalShort: { id: 'verticalShort', label: 'Vertical short', width: 1080, height: 1920, format: 'mp4+optional-gif' },
  landscape: { id: 'landscape', label: 'Social landscape', width: 1600, height: 900, format: 'gif+mp4' }
} as const;

export const stylePresets = {
  appleMinimal: { id: 'appleMinimal', label: 'Soft Minimal', bg: '#f5f5f7', text: '#111114', accent: '#007aff', surface: 'rgba(255,255,255,.82)', radius: 42, shadow: '0 24px 60px rgba(20,20,25,.105)', font: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif' },
  stripe: { id: 'stripe', label: 'Gradient Editorial', bg: '#f8fbff', text: '#0a2540', accent: '#635bff', surface: 'rgba(255,255,255,.78)', radius: 28, shadow: '0 24px 70px rgba(50,50,93,.14)', font: 'Inter, ui-sans-serif, system-ui' },
  terminalDark: { id: 'terminalDark', label: 'Terminal Glow', bg: '#05070b', text: '#d9ffe8', accent: '#35f6a5', surface: 'rgba(5,18,24,.82)', radius: 16, shadow: '0 0 38px rgba(53,246,165,.16)', font: 'JetBrains Mono, ui-monospace, monospace' },
  handDrawn: { id: 'handDrawn', label: 'Sketch Explainer', bg: '#fbf6ea', text: '#241f1a', accent: '#e4572e', surface: '#fffaf0', radius: 24, shadow: '8px 8px 0 rgba(36,31,26,.16)', font: 'Comic Sans MS, ui-rounded, system-ui' },
  brutalist: { id: 'brutalist', label: 'Brutalist Pop', bg: '#f4ff00', text: '#050505', accent: '#ff3b30', surface: '#ffffff', radius: 4, shadow: '10px 10px 0 #000', font: 'Arial Black, Impact, system-ui' },
  linear: { id: 'linear', label: 'Precision SaaS', bg: '#f7f8fb', text: '#17171c', accent: '#5e6ad2', surface: '#ffffff', radius: 18, shadow: '0 18px 46px rgba(25,28,33,.09)', font: 'Inter, ui-sans-serif, system-ui' },
  warmEditorial: { id: 'warmEditorial', label: 'Warm Editorial', bg: '#fff7ed', text: '#2b2118', accent: '#d97706', surface: '#fffaf3', radius: 26, shadow: '0 18px 42px rgba(120,72,18,.12)', font: 'Fraunces, Georgia, ui-serif, serif' },
  monoTechnical: { id: 'monoTechnical', label: 'Mono Technical', bg: '#f4f4f1', text: '#111111', accent: '#111111', surface: '#ffffff', radius: 10, shadow: '0 14px 32px rgba(0,0,0,.08)', font: 'IBM Plex Mono, JetBrains Mono, ui-monospace, monospace' },
  cinematicDark: { id: 'cinematicDark', label: 'Cinematic Dark', bg: '#080b16', text: '#eef2ff', accent: '#8b5cf6', surface: 'rgba(15,23,42,.78)', radius: 24, shadow: '0 26px 80px rgba(0,0,0,.36)', font: 'Inter, ui-sans-serif, system-ui' },
  blueprintSystem: { id: 'blueprintSystem', label: 'Blueprint System', bg: '#071629', text: '#dbeafe', accent: '#38bdf8', surface: 'rgba(8,47,73,.62)', radius: 12, shadow: '0 0 44px rgba(56,189,248,.10)', font: 'Inter, ui-sans-serif, system-ui' },
  calmDocument: { id: 'calmDocument', label: 'Calm Document', bg: '#fafaf8', text: '#202124', accent: '#2563eb', surface: '#ffffff', radius: 20, shadow: '0 10px 28px rgba(32,33,36,.07)', font: 'Source Sans 3, Inter, ui-sans-serif, system-ui' },
  emeraldConsole: { id: 'emeraldConsole', label: 'Emerald Console', bg: '#04120d', text: '#dcfce7', accent: '#10b981', surface: 'rgba(6,35,25,.82)', radius: 14, shadow: '0 0 34px rgba(16,185,129,.14)', font: 'JetBrains Mono, ui-monospace, monospace' }
} as const;

export const templateIds = ['promptResponseChain','loopCycle','beforeAfter','comparison','questionCluster','pipelineFlow'] as const;
export const graphicGrammars = ['sequence','loop','comparison','stack','transformation','network','timeline','metaphor'] as const;

const StylePresetEnum = z.enum(Object.keys(stylePresets) as [keyof typeof stylePresets, ...(keyof typeof stylePresets)[]]);
const AspectPresetEnum = z.enum(Object.keys(aspectRatios) as [keyof typeof aspectRatios, ...(keyof typeof aspectRatios)[]]);
const GraphicGrammarEnum = z.enum(graphicGrammars);

export function normalizeGraphicGrammar(value: unknown) {
  if (typeof value !== 'string') return value;
  const lower = value.toLowerCase().trim();
  const exact = graphicGrammars.find(grammar => lower === grammar);
  if (exact) return exact;
  const matches = graphicGrammars
    .map(grammar => ({ grammar, index: lower.search(new RegExp(`(^|[^a-z])${grammar}([^a-z]|$)`)) }))
    .filter(match => match.index >= 0)
    .sort((a, b) => a.index - b.index);
  return matches[0]?.grammar || value;
}

export const GeneratedGraphicSchema = z.object({
  interpretation: z.string().min(8).max(2000),
  grammar: z.preprocess(normalizeGraphicGrammar, GraphicGrammarEnum),
  generatedHtml: z.string().min(500).max(160000),
  notes: z.array(z.string().max(240)).max(6).default([])
});

export const ArticleVisualizationSpotSchema = z.object({
  id: z.string().min(3).max(80),
  priority: z.number().int().min(1).max(5),
  anchorText: z.string().min(12).max(800),
  insertAfterParagraph: z.number().int().min(0),
  articleExcerpt: z.string().min(20).max(1500),
  visualIdea: z.string().min(20).max(1000),
  conceptText: z.string().min(20).max(1500),
  grammar: z.preprocess(normalizeGraphicGrammar, GraphicGrammarEnum),
  aspectPreset: AspectPresetEnum.default('articleBanner'),
  durationSeconds: z.number().min(3).max(20).default(7),
  rationale: z.string().min(20).max(800),
  captionSuggestion: z.string().max(240).optional().default('')
});

export const ArticleVisualizationPlanSchema = z.object({
  title: z.string().max(240).optional().default(''),
  summary: z.string().min(20).max(1200),
  spots: z.array(ArticleVisualizationSpotSchema).min(3).max(5)
});

export const GraphicDirectiveSchema = z.object({
  id: z.string().min(2).max(80).optional(),
  type: z.preprocess(normalizeGraphicGrammar, GraphicGrammarEnum).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  placement: z.enum(['before','after','replace']).default('replace'),
  aspect: AspectPresetEnum.default('articleBanner'),
  duration: z.number().min(3).max(20).default(7),
  style: z.string().max(80).default('article-native'),
  anchor: z.string().max(800).optional(),
  description: z.string().min(8).max(1600),
  caption: z.string().max(240).optional().default(''),
  must_include: z.array(z.string().min(1).max(180)).max(12).optional().default([]),
  avoid: z.array(z.string().min(1).max(180)).max(12).optional().default([]),
  raw: z.string().optional()
});

export const GraphicDirectiveDocumentSchema = z.object({
  directives: z.array(GraphicDirectiveSchema),
  articleText: z.string()
});

export const ArticleAnalysisRequestSchema = z.object({
  articleText: z.string().min(500).max(80000),
  stylePreset: StylePresetEnum,
  authMode: z.enum(['byok','master']),
  provider: z.string().max(80).optional(),
  model: z.string().max(120).optional(),
  maxSpots: z.number().int().min(3).max(5).default(5),
  designSystem: AglDesignSystemSchema.optional(),
  designMdSource: z.string().max(120000).optional()
});

export const DraftRequestSchema = z.object({
  conceptText: z.string().min(8).max(5000),
  articleContext: z.string().max(10000).optional().default(''),
  stylePreset: StylePresetEnum,
  aspectPreset: AspectPresetEnum,
  durationSeconds: z.number().min(3).max(20).default(7),
  authMode: z.enum(['byok','master']),
  provider: z.string().max(80).optional(),
  model: z.string().max(120).optional(),
  currentHtml: z.string().max(160000).optional(),
  changePrompt: z.string().max(3000).optional(),
  designSystem: AglDesignSystemSchema.optional(),
  designMdSource: z.string().max(120000).optional(),
  designLocked: z.boolean().default(true)
});

export const JobRequestSchema = z.object({
  conceptText: z.string().min(8).max(5000),
  articleContext: z.string().max(10000).optional().default(''),
  stylePreset: StylePresetEnum,
  aspectPreset: AspectPresetEnum,
  authMode: z.enum(['byok','master']),
  provider: z.string().max(80).optional(),
  model: z.string().max(120).optional(),
  referenceAssetId: z.string().optional(),
  designMdAssetId: z.string().optional(),
  durationSeconds: z.number().min(3).max(20).default(7),
  generatedHtml: z.string().min(500).max(160000).optional(),
  interpretation: z.string().max(2000).optional(),
  designSystem: AglDesignSystemSchema.optional(),
  designMdSource: z.string().max(120000).optional(),
  designLocked: z.boolean().default(true)
});

export type JobRequest = z.infer<typeof JobRequestSchema>;
export type DraftRequest = z.infer<typeof DraftRequestSchema>;
export type GeneratedGraphic = z.infer<typeof GeneratedGraphicSchema>;
export type ArticleVisualizationSpot = z.infer<typeof ArticleVisualizationSpotSchema>;
export type ArticleVisualizationPlan = z.infer<typeof ArticleVisualizationPlanSchema>;
export type ArticleAnalysisRequest = z.infer<typeof ArticleAnalysisRequestSchema>;
export type GraphicDirective = z.infer<typeof GraphicDirectiveSchema>;
export type GraphicDirectiveDocument = z.infer<typeof GraphicDirectiveDocumentSchema>;
export type AspectPresetId = keyof typeof aspectRatios;
export type StylePresetId = keyof typeof stylePresets;

export function getAspectPreset(id: AspectPresetId) { return aspectRatios[id]; }
export function getStylePreset(id: StylePresetId) { return stylePresets[id]; }

export function estimateQueuePosition(jobsAhead: number) { return Math.max(1, jobsAhead + 1); }

export * from './design-systems.js';
export * from './design-md.js';
