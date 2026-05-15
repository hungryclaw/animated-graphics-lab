export { articleBaseName, buildArticleHtml, buildArticleMarkdown, splitArticleParagraphs } from '@agl/workflow-core';
export type { ExportSpot } from '@agl/workflow-core';

export function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
