import path from 'node:path';
import { cp } from 'node:fs/promises';
import { buildArticleHtml, buildArticleMarkdown, directiveToSpot, extractGraphicDirectives, inferTitle, visualFromSpot, createRunManifest, setRunStage, updateVisualStatus } from '@agl/workflow-core';
import { analyzeArticleWithAgent } from '../../render-worker/src/article-analyzer.mjs';
import { generateDraftWithHermes, validateGeneratedHtml } from '../../render-worker/src/draft-generator.mjs';
import { configureAgentEnvironment } from './config.mjs';
import { ensureDir, readText, runPaths, visualPaths, writeJson, writeText } from './artifacts.mjs';
import { renderHtmlFile } from './render-local.mjs';
import { runAgentPrompt } from './agent-adapters/index.mjs';

function rel(from, to) { return path.relative(from, to).replaceAll(path.sep, '/'); }
function idSafe(value, fallback = 'visual') { return String(value || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 72) || fallback; }

function titleFromTopic(topic) {
  return String(topic || '').trim().replace(/[.?!]+$/, '') || 'Visualized article';
}

function articleWriterPrompt(topic, maxVisuals) {
  return `Write a concise, article-quality Markdown draft about: ${topic}

Insert up to ${maxVisuals} AGL_GRAPHIC directives where animation genuinely improves understanding. Return ONLY Markdown.

Directive format:
<!-- AGL_GRAPHIC
id: short-slug
type: sequence|loop|comparison|stack|transformation|network|timeline|metaphor
priority: 1
placement: replace
aspect: articleBanner
duration: 7
style: article-native
description: A specific article-native animated visual idea grounded in the nearby paragraphs.
caption: Short caption/alt text.
must_include:
  - concrete label one
  - concrete label two
avoid:
  - decorative filler
-->

Rules:
- Keep the article useful without the graphics.
- Graphics are minimal inline article embeds, not posters.
- Avoid generic AI filler.`;
}

