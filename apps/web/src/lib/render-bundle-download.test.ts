import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildRenderBundleZipBytes, renderBundleFilename } from './render-bundle-download';

function zipTextEntries(bytes: Uint8Array) {
  const unzipped = unzipSync(bytes);
  const entries: Record<string, string> = {};
  for (const name of Object.keys(unzipped)) entries[name] = strFromU8(unzipped[name]);
  return entries;
}

describe('render bundle download helpers', () => {
  it('creates a zip containing render bundle files', () => {
    const bytes = buildRenderBundleZipBytes([
      { path: 'manifest.json', content: '{"version":1}\n' },
      { path: 'render-all.mjs', content: 'console.log("render")' },
      { path: 'visuals/memory-loop/source.html', content: '<!doctype html>' }
    ]);

    const entries = zipTextEntries(bytes);
    expect(entries['manifest.json']).toContain('"version"');
    expect(entries['render-all.mjs']).toContain('render');
    expect(entries['visuals/memory-loop/source.html']).toContain('<!doctype html>');
  });

  it('uses article-safe bundle filenames', () => {
    expect(renderBundleFilename('Agent Memory: Local Render!')).toBe('agent-memory-local-render-agl-render-bundle.zip');
    expect(renderBundleFilename('')).toBe('visualized-article-agl-render-bundle.zip');
  });
});
