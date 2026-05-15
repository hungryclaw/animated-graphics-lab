import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/args.mjs';

test('parseArgs handles values, booleans, and equals syntax', () => {
  const args = parseArgs(['--input', 'article.md', '--render', '--max-visuals=3']);
  assert.equal(args.input, 'article.md');
  assert.equal(args.render, true);
  assert.equal(args['max-visuals'], '3');
});
