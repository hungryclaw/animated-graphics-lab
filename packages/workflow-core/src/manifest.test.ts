import { describe, expect, it } from 'vitest';
import { createRunManifest, updateVisualStatus, validateManifest, visualFromSpot } from './manifest';

describe('run manifest', () => {
  it('creates a valid HyperFrames powered manifest', () => {
    const manifest = createRunManifest({ inputKind: 'article', inputPath: 'article.md', agentKind: 'codex', agentCommand: 'codex' });
    expect(manifest.render.poweredBy).toBe('HyperFrames from HeyGen');
    expect(validateManifest(manifest).ok).toBe(true);
  });

  it('updates visual status without dropping validation fields', () => {
    const visual = visualFromSpot({ id: 'v1', visualIdea: 'Visual idea' });
    const manifest = createRunManifest({ inputKind: 'article', visuals: [visual] });
    const next = updateVisualStatus(manifest, 'v1', { status: 'rendered', validation: { ffprobeOk: true } });
    expect(next.visuals[0].status).toBe('rendered');
    expect(next.visuals[0].validation.htmlSafe).toBe(false);
    expect(next.visuals[0].validation.ffprobeOk).toBe(true);
  });
});
