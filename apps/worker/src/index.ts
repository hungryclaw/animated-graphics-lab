import { ArticleAnalysisRequestSchema, DraftRequestSchema, JobRequestSchema, aspectRatios } from '@agl/composition-schema';
import { verifyToken } from './auth';
import { publicJob, queuePosition } from './queue';
import { generateArticlePlan, generateGraphicDraft, validateGeneratedHtml } from './ai';

type Env = {
  DB: D1Database;
  R2?: R2Bucket;
  APP_ORIGIN?: string;
  TOKEN_PEPPER?: string;
  MASTER_SUBMITTER_KEY_HASH?: string;
  RENDER_WORKER_TOKEN_HASH?: string;
  ADMIN_KEY_HASH?: string;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
};

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body, null, 2), { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,24)}`;

function cors(req: Request, env: Env) {
  const origin = req.headers.get('origin') || '';
  const configured = env.APP_ORIGIN || 'https://animated-graphics-lab.pages.dev';
  const allowed = origin === configured || origin === 'https://animated-graphics-lab.pages.dev' || origin.endsWith('.animated-graphics-lab.pages.dev');
  return {
    'access-control-allow-origin': origin && allowed ? origin : configured,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-master-key,x-worker-token,x-admin-key,x-byok-key',
    'vary': 'Origin'
  };
}

async function addEvent(env: Env, jobId: string, level: 'info'|'warn'|'error', message: string, data?: unknown) {
  await env.DB.prepare('INSERT INTO job_events(job_id, created_at, level, message, data_json) VALUES(?,?,?,?,?)').bind(jobId, now(), level, message, data ? JSON.stringify(data) : null).run();
}

async function addDraftEvent(env: Env, draftId: string, level: 'info'|'warn'|'error', message: string, data?: unknown) {
  await env.DB.prepare('INSERT INTO draft_events(draft_id, created_at, level, message, data_json) VALUES(?,?,?,?,?)').bind(draftId, now(), level, message.slice(0, 500), data ? JSON.stringify(data) : null).run();
}

async function queuedIds(env: Env) {
  const rs = await env.DB.prepare("SELECT id FROM jobs WHERE status IN ('queued','claimed','composing','rendering_mp4','converting_gif','uploading') ORDER BY priority DESC, queue_index ASC").all<{id:string}>();
  return (rs.results || []).map(r => r.id);
}



async function handleArticleAnalyze(req: Request, env: Env) {
  const body = await req.json();
  const parsed = ArticleAnalysisRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  const authOk = parsed.data.authMode === 'master'
    ? await verifyToken(req.headers.get('x-master-key'), env.MASTER_SUBMITTER_KEY_HASH, env.TOKEN_PEPPER)
    : Boolean(req.headers.get('x-byok-key'));
  if (!authOk) return json({ error: 'unauthorized' }, { status: 401 });
  if (parsed.data.authMode === 'byok') {
    const plan = await generateArticlePlan(parsed.data, env, req.headers.get('x-byok-key'));
    return json(plan);
  }
  const analysisId = id('analysis');
  const t = now();
  await env.DB.prepare(`INSERT INTO article_analysis_jobs(id, created_at, updated_at, status, auth_mode, provider, model, request_json)
    VALUES(?,?,?,?,?,?,?,?)`).bind(analysisId, t, t, 'queued', parsed.data.authMode, 'codex', 'gpt-5.5', JSON.stringify({ ...parsed.data, provider: 'codex', model: 'gpt-5.5' })).run();
  return json({ analysisId, status: 'queued' }, { status: 202 });
}

function publicArticleAnalysis(row: any) {
  return {
    analysisId: row.id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    provider: row.provider,
    model: row.model,
    result: row.result_json ? JSON.parse(row.result_json) : undefined,
    error: row.error_message || undefined
  };
}

async function handleGetArticleAnalysis(_req: Request, env: Env, analysisId: string) {
  const row = await env.DB.prepare('SELECT * FROM article_analysis_jobs WHERE id=?').bind(analysisId).first<any>();
  if (!row) return json({ error: 'not_found' }, { status: 404 });
  return json(publicArticleAnalysis(row));
}

async function handleDraft(req: Request, env: Env) {
  const body = await req.json();
  const parsed = DraftRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  const authOk = parsed.data.authMode === 'master'
    ? await verifyToken(req.headers.get('x-master-key'), env.MASTER_SUBMITTER_KEY_HASH, env.TOKEN_PEPPER)
    : Boolean(req.headers.get('x-byok-key'));
  if (!authOk) return json({ error: 'unauthorized' }, { status: 401 });
  if (parsed.data.authMode === 'byok') {
    const draft = await generateGraphicDraft(parsed.data, env, req.headers.get('x-byok-key'));
    return json(draft);
  }
  const draftId = id('draft');
  const t = now();
  await env.DB.prepare(`INSERT INTO draft_jobs(id, created_at, updated_at, status, auth_mode, provider, model, request_json)
    VALUES(?,?,?,?,?,?,?,?)`).bind(draftId, t, t, 'queued', parsed.data.authMode, 'codex', 'gpt-5.5', JSON.stringify({ ...parsed.data, provider: 'codex', model: 'gpt-5.5' })).run();
  await addDraftEvent(env, draftId, 'info', 'Draft queued');
  return json({ draftId, status: 'queued' }, { status: 202 });
}

function publicDraft(row: any, events: any[] = []) {
  return {
    draftId: row.id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    provider: row.provider,
    model: row.model,
    result: row.result_json ? JSON.parse(row.result_json) : undefined,
    error: row.error_message || undefined,
    events: events.map(event => ({
      createdAt: event.created_at,
      level: event.level,
      message: event.message,
      data: event.data_json ? JSON.parse(event.data_json) : undefined
    }))
  };
}

async function handleGetDraft(_req: Request, env: Env, draftId: string) {
  const row = await env.DB.prepare('SELECT * FROM draft_jobs WHERE id=?').bind(draftId).first<any>();
  if (!row) return json({ error: 'not_found' }, { status: 404 });
  const events = (await env.DB.prepare('SELECT * FROM draft_events WHERE draft_id=? ORDER BY id ASC').bind(draftId).all()).results || [];
  return json(publicDraft(row, events));
}

async function handleCreateJob(req: Request, env: Env) {
  const body = await req.json();
  const parsed = JobRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'invalid_request', issues: parsed.error.issues }, { status: 400 });
  const authOk = parsed.data.authMode === 'master'
    ? await verifyToken(req.headers.get('x-master-key'), env.MASTER_SUBMITTER_KEY_HASH, env.TOKEN_PEPPER)
    : Boolean(req.headers.get('x-byok-key'));
  if (!authOk) return json({ error: 'unauthorized' }, { status: 401 });
  if (parsed.data.generatedHtml) {
    try { validateGeneratedHtml(parsed.data.generatedHtml); }
    catch (err) { return json({ error: 'unsafe_generated_html', message: err instanceof Error ? err.message : String(err) }, { status: 400 }); }
  }
  const aspect = aspectRatios[parsed.data.aspectPreset];
  const jobId = id('job');
  const t = now();
  const max = await env.DB.prepare('SELECT COALESCE(MAX(queue_index),0) as n FROM jobs').first<{n:number}>();
  const compositionSpec = parsed.data.generatedHtml ? JSON.stringify({ generatedHtml: parsed.data.generatedHtml, interpretation: parsed.data.interpretation || '' }) : null;
  await env.DB.prepare(`INSERT INTO jobs(id, created_at, updated_at, status, queue_index, auth_mode, provider, model, concept_text, article_context, style_preset, aspect_preset, width, height, duration_seconds, reference_asset_id, design_md_asset_id, composition_spec_json)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(jobId, t, t, 'queued', (max?.n || 0)+1, parsed.data.authMode, parsed.data.provider || null, parsed.data.model || null, parsed.data.conceptText, parsed.data.articleContext || '', parsed.data.stylePreset, parsed.data.aspectPreset, aspect.width, aspect.height, parsed.data.durationSeconds, parsed.data.referenceAssetId || null, parsed.data.designMdAssetId || null, compositionSpec).run();
  await addEvent(env, jobId, 'info', 'Job queued');
  const row = await env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(jobId).first();
  return json(publicJob(row, [{created_at:t, level:'info', message:'Job queued'}], queuePosition(await queuedIds(env), jobId)));
}

