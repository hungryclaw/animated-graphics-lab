import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2).filter(arg => arg !== '--runInBand');
const defaultTests = ['src/lib/resume-state.test.ts', 'src/lib/graphic-directives.test.ts', 'src/lib/article-export.test.ts', 'src/lib/gif-downloads.test.ts', 'src/lib/render-bundle-download.test.ts', 'src/lib/current-result-view.test.ts', 'src/data/demo-fixtures.test.ts'];
const explicitTests = args.some(arg => /\.test\.tsx?$/.test(arg));
const result = spawnSync('npx', ['vitest', 'run', ...(explicitTests ? [] : defaultTests), ...args], {
  cwd: new URL('../apps/web/', import.meta.url),
  stdio: 'inherit',
  shell: false
});
process.exit(result.status ?? 1);
