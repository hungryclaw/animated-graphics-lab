import { spawn } from 'node:child_process';
import { jsonrepair } from 'jsonrepair';
import { aspectRatios, stylePresetToDesignSystem, GeneratedGraphicSchema } from '@agl/composition-schema';

function agentCommand(prompt) {
  const command = process.env.AGL_AGENT_COMMAND || 'hermes';
  if (process.env.AGL_AGENT_ARGS_JSON) {
    const args = JSON.parse(process.env.AGL_AGENT_ARGS_JSON);
    if (!Array.isArray(args) || !args.every(arg => typeof arg === 'string')) throw new Error('AGL_AGENT_ARGS_JSON must be a JSON array of strings');
    return { command, args: args.map(arg => arg.replaceAll('{prompt}', prompt)) };
  }
  return {
    command,
    args: [
      'chat', '-q', prompt,
      '--provider', process.env.AGL_AGENT_PROVIDER || 'openai-codex',
      '--model', process.env.AGL_AGENT_MODEL || 'gpt-5.5',
      '--quiet'
    ]
  };
}

export function sanitizeProgressLine(line) {
  return String(line || '')
    .replace(/\b[A-Z0-9_]*(?:API|TOKEN|KEY|SECRET)[A-Z0-9_]*\s*=\s*\S+/gi, '[secret]')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[secret]')
    .replace(/<[^>]{1,400}>/g, ' ')
    .replace(/[{}\[\]"`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

export function progressLabelFromLine(line) {
  const lower = String(line || '').toLowerCase();
  if (/valid|json|result|final|done|complete/.test(lower)) return 'Codex returned a draft. Validating the HTML…';
  if (/think|plan|reason|analy|interpret|design|structure/.test(lower)) return 'Codex is planning the visual structure…';
  if (/html|css|gsap|script|timeline|compos|writing|generat/.test(lower)) return 'Codex is writing the HTML/CSS/GSAP preview…';
  if (/retry|repair|schema|overlap|validate/.test(lower)) return 'Repairing and validating the generated preview…';
  return 'Codex is still working on the preview…';
}

async function runAgentStreaming(agent, { timeout, onProgress } = {}) {
  return await new Promise((resolve, reject) => {
    const child = spawn(agent.command, agent.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2500).unref?.();
      settled = true;
      reject(new Error(`Agent timed out after ${Math.round(timeout / 1000)}s`));
    }, timeout);

    const handleChunk = (chunk, stream) => {
      const text = chunk.toString('utf8');
      if (stream === 'stdout') stdout += text; else stderr += text;
      const lines = text.split(/\r?\n/).map(sanitizeProgressLine).filter(Boolean);
      const interesting = lines.find(line => /think|plan|reason|analy|interpret|design|structure|html|css|gsap|script|timeline|compos|writing|generat|json|valid|result|final|done|complete|retry|repair|schema|overlap|validate/i.test(line));
      if (interesting) Promise.resolve(onProgress?.({ label: progressLabelFromLine(interesting), detail: interesting })).catch(err => console.warn('progress update failed', err));
    };

    child.stdout.on('data', chunk => handleChunk(chunk, 'stdout'));
    child.stderr.on('data', chunk => handleChunk(chunk, 'stderr'));
    child.on('error', err => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Agent exited with ${code}: ${(stderr || stdout).slice(-2000)}`));
    });
  });
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function cssNumber(style, prop) {
  const match = String(style || '').match(new RegExp(`${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`, 'i'));
  return match ? Number(match[1]) : null;
}

function extractReadableTextBoxes(html) {
  const boxes = [];
  const withoutScripts = String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const elementPattern = /<([a-z][\w:-]*)\b([^>]*)>([^<]+)(?=<)/gi;
  for (const match of withoutScripts.matchAll(elementPattern)) {
    const [, tag, attrs, inner] = match;
    if (/^(svg|path|defs|g|lineargradient|radialgradient)$/i.test(tag)) continue;
    const text = stripTags(inner);
    if (text.length < 2) continue;
    const style = attrs.match(/\bstyle\s*=\s*["']([^"']+)["']/i)?.[1] || '';
    if (!/\b(left|top|right|bottom|transform)\s*:/i.test(style)) continue;
    const left = cssNumber(style, 'left');
    const top = cssNumber(style, 'top');
    if (left === null || top === null) continue;
    const fontSize = cssNumber(style, 'font-size') || 28;
    const width = cssNumber(style, 'width') || Math.min(900, Math.max(40, text.length * fontSize * 0.62));
    const height = cssNumber(style, 'height') || Math.max(fontSize * 1.35, Math.ceil(text.length / Math.max(1, width / (fontSize * 0.62))) * fontSize * 1.35);
    boxes.push({ text, left, top, width, height });
  }
  return boxes;
}

function overlapArea(a, b, padding = 8) {
  const x = Math.max(0, Math.min(a.left + a.width + padding, b.left + b.width + padding) - Math.max(a.left - padding, b.left - padding));
  const y = Math.max(0, Math.min(a.top + a.height + padding, b.top + b.height + padding) - Math.max(a.top - padding, b.top - padding));
  return x * y;
}

export function validateNoReadableTextOverlap(html) {
  const boxes = extractReadableTextBoxes(html);
  const errors = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const area = overlapArea(boxes[i], boxes[j]);
      if (!area) continue;
      const smaller = Math.min(boxes[i].width * boxes[i].height, boxes[j].width * boxes[j].height);
      if (area >= Math.min(900, smaller * 0.12)) errors.push(`readable text overlap: "${boxes[i].text.slice(0, 36)}" overlaps "${boxes[j].text.slice(0, 36)}"`);
    }
  }
  if (errors.length) throw new Error(errors.slice(0, 5).join('; '));
}

export function validateGeneratedHtml(html) {
  const lower = String(html || '').toLowerCase();
  const errors = [];
  if (!lower.includes('data-composition-id="main"') && !lower.includes("data-composition-id='main'")) errors.push('missing data-composition-id="main"');
  if (!lower.includes('window.__hf')) errors.push('missing window.__hf seek bridge');
  if (!lower.includes('window.__timelines')) errors.push('missing window.__timelines registration');
  if (!lower.includes('gsap')) errors.push('missing GSAP timeline');
  const blocked = ['fetch(', 'xmlhttprequest', 'websocket', 'eventsource', 'localstorage', 'sessionstorage', 'document.cookie', 'navigator.sendbeacon', '<iframe', '<object', '<embed', '<form', 'import(', 'eval(', 'new function'];
  for (const token of blocked) if (lower.includes(token)) errors.push(`blocked token: ${token}`);
  const scripts = [...String(html || '').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  for (const src of scripts) {
    if (!/^https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@/.test(src)) errors.push(`external script not allowed: ${src}`);
  }
  try { validateNoReadableTextOverlap(html); }
  catch (err) { errors.push(err instanceof Error ? err.message : String(err)); }
  if (errors.length) throw new Error(errors.join('; '));
}


function resolveDesignSystem(req) {
  return req.designSystem || stylePresetToDesignSystem(req.stylePreset);
}

function designSystemPromptBlock(req) {
  const design = resolveDesignSystem(req);
  const designLock = req.designLocked !== false;
  return `Selected design system:
${JSON.stringify(design, null, 2)}

Design rules:
- Treat the selected design system as the source of truth.
- Use only its text, muted, accent, accent2, surface, line, radius, shadow, and font tokens unless the concept absolutely requires semantic red/green.
- If extra shades are needed, derive them from existing tokens with opacity.
- Respect composition.backgroundPolicy. For transparent article embeds, keep html, body, and .stage transparent and use color only on meaningful marks.
- If composition.backgroundPolicy is "full-bleed", full-canvas backgrounds are allowed only for social/video formats; article embed requests should still prefer transparency unless the user explicitly asks for poster-like output.
- Respect motion.personality, motion.easing, durationScale, stagger, glow, and particleDensity.
- Respect composition.avoid and promptHints.
- Design lock is ${designLock ? 'ON: do not invent new fonts, palettes, card styles, or unrelated visual motifs. Change layout/content/motion only.' : 'OFF: minor tasteful adaptations are allowed, but the selected design system should still be recognizable.'}`;
}

function systemPrompt(req) {
  const aspect = aspectRatios[req.aspectPreset];
  return `You generate one minimal animated article graphic as deterministic HyperFrames-compatible HTML.
Return ONLY JSON with: interpretation, grammar, generatedHtml, notes.
The generatedHtml field must contain the complete HTML document as a valid JSON string.

Hard rules:
- The HTML must be a complete <!doctype html> document.
- Use only inline CSS/JS plus GSAP from https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js .
- No fetch/XHR/WebSocket/import/eval/localStorage/cookies/forms/iframes/external images.
- The renderable stage must be bare graphic only: no app UI, no title unless essential, no captions outside the graphic.
- Root stage: <div class="stage" data-composition-id="main" data-width="${aspect.width}" data-height="${aspect.height}" data-start="0" data-duration="${req.durationSeconds}">.
- CSS must set .stage width:${aspect.width}px;height:${aspect.height}px;overflow:hidden;position:relative;background:transparent.
- Treat the animation as an inline article embed, not a poster on its own canvas: do not use full-canvas background fills, colored stage backgrounds, colored page backgrounds, or large background panels that make the graphic look like a separate card from the article. Keep html, body, and .stage transparent; use color only on the meaningful nodes, lines, icons, particles, and text.
- JS must create a GSAP timeline with id main, register window.__timelines.main = tl, and expose window.__hf = { duration: ${req.durationSeconds}, seek:(t)=>{tl.time(t,true);tl.pause();} }.
- Do not return unescaped newlines or raw unescaped double quotes inside generatedHtml.
- Use deterministic positions and timings. No Math.random, Date, setInterval, live clock, or network access.
- Match the requested concept. Do not reuse a generic 4-node chain unless the concept actually asks for a chain.
- Choose an appropriate graphic grammar: sequence, loop, comparison, stack, transformation, network, timeline, metaphor.
- Keep moving elements away from readable text.
- Every readable detail/label must have a non-overlap safe zone: no text boxes may cover or touch another text box; leave at least 24px spacing between labels, titles, annotations, badges, buttons, and callouts.

${designSystemPromptBlock(req)}
Canvas: ${aspect.width}x${aspect.height}, duration ${req.durationSeconds}s.`;
}

function userPrompt(req) {
  const parts = [
    `Concept: ${req.conceptText}`,
    req.articleContext ? `Article context: ${req.articleContext}` : '',
    req.currentHtml ? `Existing HTML to revise:\n${req.currentHtml.slice(0, 90000)}` : '',
    req.changePrompt ? `Requested changes: ${req.changePrompt}` : 'Create the first draft. Interpret the concept first, then produce matching HTML.'
  ].filter(Boolean);
  return parts.join('\n\n');
}

function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch (err) {
    try { return JSON.parse(jsonrepair(text)); } catch {}
    throw err;
  }
}

export function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try { return parseJsonLoose(trimmed); } catch {}
  }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) return parseJsonLoose(fenced);
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return parseJsonLoose(text.slice(first, last + 1));
  if (trimmed.startsWith('[')) return parseJsonLoose(trimmed);
  throw new Error('Hermes/Codex did not return JSON');
}

function normalizeRawDraft(raw) {
  const value = Array.isArray(raw) ? raw.find(item => item && typeof item === 'object' && 'generatedHtml' in item) || raw[0] : raw;
  const candidate = value || {};
  const notes = Array.isArray(candidate.notes) ? candidate.notes : (candidate.notes ? [String(candidate.notes)] : []);
  return GeneratedGraphicSchema.parse({
    interpretation: candidate.interpretation,
    grammar: candidate.grammar,
    generatedHtml: candidate.generatedHtml,
    notes: notes.slice(0, 6).map(note => String(note).slice(0, 240))
  });
}

export async function generateDraftWithHermes(req, { onProgress } = {}) {
  let attemptReq = req;
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = `${systemPrompt(attemptReq)}\n\nReturn valid JSON only. Escape every newline and quote inside generatedHtml as JSON requires.\n\n${userPrompt(attemptReq)}`;
    try {
      const agent = agentCommand(prompt);
      await Promise.resolve(onProgress?.({ label: attempt === 1 ? 'Launching Codex to write preview HTML…' : 'Retrying Codex with validation feedback…' }));
      const { stdout, stderr } = await runAgentStreaming(agent, {
        timeout: Number(process.env.AGL_DRAFT_TIMEOUT_MS || 300000),
        onProgress
      });
      const output = `${stdout || ''}\n${stderr || ''}`.trim();
      await Promise.resolve(onProgress?.({ label: 'Codex returned output. Parsing generated HTML…' }));
      const parsed = normalizeRawDraft(extractJson(output));
      await Promise.resolve(onProgress?.({ label: 'Validating preview HTML safety and timeline contract…' }));
      validateGeneratedHtml(parsed.generatedHtml);
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt >= 2) break;
      await Promise.resolve(onProgress?.({ label: 'Preview draft failed validation; retrying once…', detail: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240) }));
      attemptReq = {
        ...req,
        currentHtml: '',
        changePrompt: `The previous generated HTML failed validation: ${err instanceof Error ? err.message : String(err)}. Regenerate from scratch. Keep the same concept, but lay out all readable labels/details with at least 24px spacing and no overlapping bounding boxes. Return only valid JSON with corrected generatedHtml.`
      };
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
