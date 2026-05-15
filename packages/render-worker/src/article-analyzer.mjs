import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { jsonrepair } from 'jsonrepair';
import { ArticleVisualizationPlanSchema, stylePresetToDesignSystem } from '@agl/composition-schema';

const execFileAsync = promisify(execFile);

function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch (err) {
    try { return JSON.parse(jsonrepair(text)); } catch {}
    throw err;
  }
}

export function extractJson(text) {
  const trimmed = String(text || '').trim();
  if (trimmed.startsWith('{')) {
    try { return parseJsonLoose(trimmed); } catch {}
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced) return parseJsonLoose(fenced);
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return parseJsonLoose(trimmed.slice(first, last + 1));
  throw new Error('Agent did not return an article visualization JSON object');
}

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


function resolveDesignSystem(req) {
  return req.designSystem || stylePresetToDesignSystem(req.stylePreset);
}

function designSystemPromptBlock(req) {
  const design = resolveDesignSystem(req);
  return `Selected design system:
${JSON.stringify(design, null, 2)}

Design rules:
- Treat the selected design system as the source of truth for generated spot ideas.
- Prefer visual ideas and grammar choices that fit its motion personality, diagram density, and background policy.
- Respect composition.avoid and promptHints.`;
}

function systemPrompt(req) {
  return `You are an editorial visualization director for an article animation tool.
Return ONLY valid JSON with: title, summary, spots.
Pick the ${req.maxSpots || 5} best places in the article where animation would genuinely improve understanding.

Rules:
- Return 3 to ${req.maxSpots || 5} spots.
- Each spot must be grounded in the provided article; no generic ideas.
- Do not choose decorative intro/header spots unless the article's opening contains a mechanism worth visualizing.
- Prefer mechanisms, transformations, stacks, timelines, feedback loops, comparisons, networks, and counterintuitive shifts.
- Use zero-based insertAfterParagraph based on paragraphs split by blank lines. If unsure, use the closest paragraph index.
- anchorText must be an exact or near-exact quote from the article.
- conceptText must be self-contained; it will be sent to a second agent that creates one animation.
- grammar must be one of: sequence, loop, comparison, stack, transformation, network, timeline, metaphor.
- aspectPreset should usually be articleBanner; use wideBanner for big systems, square for compact/social visuals.
- durationSeconds should be 5-8 for most article GIFs.
- Keep captionSuggestion short or empty.

${designSystemPromptBlock(req)}`;
}

function userPrompt(req) {
  return `${systemPrompt(req)}\n\nArticle:\n${req.articleText.slice(0, 80000)}\n\nReturn JSON only.`;
}

export function normalizeArticlePlan(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const candidate = value || {};
  return ArticleVisualizationPlanSchema.parse({
    title: candidate.title || '',
    summary: candidate.summary,
    spots: Array.isArray(candidate.spots) ? candidate.spots.map((spot, i) => ({
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

export async function analyzeArticleWithAgent(req) {
  const prompt = userPrompt(req);
  const agent = agentCommand(prompt);
  const { stdout, stderr } = await execFileAsync(agent.command, agent.args, {
    maxBuffer: 20 * 1024 * 1024,
    timeout: Number(process.env.AGL_ARTICLE_ANALYSIS_TIMEOUT_MS || 300000)
  });
  const output = `${stdout || ''}\n${stderr || ''}`.trim();
  return normalizeArticlePlan(extractJson(output));
}
