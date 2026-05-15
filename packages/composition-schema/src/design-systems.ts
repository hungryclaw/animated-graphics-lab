import { z } from 'zod';

export const MotionPersonalitySchema = z.enum(['calm', 'snappy', 'cinematic', 'playful', 'technical']);
export const GlowSchema = z.enum(['none', 'subtle', 'strong']);
export const ParticleDensitySchema = z.enum(['none', 'low', 'medium', 'high']);
export const BackgroundPolicySchema = z.enum(['transparent', 'soft-card', 'full-bleed']);
export const DiagramDensitySchema = z.enum(['minimal', 'balanced', 'dense']);
export const GraphicGrammarSchema = z.enum(['sequence', 'loop', 'comparison', 'stack', 'transformation', 'network', 'timeline', 'metaphor']);

export const AglDesignSystemSchema = z.object({
  id: z.string().min(2).max(80),
  label: z.string().min(2).max(80),
  source: z.enum(['builtin', 'design-md', 'custom']).default('builtin'),
  description: z.string().min(8).max(280),
  colors: z.object({
    bg: z.string(),
    text: z.string(),
    muted: z.string(),
    accent: z.string(),
    accent2: z.string().optional(),
    surface: z.string(),
    line: z.string()
  }),
  typography: z.object({
    font: z.string(),
    monoFont: z.string().optional(),
    titleWeight: z.number().int().min(100).max(1000),
    bodyWeight: z.number().int().min(100).max(1000),
    letterSpacing: z.string().optional()
  }),
  shape: z.object({
    radius: z.number().min(0).max(96),
    strokeWidth: z.number().min(1).max(12),
    shadow: z.string()
  }),
  motion: z.object({
    personality: MotionPersonalitySchema,
    easing: z.string().min(2).max(60),
    durationScale: z.number().min(0.5).max(2),
    stagger: z.number().min(0).max(1),
    glow: GlowSchema,
    particleDensity: ParticleDensitySchema
  }),
  composition: z.object({
    backgroundPolicy: BackgroundPolicySchema,
    diagramDensity: DiagramDensitySchema,
    preferredGrammars: z.array(GraphicGrammarSchema).max(8).optional().default([]),
    avoid: z.array(z.string().min(1).max(180)).max(16).optional().default([])
  }),
  promptHints: z.array(z.string().min(1).max(240)).max(12).default([])
});

export type AglDesignSystem = z.infer<typeof AglDesignSystemSchema>;

