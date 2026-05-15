import YAML from 'yaml';
import { AglDesignSystem, AglDesignSystemSchema } from './design-systems.js';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'imported-design';
}

function parsePx(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

function firstTypography(frontmatter: any, keys: string[]) {
  for (const key of keys) {
    const value = frontmatter?.typography?.[key];
    if (value) return value;
  }
  return undefined;
}

const grammarSet = new Set(['sequence', 'loop', 'comparison', 'stack', 'transformation', 'network', 'timeline', 'metaphor']);

function asGrammarArray(value: unknown): AglDesignSystem['composition']['preferredGrammars'] {
  return Array.isArray(value) ? value.map(String).filter(item => grammarSet.has(item)) as AglDesignSystem['composition']['preferredGrammars'] : [];
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function stripFrontmatter(markdown: string) {
  return String(markdown || '').replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '');
}

export function extractDesignMdFrontmatter(markdown: string): any {
  const match = String(markdown || '').match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  return match ? (YAML.parse(match[1]) || {}) : null;
}

function findTokenHex(markdown: string) {
  const tokens: Record<string, string> = {};
  const tokenPattern = /\{colors\.([a-zA-Z0-9_-]+)\}[\s\S]{0,80}?#([0-9a-fA-F]{6})/g;
  for (const match of markdown.matchAll(tokenPattern)) tokens[match[1]] = `#${match[2].toLowerCase()}`;

  const namedLinePattern = /^[-*]\s+\*\*([^*]+)\*\*\s*\(`\{colors\.([^}`]+)\}`\s*[—-]\s*(#[0-9a-fA-F]{6})\)/gm;
  for (const match of markdown.matchAll(namedLinePattern)) tokens[match[2]] = match[3].toLowerCase();

  return tokens;
}

function pick(tokens: Record<string, string>, keys: string[], fallback: string) {
  for (const key of keys) {
    if (tokens[key]) return tokens[key];
  }
  return fallback;
}

function extractTitleFromMarkdown(markdown: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;
  const overview = markdown.match(/##\s+Overview\s+([\s\S]{0,700})/i)?.[1] || markdown.slice(0, 700);
  const possessiveBrand = overview.match(/\b([A-Z][A-Za-z0-9&.-]{2,})['’]s\s+(?:marketing\s+)?site\b/);
  if (possiveSafe(possessiveBrand?.[1])) return `${possessiveBrand![1]} Imported`;
  const brand = overview.match(/\b([A-Z][A-Za-z0-9&.-]{2,})\b/);
  return brand ? `${brand[1]} Imported` : 'Imported DESIGN.md';
}

function possiveSafe(value?: string) {
  return Boolean(value && !['The', 'This', 'Key', 'Brand', 'Colors', 'Typography'].includes(value));
}

function extractDescription(markdown: string) {
  const overview = markdown.match(/##\s+Overview\s+([\s\S]*?)(?:\n##\s+|$)/i)?.[1] || markdown;
  const paragraph = overview.split(/\n\s*\n/).map(part => part.replace(/[#*_`{}]/g, '').replace(/\s+/g, ' ').trim()).find(Boolean);
  return (paragraph || 'Imported markdown design system adapted for animated article graphics.').slice(0, 280);
}

function extractFont(markdown: string) {
  const substitute = markdown.match(/(?:Open-source substitute|substitute):\s*\*\*?([^*\n]+)\*\*?/i)?.[1]?.trim();
  const family = markdown.match(/\*\*([A-Za-z][A-Za-z0-9\s-]{2,40})\*\*\s+is\s+the\s+(?:licensed\s+)?(?:single\s+)?sans/i)?.[1]?.trim()
    || markdown.match(/Font Family\s+\*\*([^*\n]+)\*\*/i)?.[1]?.trim();
  const primary = substitute || family || 'Inter';
  return `${primary}, ${family && substitute ? `${family}, ` : ''}-apple-system, system-ui, sans-serif`;
}

