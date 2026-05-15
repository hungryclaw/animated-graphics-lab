#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const requiredFiles = ['apps/worker/.dev.vars', 'apps/web/.env.local', '.env.render-worker.local'];
const missing = requiredFiles.filter(file => !existsSync(file));
if (missing.length) {
  console.error(`Missing local env files: ${missing.join(', ')}`);
  console.error('Run: npm run setup:local');
  process.exit(1);
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitForHealth(url, timeoutMs = 45000) {
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      const body = await res.json();
      if (res.ok && body.ok) return body;
      lastError = `${res.status} ${JSON.stringify(body)}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await wait(1000);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

console.log('Starting local API smoke test...');
const child = spawn('npm', ['run', 'dev:api'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, FORCE_COLOR: '0' } });
let output = '';
child.stdout.on('data', chunk => { output += chunk.toString(); });
child.stderr.on('data', chunk => { output += chunk.toString(); });

try {
  const health = await waitForHealth('http://localhost:8787/api/health');
  console.log(`✓ local API health ok (${health.service})`);
  process.exitCode = 0;
} catch (err) {
  console.error(`✗ smoke test failed: ${err instanceof Error ? err.message : String(err)}`);
  console.error(output.split('\n').slice(-30).join('\n'));
  process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
  setTimeout(() => process.exit(process.exitCode || 0), 250);
}
