import os from 'node:os';
import { commandExists, runCommand } from './commands.mjs';

async function check(label, fn, hint = '') {
  try {
    const detail = await fn();
    console.log(`ok   ${label}${detail ? ` — ${detail}` : ''}`);
    return { label, ok: true };
  } catch (err) {
    console.log(`fail ${label}${hint ? ` — ${hint}` : ''}`);
    return { label, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function doctor({ target = 'mac', requireAgent = false } = {}) {
  console.log(`Animated Graphics Lab local doctor (${target})`);
  console.log(`Platform: ${os.platform()} ${os.arch()} ${os.release()}`);
  const results = [];
  results.push(await check('Node 20+', async () => {
    const major = Number(process.versions.node.split('.')[0]);
    if (major < 20) throw new Error(`Node ${process.versions.node}`);
    return process.versions.node;
  }, 'install with: brew install node'));
  results.push(await check('npm', async () => (await runCommand('npm', ['--version'])).stdout.trim()));
  results.push(await check('ffmpeg', async () => (await runCommand('ffmpeg', ['-version'])).stdout.split('\n')[0], 'install with: brew install ffmpeg'));
  results.push(await check('ffprobe', async () => (await runCommand('ffprobe', ['-version'])).stdout.split('\n')[0], 'install with: brew install ffmpeg'));
  results.push(await check('HyperFrames from HeyGen CLI', async () => {
    await runCommand('npx', ['--yes', 'hyperframes', '--help'], { timeout: 60000 });
    return 'npx --yes hyperframes --help works';
  }));
  const hasCodex = await commandExists('codex', ['--version']);
  const hasHermes = await commandExists('hermes', ['--version']);
  if (hasCodex) console.log('ok   Codex CLI — subscription auth stays local on this device');
  else console.log('warn Codex CLI — not found; use Hermes adapter or install/login locally');
  if (hasHermes) console.log('ok   Hermes CLI — available as Codex-provider adapter');
  else console.log('warn Hermes CLI — not found; optional if Codex CLI is installed');
  if (requireAgent && !hasCodex && !hasHermes) results.push({ label: 'agent', ok: false });
  const failures = results.filter(r => !r.ok).length;
  console.log(`
Doctor result: ${failures} failure(s).`);
  if (failures) process.exitCode = 1;
}
