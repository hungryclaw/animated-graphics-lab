import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

export function agentCommandForPrompt(agent, prompt) {
  const kind = agent?.kind || 'hermes';
  if (kind === 'codex') {
    return { command: agent.command || 'codex', args: (agent.args || ['exec', '--json', '{prompt}']).map(arg => arg.replaceAll('{prompt}', prompt)) };
  }
  if (kind === 'custom') {
    if (!agent.command || !Array.isArray(agent.args)) throw new Error('custom agent requires command and args in .agl/config.local.json');
    return { command: agent.command, args: agent.args.map(arg => arg.replaceAll('{prompt}', prompt)) };
  }
  return { command: agent?.command || 'hermes', args: (agent?.args || ['chat', '-q', '{prompt}', '--provider', 'openai-codex', '--model', 'gpt-5.5', '--quiet']).map(arg => arg.replaceAll('{prompt}', prompt)) };
}

export async function runAgentPrompt(agent, prompt, { timeout = 300000 } = {}) {
  const command = agentCommandForPrompt(agent, prompt);
  const { stdout, stderr } = await execFileAsync(command.command, command.args, { timeout, maxBuffer: 20 * 1024 * 1024 });
  return `${stdout || ''}
${stderr || ''}`.trim();
}
