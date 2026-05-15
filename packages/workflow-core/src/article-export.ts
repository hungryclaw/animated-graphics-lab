export function splitArticleParagraphs(articleText: string) {
  return articleText.split(/\n\s*\n/g).map(p => p.trim()).filter(Boolean);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'article';
}

import type { ExportSpot } from './types.js';

function spotCaption(spot: ExportSpot) {
  return spot.captionSuggestion || spot.visualIdea;
}

function htmlFigure(spot: ExportSpot) {
  const caption = spotCaption(spot);
  const media = spot.job?.gifUrl
    ? `<img src="${escapeHtml(spot.job.gifUrl)}" alt="${escapeHtml(caption)}">`
    : spot.job?.mp4Url
      ? `<video src="${escapeHtml(spot.job.mp4Url)}" autoplay muted loop playsinline controls></video>`
      : spot.draft?.generatedHtml
        ? `<details><summary>Animation source: ${escapeHtml(caption)}</summary><pre>${escapeHtml(spot.draft.generatedHtml)}</pre></details>`
        : `<div class="agl-pending-box">Animation pending: ${escapeHtml(spot.visualIdea)}</div>`;
  return `<figure class="agl-animation" id="${escapeHtml(spot.id)}">${media}${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
}

function markdownEmbed(spot: ExportSpot) {
  const caption = spotCaption(spot);
  if (spot.job?.gifUrl) return `![${caption}](${spot.job.gifUrl})`;
  if (spot.job?.mp4Url) return `<video src="${spot.job.mp4Url}" autoplay muted loop playsinline controls></video>`;
  return `<!-- AGL_GRAPHIC_PENDING\nid: ${spot.id}\ndescription: ${spot.visualIdea}\n-->`;
}

function replaceDirectiveRanges(articleText: string, spots: ExportSpot[], render: (spot: ExportSpot) => string) {
  const directiveSpots = spots
    .filter(s => s.directive)
    .sort((a, b) => (b.directive!.start - a.directive!.start));
  let out = articleText;
  for (const spot of directiveSpots) {
    const d = spot.directive!;
    out = `${out.slice(0, d.start)}\n\n${render(spot)}\n\n${out.slice(d.end)}`;
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function renderArticleBody(markdown: string, title: string) {
  const body: string[] = [];
  splitArticleParagraphs(markdown).forEach((paragraph, index) => {
    if (/^<figure class="agl-animation"/.test(paragraph)) {
      body.push(paragraph);
      return;
    }
    const isHeading = /^#{1,6}\s+/.test(paragraph);
    const headingText = paragraph.replace(/^#{1,6}\s+/, '');
    const duplicatesTitle = index === 0 && isHeading && headingText.trim().toLowerCase() === title.trim().toLowerCase();
    if (!duplicatesTitle) {
      if (isHeading) body.push(`<h2>${escapeHtml(headingText)}</h2>`);
      else body.push(`<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`);
    }
  });
  return body.join('\n');
}

function insertParagraphFallback(articleText: string, spots: ExportSpot[], render: (spot: ExportSpot) => string) {
  const paragraphs = splitArticleParagraphs(articleText);
  const accepted = spots.filter(s => !s.directive && (s.draft || s.job)).sort((a, b) => a.insertAfterParagraph - b.insertAfterParagraph);
  const byParagraph = new Map<number, ExportSpot[]>();
  for (const spot of accepted) {
    const key = Math.max(0, Math.min(paragraphs.length - 1, spot.insertAfterParagraph));
    byParagraph.set(key, [...(byParagraph.get(key) || []), spot]);
  }
  const out: string[] = [];
  paragraphs.forEach((paragraph, index) => {
    out.push(paragraph);
    for (const spot of byParagraph.get(index) || []) out.push(render(spot));
  });
  return out.join('\n\n');
}

export function buildArticleHtml(articleText: string, spots: ExportSpot[], title = 'Visualized article') {
  const withDirectiveEmbeds = replaceDirectiveRanges(articleText, spots.filter(s => s.directive), htmlFigure);
  const withFallbackEmbeds = insertParagraphFallback(withDirectiveEmbeds, spots, htmlFigure);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:Inter,system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 20px;line-height:1.7;color:#17171c}h1,h2{line-height:1.15}.agl-animation{margin:32px 0;padding:0;border:0;border-radius:0;background:transparent}.agl-animation img,.agl-animation video{width:100%;border-radius:0;display:block}.agl-animation figcaption{font-size:13px;color:#666;margin-top:10px;text-align:center}.agl-pending-box{padding:18px 0;color:#666;border-top:1px dashed #ccd1da;border-bottom:1px dashed #ccd1da}pre{white-space:pre-wrap;max-height:420px;overflow:auto;background:#111;color:#eee;padding:12px;border-radius:10px}</style></head><body><h1>${escapeHtml(title)}</h1>${renderArticleBody(withFallbackEmbeds, title)}<!-- Animations rendered locally with HyperFrames from HeyGen. --></body></html>`;
}

export function buildArticleMarkdown(articleText: string, spots: ExportSpot[]) {
  const withDirectiveEmbeds = replaceDirectiveRanges(articleText, spots.filter(s => s.directive), markdownEmbed);
  return insertParagraphFallback(withDirectiveEmbeds, spots, markdownEmbed);
}

export function articleBaseName(title: string) {
  return slug(title || 'visualized-article');
}
