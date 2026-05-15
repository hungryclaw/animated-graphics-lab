#!/usr/bin/env node
import { loadConfig } from './config.mjs';
import { parseArgs } from './args.mjs';
import { doctor } from './doctor.mjs';
import { renderSmoke } from './render-local.mjs';
import { runAutonomous } from './run-autonomous.mjs';
import { renderBundle } from './render-bundle.mjs';
import { runCommand } from './commands.mjs';

async function main() {
  const [command = 'help', ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const config = await loadConfig(process.cwd());

  if (command === 'run') return runAutonomous(args, config);
  if (command === 'render-bundle') return renderBundle(args, config);
  if (command === 'doctor') return doctor({ target: args.target || 'mac', requireAgent: Boolean(args['require-agent']) });
  if (command === 'render-test') {
    const dryRun = args['dry-run'] === true || args['dry-run'] === 'true';
    const result = await renderSmoke({ outDir: args.out || '.agl/runs/render-smoke', dryRun });
    console.log('Render smoke output:');
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'codex-check') {
    console.log('Checking local Codex subscription access. Credentials stay on this device.');
    try {
      const version = await runCommand('codex', ['--version']);
      console.log(`ok   codex --version: ${version.stdout.trim() || version.stderr.trim()}`);
      if (args.prompt) {
        const probe = await runCommand('codex', ['exec', '--json', 'Reply with exactly: OK'], { timeout: 60000 });
        console.log(probe.stdout.trim() || probe.stderr.trim());
      } else {
        console.log('skip prompt probe; pass --prompt to test codex exec --json.');
      }
    } catch (err) {
      console.error('Codex check failed. Install/login locally, or use Hermes/custom adapter in .agl/config.local.json.');
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    }
    return;
  }
  if (command === 'examples') {
    console.log(`Examples:\n\n  npm run agl:run -- --input examples/articles/directive-demo.md --no-render --out .agl/runs/demo-no-render\n  npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --generate-drafts --dry-render\n  npm run agl:run -- --topic "Why memory-backed agents compound" --write-article --agent codex --render\n  npm run agl:render-bundle -- --bundle /path/to/unzipped-agl-render-bundle --dry-run\n  npm run agl:doctor:mac\n  npm run agl:render:test -- --dry-run`);
    return;
  }

  console.log(`Animated Graphics Lab local runner\n\nCommands:\n  run\n  render-bundle\n  doctor\n  codex-check\n  render-test\n  examples\n\nRun: npm run agl:examples`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
