import type { ReactNode } from 'react';

type Props = {
  markdown: string;
  className?: string;
  insertAfterParagraph?: Record<number, ReactNode[]>;
};

type Block = { type: 'h1'|'h2'|'h3'|'p'|'ul'|'ol'|'blockquote'|'code'; text?: string; items?: string[] };

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

function inlineParts(text: string) {
  const parts: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a>);
    else if (match[3]) parts.push(<code key={match.index}>{match[3]}</code>);
    else if (match[4]) parts.push(<strong key={match.index}>{match[4]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function markdownTitle(markdown: string) {
  const clean = stripFrontmatter(markdown);
  return clean.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Untitled article';
}

function parseBlocks(markdown: string): Block[] {
  const clean = stripFrontmatter(markdown);
  const chunks = clean.split(/\n\s*\n/g).map(chunk => chunk.trim()).filter(Boolean);
  const blocks: Block[] = [];
  for (const chunk of chunks) {
    if (chunk.startsWith('```')) {
      blocks.push({ type: 'code', text: chunk.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim() });
    } else if (/^#\s+/.test(chunk)) blocks.push({ type: 'h1', text: chunk.replace(/^#\s+/, '') });
    else if (/^##\s+/.test(chunk)) blocks.push({ type: 'h2', text: chunk.replace(/^##\s+/, '') });
    else if (/^###\s+/.test(chunk)) blocks.push({ type: 'h3', text: chunk.replace(/^###\s+/, '') });
    else if (/^>\s*/.test(chunk)) blocks.push({ type: 'blockquote', text: chunk.replace(/^>\s*/gm, '') });
    else if (/^(?:- |\* )/m.test(chunk)) blocks.push({ type: 'ul', items: chunk.split(/\n/).map(line => line.replace(/^(?:- |\* )/, '').trim()).filter(Boolean) });
    else if (/^\d+\.\s+/m.test(chunk)) blocks.push({ type: 'ol', items: chunk.split(/\n/).map(line => line.replace(/^\d+\.\s+/, '').trim()).filter(Boolean) });
    else blocks.push({ type: 'p', text: chunk.replace(/\n/g, ' ') });
  }
  return blocks;
}

export function ArticleMarkdownPreview({ markdown, className = '', insertAfterParagraph = {} }: Props) {
  const blocks = parseBlocks(markdown);
  let paragraphIndex = -1;
  return <article className={`article-markdown-preview ${className}`.trim()}>
    {blocks.map((block, index) => {
      const inserts: React.ReactNode[] = [];
      if (block.type === 'p' || block.type === 'blockquote' || block.type === 'ul' || block.type === 'ol') {
        paragraphIndex += 1;
        inserts.push(...(insertAfterParagraph[paragraphIndex] || []));
      }
      const rendered = (() => {
        if (block.type === 'h1') return <h1>{inlineParts(block.text || '')}</h1>;
        if (block.type === 'h2') return <h2>{inlineParts(block.text || '')}</h2>;
        if (block.type === 'h3') return <h3>{inlineParts(block.text || '')}</h3>;
        if (block.type === 'blockquote') return <blockquote>{inlineParts(block.text || '')}</blockquote>;
        if (block.type === 'code') return <pre><code>{block.text}</code></pre>;
        if (block.type === 'ul') return <ul>{block.items?.map((item, i) => <li key={i}>{inlineParts(item)}</li>)}</ul>;
        if (block.type === 'ol') return <ol>{block.items?.map((item, i) => <li key={i}>{inlineParts(item)}</li>)}</ol>;
        return <p>{inlineParts(block.text || '')}</p>;
      })();
      return <div className="article-preview-block" key={index}>{rendered}{inserts}</div>;
    })}
  </article>;
}
