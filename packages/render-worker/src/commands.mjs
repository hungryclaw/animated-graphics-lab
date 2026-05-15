import { spawn } from 'node:child_process';
export function run(cmd, args, opts={}) { return new Promise((resolve, reject) => { const child = spawn(cmd, args, { ...opts, shell: false }); let stdout='', stderr=''; child.stdout?.on('data', d => stdout += d); child.stderr?.on('data', d => stderr += d); child.on('error', reject); child.on('close', code => code === 0 ? resolve({stdout, stderr}) : reject(new Error(`${cmd} ${args.join(' ')} failed (${code})
${stdout}
${stderr}`))); }); }
