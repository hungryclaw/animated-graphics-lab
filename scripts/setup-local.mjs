#!/usr/bin/env node
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const force = args.has('--force');
const saveKeys = args.has('--save-keys');
const agentArg = rawArgs.find(arg => arg.startsWith('--agent='))?.split('=')[1]
  || (args.has('--codex') ? 'codex' : args.has('--hermes') ? 'hermes' : args.has('--custom') ? 'custom' : 'hermes');
const root = process.cwd();

function token(name) { return `agl_${name}_local_${randomBytes(24).toString('hex')}`; }
function hash(raw, pepper) { return createHash('sha256').update(`${pepper}${raw}`).digest('hex'); }
function agentSettings(kind) {
  if (kind === 'codex') {
    return {
      env: `AGL_AGENT_COMMAND=codex\nAGL_AGENT_ARGS_JSON=["exec","--json","{prompt}"]\nAGL_AGENT_PROVIDER=local-codex\nAGL_AGENT_MODEL=local-codex-subscription\n`,
      config: {
        agent: { kind: 'codex', command: 'codex', args: ['exec', '--json', '{prompt}'], model: 'local-codex-subscription' }
      }
    };
  }
  if (kind === 'custom') {
    const command = process.env.AGL_AGENT_COMMAND || '/path/to/my-agent';
    let parsedArgs = ['--prompt', '{prompt}', '--json'];
    if (process.env.AGL_AGENT_ARGS_JSON) {
      try { parsedArgs = JSON.parse(process.env.AGL_AGENT_ARGS_JSON); } catch {}
    }
    return {
      env: `AGL_AGENT_COMMAND=${command}\nAGL_AGENT_ARGS_JSON=${JSON.stringify(parsedArgs)}\nAGL_AGENT_PROVIDER=custom\nAGL_AGENT_MODEL=${process.env.AGL_AGENT_MODEL || 'custom-local-agent'}\n`,
      config: {
        agent: { kind: 'custom', command, args: parsedArgs, model: process.env.AGL_AGENT_MODEL || 'custom-local-agent' }
      }
    };
  }
  return {
    env: `AGL_AGENT_COMMAND=${process.env.AGL_AGENT_COMMAND || 'hermes'}\nAGL_AGENT_PROVIDER=${process.env.AGL_AGENT_PROVIDER || 'openai-codex'}\nAGL_AGENT_MODEL=${process.env.AGL_AGENT_MODEL || 'gpt-5.5'}\n`,
    config: {
      agent: {
        kind: 'hermes',
        command: process.env.AGL_AGENT_COMMAND || 'hermes',
        args: ['chat', '-q', '{prompt}', '--provider', process.env.AGL_AGENT_PROVIDER || 'openai-codex', '--model', process.env.AGL_AGENT_MODEL || 'gpt-5.5', '--quiet'],
        model: process.env.AGL_AGENT_MODEL || 'gpt-5.5'
      }
    }
  };
}

function localRunnerConfig(agentConfig) {
  return JSON.stringify({
    ...agentConfig,
    render: { engine: 'hyperframes', poweredBy: 'HyperFrames from HeyGen', fps: 30, gifFps: 15, gifWidth: 1440, workers: 2 },
    output: { root: '.agl/runs' }
  }, null, 2) + '\n';
}

function writeSafe(rel, content) {
  const path = join(root, rel);
  if (existsSync(path) && !force) throw new Error(`${rel} already exists. Re-run with --force to overwrite.`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { mode: 0o600 });
  console.log(`Created ${rel}`);
}

const MASTER_SUBMITTER_KEY = token('master');
const RENDER_WORKER_TOKEN = token('worker');
const ADMIN_KEY = token('admin');
const TOKEN_PEPPER = token('pepper');

const MASTER_SUBMITTER_KEY_HASH = hash(MASTER_SUBMITTER_KEY, TOKEN_PEPPER);
const RENDER_WORKER_TOKEN_HASH = hash(RENDER_WORKER_TOKEN, TOKEN_PEPPER);
const ADMIN_KEY_HASH = hash(ADMIN_KEY, TOKEN_PEPPER);

const agent = agentSettings(agentArg);

writeSafe('apps/worker/.dev.vars', `TOKEN_PEPPER=${TOKEN_PEPPER}\nMASTER_SUBMITTER_KEY_HASH=${MASTER_SUBMITTER_KEY_HASH}\nRENDER_WORKER_TOKEN_HASH=${RENDER_WORKER_TOKEN_HASH}\nADMIN_KEY_HASH=${ADMIN_KEY_HASH}\nAPP_ORIGIN=http://localhost:5173\n`);
writeSafe('apps/web/.env.local', 'VITE_API_BASE=http://localhost:8787\n');
writeSafe('.env.render-worker.local', `AGL_API_BASE=http://localhost:8787\nAGL_RENDER_WORKER_TOKEN=${RENDER_WORKER_TOKEN}\nAGL_WORKER_ID=local-agent-worker\nAGL_JOBS_ROOT=${join(root, '.agl/jobs')}\nAGL_POLL_MS=2500\n${agent.env}`);
writeSafe('.agl/config.local.json', localRunnerConfig(agent.config));

if (saveKeys) {
  writeSafe('.agl/local-keys.txt', `MASTER_SUBMITTER_KEY=${MASTER_SUBMITTER_KEY}\nRENDER_WORKER_TOKEN=${RENDER_WORKER_TOKEN}\nADMIN_KEY=${ADMIN_KEY}\nTOKEN_PEPPER=${TOKEN_PEPPER}\n`);
}

console.log('\nPaste this into the UI Access settings:');
console.log(`MASTER_SUBMITTER_KEY=${MASTER_SUBMITTER_KEY}`);
console.log('\nKeep it private. It is printed once unless you re-run setup.');
