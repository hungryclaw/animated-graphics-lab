import type { Job, GraphicDraft } from '../types';
import type { ArticleAnalysisRequest, ArticleVisualizationPlan, DraftRequest, JobRequest } from '@agl/composition-schema';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

function authHeaders(masterKey?: string, byokKey?: string) {
  const headers: Record<string,string> = { 'content-type': 'application/json' };
  if (masterKey) headers['x-master-key'] = masterKey;
  if (byokKey) headers['x-byok-key'] = byokKey;
  return headers;
}

type DraftEvent = { createdAt: string; level: 'info'|'warn'|'error'; message: string; data?: { detail?: string } };
type QueuedDraft = { draftId: string; status: 'queued'|'claimed'|'done'|'failed'; result?: GraphicDraft; error?: string; updatedAt?: string; events?: DraftEvent[] };
type QueuedArticleAnalysis = { analysisId: string; status: 'queued'|'claimed'|'done'|'failed'; result?: ArticleVisualizationPlan; error?: string };
export type PollProgress = { id?: string; status: string; attempt: number; label: string; events?: DraftEvent[]; updatedAt?: string };

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const POLL_INTERVAL_MS = 2000;
const DRAFT_POLL_ATTEMPTS = 600;
const ARTICLE_ANALYSIS_POLL_ATTEMPTS = 600;

export async function getDraft(id: string): Promise<QueuedDraft> {
  const res = await fetch(`${API_BASE}/api/drafts/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function waitForDraft(draftId: string, onProgress?: (progress: PollProgress) => void): Promise<GraphicDraft> {
  for (let attempt = 0; attempt < DRAFT_POLL_ATTEMPTS; attempt++) {
    const draft = await getDraft(draftId);
    const latestEvent = draft.events?.[draft.events.length - 1];
    const label = latestEvent?.message || (draft.status === 'claimed' ? 'Local agent is writing the preview HTML…' : 'Draft is queued. Waiting for the worker to claim it…');
    onProgress?.({ id: draftId, status: draft.status, attempt: attempt + 1, label, events: draft.events, updatedAt: draft.updatedAt });
    if (draft.status === 'done' && draft.result) return draft.result;
    if (draft.status === 'failed') throw new Error(draft.error || 'Draft generation failed');
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(`Draft ${draftId} is still running after ${Math.round(DRAFT_POLL_ATTEMPTS * POLL_INTERVAL_MS / 60000)} minutes. The worker may still finish it; reload or regenerate if this message persists.`);
}

export async function createDraft(payload: DraftRequest, masterKey?: string, byokKey?: string, onProgress?: (progress: PollProgress) => void): Promise<GraphicDraft> {
  const res = await fetch(`${API_BASE}/api/drafts/interpret`, { method: 'POST', headers: authHeaders(masterKey, byokKey), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  const created = await res.json();
  if (!created?.draftId) return created;
  onProgress?.({ id: created.draftId, status: created.status || 'queued', attempt: 0, label: 'Draft queued. Waiting for the local agent worker…' });
  return waitForDraft(created.draftId, onProgress);
}

export async function getArticleAnalysis(id: string): Promise<QueuedArticleAnalysis> {
  const res = await fetch(`${API_BASE}/api/articles/analyze/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function waitForArticleAnalysis(analysisId: string, onProgress?: (progress: PollProgress) => void): Promise<ArticleVisualizationPlan> {
  for (let attempt = 0; attempt < ARTICLE_ANALYSIS_POLL_ATTEMPTS; attempt++) {
    const analysis = await getArticleAnalysis(analysisId);
    onProgress?.({ id: analysisId, status: analysis.status, attempt: attempt + 1, label: analysis.status === 'claimed' ? 'Local agent is reading the article and selecting visual moments…' : 'Analysis is queued. Waiting for the worker to claim it…' });
    if (analysis.status === 'done' && analysis.result) return analysis.result;
    if (analysis.status === 'failed') throw new Error(analysis.error || 'Article analysis failed');
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(`Article analysis ${analysisId} is still running after ${Math.round(ARTICLE_ANALYSIS_POLL_ATTEMPTS * POLL_INTERVAL_MS / 60000)} minutes. The worker may still finish it; reload or retry if this message persists.`);
}

export async function analyzeArticle(payload: ArticleAnalysisRequest, masterKey?: string, byokKey?: string, onProgress?: (progress: PollProgress) => void): Promise<ArticleVisualizationPlan> {
  const res = await fetch(`${API_BASE}/api/articles/analyze`, { method: 'POST', headers: authHeaders(masterKey, byokKey), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  const created = await res.json();
  if (!created?.analysisId) return created;
  onProgress?.({ id: created.analysisId, status: created.status || 'queued', attempt: 0, label: 'Article analysis queued. Waiting for the local agent worker…' });
  return waitForArticleAnalysis(created.analysisId, onProgress);
}

export async function createJob(payload: JobRequest, masterKey?: string, byokKey?: string): Promise<Job> {
  const res = await fetch(`${API_BASE}/api/jobs`, { method: 'POST', headers: authHeaders(masterKey, byokKey), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadReference(file: File, kind: 'reference_image'|'design_md'): Promise<{assetId:string}> {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  const res = await fetch(`${API_BASE}/api/uploads/reference`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
