import { describe, expect, it } from 'vitest';
import { validateGeneratedHtml } from '../src/ai';

const requiredScript = `<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><script>window.__timelines = window.__timelines || {}; const tl = gsap.timeline({ paused: true }); window.__timelines.main = tl; window.__hf = { duration: 7, seek:(t)=>{tl.time(t,true);tl.pause();} };</script>`;

function html(body: string) {
  return `<!doctype html><html><head>${requiredScript}<style>.stage{width:1920px;height:540px;overflow:hidden;position:relative;background:#fff}.label{position:absolute;font-size:32px;font-family:Inter}.filler{display:none}</style></head><body><div class="stage" data-composition-id="main" data-width="1920" data-height="540" data-start="0" data-duration="7">${body}<div class="filler">${'x'.repeat(600)}</div></div></body></html>`;
}

describe('generated HTML visual safety', () => {
  it('rejects overlapping readable detail text blocks', () => {
    const unsafe = html(`
      <div class="label" style="left:100px;top:80px;width:320px;height:56px">Human approval</div>
      <div class="label" style="left:180px;top:95px;width:320px;height:56px">Render queue</div>
    `);

    expect(() => validateGeneratedHtml(unsafe)).toThrow(/overlap/i);
  });

  it('allows readable detail text blocks with clear spacing', () => {
    const safe = html(`
      <div class="label" style="left:100px;top:80px;width:320px;height:56px">Human approval</div>
      <div class="label" style="left:520px;top:80px;width:320px;height:56px">Render queue</div>
    `);

    expect(() => validateGeneratedHtml(safe)).not.toThrow();
  });
});
