import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGeneratedHtml } from '../src/draft-generator.mjs';

const requiredScript = `<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><script>window.__timelines = window.__timelines || {}; const tl = gsap.timeline({ paused: true }); window.__timelines.main = tl; window.__hf = { duration: 7, seek:(t)=>{tl.time(t,true);tl.pause();} };</script>`;

function html(body) {
  return `<!doctype html><html><head>${requiredScript}<style>.stage{width:1920px;height:540px;overflow:hidden;position:relative;background:#fff}.label{position:absolute;font-size:32px}.filler{display:none}</style></head><body><div class="stage" data-composition-id="main" data-width="1920" data-height="540" data-start="0" data-duration="7">${body}<div class="filler">${'x'.repeat(600)}</div></div></body></html>`;
}

test('validateGeneratedHtml rejects overlapping readable text blocks', () => {
  assert.throws(() => validateGeneratedHtml(html(`
    <div class="label" style="left:100px;top:80px;width:320px;height:56px">Human approval</div>
    <div class="label" style="left:180px;top:95px;width:320px;height:56px">Render queue</div>
  `)), /overlap/i);
});

test('validateGeneratedHtml allows spaced readable text blocks', () => {
  assert.doesNotThrow(() => validateGeneratedHtml(html(`
    <div class="label" style="left:100px;top:80px;width:320px;height:56px">Human approval</div>
    <div class="label" style="left:520px;top:80px;width:320px;height:56px">Render queue</div>
  `)));
});