export async function runAutonomous(args, config) {
  configureAgentEnvironment({ ...config.agent, kind: args.agent || config.agent.kind });
  const maxVisuals = Number(args['max-visuals'] || 3);
  const stylePreset = args.style || 'linear';
  const shouldRender = args.render === true || args.render === 'true';
  const shouldGenerateDrafts = shouldRender || args['generate-drafts'] === true || args['generate-drafts'] === 'true';
  const dryRender = args['dry-render'] === true || args['dry-render'] === 'true';
  const outDir = path.resolve(args.out || path.join(config.output.root, `run-${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}`));
  const paths = runPaths(outDir);
  await ensureDir(outDir);

  let articleText = '';
  let inputKind = 'article';
  let inputPath = args.input ? path.resolve(args.input) : undefined;
  if (args.topic && (args['write-article'] === true || args['write-article'] === 'true')) {
    inputKind = 'topic';
    const prompt = articleWriterPrompt(args.topic, maxVisuals);
    console.log('Writing article + AGL_GRAPHIC directives with local agent…');
    articleText = await runAgentPrompt({ ...config.agent, kind: args.agent || config.agent.kind }, prompt);
    inputPath = paths.inputArticle;
  } else if (args.input) {
    articleText = await readText(inputPath);
  } else {
    throw new Error('Provide --input article.md or --topic "..." --write-article');
  }

  await writeText(paths.inputArticle, articleText);
  const title = inferTitle(articleText) || titleFromTopic(args.topic);
  let manifest = createRunManifest({ inputKind, inputPath, title, agentKind: args.agent || config.agent.kind || 'hermes', agentCommand: config.agent.command || '', model: config.agent.model });
  manifest = setRunStage(manifest, 'article_prepared');
  await writeJson(paths.manifest, manifest);

  let spots = [];
  const directives = extractGraphicDirectives(articleText).slice(0, maxVisuals);
  if (directives.length) {
    console.log(`Found ${directives.length} AGL_GRAPHIC directive(s).`);
    spots = directives.map((d, i) => directiveToSpot(d, articleText, i + 1));
    manifest = { ...setRunStage(manifest, 'directives_found'), visuals: spots.map(spot => visualFromSpot(spot)) };
  } else if (args['plan-visuals'] === true || args['plan-visuals'] === 'true') {
    console.log('No directives found; planning visuals with local agent…');
    const plan = await analyzeArticleWithAgent({ articleText, stylePreset, authMode: 'master', maxSpots: maxVisuals });
    spots = plan.spots.slice(0, maxVisuals).map((spot, i) => ({ ...spot, id: idSafe(spot.id || spot.visualIdea, `spot-${i + 1}`), accepted: true, changePrompt: '' }));
    manifest = { ...setRunStage(manifest, 'spots_planned'), visuals: spots.map(spot => visualFromSpot(spot)) };
  } else {
    console.log('No directives found. Exporting article without visuals. Use --plan-visuals to let the agent pick spots.');
    manifest = { ...setRunStage(manifest, 'spots_planned'), visuals: [] };
  }
  await writeJson(paths.manifest, manifest);

  if (shouldGenerateDrafts && spots.length) {
    manifest = setRunStage(manifest, 'drafts_queued');
    await writeJson(paths.manifest, manifest);
    for (const spot of spots) {
      const vp = visualPaths(outDir, spot.id);
      await ensureDir(vp.dir);
      manifest = updateVisualStatus(manifest, spot.id, { status: 'preview_generating' });
      await writeJson(paths.manifest, manifest);
      console.log(`Generating draft HTML for ${spot.id}…`);
      try {
        const draft = await generateDraftWithHermes({
          conceptText: spot.conceptText,
          articleContext: spot.articleExcerpt || articleText.slice(0, 3000),
          stylePreset,
          aspectPreset: spot.aspectPreset || 'articleBanner',
          durationSeconds: spot.durationSeconds || 7,
          authMode: 'master',
          provider: 'codex',
          model: config.agent.model || 'gpt-5.5'
        }, { onProgress: p => p?.label && console.log(`  ${p.label}`) });
        validateGeneratedHtml(draft.generatedHtml);
        spot.draft = draft;
        await writeText(vp.sourceHtml, draft.generatedHtml);
        await writeText(vp.indexHtml, draft.generatedHtml);
        await writeJson(vp.metadata, { spot, draft, poweredBy: 'HyperFrames from HeyGen' });
        manifest = updateVisualStatus(manifest, spot.id, { status: 'preview_ready', sourceHtmlPath: rel(outDir, vp.sourceHtml), metadataPath: rel(outDir, vp.metadata), validation: { htmlSafe: true } });
        await writeJson(paths.manifest, manifest);
      } catch (err) {
        manifest = updateVisualStatus(manifest, spot.id, { status: 'preview_failed', error: err instanceof Error ? err.message : String(err) });
        await writeJson(paths.manifest, manifest);
        if (!args['continue-on-error']) throw err;
      }
    }
    manifest = setRunStage(manifest, 'drafts_validated');
    await writeJson(paths.manifest, manifest);
  }

  if (shouldRender && spots.length) {
    manifest = setRunStage(manifest, 'renders_queued');
    await writeJson(paths.manifest, manifest);
    for (const spot of spots.filter(s => s.draft?.generatedHtml)) {
      const vp = visualPaths(outDir, spot.id);
      manifest = updateVisualStatus(manifest, spot.id, { status: 'rendering' });
      await writeJson(paths.manifest, manifest);
      try {
        const result = await renderHtmlFile({ sourceHtml: spot.draft.generatedHtml, outDir: vp.dir, fps: config.render.fps, gifFps: config.render.gifFps, gifWidth: config.render.gifWidth, workers: config.render.workers, dryRun: dryRender });
        if (result.gifPath) spot.job = { gifUrl: rel(outDir, result.gifPath), mp4Url: rel(outDir, result.mp4Path) };
        manifest = updateVisualStatus(manifest, spot.id, { status: result.gifPath ? 'rendered' : 'preview_ready', mp4Path: result.mp4Path ? rel(outDir, result.mp4Path) : undefined, gifPath: result.gifPath ? rel(outDir, result.gifPath) : undefined, validation: { hyperframesLint: !dryRender, ffprobeOk: !dryRender } });
        await writeJson(paths.manifest, manifest);
      } catch (err) {
        manifest = updateVisualStatus(manifest, spot.id, { status: 'render_failed', error: err instanceof Error ? err.message : String(err) });
        await writeJson(paths.manifest, manifest);
        if (!args['continue-on-error']) throw err;
      }
    }
    manifest = setRunStage(manifest, 'rendered');
    await writeJson(paths.manifest, manifest);
  }

  // If only draft HTML exists, export with pending markers/source details. If rendered, export relative GIF/MP4 embeds.
  const finalMd = buildArticleMarkdown(articleText, spots);
  const finalHtml = buildArticleHtml(articleText, spots, title);
  await writeText(paths.finalMarkdown, finalMd);
  await writeText(paths.finalHtml, finalHtml);
  manifest = { ...setRunStage(manifest, 'exported'), article: { ...manifest.article, finalMarkdownPath: rel(outDir, paths.finalMarkdown), finalHtmlPath: rel(outDir, paths.finalHtml) } };
  manifest = { ...setRunStage(manifest, 'completed'), status: 'completed' };
  await writeJson(paths.manifest, manifest);
  console.log(`\nAGL run complete: ${outDir}`);
  console.log(`Final Markdown: ${paths.finalMarkdown}`);
  console.log(`Final HTML:     ${paths.finalHtml}`);
  return { outDir, manifest };
}
