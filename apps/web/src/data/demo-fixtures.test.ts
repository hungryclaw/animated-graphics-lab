import { describe, expect, it } from 'vitest';
import { demoArticles } from './demo-articles';
import { demoResults, demoArticleForResult } from './demo-results';

describe('Smartoolbox demo fixtures', () => {
  it('provides five unique markdown demo articles', () => {
    expect(demoArticles).toHaveLength(5);
    expect(new Set(demoArticles.map(article => article.id)).size).toBe(demoArticles.length);
    for (const article of demoArticles) {
      expect(article.source).toBe('smartoolbox');
      expect(article.sourceUrl).toMatch(/^https:\/\/smartoolbox\.com\/blog\//);
      expect(article.markdown).not.toMatch(/^---\n/);
      expect(article.markdown).not.toContain('demoArticleId:');
      expect(article.markdown).not.toContain('preferredStyle:');
      expect(article.markdown).toContain(`# ${article.title}`);
      expect(article.markdown.length).toBeGreaterThan(1200);
    }
  });

  it('keeps result fixtures connected to demo articles', () => {
    expect(demoResults).toHaveLength(5);
    for (const result of demoResults) {
      expect(demoArticleForResult(result)?.id).toBe(result.articleId);
      expect(result.animations.length).toBeGreaterThanOrEqual(2);
    }
  });
});
