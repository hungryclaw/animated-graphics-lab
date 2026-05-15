#!/usr/bin/env node
import { mkdir, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ApiClient } from './api-client.mjs';
import { renderHtml } from './template.mjs';
import { run } from './commands.mjs';
import { generateDraftWithHermes } from './draft-generator.mjs';
import { analyzeArticleWithAgent } from './article-analyzer.mjs';

const args = new Set(process.argv.slice(2));
const getArg = (name, fallback) => { const idx = process.argv.indexOf(name); return idx >= 0 ? process.argv[idx+1] : fallback; };
const once = args.has('--once');
const dryRun = args.has('--dry-run');
const apiBase = getArg('--api', process.env.AGL_API_BASE || 'http://localhost:8787');
const token = getArg('--token', process.env.AGL_RENDER_WORKER_TOKEN || '');
const workerId = getArg('--worker-id', process.env.AGL_WORKER_ID || `worker-${os.hostname() || 'local'}`);
const jobsRoot = getArg('--jobs-root', process.env.AGL_JOBS_ROOT || `${process.env.HOME}/.hermes/graphics-lab/jobs`);
const pollMs = Number(getArg('--poll-ms', process.env.AGL_POLL_MS || '10000'));

if (!token && !dryRun) {
  console.error('Missing AGL_RENDER_WORKER_TOKEN or --token');
  process.exit(2);
}

const api = new ApiClient({ apiBase, token, workerId });

async function postStatus(jobId, body) {
  if (dryRun && !token) { console.log(`[dry-run] ${jobId}: ${body.status} - ${body.message || ''}`); return; }
  return api.status(jobId, body);
}

async function processDraft(draft) {
  const request = JSON.parse(draft.request_json);
  let lastProgressAt = 0;
  let lastProgressLabel = '';
  const onProgress = async progress => {
    const label = String(progress?.label || '').slice(0, 500);
    if (!label) return;
    const nowMs = Date.now();
    if (label === lastProgressLabel && nowMs - lastProgressAt < 8000) return;
    if (nowMs - lastProgressAt < 2500) return;
    lastProgressAt = nowMs;
    lastProgressLabel = label;
    await api.draftStatus(draft.id, { status: 'claimed', message: label, data: progress?.detail ? { detail: String(progress.detail).slice(0, 500) } : undefined });
  };
  const result = await generateDraftWithHermes({ ...request, authMode: 'master', provider: 'codex', model: 'gpt-5.5' }, { onProgress });
  await api.draftStatus(draft.id, { status: 'done', result, message: 'Preview HTML ready' });
}

async function processArticleAnalysis(analysis) {
  const request = JSON.parse(analysis.request_json);
  const result = await analyzeArticleWithAgent({ ...request, authMode: 'master', provider: 'codex', model: 'gpt-5.5' });
  await api.articleAnalysisStatus(analysis.id, { status: 'done', result });
}

async function processJob(job) {
  const dir = path.join(jobsRoot, job.id);
  const source = path.join(dir, 'source');
  const renders = path.join(dir, 'renders');
  await mkdir(source, { recursive: true });
  await mkdir(renders, { recursive: true });
  await postStatus(job.id, { status: 'composing', message: 'Generating safe template composition' });
  const html = renderHtml(job);
  await writeFile(path.join(source, 'index.html'), html);
  await writeFile(path.join(source, 'meta.json'), JSON.stringify(job, null, 2));

  if (dryRun) {
    await postStatus(job.id, { status: 'preview_ready', message: `Dry-run source generated at ${path.join(source, 'index.html')}` });
    return;
  }

  await postStatus(job.id, { status: 'preview_ready', message: 'Source generated; running HyperFrames lint' });
  await run('npx', ['hyperframes', 'lint'], { cwd: source });
  const duration = Number(job.duration_seconds || 7);
  const at = [0, Math.min(1.3,duration), Math.min(2.2,duration), Math.min(3.7,duration), Math.max(0,duration-.2)].join(',');
  await run('npx', ['hyperframes', 'snapshot', '--at', at], { cwd: source });

  await postStatus(job.id, { status: 'rendering_mp4', message: 'Rendering MP4 with HyperFrames' });
  const mp4 = path.join(renders, 'out.mp4');
  await run('npx', ['hyperframes', 'render', '--output', mp4, '--fps', '30', '--quality', 'high', '--workers', '2'], { cwd: source });
  await run('ffprobe', ['-v','error','-show_entries','format=duration,size','-of','default=nw=1:nk=1', mp4]);

  await postStatus(job.id, { status: 'converting_gif', message: 'Converting MP4 to optimized GIF' });
  const gif = path.join(renders, 'out.gif');
  await run('ffmpeg', ['-y','-i',mp4,'-vf','fps=15,scale=1440:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle','-loop','0',gif]);
  await run('ffprobe', ['-v','error','-show_entries','format=duration,size','-of','default=nw=1:nk=1', gif]);

  // V1 local artifact URLs. In production, replace with R2/Drive upload and public URLs.
  await postStatus(job.id, { status: 'done', message: 'Render complete', gifUrl: `file://${gif}`, mp4Url: `file://${mp4}`, sourceUrl: `file://${path.join(source,'index.html')}` });
}

async function tick() {
  if (!(dryRun && !token)) {
    const analysis = await api.nextArticleAnalysis();
    if (analysis) {
      try { await processArticleAnalysis(analysis); }
      catch (err) {
        console.error(err);
        await api.articleAnalysisStatus(analysis.id, { status: 'failed', errorMessage: err instanceof Error ? err.message.slice(0, 4000) : String(err) });
      }
      return true;
    }

    const draft = await api.nextDraft();
    if (draft) {
      try { await processDraft(draft); }
      catch (err) {
        console.error(err);
        await api.draftStatus(draft.id, { status: 'failed', errorMessage: err instanceof Error ? err.message.slice(0, 4000) : String(err) });
      }
      return true;
    }
  }

  const job = dryRun && !token ? { id: 'dry_job', concept_text: 'A rough paragraph becomes a minimal animated GIF preview', width: 1920, height: 540, duration_seconds: 7, style_preset: 'appleMinimal' } : await api.nextJob();
  if (!job) return false;
  try { await processJob(job); }
  catch (err) {
    console.error(err);
    if (!dryRun) await postStatus(job.id, { status: 'failed', message: 'Render failed', errorMessage: err instanceof Error ? err.message.slice(0, 4000) : String(err) });
  }
  return true;
}

while (true) {
  const did = await tick();
  if (once) break;
  if (!did) await new Promise(r => setTimeout(r, pollMs));
}
