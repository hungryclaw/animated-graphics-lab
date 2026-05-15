import { describe, expect, it } from 'vitest';
import { ArticleAnalysisRequestSchema, ArticleVisualizationPlanSchema, DraftRequestSchema, GeneratedGraphicSchema, GraphicDirectiveSchema, JobRequestSchema, estimateQueuePosition, getAspectPreset, getStylePreset, stylePresets, stylePresetToDesignSystem } from './index';

describe('composition schema', () => {
  it('accepts a valid master-backed render request', () => {
    const parsed = JobRequestSchema.parse({ conceptText: 'Prompt becomes response in a clean loop', stylePreset: 'appleMinimal', aspectPreset: 'articleBanner', authMode: 'master' });
    expect(parsed.durationSeconds).toBe(7);
  });
  it('rejects too-short concepts', () => {
    expect(() => JobRequestSchema.parse({ conceptText: 'tiny', stylePreset: 'appleMinimal', aspectPreset: 'articleBanner', authMode: 'master' })).toThrow();
  });
  it('returns known presets', () => {
    expect(getAspectPreset('verticalShort').height).toBe(1920);
    expect(getStylePreset('terminalDark').accent).toBe('#35f6a5');
  });
  it('reports human queue positions', () => {
    expect(estimateQueuePosition(0)).toBe(1);
    expect(estimateQueuePosition(4)).toBe(5);
  });
  it('normalizes composite model grammar labels to a supported enum value', () => {
    const parsed = GeneratedGraphicSchema.parse({
      interpretation: 'A transformation that reveals a capability stack.',
      grammar: 'transformation + capability stack',
      generatedHtml: '<!doctype html>' + 'x'.repeat(500),
      notes: []
    });
    expect(parsed.grammar).toBe('transformation');
  });
  it('accepts a 3-spot article visualization plan and normalizes spot grammar', () => {
    const parsed = ArticleVisualizationPlanSchema.parse({
      title: 'A practical article',
      summary: 'The article explains a workflow with several moments that benefit from animation.',
      spots: [1, 2, 3].map((priority) => ({
        id: `spot-${priority}`,
        priority,
        anchorText: 'This is the quoted paragraph anchor for the visual insertion.',
        insertAfterParagraph: priority,
        articleExcerpt: 'This paragraph excerpt contains a concrete mechanism that can be visualized clearly.',
        visualIdea: 'Show the idea transforming into a layered capability stack with one clean motion.',
        conceptText: 'A raw article idea transforms into a layered visual capability stack for readers.',
        grammar: priority === 1 ? 'transformation + capability stack' : 'sequence',
        rationale: 'This is a high-friction reading moment where animation can reduce cognitive load.'
      }))
    });
    expect(parsed.spots).toHaveLength(3);
    expect(parsed.spots[0].grammar).toBe('transformation');
    expect(parsed.spots[0].aspectPreset).toBe('articleBanner');
  });
  it('rejects article visualization plans with fewer than 3 spots', () => {
    expect(() => ArticleVisualizationPlanSchema.parse({
      summary: 'Too few visual opportunities were proposed for this article.',
      spots: []
    })).toThrow();
  });
  it('accepts a valid article analysis request', () => {
    const parsed = ArticleAnalysisRequestSchema.parse({
      articleText: 'Paragraph about an idea. '.repeat(40),
      stylePreset: 'linear',
      authMode: 'master'
    });
    expect(parsed.maxSpots).toBe(5);
  });
  it('accepts graphic directives with article-native defaults', () => {
    const parsed = GraphicDirectiveSchema.parse({
      description: 'Show prompt to output to evaluator to improved prompt.',
      type: 'loop'
    });
    expect(parsed.placement).toBe('replace');
    expect(parsed.aspect).toBe('articleBanner');
    expect(parsed.duration).toBe(7);
    expect(parsed.style).toBe('article-native');
    expect(parsed.type).toBe('loop');
  });
  it('rejects graphic directives without descriptions', () => {
    expect(() => GraphicDirectiveSchema.parse({ id: 'missing-description' })).toThrow();
  });
  it('style preset labels are user-facing and non-branded', () => {
    const banned = /apple|claude|stripe|linear|vercel|runway|notion|supabase|figma|anthropic/i;
    for (const preset of Object.values(stylePresets)) {
      expect(preset.label).not.toMatch(banned);
    }
  });
  it('all legacy style presets map to a normalized design system', () => {
    for (const id of Object.keys(stylePresets)) {
      expect(stylePresetToDesignSystem(id).id).toBeTruthy();
    }
  });
  it('accepts a normalized design system in draft requests', () => {
    const designSystem = stylePresetToDesignSystem('terminalDark');
    const parsed = DraftRequestSchema.parse({
      conceptText: 'Show a request flowing through a local render worker and returning a preview',
      stylePreset: 'terminalDark',
      aspectPreset: 'articleBanner',
      durationSeconds: 7,
      authMode: 'master',
      designSystem
    });
    expect(parsed.designSystem?.label).toBe('Terminal Glow');
    expect(parsed.designLocked).toBe(true);
  });
});
