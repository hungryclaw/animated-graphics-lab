import { describe, expect, it } from 'vitest';
import { AglDesignSystemSchema, aglDesignSystems, getAglDesignSystem, stylePresetToDesignSystem } from './design-systems';

describe('AGL design systems', () => {
  it('ships non-branded user-facing preset labels', () => {
    const banned = /apple|claude|stripe|linear|vercel|runway|notion|supabase|figma|anthropic/i;
    for (const preset of Object.values(aglDesignSystems)) {
      expect(preset.label).not.toMatch(banned);
      expect(preset.description).not.toMatch(banned);
    }
  });

  it('all built-in systems satisfy the normalized schema', () => {
    for (const preset of Object.values(aglDesignSystems)) {
      expect(() => AglDesignSystemSchema.parse(preset)).not.toThrow();
    }
  });

  it('keeps legacy style preset ids compatible', () => {
    const soft = stylePresetToDesignSystem('appleMinimal');
    expect(soft.id).toBe('softMinimal');
    expect(soft.label).toBe('Soft Minimal');
  });

  it('returns a requested design system', () => {
    expect(getAglDesignSystem('terminalGlow').motion.glow).toBe('strong');
  });
});
