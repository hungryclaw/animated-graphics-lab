import type { CSSProperties } from 'react';
import type { AglDesignSystem } from '@agl/composition-schema';

type Props = {
  design: AglDesignSystem;
  size?: 'compact' | 'large';
};

type PreviewVariant =
  | 'soft-orbit'
  | 'saas-flow'
  | 'gradient-ribbons'
  | 'terminal-stack'
  | 'sketch-bubbles'
  | 'brutalist-blocks'
  | 'editorial-cards'
  | 'mono-circuit'
  | 'cinematic-nexus'
  | 'blueprint-layers'
  | 'document-marginalia'
  | 'console-packets';

const variantByDesignId: Record<string, PreviewVariant> = {
  softMinimal: 'soft-orbit',
  precisionSaas: 'saas-flow',
  gradientEditorial: 'gradient-ribbons',
  terminalGlow: 'terminal-stack',
  sketchExplainer: 'sketch-bubbles',
  brutalistPop: 'brutalist-blocks',
  warmEditorial: 'editorial-cards',
  monoTechnical: 'mono-circuit',
  cinematicDark: 'cinematic-nexus',
  blueprintSystem: 'blueprint-layers',
  calmDocument: 'document-marginalia',
  emeraldConsole: 'console-packets'
};

function getVariant(design: AglDesignSystem): PreviewVariant {
  if (variantByDesignId[design.id]) return variantByDesignId[design.id];
  if (design.typography.font.toLowerCase().includes('mono')) return 'mono-circuit';
  if (design.motion.personality === 'technical') return 'blueprint-layers';
  if (design.motion.personality === 'playful') return 'sketch-bubbles';
  if (design.motion.personality === 'cinematic') return 'cinematic-nexus';
  if (design.shape.strokeWidth >= 4 || design.shape.radius <= 6) return 'brutalist-blocks';
  return 'soft-orbit';
}

function MiniGlyphs() {
  return (
    <>
      <span className="glyph-dot glyph-a" />
      <span className="glyph-dot glyph-b" />
      <span className="glyph-dot glyph-c" />
    </>
  );
}

function PreviewBody({ variant }: { variant: PreviewVariant }) {
  switch (variant) {
    case 'soft-orbit':
      return <>
        <span className="soft-orbit-core"><b>Idea</b></span>
        <span className="soft-orbit-ring ring-one" />
        <span className="soft-orbit-ring ring-two" />
        <MiniGlyphs />
      </>;
    case 'saas-flow':
      return <>
        <span className="saas-node saas-main"><b>Plan</b><i /></span>
        <span className="saas-node saas-side top"><i /></span>
        <span className="saas-node saas-side bottom"><i /></span>
        <span className="saas-arrow" />
      </>;
    case 'gradient-ribbons':
      return <>
        <span className="ribbon ribbon-one" />
        <span className="ribbon ribbon-two" />
        <span className="ribbon-card"><b>GIF</b></span>
      </>;
    case 'terminal-stack':
      return <>
        <span className="terminal-window"><b>$ run</b><i /><i /><i /></span>
        <span className="terminal-cursor" />
      </>;
    case 'sketch-bubbles':
      return <>
        <span className="sketch-shape sketch-one"><b>?</b></span>
        <span className="sketch-shape sketch-two"><b>→</b></span>
        <span className="sketch-shape sketch-three"><b>!</b></span>
        <span className="sketch-line" />
      </>;
    case 'brutalist-blocks':
      return <>
        <span className="brutal-block big"><b>GO</b></span>
        <span className="brutal-block small one" />
        <span className="brutal-block small two" />
      </>;
    case 'editorial-cards':
      return <>
        <span className="editorial-card main"><b>A</b><i /></span>
        <span className="editorial-card quote"><b>“”</b></span>
        <span className="editorial-rule" />
      </>;
    case 'mono-circuit':
      return <>
        <span className="circuit-grid" />
        <span className="circuit-chip"><b>01</b></span>
        <span className="circuit-trace one" />
        <span className="circuit-trace two" />
      </>;
    case 'cinematic-nexus':
      return <>
        <span className="nexus-orb main" />
        <span className="nexus-orb side one" />
        <span className="nexus-orb side two" />
        <span className="nexus-beam" />
      </>;
    case 'blueprint-layers':
      return <>
        <span className="blueprint-box back" />
        <span className="blueprint-box mid" />
        <span className="blueprint-box front"><b>Layer</b></span>
      </>;
    case 'document-marginalia':
      return <>
        <span className="doc-page"><i /><i /><i /></span>
        <span className="doc-note"><b>note</b></span>
        <span className="doc-pin" />
      </>;
    case 'console-packets':
      return <>
        <span className="packet packet-one" />
        <span className="packet packet-two" />
        <span className="packet packet-three" />
        <span className="packet-path" />
      </>;
  }
}

export function DesignSystemPreview({ design, size = 'compact' }: Props) {
  const variant = getVariant(design);
  const style = {
    '--agl-bg': design.colors.bg,
    '--agl-text': design.colors.text,
    '--agl-muted': design.colors.muted,
    '--agl-accent': design.colors.accent,
    '--agl-accent-2': design.colors.accent2 || design.colors.accent,
    '--agl-surface': design.colors.surface,
    '--agl-line': design.colors.line,
    '--agl-radius': `${Math.min(Math.max(design.shape.radius, 4), 42)}px`,
    '--agl-stroke': `${Math.min(Math.max(design.shape.strokeWidth, 1), 5)}px`,
    '--agl-shadow': design.shape.shadow,
    '--agl-font': design.typography.font,
    '--agl-title-weight': design.typography.titleWeight,
    '--agl-letter-spacing': design.typography.letterSpacing || '0em'
  } as CSSProperties;

  return (
    <span
      className={`design-preview diverse ${size} variant-${variant} motion-${design.motion.personality} density-${design.composition.diagramDensity} glow-${design.motion.glow} bg-${design.composition.backgroundPolicy}`}
      style={style}
      aria-hidden="true"
    >
      <span className="design-preview-stage">
        <PreviewBody variant={variant} />
      </span>
    </span>
  );
}
