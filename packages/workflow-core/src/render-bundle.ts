import { buildArticleHtml, buildArticleMarkdown } from './article-export.js';
import type { ExportSpot } from './types.js';

export type RenderBundleManifestVisual = {
  id: string;
  originalId: string;
  visualIdea: string;
  caption?: string;
  aspectPreset?: string;
  durationSeconds?: number;
  insertAfterParagraph: number;
  directive?: { raw: string; start: number; end: number; placement: 'before' | 'after' | 'replace' };
  sourceHtmlPath: string;
  metadataPath: string;
  expectedMp4Path: string;
  expectedGifPath: string;
};

export type RenderBundleManifest = {
  version: 1;
  title: string;
  createdAt: string;
  renderEngine: 'hyperframes';
  poweredBy: 'HyperFrames from HeyGen';
  articleInputPath: 'article.input.md';
  articlePreviewMarkdownPath: 'article.preview.md';
  articlePreviewHtmlPath: 'article.preview.html';
  visuals: RenderBundleManifestVisual[];
};

export type RenderBundleFile = {
  path: string;
  content: string;
};

export type BuildRenderBundleInput = {
  title: string;
  articleText: string;
  spots: ExportSpot[];
  createdAt?: string;
};

type RuntimeExportSpot = ExportSpot & {
  accepted?: boolean;
  aspectPreset?: string;
  durationSeconds?: number;
  grammar?: string;
  rationale?: string;
  anchorText?: string;
  conceptText?: string;
};

function safeId(value: string, fallback = 'visual') {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72) || fallback;
}

function uniqueSafeIds(spots: RuntimeExportSpot[]) {
  const seen = new Map<string, number>();
  return spots.map((spot, index) => {
    const base = safeId(spot.id, `visual-${index + 1}`);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  });
}

function renderScriptTemplate() {
  return `#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const only = args.only ? String(args.only) : '';
const dryRun = Boolean(args['dry-run']);
const fps = String(args.fps || 30);
const gifFps = String(args['gif-fps'] || 15);
const gifWidth = String(args['gif-width'] || 1440);
const workers = String(args.workers || 2);
const results = [];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i += 1; }
  }
  return out;
}

function run(command, commandArgs, options = {}) {
  console.log(['$', command, ...commandArgs].join(' '));
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(command + ' exited with ' + code)));
  });
}

for (const visual of manifest.visuals) {
  if (only && only !== visual.id && only !== visual.originalId) continue;
  const visualDir = path.join(root, 'visuals', visual.id);
  const source = path.join(root, visual.sourceHtmlPath);
  const index = path.join(visualDir, 'index.html');
  const mp4 = path.resolve(visualDir, 'render.mp4');
  const gif = path.resolve(visualDir, 'render.gif');
  console.log('\nRendering ' + visual.id + ' with HyperFrames from HeyGen');
  await copyFile(source, index);
  if (dryRun) {
    results.push({ id: visual.id, status: 'dry-run', sourceHtmlPath: visual.sourceHtmlPath });
    continue;
  }
  try {
    await run('npx', ['hyperframes', 'lint'], { cwd: visualDir });
    await run('npx', ['hyperframes', 'snapshot', '--at', '0,1,2'], { cwd: visualDir });
    await run('npx', ['hyperframes', 'render', '--output', mp4, '--fps', fps, '--quality', 'high', '--workers', workers], { cwd: visualDir });
    await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'default=nw=1:nk=1', mp4]);
    await run('ffmpeg', ['-y', '-i', mp4, '-vf', 'fps=' + gifFps + ',scale=' + gifWidth + ':-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', gif]);
    await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'default=nw=1:nk=1', gif]);
    results.push({ id: visual.id, status: 'rendered', mp4Path: path.relative(root, mp4).replaceAll(path.sep, '/'), gifPath: path.relative(root, gif).replaceAll(path.sep, '/') });
  } catch (error) {
    results.push({ id: visual.id, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    if (!args['continue-on-error']) throw error;
  }
}

await writeFile(path.join(root, 'render-results.json'), JSON.stringify({ renderedAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log('\nDone. Results: ' + path.join(root, 'render-results.json'));
`;
}

