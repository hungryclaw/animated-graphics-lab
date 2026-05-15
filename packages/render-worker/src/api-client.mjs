export class ApiClient {
  constructor({ apiBase, token, workerId }) { this.apiBase = apiBase.replace(/\/$/,''); this.token = token; this.workerId = workerId || 'render-worker'; }
  headers() { return { 'content-type': 'application/json', 'x-worker-token': this.token, 'x-worker-id': this.workerId }; }
  async nextJob() { const r = await fetch(`${this.apiBase}/api/internal/jobs/next`, { method:'POST', headers: this.headers() }); if (!r.ok) throw new Error(`nextJob ${r.status}: ${await r.text()}`); return (await r.json()).job; }
  async status(jobId, body) { const r = await fetch(`${this.apiBase}/api/internal/jobs/${jobId}/status`, { method:'POST', headers: this.headers(), body: JSON.stringify(body) }); if (!r.ok) throw new Error(`status ${r.status}: ${await r.text()}`); return r.json(); }
  async nextDraft() { const r = await fetch(`${this.apiBase}/api/internal/drafts/next`, { method:'POST', headers: this.headers() }); if (!r.ok) throw new Error(`nextDraft ${r.status}: ${await r.text()}`); return (await r.json()).draft; }
  async draftStatus(draftId, body) { const r = await fetch(`${this.apiBase}/api/internal/drafts/${draftId}/status`, { method:'POST', headers: this.headers(), body: JSON.stringify(body) }); if (!r.ok) throw new Error(`draftStatus ${r.status}: ${await r.text()}`); return r.json(); }
  async nextArticleAnalysis() { const r = await fetch(`${this.apiBase}/api/internal/article-analyses/next`, { method:'POST', headers: this.headers() }); if (!r.ok) throw new Error(`nextArticleAnalysis ${r.status}: ${await r.text()}`); return (await r.json()).analysis; }
  async articleAnalysisStatus(analysisId, body) { const r = await fetch(`${this.apiBase}/api/internal/article-analyses/${analysisId}/status`, { method:'POST', headers: this.headers(), body: JSON.stringify(body) }); if (!r.ok) throw new Error(`articleAnalysisStatus ${r.status}: ${await r.text()}`); return r.json(); }
}
