import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArticlePlan } from '../src/article-analyzer.mjs';

test('normalizeArticlePlan accepts 3 grounded spots and normalizes grammar', () => {
  const plan = normalizeArticlePlan({
    title: 'Agentic Articles',
    summary: 'The article explains how agent workflows turn rough ideas into visual outputs.',
    spots: [1, 2, 3].map((n) => ({
      id: `spot-${n}`,
      priority: n,
      anchorText: 'The article describes a concrete transformation from input into output.',
      insertAfterParagraph: n,
      articleExcerpt: 'The article describes a concrete transformation from input into output with tools and feedback.',
      visualIdea: 'Show a rough input becoming a visualized output through a capability stack.',
      conceptText: 'A rough article input transforms through an agent capability stack into a visualized output.',
      grammar: n === 1 ? 'transformation + capability stack' : 'sequence',
      rationale: 'This moment benefits from animation because the mechanism is easier to understand visually.'
    }))
  });
  assert.equal(plan.spots.length, 3);
  assert.equal(plan.spots[0].grammar, 'transformation');
});
