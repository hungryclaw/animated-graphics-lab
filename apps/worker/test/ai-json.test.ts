import { describe, expect, it } from 'vitest';
import { extractJson } from '../src/ai';

describe('AI JSON extraction', () => {
  it('repairs model JSON with raw multiline HTML inside generatedHtml', () => {
    const malformed = `{
      "interpretation": "A simple transition",
      "grammar": "transformation",
      "generatedHtml": "<!doctype html>
<html><body><div class="stage" data-composition-id="main">Hi</div></body></html>",
      "notes": ["ok"]
    }`;

    const parsed = extractJson(malformed) as { generatedHtml: string };
    expect(parsed.generatedHtml).toContain('<!doctype html>');
    expect(parsed.generatedHtml).toContain('data-composition-id="main"');
  });
});
