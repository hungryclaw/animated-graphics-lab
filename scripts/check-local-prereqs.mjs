#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const agentArg = process.argv.slice(2).find(arg => arg.startsWith('--agent='))?.split('=')[1];
const deep = args.has('--deep');
const requireAgent = args.has('--require-agent');
let failures = 0;
let warnings = 0;

function run(command, commandArgs = [], options = {}) {
  return spawnSync(command, commandArgs, { encoding: 'utf8', timeout: options.timeout || 20000, shell: false });
}

function versionLine(result) {
  return String(result.stdout || result.stderr || '').split('\n').find(Boolean)?.trim() || '';
}

function pass(label, detail = '') { console.log(`✓ ${label}${detail ? ` — ${detail}` : ''}`); }
function fail(label, hint) { failures += 1; console.log(`✗ ${label}`); if (hint) console.log(`  ${hint}`); }
function warn(label, hint) { warnings += 1; console.log(`! ${label}`); if (hint) console.log(`  ${hint}`); }

const node = run('node', ['--version']);
if (node.status === 0) {
  const v = versionLine(node);
  const major = Number(v.replace(/^v/, '').split('.')[0]);
  if (major >= 20) pass('Node.js', v);
  else fail('Node.js 20+ required', `Found ${v}. Install Node.js 20 or newer.`);
} else fail('Node.js not found', 'Install Node.js 20+ from https://nodejs.org/');

const npm = run('npm', ['--version']);
if (npm.status === 0) pass('npm', versionLine(npm));
else fail('npm not found', 'Install npm with Node.js.');

const ffmpeg = run('ffmpeg', ['-version']);
if (ffmpeg.status === 0) pass('ffmpeg', versionLine(ffmpeg));
else fail('ffmpeg not found', 'macOS: brew install ffmpeg | Debian/Ubuntu: sudo apt-get install -y ffmpeg');

const ffprobe = run('ffprobe', ['-version']);
if (ffprobe.status === 0) pass('ffprobe', versionLine(ffprobe));
else fail('ffprobe not found', 'ffprobe is included with ffmpeg.');

const wrangler = run('npx', ['wrangler', '--version'], { timeout: 30000 });
if (wrangler.status === 0) pass('Wrangler', versionLine(wrangler));
else fail('Wrangler check failed', 'Run npm install, then retry npm run check:local.');

const hyperframes = run('npx', ['--yes', 'hyperframes', '--help'], { timeout: 45000 });
if (hyperframes.status === 0) pass('HyperFrames', 'npx hyperframes is available');
else fail('HyperFrames check failed', 'Try: npx --yes hyperframes --help');

const agentCommand = process.env.AGL_AGENT_COMMAND || (agentArg === 'codex' ? 'codex' : 'hermes');
if (deep && agentCommand === 'hermes') {
  const hermes = run('hermes', ['chat', '-q', 'Reply with exactly: OK', '--quiet'], { timeout: 60000 });
  if (hermes.status === 0) pass('Hermes deep check', versionLine(hermes) || 'OK');
  else (requireAgent ? fail : warn)('Hermes deep check failed', 'Run hermes setup, or configure AGL_AGENT_COMMAND for another CLI.');
} else {
  const agent = run(agentCommand, ['--version'], { timeout: 15000 });
  if (agent.status === 0) pass(`Agent command (${agentCommand})`, versionLine(agent));
  else (requireAgent ? fail : warn)(`Agent command (${agentCommand}) not verified`, 'This is OK for BYOK-only demos. For master mode, install Hermes or set AGL_AGENT_COMMAND/AGL_AGENT_ARGS_JSON. Use --deep for a Hermes chat check.');
}

console.log(`\nLocal prerequisite check complete: ${failures} failure(s), ${warnings} warning(s).`);
process.exit(failures ? 1 : 0);