function extractWeight(markdown: string, kind: 'title' | 'body') {
  if (kind === 'title') {
    const display = markdown.match(/display[^|\n]*\|\s*\d+px\s*\|\s*(\d{3})/i)?.[1]
      || markdown.match(/display\s+weight\s+(?:stays\s+at\s+)?(\d{3})/i)?.[1];
    return display ? Number(display) : 720;
  }
  const body = markdown.match(/body[^|\n]*\|\s*\d+px\s*\|\s*(\d{3})/i)?.[1]
    || markdown.match(/body\s+(\d{3})/i)?.[1];
  return body ? Number(body) : 500;
}

function extractRadius(markdown: string) {
  const none = markdown.match(/\{rounded\.none\}[^#\n|]*(?:\||—|-)\s*(\d+(?:\.\d+)?)px/i)?.[1]
    || markdown.match(/rounded\.none[^\n]*(\d+(?:\.\d+)?)px/i)?.[1];
  if (none !== undefined && /sharp|dominant|every CTA|every card/i.test(markdown)) return Number(none);
  const all = [...markdown.matchAll(/\{rounded\.[^}]+\}[^\n]*(\d+(?:\.\d+)?)px/gi)].map(match => Number(match[1])).filter(Number.isFinite);
  return all.length ? Math.max(...all.filter(value => value < 999)) : 18;
}

function extractAvoid(markdown: string) {
  const dont = markdown.match(/###\s+Don't\s+([\s\S]*?)(?:\n##\s+|$)/i)?.[1] || '';
  return dont.split('\n')
    .map(line => line.match(/^[-*]\s+(.+)/)?.[1]?.replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').trim())
    .filter((line): line is string => Boolean(line))
    .slice(0, 8);
}

function markdownToFrontmatter(markdown: string) {
  const tokens = findTokenHex(markdown);
  const lower = markdown.toLowerCase();
  const cinematic = /cinematic|full-bleed|photograph|hero/i.test(markdown);
  const technical = /spec|race|grid|telemetry|hairline/i.test(markdown);
  return {
    name: extractTitleFromMarkdown(markdown),
    description: extractDescription(markdown),
    colors: {
      primary: pick(tokens, ['ink', 'body-on-light', 'text'], '#111114'),
      secondary: pick(tokens, ['body', 'muted', 'muted-soft', 'secondary'], '#686868'),
      tertiary: pick(tokens, ['primary', 'accent', 'rosso-corsa', 'semantic-warning'], '#635bff'),
      neutral: pick(tokens, ['canvas', 'background', 'neutral', 'canvas-light'], '#ffffff'),
      surface: pick(tokens, ['canvas-elevated', 'surface-card', 'surface-soft-light', 'surface'], 'rgba(255,255,255,.82)'),
      line: pick(tokens, ['hairline', 'hairline-on-light', 'hairline-soft', 'border'], 'rgba(17,17,20,.22)')
    },
    typography: {
      h1: { fontFamily: extractFont(markdown), fontWeight: extractWeight(markdown, 'title'), letterSpacing: lower.includes('letter-spacing') ? '-0.015em' : undefined },
      'body-md': { fontFamily: extractFont(markdown), fontWeight: extractWeight(markdown, 'body') }
    },
    rounded: { lg: `${extractRadius(markdown)}px`, md: `${extractRadius(markdown)}px` },
    shadow: /no drop shadow|no shadows/i.test(markdown) ? 'none' : '0 18px 46px rgba(25,28,33,.09)',
    agl: {
      motion: {
        personality: cinematic ? 'cinematic' : technical ? 'technical' : 'calm',
        easing: cinematic ? 'power4.out' : 'power3.out',
        durationScale: cinematic ? 1.2 : 1,
        glow: lower.includes('near-black') || lower.includes('dark') ? 'subtle' : 'none',
        particleDensity: cinematic ? 'low' : 'none'
      },
      composition: {
        backgroundPolicy: cinematic ? 'full-bleed' : 'transparent',
        diagramDensity: technical ? 'dense' : 'balanced',
        preferredGrammars: cinematic ? ['metaphor', 'timeline', 'comparison'] : ['sequence', 'comparison', 'transformation'],
        avoid: extractAvoid(markdown)
      }
    }
  };
}

function normalizeFrontmatter(markdown: string) {
  const fm = extractDesignMdFrontmatter(markdown);
  return fm || markdownToFrontmatter(markdown);
}

export function parseDesignMdToAglDesignSystem(markdown: string): AglDesignSystem {
  const fm = normalizeFrontmatter(markdown);
  const colors = fm.colors || {};
  const h1 = firstTypography(fm, ['h1', 'title', 'heading']);
  const body = firstTypography(fm, ['body-md', 'body', 'bodyMd', 'p']);
  const radius = Math.max(parsePx(fm.rounded?.lg, 0), parsePx(fm.rounded?.md, 0), parsePx(fm.rounded?.sm, 0), 0);

  const candidate: AglDesignSystem = {
    id: `design-md-${slugify(String(fm.name || 'imported-design'))}`,
    label: String(fm.name || 'Imported DESIGN.md').slice(0, 80),
    source: 'design-md',
    description: String(fm.description || 'Imported DESIGN.md design system adapted for animated article graphics.').slice(0, 280),
    colors: {
      text: colors.primary || colors.text || '#111114',
      muted: colors.secondary || colors.muted || '#686868',
      accent: colors.tertiary || colors.accent || '#635bff',
      accent2: colors.quaternary || colors.accent2,
      bg: colors.neutral || colors.background || colors.bg || '#ffffff',
      surface: fm.components?.node?.backgroundColor || colors.surface || colors.neutral || 'rgba(255,255,255,.82)',
      line: colors.line || colors.border || colors.tertiary || colors.accent || 'rgba(17,17,20,.22)'
    },
    typography: {
      font: `${h1?.fontFamily || body?.fontFamily || 'Inter'}, ui-sans-serif, system-ui`,
      monoFont: fm.typography?.mono?.fontFamily ? `${fm.typography.mono.fontFamily}, ui-monospace, monospace` : undefined,
      titleWeight: Number(h1?.fontWeight || 720),
      bodyWeight: Number(body?.fontWeight || 500),
      letterSpacing: h1?.letterSpacing || '-0.015em'
    },
    shape: {
      radius,
      strokeWidth: parsePx(fm.strokeWidth || fm.borderWidth || fm.components?.node?.borderWidth, 2),
      shadow: fm.shadow || fm.elevation?.md || '0 18px 46px rgba(25,28,33,.09)'
    },
    motion: {
      personality: fm.agl?.motion?.personality || 'calm',
      easing: fm.agl?.motion?.easing || 'power3.out',
      durationScale: Number(fm.agl?.motion?.durationScale || 1),
      stagger: Number(fm.agl?.motion?.stagger || 0.08),
      glow: fm.agl?.motion?.glow || 'subtle',
      particleDensity: fm.agl?.motion?.particleDensity || 'low'
    },
    composition: {
      backgroundPolicy: fm.agl?.composition?.backgroundPolicy || 'transparent',
      diagramDensity: fm.agl?.composition?.diagramDensity || 'balanced',
      preferredGrammars: asGrammarArray(fm.agl?.composition?.preferredGrammars),
      avoid: asStringArray(fm.agl?.composition?.avoid)
    },
    promptHints: [
      stripFrontmatter(markdown).startsWith('##') ? 'This import was inferred from markdown prose/tables because no YAML frontmatter was provided.' : 'Follow the imported DESIGN.md tokens as the source of truth.',
      'If extra colors are needed, derive them from text/accent/surface with opacity.'
    ]
  };

  return AglDesignSystemSchema.parse(candidate);
}
