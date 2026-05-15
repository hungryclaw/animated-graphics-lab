#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, '.agl');
mkdirSync(outDir, { recursive: true });

const instructions = readFileSync(join(root, 'docs/agent-instruction-pack.md'), 'utf8');
writeFileSync(join(outDir, 'agent-instructions.md'), instructions);
writeFileSync(join(outDir, 'example-article-prompt.md'), `Read .agl/agent-instructions.md first.\n\nThen write a 900-word article about: memory-backed agents vs stateless agents.\n\nUse 2-3 AGL_GRAPHIC directives where visuals would clarify a mechanism. Return normal Markdown plus the AGL_GRAPHIC comments. Do not generate images or HTML files.\n`);

console.log('Created .agl/agent-instructions.md');
console.log('Created .agl/example-article-prompt.md');
console.log('\nNext steps:');
console.log('  hermes chat -f .agl/example-article-prompt.md');
console.log('or pass .agl/agent-instructions.md as project context to your preferred agent.');
