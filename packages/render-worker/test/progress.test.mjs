import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeProgressLine, progressLabelFromLine } from '../src/draft-generator.mjs';

test('sanitizeProgressLine removes JSON/HTML/secrets and keeps useful short status text', () => {
  const line = 'OPENROUTER_API_KEY=sk-secret <div class="stage">huge html</div> analysis: composing timeline now';
  const out = sanitizeProgressLine(line);
  assert.equal(out.includes('sk-secret'), false);
  assert.equal(out.includes('<div'), false);
  assert.ok(out.length <= 180);
  assert.match(out, /composing timeline/i);
});

test('progressLabelFromLine maps agent output to human preview-generation status', () => {
  assert.equal(progressLabelFromLine('thinking about composition'), 'Codex is planning the visual structure…');
  assert.equal(progressLabelFromLine('writing css and html'), 'Codex is writing the HTML/CSS/GSAP preview…');
  assert.equal(progressLabelFromLine('valid json result ready'), 'Codex returned a draft. Validating the HTML…');
  assert.equal(progressLabelFromLine('unrelated trace'), 'Codex is still working on the preview…');
});