async function handleGetJob(_req: Request, env: Env, jobId: string) {
  const row = await env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(jobId).first();
  if (!row) return json({ error: 'not_found' }, { status: 404 });
  const events = (await env.DB.prepare('SELECT * FROM job_events WHERE job_id=? ORDER BY id ASC').bind(jobId).all()).results || [];
  return json(publicJob(row, events, queuePosition(await queuedIds(env), jobId)));
}

async function handleUpload(req: Request, env: Env) {
  if (!env.R2) return json({ error: 'r2_not_configured', message: 'Upload storage is disabled because the current Cloudflare token cannot create/bind R2 yet.' }, { status: 501 });
  const form = await req.formData();
  const file = form.get('file');
  const kind = String(form.get('kind') || 'reference_image');
  if (!(file instanceof File)) return json({ error: 'missing_file' }, { status: 400 });
  if (!['reference_image','design_md'].includes(kind)) return json({ error: 'bad_kind' }, { status: 400 });
  if (kind === 'reference_image' && !file.type.startsWith('image/')) return json({ error: 'expected_image' }, { status: 400 });
  if (kind === 'design_md' && file.size > 1024*1024) return json({ error: 'design_md_too_large' }, { status: 400 });
  if (file.size > 10*1024*1024) return json({ error: 'file_too_large' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2,'0')).join('');
  const assetId = id('asset');
  const key = `uploads/${assetId}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  await env.R2.put(key, bytes, { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  await env.DB.prepare('INSERT INTO assets(id, created_at, kind, r2_key, mime_type, size_bytes, sha256) VALUES(?,?,?,?,?,?,?)').bind(assetId, now(), kind, key, file.type || 'application/octet-stream', file.size, digest).run();
  return json({ assetId });
}

async function handleNextJob(req: Request, env: Env) {
  if (!await verifyToken(req.headers.get('x-worker-token'), env.RENDER_WORKER_TOKEN_HASH, env.TOKEN_PEPPER)) return json({ error: 'unauthorized' }, { status: 401 });
  const workerId = req.headers.get('x-worker-id') || 'render-worker';
  const row = await env.DB.prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY priority DESC, queue_index ASC LIMIT 1").first<any>();
  if (!row) return json({ job: null });
  const t = now();
  await env.DB.prepare("UPDATE jobs SET status='claimed', claimed_by=?, claimed_at=?, updated_at=? WHERE id=? AND status='queued'").bind(workerId, t, t, row.id).run();
  await addEvent(env, row.id, 'info', `Claimed by ${workerId}`);
  const updated = await env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(row.id).first();
  return json({ job: updated });
}

async function handleStatus(req: Request, env: Env, jobId: string) {
  if (!await verifyToken(req.headers.get('x-worker-token'), env.RENDER_WORKER_TOKEN_HASH, env.TOKEN_PEPPER)) return json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json<any>();
  const allowed = ['claimed','composing','preview_ready','rendering_mp4','converting_gif','uploading','done','failed','cancelled'];
  if (!allowed.includes(body.status)) return json({ error: 'bad_status' }, { status: 400 });
  await env.DB.prepare('UPDATE jobs SET status=?, updated_at=?, error_message=COALESCE(?, error_message), gif_url=COALESCE(?, gif_url), mp4_url=COALESCE(?, mp4_url), source_bundle_url=COALESCE(?, source_bundle_url), preview_url=COALESCE(?, preview_url), drive_view_url=COALESCE(?, drive_view_url), drive_download_url=COALESCE(?, drive_download_url) WHERE id=?')
    .bind(body.status, now(), body.errorMessage || null, body.gifUrl || null, body.mp4Url || null, body.sourceUrl || null, body.previewUrl || null, body.driveViewUrl || null, body.driveDownloadUrl || null, jobId).run();
  await addEvent(env, jobId, body.status === 'failed' ? 'error' : 'info', body.message || `Status: ${body.status}`);
  return json({ ok: true });
}


async function handleNextArticleAnalysis(req: Request, env: Env) {
  if (!await verifyToken(req.headers.get('x-worker-token'), env.RENDER_WORKER_TOKEN_HASH, env.TOKEN_PEPPER)) return json({ error: 'unauthorized' }, { status: 401 });
  const workerId = req.headers.get('x-worker-id') || 'render-worker';
  const row = await env.DB.prepare("SELECT * FROM article_analysis_jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1").first<any>();
  if (!row) return json({ analysis: null });
  const t = now();
  await env.DB.prepare("UPDATE article_analysis_jobs SET status='claimed', claimed_by=?, claimed_at=?, updated_at=? WHERE id=? AND status='queued'").bind(workerId, t, t, row.id).run();
  const updated = await env.DB.prepare('SELECT * FROM article_analysis_jobs WHERE id=?').bind(row.id).first<any>();
  if (!updated || updated.status !== 'claimed' || updated.claimed_by !== workerId) return json({ analysis: null });
  return json({ analysis: updated });
}

async function handleArticleAnalysisStatus(req: Request, env: Env, analysisId: string) {
  if (!await verifyToken(req.headers.get('x-worker-token'), env.RENDER_WORKER_TOKEN_HASH, env.TOKEN_PEPPER)) return json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json<any>();
  const allowed = ['claimed','done','failed'];
  if (!allowed.includes(body.status)) return json({ error: 'bad_status' }, { status: 400 });
  await env.DB.prepare('UPDATE article_analysis_jobs SET status=?, updated_at=?, result_json=COALESCE(?, result_json), error_message=COALESCE(?, error_message) WHERE id=?')
    .bind(body.status, now(), body.result ? JSON.stringify(body.result) : null, body.errorMessage || null, analysisId).run();
  return json({ ok: true });
}

async function handleNextDraft(req: Request, env: Env) {
  if (!await verifyToken(req.headers.get('x-worker-token'), env.RENDER_WORKER_TOKEN_HASH, env.TOKEN_PEPPER)) return json({ error: 'unauthorized' }, { status: 401 });
  const workerId = req.headers.get('x-worker-id') || 'render-worker';
  const row = await env.DB.prepare("SELECT * FROM draft_jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1").first<any>();
  if (!row) return json({ draft: null });
  const t = now();
  await env.DB.prepare("UPDATE draft_jobs SET status='claimed', claimed_by=?, claimed_at=?, updated_at=? WHERE id=? AND status='queued'").bind(workerId, t, t, row.id).run();
  await addDraftEvent(env, row.id, 'info', `Claimed by ${workerId}`);
  const updated = await env.DB.prepare('SELECT * FROM draft_jobs WHERE id=?').bind(row.id).first<any>();
  if (!updated || updated.status !== 'claimed' || updated.claimed_by !== workerId) return json({ draft: null });
  return json({ draft: updated });
}

async function handleDraftStatus(req: Request, env: Env, draftId: string) {
  if (!await verifyToken(req.headers.get('x-worker-token'), env.RENDER_WORKER_TOKEN_HASH, env.TOKEN_PEPPER)) return json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json<any>();
  const allowed = ['claimed','done','failed'];
  if (!allowed.includes(body.status)) return json({ error: 'bad_status' }, { status: 400 });
  if (body.status === 'done') {
    try { validateGeneratedHtml(body.result?.generatedHtml || ''); }
    catch (err) { return json({ error: 'unsafe_generated_html', message: err instanceof Error ? err.message : String(err) }, { status: 400 }); }
  }
  await env.DB.prepare('UPDATE draft_jobs SET status=?, updated_at=?, result_json=COALESCE(?, result_json), error_message=COALESCE(?, error_message) WHERE id=?')
    .bind(body.status, now(), body.result ? JSON.stringify(body.result) : null, body.errorMessage || null, draftId).run();
  if (body.message) await addDraftEvent(env, draftId, body.status === 'failed' ? 'error' : 'info', body.message, body.data || undefined);
  return json({ ok: true });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req, env) });
    const url = new URL(req.url);
    let res: Response;
    try {
      if (req.method === 'GET' && url.pathname === '/api/health') res = json({ ok: true, service: 'animated-graphics-lab-api', version: '1.0.0' });
      else if (req.method === 'POST' && url.pathname === '/api/articles/analyze') res = await handleArticleAnalyze(req, env);
      else if (req.method === 'GET' && url.pathname.startsWith('/api/articles/analyze/')) res = await handleGetArticleAnalysis(req, env, url.pathname.split('/').pop()!);
      else if (req.method === 'POST' && url.pathname === '/api/drafts/interpret') res = await handleDraft(req, env);
      else if (req.method === 'GET' && url.pathname.startsWith('/api/drafts/')) res = await handleGetDraft(req, env, url.pathname.split('/').pop()!);
      else if (req.method === 'POST' && url.pathname === '/api/jobs') res = await handleCreateJob(req, env);
      else if (req.method === 'POST' && url.pathname === '/api/uploads/reference') res = await handleUpload(req, env);
      else if (req.method === 'GET' && url.pathname.startsWith('/api/jobs/')) res = await handleGetJob(req, env, url.pathname.split('/').pop()!);
      else if (req.method === 'POST' && url.pathname === '/api/internal/jobs/next') res = await handleNextJob(req, env);
      else if (req.method === 'POST' && url.pathname.startsWith('/api/internal/jobs/') && url.pathname.endsWith('/status')) res = await handleStatus(req, env, url.pathname.split('/')[4]);
      else if (req.method === 'POST' && url.pathname === '/api/internal/article-analyses/next') res = await handleNextArticleAnalysis(req, env);
      else if (req.method === 'POST' && url.pathname.startsWith('/api/internal/article-analyses/') && url.pathname.endsWith('/status')) res = await handleArticleAnalysisStatus(req, env, url.pathname.split('/')[4]);
      else if (req.method === 'POST' && url.pathname === '/api/internal/drafts/next') res = await handleNextDraft(req, env);
      else if (req.method === 'POST' && url.pathname.startsWith('/api/internal/drafts/') && url.pathname.endsWith('/status')) res = await handleDraftStatus(req, env, url.pathname.split('/')[4]);
      else res = json({ error: 'not_found' }, { status: 404 });
    } catch (err) {
      res = json({ error: 'internal_error', message: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
    const headers = new Headers(res.headers);
    Object.entries(cors(req, env)).forEach(([k,v]) => headers.set(k,v));
    headers.set('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
};
