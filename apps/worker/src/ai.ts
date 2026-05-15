import { aspectRatios, stylePresetToDesignSystem, GeneratedGraphicSchema, ArticleVisualizationPlanSchema, type DraftRequest, type GeneratedGraphic, type ArticleAnalysisRequest } from '@agl/composition-schema';
import { jsonrepair } from 'jsonrepair';

type AiEnv = { OPENROUTER_API_KEY?: string; GEMINI_API_KEY?: string };
type RawGeneratedGraphic = Omit<GeneratedGraphic, 'generatedHtml'> & { generatedHtml?: string; generatedHtmlBase64?: string };

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

type TextBox = { text: string; left: number; top: number; width: number; height: number };

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function cssNumber(style: string, prop: string) {
  const match = style.match(new RegExp(`${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`, 'i'));
  return match ? Number(match[1]) : null;
}

function extractReadableTextBoxes(html: string) {
  const boxes: TextBox[] = [];
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
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

function overlapArea(a: TextBox, b: TextBox, padding = 8) {
  const x = Math.max(0, Math.min(a.left + a.width + padding, b.left + b.width + padding) - Math.max(a.left - padding, b.left - padding));
  const y = Math.max(0, Math.min(a.top + a.height + padding, b.top + b.height + padding) - Math.max(a.top - padding, b.top - padding));
  return x * y;
}

export function validateNoReadableTextOverlap(html: string) {
  const boxes = extractReadableTextBoxes(html);
  const errors: string[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const area = overlapArea(boxes[i], boxes[j]);
      if (!area) continue;
      const smaller = Math.min(boxes[i].width * boxes[i].height, boxes[j].width * boxes[j].height);
      if (area >= Math.min(900, smaller * 0.12)) {
        errors.push(`readable text overlap: "${boxes[i].text.slice(0, 36)}" overlaps "${boxes[j].text.slice(0, 36)}"`);
      }
    }
  }
  if (errors.length) throw new Error(errors.slice(0, 5).join('; '));
}

export function validateGeneratedHtml(html: string) {
  const lower = html.toLowerCase();
  const errors: string[] = [];
  if (!lower.includes('data-composition-id="main"') && !lower.includes("data-composition-id='main'")) errors.push('missing data-composition-id="main"');
  if (!lower.includes('window.__hf')) errors.push('missing window.__hf seek bridge');
  if (!lower.includes('window.__timelines')) errors.push('missing window.__timelines registration');
  if (!lower.includes('gsap')) errors.push('missing GSAP timeline');
  const blocked = ['fetch(', 'xmlhttprequest', 'websocket', 'eventsource', 'localstorage', 'sessionstorage', 'document.cookie', 'navigator.sendbeacon', '<iframe', '<object', '<embed', '<form', 'import(', 'eval(', 'new function'];
  for (const token of blocked) if (lower.includes(token)) errors.push(`blocked token: ${token}`);
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  for (const src of scripts) {
    if (!/^https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@/.test(src)) errors.push(`external script not allowed: ${src}`);
  }
  try { validateNoReadableTextOverlap(html); }
  catch (err) { errors.push(err instanceof Error ? err.message : String(err)); }
  if (errors.length) throw new Error(errors.join('; '));
}


function resolveDesignSystem(req: DraftRequest | ArticleAnalysisRequest) {
  return req.designSystem || stylePresetToDesignSystem(req.stylePreset);
}

