import type { ArticleSpotState } from '../types';

export type GifDownload = { url: string; filename: string; spotId: string };

function slugify(value: string, fallback = 'animation') {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '');
  return slug || fallback;
}

export function gifDownloadFilename(articleTitle: string, spot: Pick<ArticleSpotState, 'id'|'priority'>) {
  const articleSlug = slugify(articleTitle, 'article');
  const spotSlug = slugify(spot.id, 'animation');
  const index = String(Math.max(0, spot.priority)).padStart(2, '0');
  return `${articleSlug}-${index}-${spotSlug}.gif`;
}

export function buildArticleGifDownloads(articleTitle: string, spots: ArticleSpotState[]): GifDownload[] {
  return spots
    .filter(spot => spot.accepted && spot.job?.status === 'done' && Boolean(spot.job.gifUrl))
    .sort((a, b) => a.insertAfterParagraph - b.insertAfterParagraph || a.priority - b.priority)
    .map(spot => ({
      url: spot.job!.gifUrl!,
      filename: gifDownloadFilename(articleTitle, spot),
      spotId: spot.id
    }));
}

function triggerAnchorDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadGif(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`GIF download failed: ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerAnchorDownload(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    triggerAnchorDownload(url, filename);
  }
}

export async function downloadGifBatch(downloads: GifDownload[], delayMs = 250) {
  for (const item of downloads) {
    await downloadGif(item.url, item.filename);
    if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
