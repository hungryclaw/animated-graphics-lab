#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import process from 'node:process';

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const renderEnv = { ...process.env, ...parseEnvFile('.env.render-worker.local') };

const children = [
  { name: 'api', args: ['run', 'dev:api'], env: process.env },
  { name: 'render', args: ['run', 'dev:render'], env: renderEnv },
  { name: 'web', args: ['run', 'dev:web'], env: process.env }
];

const running = new Map();
let shuttingDown = false;

console.log('Starting Animated Graphics Lab locally...');
console.log('  API:    http://localhost:8787');
console.log('  Web UI: http://localhost:5173');
console.log('  Render worker: .env.render-worker.local');
console.log('Press Ctrl+C to stop all local processes.\n');

for (const child of children) {
  const proc = spawn(npmCmd, child.args, { stdio: ['ignore', 'pipe', 'pipe'], env: child.env });
  running.set(child.name, proc);

  const prefix = `[${child.name}]`;
  proc.stdout.on('data', chunk => process.stdout.write(`${prefix} ${chunk}`));
  proc.stderr.on('data', chunk => process.stderr.write(`${prefix} ${chunk}`));
  proc.on('exit', (code, signal) => {
    running.delete(child.name);
    if (!shuttingDown) {
      console.error(`\n${prefix} exited with ${signal || code}. Stopping remaining local processes...`);
      shutdown(code || 1);
    }
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const proc of running.values()) {
    if (!proc.killed) proc.kill('SIGTERM');
  }
  setTimeout(() => {
    for (const proc of running.values()) {
      if (!proc.killed) proc.kill('SIGKILL');
    }
    process.exit(code);
  }, 1500).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