export const aglDesignSystems = {
  softMinimal: {
    id: 'softMinimal', label: 'Soft Minimal', source: 'builtin',
    description: 'Premium light editorial graphics with soft depth, restrained color, and spacious labels.',
    colors: { bg: '#f5f5f7', text: '#111114', muted: '#6e6e73', accent: '#007aff', surface: 'rgba(255,255,255,.84)', line: 'rgba(17,17,20,.18)' },
    typography: { font: '-apple-system, BlinkMacSystemFont, Inter, Segoe UI, sans-serif', titleWeight: 720, bodyWeight: 500, letterSpacing: '-0.02em' },
    shape: { radius: 42, strokeWidth: 2, shadow: '0 24px 60px rgba(20,20,25,.105)' },
    motion: { personality: 'calm', easing: 'power3.out', durationScale: 1, stagger: 0.08, glow: 'none', particleDensity: 'low' },
    composition: { backgroundPolicy: 'transparent', diagramDensity: 'minimal', preferredGrammars: ['sequence', 'comparison', 'transformation'], avoid: ['busy dashboard chrome', 'heavy background panels'] },
    promptHints: ['Use whitespace as a design element.', 'Prefer a few precise nodes over dense decoration.']
  },
  precisionSaas: {
    id: 'precisionSaas', label: 'Precision SaaS', source: 'builtin',
    description: 'Crisp product diagrams with clean cards, subtle grid logic, and confident accent lines.',
    colors: { bg: '#f7f8fb', text: '#17171c', muted: '#6b7280', accent: '#5e6ad2', surface: '#ffffff', line: 'rgba(94,106,210,.24)' },
    typography: { font: 'Inter, ui-sans-serif, system-ui', monoFont: 'JetBrains Mono, ui-monospace, monospace', titleWeight: 700, bodyWeight: 500, letterSpacing: '-0.015em' },
    shape: { radius: 18, strokeWidth: 2, shadow: '0 18px 46px rgba(25,28,33,.09)' },
    motion: { personality: 'snappy', easing: 'power2.out', durationScale: 0.9, stagger: 0.06, glow: 'subtle', particleDensity: 'low' },
    composition: { backgroundPolicy: 'transparent', diagramDensity: 'balanced', preferredGrammars: ['sequence', 'loop'], avoid: ['cartoon styling', 'oversized blobs'] },
    promptHints: ['Make alignment obvious.', 'Use thin connector lines and compact annotations.']
  },
  gradientEditorial: {
    id: 'gradientEditorial', label: 'Gradient Editorial', source: 'builtin',
    description: 'Polished modern explainer style with airy gradients, rounded surfaces, and rich accent transitions.',
    colors: { bg: '#f8fbff', text: '#0a2540', muted: '#526171', accent: '#635bff', accent2: '#00d4ff', surface: 'rgba(255,255,255,.78)', line: 'rgba(99,91,255,.24)' },
    typography: { font: 'Inter, ui-sans-serif, system-ui', titleWeight: 720, bodyWeight: 500, letterSpacing: '-0.02em' },
    shape: { radius: 28, strokeWidth: 2, shadow: '0 24px 70px rgba(50,50,93,.14)' },
    motion: { personality: 'calm', easing: 'power3.out', durationScale: 1.05, stagger: 0.1, glow: 'subtle', particleDensity: 'medium' },
    composition: { backgroundPolicy: 'transparent', diagramDensity: 'balanced', preferredGrammars: ['transformation', 'network', 'comparison'], avoid: ['flat primary-color blocks'] },
    promptHints: ['Use accent gradients sparingly on signal paths, not large backgrounds.']
  },
  terminalGlow: {
    id: 'terminalGlow', label: 'Terminal Glow', source: 'builtin',
    description: 'Dark technical graphics with monospace labels, neon signals, and command-line energy.',
    colors: { bg: '#05070b', text: '#d9ffe8', muted: '#76a58d', accent: '#35f6a5', surface: 'rgba(5,18,24,.82)', line: 'rgba(53,246,165,.32)' },
    typography: { font: 'JetBrains Mono, ui-monospace, monospace', monoFont: 'JetBrains Mono, ui-monospace, monospace', titleWeight: 700, bodyWeight: 500, letterSpacing: '-0.01em' },
    shape: { radius: 16, strokeWidth: 2, shadow: '0 0 38px rgba(53,246,165,.16)' },
    motion: { personality: 'technical', easing: 'steps(1)', durationScale: 0.95, stagger: 0.05, glow: 'strong', particleDensity: 'medium' },
    composition: { backgroundPolicy: 'soft-card', diagramDensity: 'balanced', preferredGrammars: ['sequence', 'loop', 'timeline'], avoid: ['warm pastel cards', 'handwritten styling'] },
    promptHints: ['Use terminal-like labels only when readable.', 'Neon should highlight motion paths, not flood the whole canvas.']
  },
  sketchExplainer: {
    id: 'sketchExplainer', label: 'Sketch Explainer', source: 'builtin',
    description: 'Friendly hand-drawn educational diagrams with warm paper surfaces and playful emphasis.',
    colors: { bg: '#fbf6ea', text: '#241f1a', muted: '#76695d', accent: '#e4572e', surface: '#fffaf0', line: 'rgba(36,31,26,.25)' },
    typography: { font: 'Comic Sans MS, ui-rounded, system-ui', titleWeight: 700, bodyWeight: 500, letterSpacing: '0em' },
    shape: { radius: 24, strokeWidth: 3, shadow: '8px 8px 0 rgba(36,31,26,.16)' },
    motion: { personality: 'playful', easing: 'back.out(1.4)', durationScale: 1.05, stagger: 0.12, glow: 'none', particleDensity: 'low' },
    composition: { backgroundPolicy: 'transparent', diagramDensity: 'balanced', preferredGrammars: ['metaphor', 'loop', 'comparison'], avoid: ['photorealism', 'corporate dashboard chrome'] },
    promptHints: ['Use slightly imperfect lines, but keep text clean and readable.']
  },
  brutalistPop: {
    id: 'brutalistPop', label: 'Brutalist Pop', source: 'builtin',
    description: 'High-contrast loud visuals with chunky type, hard shadows, and punchy simple structure.',
    colors: { bg: '#f4ff00', text: '#050505', muted: '#3a3a3a', accent: '#ff3b30', surface: '#ffffff', line: '#050505' },
    typography: { font: 'Arial Black, Impact, system-ui', titleWeight: 900, bodyWeight: 800, letterSpacing: '-0.03em' },
    shape: { radius: 4, strokeWidth: 4, shadow: '10px 10px 0 #000' },
    motion: { personality: 'snappy', easing: 'back.out(1.7)', durationScale: 0.85, stagger: 0.05, glow: 'none', particleDensity: 'none' },
    composition: { backgroundPolicy: 'soft-card', diagramDensity: 'minimal', preferredGrammars: ['comparison', 'transformation', 'metaphor'], avoid: ['small low-contrast text', 'subtle pastel gradients'] },
    promptHints: ['Use fewer bigger elements.', 'Keep labels short and loud.']
  },
  warmEditorial: {
    id: 'warmEditorial', label: 'Warm Editorial', source: 'builtin',
    description: 'Article-native warm diagrams with paper tone, serif-friendly typography, and measured motion.',
    colors: { bg: '#fff7ed', text: '#2b2118', muted: '#7c6754', accent: '#d97706', accent2: '#fb7185', surface: '#fffaf3', line: 'rgba(146,64,14,.25)' },
    typography: { font: 'Fraunces, Georgia, ui-serif, serif', titleWeight: 700, bodyWeight: 450, letterSpacing: '-0.01em' },
    shape: { radius: 26, strokeWidth: 2, shadow: '0 18px 42px rgba(120,72,18,.12)' },
    motion: { personality: 'calm', easing: 'power3.out', durationScale: 1.1, stagger: 0.12, glow: 'none', particleDensity: 'low' },
    composition: { backgroundPolicy: 'transparent', diagramDensity: 'balanced', preferredGrammars: ['transformation', 'metaphor', 'comparison'], avoid: ['cold corporate blue', 'dense dashboard UI'] },
    promptHints: ['Make it feel like an editorial figure embedded in prose.']
  },
  monoTechnical: {
    id: 'monoTechnical', label: 'Mono Technical', source: 'builtin',
    description: 'Precise monochrome engineering diagrams with restrained highlights and compact readable labels.',
    colors: { bg: '#f4f4f1', text: '#111111', muted: '#666666', accent: '#111111', surface: '#ffffff', line: 'rgba(17,17,17,.28)' },
    typography: { font: 'IBM Plex Mono, JetBrains Mono, ui-monospace, monospace', monoFont: 'IBM Plex Mono, ui-monospace, monospace', titleWeight: 650, bodyWeight: 500, letterSpacing: '-0.015em' },
    shape: { radius: 10, strokeWidth: 2, shadow: '0 14px 32px rgba(0,0,0,.08)' },
    motion: { personality: 'technical', easing: 'power1.out', durationScale: 0.92, stagger: 0.04, glow: 'none', particleDensity: 'none' },
    composition: { backgroundPolicy: 'transparent', diagramDensity: 'dense', preferredGrammars: ['stack', 'timeline', 'network'], avoid: ['gradients', 'decorative blobs'] },
    promptHints: ['Use monochrome hierarchy and strong spacing instead of decoration.']
  },
  cinematicDark: {
    id: 'cinematicDark', label: 'Cinematic Dark', source: 'builtin',
    description: 'Dark atmospheric explainers with controlled glow, high contrast, and slower reveal pacing.',
    colors: { bg: '#080b16', text: '#eef2ff', muted: '#94a3b8', accent: '#8b5cf6', accent2: '#06b6d4', surface: 'rgba(15,23,42,.78)', line: 'rgba(139,92,246,.34)' },
    typography: { font: 'Inter, ui-sans-serif, system-ui', titleWeight: 760, bodyWeight: 500, letterSpacing: '-0.025em' },
    shape: { radius: 24, strokeWidth: 2, shadow: '0 26px 80px rgba(0,0,0,.36)' },
    motion: { personality: 'cinematic', easing: 'power4.out', durationScale: 1.25, stagger: 0.14, glow: 'strong', particleDensity: 'medium' },
    composition: { backgroundPolicy: 'full-bleed', diagramDensity: 'balanced', preferredGrammars: ['network', 'transformation', 'timeline'], avoid: ['flat white cards', 'comic styling'] },
    promptHints: ['Use darkness as contrast while keeping labels large and readable.']
  },
  blueprintSystem: {
    id: 'blueprintSystem', label: 'Blueprint System', source: 'builtin',
    description: 'System-map diagrams with blueprint lines, cool surfaces, and architectural clarity.',
    colors: { bg: '#071629', text: '#dbeafe', muted: '#93c5fd', accent: '#38bdf8', surface: 'rgba(8,47,73,.62)', line: 'rgba(56,189,248,.35)' },
    typography: { font: 'Inter, ui-sans-serif, system-ui', monoFont: 'JetBrains Mono, ui-monospace, monospace', titleWeight: 700, bodyWeight: 500, letterSpacing: '-0.01em' },
    shape: { radius: 12, strokeWidth: 2, shadow: '0 0 44px rgba(56,189,248,.10)' },
    motion: { personality: 'technical', easing: 'power2.inOut', durationScale: 1, stagger: 0.07, glow: 'subtle', particleDensity: 'low' },
    composition: { backgroundPolicy: 'soft-card', diagramDensity: 'dense', preferredGrammars: ['stack', 'network', 'sequence'], avoid: ['warm paper texture', 'rounded bubbly cards'] },
    promptHints: ['Think system architecture: aligned nodes, connectors, and layer labels.']
  },
  calmDocument: {
    id: 'calmDocument', label: 'Calm Document', source: 'builtin',
    description: 'Readable document-style visuals with low contrast surfaces and quiet educational pacing.',
    colors: { bg: '#fafaf8', text: '#202124', muted: '#71717a', accent: '#2563eb', surface: '#ffffff', line: 'rgba(32,33,36,.16)' },
    typography: { font: 'Source Sans 3, Inter, ui-sans-serif, system-ui', titleWeight: 650, bodyWeight: 450, letterSpacing: '-0.01em' },
    shape: { radius: 20, strokeWidth: 1.5, shadow: '0 10px 28px rgba(32,33,36,.07)' },
    motion: { personality: 'calm', easing: 'power2.out', durationScale: 1.15, stagger: 0.1, glow: 'none', particleDensity: 'low' },
    composition: { backgroundPolicy: 'transparent', diagramDensity: 'minimal', preferredGrammars: ['comparison', 'sequence', 'loop'], avoid: ['loud poster color', 'neon glow'] },
    promptHints: ['Prefer clarity, legibility, and small useful annotations.']
  },
  emeraldConsole: {
    id: 'emeraldConsole', label: 'Emerald Console', source: 'builtin',
    description: 'Clean console-inspired visuals with emerald accents, dark glass, and agent workflow energy.',
    colors: { bg: '#04120d', text: '#dcfce7', muted: '#86efac', accent: '#10b981', accent2: '#a3e635', surface: 'rgba(6,35,25,.82)', line: 'rgba(16,185,129,.36)' },
    typography: { font: 'JetBrains Mono, ui-monospace, monospace', monoFont: 'JetBrains Mono, ui-monospace, monospace', titleWeight: 700, bodyWeight: 500, letterSpacing: '-0.01em' },
    shape: { radius: 14, strokeWidth: 2, shadow: '0 0 34px rgba(16,185,129,.14)' },
    motion: { personality: 'technical', easing: 'steps(1)', durationScale: 0.9, stagger: 0.05, glow: 'strong', particleDensity: 'high' },
    composition: { backgroundPolicy: 'soft-card', diagramDensity: 'balanced', preferredGrammars: ['loop', 'sequence', 'stack'], avoid: ['pastel editorial tone', 'handwritten labels'] },
    promptHints: ['Use agent/tool/run terminology only when it matches the concept.']
  }
} as const satisfies Record<string, AglDesignSystem>;

const legacyStylePresetMap = {
  appleMinimal: 'softMinimal',
  linear: 'precisionSaas',
  stripe: 'gradientEditorial',
  terminalDark: 'terminalGlow',
  handDrawn: 'sketchExplainer',
  brutalist: 'brutalistPop',
  warmEditorial: 'warmEditorial',
  monoTechnical: 'monoTechnical',
  cinematicDark: 'cinematicDark',
  blueprintSystem: 'blueprintSystem',
  calmDocument: 'calmDocument',
  emeraldConsole: 'emeraldConsole'
} as const;

export type AglDesignSystemId = keyof typeof aglDesignSystems;
export type LegacyStylePresetId = keyof typeof legacyStylePresetMap;

export function getAglDesignSystem(id: AglDesignSystemId) {
  return aglDesignSystems[id];
}

export function stylePresetToDesignSystem(id: string): AglDesignSystem {
  const mapped = legacyStylePresetMap[id as LegacyStylePresetId] || id;
  const preset = aglDesignSystems[mapped as AglDesignSystemId];
  if (!preset) return aglDesignSystems.softMinimal;
  return preset;
}