function readmeTemplate(title: string) {
  return `# ${title} — AGL local render bundle

This bundle contains the exact approved browser preview HTML for local HyperFrames rendering.

## Render locally

Prerequisites:

\`\`\`bash
node --version
npx --yes hyperframes --help
ffmpeg -version
ffprobe -version
\`\`\`

Render every visual:

\`\`\`bash
node render-all.mjs
\`\`\`

Render one visual:

\`\`\`bash
node render-all.mjs --only visual-id
\`\`\`

Dry run without HyperFrames/ffmpeg:

\`\`\`bash
node render-all.mjs --dry-run
\`\`\`

Outputs are written beside each source:

\`\`\`text
visuals/<id>/render.mp4
visuals/<id>/render.gif
render-results.json
\`\`\`

No credentials are included in this bundle. Rendering stays on your device.
`;
}

export function buildRenderBundleFiles({ title, articleText, spots, createdAt = new Date().toISOString() }: BuildRenderBundleInput): RenderBundleFile[] {
  const renderableSpots = (spots as RuntimeExportSpot[]).filter(spot => spot.accepted !== false && Boolean(spot.draft?.generatedHtml));
  const ids = uniqueSafeIds(renderableSpots);
  const files: RenderBundleFile[] = [];
  const exportSpots: ExportSpot[] = [];

  const manifestVisuals = renderableSpots.map((spot, index): RenderBundleManifestVisual => {
    const id = ids[index];
    const caption = spot.captionSuggestion || spot.visualIdea;
    const sourceHtmlPath = `visuals/${id}/source.html`;
    const metadataPath = `visuals/${id}/metadata.json`;
    exportSpots.push({
      id,
      insertAfterParagraph: spot.insertAfterParagraph,
      visualIdea: spot.visualIdea,
      captionSuggestion: spot.captionSuggestion,
      draft: spot.draft,
      directive: spot.directive
    });
    files.push({ path: sourceHtmlPath, content: spot.draft!.generatedHtml });
    files.push({
      path: metadataPath,
      content: JSON.stringify({
        id,
        originalId: spot.id,
        visualIdea: spot.visualIdea,
        caption,
        aspectPreset: spot.aspectPreset,
        durationSeconds: spot.durationSeconds,
        grammar: spot.grammar,
        renderEngine: 'hyperframes',
        poweredBy: 'HyperFrames from HeyGen'
      }, null, 2) + '\n'
    });
    return {
      id,
      originalId: spot.id,
      visualIdea: spot.visualIdea,
      caption,
      aspectPreset: spot.aspectPreset,
      durationSeconds: spot.durationSeconds,
      insertAfterParagraph: spot.insertAfterParagraph,
      directive: spot.directive,
      sourceHtmlPath,
      metadataPath,
      expectedMp4Path: `visuals/${id}/render.mp4`,
      expectedGifPath: `visuals/${id}/render.gif`
    };
  });

  const manifest: RenderBundleManifest = {
    version: 1,
    title,
    createdAt,
    renderEngine: 'hyperframes',
    poweredBy: 'HyperFrames from HeyGen',
    articleInputPath: 'article.input.md',
    articlePreviewMarkdownPath: 'article.preview.md',
    articlePreviewHtmlPath: 'article.preview.html',
    visuals: manifestVisuals
  };

  return [
    { path: 'README.md', content: readmeTemplate(title) },
    { path: 'manifest.json', content: JSON.stringify(manifest, null, 2) + '\n' },
    { path: 'article.input.md', content: articleText },
    { path: 'article.preview.md', content: buildArticleMarkdown(articleText, exportSpots) },
    { path: 'article.preview.html', content: buildArticleHtml(articleText, exportSpots, title) },
    { path: 'render-all.mjs', content: renderScriptTemplate() },
    ...files
  ];
}
