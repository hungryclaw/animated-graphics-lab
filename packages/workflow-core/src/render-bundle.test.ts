import { describe, expect, it } from 'vitest';
import { buildRenderBundleFiles } from './render-bundle.js';
import type { ExportSpot } from './types.js';

const sourceHtml = '<!doctype html><html><body><div data-composition-id="main" data-width="960" data-height="270" data-duration="3"></div><script>window.__timelines={main:{}};window.__hf={duration:3,seek(t){}}</script></body></html>';

const baseSpot: ExportSpot = {
  id: 'Memory Loop!',
  insertAfterParagraph: 1,
  visualIdea: 'Show task -> memory -> better next task.',
  captionSuggestion: 'Memory compounds agent work.',
  draft: { generatedHtml: sourceHtml }
};

describe('render bundle generation', () => {
  it('exports only accepted preview HTML sources with safe local paths', () => {
    const files = buildRenderBundleFiles({
      title: 'Agent Memory: Local Render',
      articleText: '# Agent Memory\n\nBody paragraph.',
      spots: [
        baseSpot,
        { ...baseSpot, id: 'No draft', draft: undefined },
        { ...baseSpot, id: 'Already rendered', job: { gifUrl: 'https://cdn.example/render.gif' } }
      ],
      createdAt: '2026-05-15T00:00:00.000Z'
    });

    const paths = files.map(file => file.path).sort();
    expect(paths).toContain('manifest.json');
    expect(paths).toContain('render-all.mjs');
    expect(paths).toContain('article.input.md');
    expect(paths).toContain('article.preview.md');
    expect(paths).toContain('article.preview.html');
    expect(paths).toContain('visuals/memory-loop/source.html');
    expect(paths).toContain('visuals/already-rendered/source.html');
    expect(paths).not.toContain('visuals/no-draft/source.html');

    const manifest = JSON.parse(files.find(file => file.path === 'manifest.json')!.content);
    expect(manifest.version).toBe(1);
    expect(manifest.renderEngine).toBe('hyperframes');
    expect(manifest.visuals).toHaveLength(2);
    expect(manifest.visuals[0]).toMatchObject({
      id: 'memory-loop',
      sourceHtmlPath: 'visuals/memory-loop/source.html',
      expectedMp4Path: 'visuals/memory-loop/render.mp4',
      expectedGifPath: 'visuals/memory-loop/render.gif'
    });
  });

  it('does not serialize secret-like user fields into the bundle', () => {
    const files = buildRenderBundleFiles({
      title: 'Secret Check',
      articleText: '# Secret Check\n\nBody.',
      spots: [{
        ...baseSpot,
        id: 'secret-check',
        // Simulate extra UI state accidentally present at runtime.
        masterKey: 'raw_master_value_should_not_exist',
        byokKey: 'raw_byok_value_should_not_exist',
        token: 'raw_token_value_should_not_exist'
      } as unknown as ExportSpot],
      createdAt: '2026-05-15T00:00:00.000Z'
    });

    const blob = files.map(file => file.content).join('\n');
    expect(blob).not.toContain('raw_master_value_should_not_exist');
    expect(blob).not.toContain('raw_byok_value_should_not_exist');
    expect(blob).not.toContain('raw_token_value_should_not_exist');
  });

  it('generates HyperFrames v0.4-compatible render script commands', () => {
    const files = buildRenderBundleFiles({
      title: 'Render Commands',
      articleText: '# Render Commands\n\nBody.',
      spots: [baseSpot],
      createdAt: '2026-05-15T00:00:00.000Z'
    });
    const script = files.find(file => file.path === 'render-all.mjs')!.content;

    expect(script).toContain("'snapshot', '--at'");
    expect(script).toContain("'render', '--output'");
    expect(script).not.toContain("'--times'");
    expect(script).not.toContain("'-o'");
    expect(script).toContain('path.resolve(visualDir, \'render.mp4\')');
  });
});
