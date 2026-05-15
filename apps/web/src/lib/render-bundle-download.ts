import { strToU8, zipSync } from 'fflate';
import type { RenderBundleFile } from '@agl/workflow-core';

function slugify(value: string, fallback = 'visualized-article') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || fallback;
}

export function renderBundleFilename(articleTitle: string) {
  return `${slugify(articleTitle)}-agl-render-bundle.zip`;
}

export function buildRenderBundleZipBytes(files: RenderBundleFile[]) {
  const entries: Record<string, Uint8Array> = {};
  for (const file of files) entries[file.path] = strToU8(file.content);
  return zipSync(entries, { level: 6 });
}

export async function downloadRenderBundleZip(filename: string, files: RenderBundleFile[]) {
  const bytes = buildRenderBundleZipBytes(files);
  const blob = new Blob([bytes as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