function designSystemPromptBlock(req: DraftRequest | ArticleAnalysisRequest) {
  const design = resolveDesignSystem(req);
  const designLock = 'designLocked' in req ? req.designLocked !== false : true;
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

function systemPrompt(req: DraftRequest) {
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

function userPrompt(req: DraftRequest) {
  const parts = [
    `Concept: ${req.conceptText}`,
    req.articleContext ? `Article context: ${req.articleContext}` : '',
    req.currentHtml ? `Existing HTML to revise:\n${req.currentHtml.slice(0, 90000)}` : '',
    req.changePrompt ? `Requested changes: ${req.changePrompt}` : 'Create the first draft. Interpret the concept first, then produce matching HTML.'
  ].filter(Boolean);
  return parts.join('\n\n');
}

function articleSystemPrompt(req: ArticleAnalysisRequest) {
  return `You are an editorial visualization director for an article animation tool.
Return ONLY valid JSON with: title, summary, spots.
Pick the ${req.maxSpots || 5} best places in the article where animation would genuinely improve understanding.

Rules:
- Return 3 to ${req.maxSpots || 5} spots.
- Each spot must be grounded in the article; no generic ideas.
- Prefer mechanisms, transformations, stacks, timelines, feedback loops, comparisons, networks, and counterintuitive shifts.
- Use zero-based insertAfterParagraph based on paragraphs split by blank lines.
- anchorText must be an exact or near-exact quote from the article.
- conceptText must be self-contained; it will be sent to a second model that creates one animation.
- grammar must be one of: sequence, loop, comparison, stack, transformation, network, timeline, metaphor.
- aspectPreset should usually be articleBanner; use wideBanner for big systems, square for compact/social visuals.
- durationSeconds should be 5-8 for most article GIFs.

${designSystemPromptBlock(req)}`;
}

function articleUserPrompt(req: ArticleAnalysisRequest) {
  return `Article:\n${req.articleText.slice(0, 80000)}\n\nReturn JSON only.`;
}

function parseJsonLoose(text: string) {
  try { return JSON.parse(text); } catch (err) {
    try { return JSON.parse(jsonrepair(text)); } catch {}
    throw err;
  }
}

export function extractJson(text: string) {
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
  throw new Error('Model did not return JSON');
}

function decodeBase64Utf8(value: string) {
  const clean = value.replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function normalizeGeneratedDraft(raw: unknown) {
  const value = Array.isArray(raw) ? raw.find(item => item && typeof item === 'object' && 'generatedHtml' in item) || raw[0] : raw;
  const candidate = value as Partial<RawGeneratedGraphic>;
  const generatedHtml = typeof candidate.generatedHtmlBase64 === 'string' && candidate.generatedHtmlBase64.trim()
    ? decodeBase64Utf8(candidate.generatedHtmlBase64)
    : candidate.generatedHtml;
  return GeneratedGraphicSchema.parse({
    interpretation: candidate.interpretation,
    grammar: candidate.grammar,
    generatedHtml,
    notes: Array.isArray(candidate.notes) ? candidate.notes : (candidate.notes ? [String(candidate.notes)] : [])
  });
}

export function normalizeArticlePlan(raw: unknown) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const candidate = value as any;
  return ArticleVisualizationPlanSchema.parse({
    title: candidate?.title || '',
    summary: candidate?.summary,
    spots: Array.isArray(candidate?.spots) ? candidate.spots.map((spot: any, i: number) => ({
      id: spot.id || `spot-${i + 1}`,
      priority: Number(spot.priority || i + 1),
      anchorText: spot.anchorText || spot.anchor || spot.quote || spot.excerpt || `Article paragraph ${i + 1} selected for visualization`,
      insertAfterParagraph: Number(spot.insertAfterParagraph ?? spot.paragraphIndex ?? i),
      articleExcerpt: spot.articleExcerpt || spot.excerpt || spot.anchorText || spot.quote || `Article section ${i + 1} contains a visualizable idea.`,
      visualIdea: spot.visualIdea || spot.visualizationIdea || spot.idea || spot.title || spot.conceptText || `Visualize article idea ${i + 1}.`,
      conceptText: spot.conceptText || spot.visualIdea || spot.visualizationIdea || spot.idea || `Visualize article idea ${i + 1}.`,
      grammar: spot.grammar || 'metaphor',
      aspectPreset: spot.aspectPreset || 'articleBanner',
      durationSeconds: Number(spot.durationSeconds || 7),
      rationale: spot.rationale || spot.why || spot.reason || 'This article section benefits from animation because it contains a mechanism, transformation, comparison, or relationship that is easier to understand visually.',
      captionSuggestion: spot.captionSuggestion || spot.caption || ''
    })) : []
  });
}

export async function generateGraphicDraft(req: DraftRequest, env: AiEnv, byokKey: string | null) {
  const provider = (req.provider || 'gemini').toLowerCase();
  let attemptReq = req;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const content = provider.includes('gemini') || provider.includes('google')
        ? await callGemini(attemptReq, env, byokKey)
        : await callOpenRouter(attemptReq, env, byokKey);
      const parsed = normalizeGeneratedDraft(extractJson(content));
      validateGeneratedHtml(parsed.generatedHtml);
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt >= 2) break;
      attemptReq = {
        ...req,
        currentHtml: '',
        changePrompt: `The previous generated HTML failed validation: ${err instanceof Error ? err.message : String(err)}. Regenerate from scratch. Keep the same concept, but lay out all readable labels/details with at least 24px spacing and no overlapping bounding boxes. Return only valid JSON with corrected generatedHtml.`
      };
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function generateArticlePlan(req: ArticleAnalysisRequest, env: AiEnv, byokKey: string | null) {
  const provider = (req.provider || 'gemini').toLowerCase();
  const content = provider.includes('gemini') || provider.includes('google')
    ? await callGeminiArticle(req, env, byokKey)
    : await callOpenRouterArticle(req, env, byokKey);
  return normalizeArticlePlan(extractJson(content));
}

async function callOpenRouter(req: DraftRequest, env: AiEnv, byokKey: string | null) {
  const apiKey = req.authMode === 'byok' ? byokKey : env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error(req.authMode === 'byok' ? 'Missing BYOK API key' : 'Server OpenRouter key is not configured; use BYOK or set OPENROUTER_API_KEY');
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://animated-graphics-lab.pages.dev',
      'X-Title': 'Animated Graphics Lab'
    },
    body: JSON.stringify({
      model: req.model || 'qwen/qwen3-coder:free',
      temperature: 0.55,
      max_tokens: 7000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt(req) },
        { role: 'user', content: userPrompt(req) }
      ]
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`OpenRouter request failed: ${res.status} ${bodyText.slice(0, 600)}`);
  const body = JSON.parse(bodyText);
  const content = body?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no content');
  return content;
}

