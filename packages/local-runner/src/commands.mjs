import { spawn } from 'node:child_process';

export function runCommand(command, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false, ...opts });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', d => { stdout += d; if (opts.stream) process.stdout.write(d); });
    child.stderr?.on('data', d => { stderr += d; if (opts.stream) process.stderr.write(d); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ stdout, stderr, code }) : reject(new Error(`${command} ${args.join(' ')} failed (${code})
${stdout}
${stderr}`)));
  });
}

export async function commandExists(command, args = ['--version']) {
  try { await runCommand(command, args, { timeout: 15000 }); return true; }
  catch { return false; }
}
