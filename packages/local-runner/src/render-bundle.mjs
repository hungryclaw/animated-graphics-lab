import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { buildArticleHtml, buildArticleMarkdown } from '@agl/workflow-core';
import { renderHtmlFile } from './render-local.mjs';
import { ensureDir, readText, writeJson, writeText } from './artifacts.mjs';

function rel(from, to) { return path.relative(from, to).replaceAll(path.sep, '/'); }

function spotFromVisual(visual, rendered = {}) {
  return {
    id: visual.id,
    insertAfterParagraph: Number.isFinite(visual.insertAfterParagraph) ? visual.insertAfterParagraph : 0,
    visualIdea: visual.visualIdea || visual.caption || visual.id,
    captionSuggestion: visual.caption,
    directive: visual.directive,
    job: rendered.gifPath ? { gifUrl: rendered.gifPath, mp4Url: rendered.mp4Path } : undefined,
    draft: rendered.gifPath ? undefined : { generatedHtml: `Source HTML pending local render: ${visual.sourceHtmlPath}` }
  };
}

export async function renderBundle(args, config) {
  const bundleDir = path.resolve(args.bundle || args._?.[0] || '.');
  const manifestPath = path.join(bundleDir, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const dryRun = args['dry-run'] === true || args['dry-run'] === 'true';
  const only = args.only ? String(args.only) : '';
  const continueOnError = args['continue-on-error'] === true || args['continue-on-error'] === 'true';
  const results = [];
  const renderedById = new Map();

  for (const visual of manifest.visuals || []) {
    if (only && only !== visual.id && only !== visual.originalId) continue;
    const visualDir = path.join(bundleDir, 'visuals', visual.id);
    const sourceHtml = await readText(path.join(bundleDir, visual.sourceHtmlPath));
    await ensureDir(visualDir);
    try {
      const result = await renderHtmlFile({
        sourceHtml,
        outDir: visualDir,
        fps: Number(args.fps || config.render.fps),
        gifFps: Number(args['gif-fps'] || config.render.gifFps),
        gifWidth: Number(args['gif-width'] || config.render.gifWidth),
        workers: Number(args.workers || config.render.workers),
        dryRun
      });
      const rendered = result.gifPath ? {
        mp4Path: rel(bundleDir, result.mp4Path),
        gifPath: rel(bundleDir, result.gifPath)
      } : {};
      renderedById.set(visual.id, rendered);
      results.push({ id: visual.id, status: result.gifPath ? 'rendered' : 'dry-run', ...rendered, sourceHtmlPath: rel(bundleDir, result.sourceHtmlPath) });
    } catch (error) {
      const failure = { id: visual.id, status: 'failed', error: error instanceof Error ? error.message : String(error) };
      results.push(failure);
      if (!continueOnError) throw error;
    }
  }

  const articleText = await readText(path.join(bundleDir, manifest.articleInputPath || 'article.input.md'));
  const spots = (manifest.visuals || []).map(visual => spotFromVisual(visual, renderedById.get(visual.id) || {}));
  await writeText(path.join(bundleDir, 'article.rendered.md'), buildArticleMarkdown(articleText, spots));
  await writeText(path.join(bundleDir, 'article.rendered.html'), buildArticleHtml(articleText, spots, manifest.title || 'Visualized article'));
  await writeJson(path.join(bundleDir, 'render-results.json'), { renderedAt: new Date().toISOString(), dryRun, results });
  console.log(`Render bundle complete: ${bundleDir}`);
  console.log(`Rendered Markdown: ${path.join(bundleDir, 'article.rendered.md')}`);
  console.log(`Rendered HTML:     ${path.join(bundleDir, 'article.rendered.html')}`);
  return { bundleDir, results };
}
