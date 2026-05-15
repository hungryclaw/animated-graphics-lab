import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_CONFIG = {
  agent: { kind: 'hermes', command: 'hermes', args: ['chat', '-q', '{prompt}', '--provider', 'openai-codex', '--model', 'gpt-5.5', '--quiet'], model: 'gpt-5.5' },
  render: { engine: 'hyperframes', poweredBy: 'HyperFrames from HeyGen', fps: 30, gifFps: 15, gifWidth: 1440, workers: 2 },
  output: { root: '.agl/runs' }
};

export async function loadConfig(cwd = process.cwd()) {
  const configPath = path.join(cwd, '.agl/config.local.json');
  try {
    const raw = await readFile(configPath, 'utf8');
    const user = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...user,
      agent: { ...DEFAULT_CONFIG.agent, ...(user.agent || {}) },
      render: { ...DEFAULT_CONFIG.render, ...(user.render || {}) },
      output: { ...DEFAULT_CONFIG.output, ...(user.output || {}) },
      configPath
    };
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
    return { ...DEFAULT_CONFIG, configPath: null };
  }
}

export function configureAgentEnvironment(agent) {
  if (!agent || agent.kind === 'none') return;
  process.env.AGL_AGENT_COMMAND = agent.command;
  if (Array.isArray(agent.args)) process.env.AGL_AGENT_ARGS_JSON = JSON.stringify(agent.args);
  if (agent.provider) process.env.AGL_AGENT_PROVIDER = agent.provider;
  if (agent.model) process.env.AGL_AGENT_MODEL = agent.model;
}
