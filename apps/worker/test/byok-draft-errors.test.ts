import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';

const requiredScript = `<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><script>window.__timelines = window.__timelines || {}; const tl = gsap.timeline({ paused: true }); window.__timelines.main = tl; window.__hf = { duration: 7, seek:(t)=>{tl.time(t,true);tl.pause();} };</script>`;

function unsafeGeneratedHtml() {
  return `<!doctype html><html><head>${requiredScript}<style>.stage{width:1920px;height:540px;overflow:hidden;position:relative;background:transparent}.label{position:absolute;font-size:32px;font-family:Inter}.filler{display:none}</style></head><body><div class="stage" data-composition-id="main" data-width="1920" data-height="540" data-start="0" data-duration="7"><div class="label" style="left:100px;top:80px;width:180px;height:56px">TESTS</div><div class="label" style="left:140px;top:92px;width:180px;height:56px">DEPS</div><div class="filler">${'x'.repeat(600)}</div></div></body></html>`;
}

describe('BYOK draft error responses', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a client-actionable validation error instead of internal_error when model HTML overlaps text', async () => {
    const content = JSON.stringify({
      interpretation: 'A compact dependency testing map with overlapping labels.',
      grammar: 'network',
      generatedHtml: unsafeGeneratedHtml(),
      notes: ['Generated with overlapping TESTS and DEPS labels.']
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({
      choices: [{ message: { content } }]
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const res = await worker.fetch(new Request('https://api.example.test/api/drafts/interpret', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-byok-key': 'test-key' },
      body: JSON.stringify({
        conceptText: 'Show how TESTS and DEPS interact in a hackathon project.',
        articleContext: '',
        stylePreset: 'linear',
        aspectPreset: 'articleBanner',
        durationSeconds: 7,
        authMode: 'byok',
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4.5'
      })
    }), {} as never);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const body = await res.json() as { error: string; message: string };
    expect(res.status, body.message).toBe(422);
    expect(body.error).toBe('draft_validation_failed');
    expect(body.message).toContain('readable text overlap');
    expect(body.message).toContain('TESTS');
    expect(body.message).toContain('DEPS');
  });
});