async function callGemini(req: DraftRequest, env: AiEnv, byokKey: string | null) {
  const apiKey = req.authMode === 'byok' ? byokKey : env.GEMINI_API_KEY;
  if (!apiKey) throw new Error(req.authMode === 'byok' ? 'Missing BYOK Gemini API key' : 'Server Gemini key is not configured; use BYOK or set GEMINI_API_KEY');
  const model = req.model || 'gemini-2.5-flash';
  const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: 12000,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            interpretation: { type: 'string' },
            grammar: { type: 'string', enum: ['sequence','loop','comparison','stack','transformation','network','timeline','metaphor'] },
            generatedHtml: { type: 'string' },
            notes: { type: 'array', items: { type: 'string' } }
          },
          required: ['interpretation','grammar','generatedHtml','notes']
        }
      },
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt(req)}\n\nReturn valid JSON only. Escape every newline and quote inside generatedHtml as JSON requires.\n\n${userPrompt(req)}` }] }]
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${bodyText.slice(0, 600)}`);
  const body = JSON.parse(bodyText);
  const content = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('');
  if (!content) throw new Error('Gemini returned no content');
  return content;
}


async function callOpenRouterArticle(req: ArticleAnalysisRequest, env: AiEnv, byokKey: string | null) {
  const apiKey = req.authMode === 'byok' ? byokKey : env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error(req.authMode === 'byok' ? 'Missing BYOK API key' : 'Server OpenRouter key is not configured; use BYOK or set OPENROUTER_API_KEY');
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://animated-graphics-lab.pages.dev',
      'X-Title': 'Animated Graphics Lab'
    },
    body: JSON.stringify({
      model: req.model || 'qwen/qwen3-coder:free',
      temperature: 0.35,
      max_tokens: 5000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: articleSystemPrompt(req) },
        { role: 'user', content: articleUserPrompt(req) }
      ]
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`OpenRouter article request failed: ${res.status} ${bodyText.slice(0, 600)}`);
  const body = JSON.parse(bodyText);
  const content = body?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned no article plan content');
  return content;
}

async function callGeminiArticle(req: ArticleAnalysisRequest, env: AiEnv, byokKey: string | null) {
  const apiKey = req.authMode === 'byok' ? byokKey : env.GEMINI_API_KEY;
  if (!apiKey) throw new Error(req.authMode === 'byok' ? 'Missing BYOK Gemini API key' : 'Server Gemini key is not configured; use BYOK or set GEMINI_API_KEY');
  const model = req.model || 'gemini-2.5-flash';
  const res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      generationConfig: { temperature: 0.35, maxOutputTokens: 9000, responseMimeType: 'application/json' },
      contents: [{ role: 'user', parts: [{ text: `${articleSystemPrompt(req)}\n\n${articleUserPrompt(req)}` }] }]
    })
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`Gemini article request failed: ${res.status} ${bodyText.slice(0, 600)}`);
  const body = JSON.parse(bodyText);
  const content = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('');
  if (!content) throw new Error('Gemini returned no article plan content');
  return content;
}
