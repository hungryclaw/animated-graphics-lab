import type { AglInputKind, AglRunManifest, AglRunMode, AglVisualManifest, AglVisualStatus, AglWorkflowStage } from './types.js';

function nowIso() { return new Date().toISOString(); }

export function createRunId(prefix = 'agl') {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${rand}`;
}

export function createRunManifest(input: {
  runId?: string;
  mode?: AglRunMode;
  inputKind: AglInputKind;
  inputPath?: string;
  title?: string;
  agentKind?: AglRunManifest['agent']['kind'];
  agentCommand?: string;
  model?: string;
  visuals?: AglVisualManifest[];
}): AglRunManifest {
  const timestamp = nowIso();
  return {
    runId: input.runId || createRunId(),
    mode: input.mode || 'autonomous-agent',
    stage: 'input_received',
    createdAt: timestamp,
    updatedAt: timestamp,
    input: { kind: input.inputKind, path: input.inputPath, title: input.title },
    agent: { kind: input.agentKind || 'none', command: input.agentCommand || '', model: input.model },
    render: { engine: 'hyperframes', poweredBy: 'HyperFrames from HeyGen', ffmpeg: true, fps: 30, gifFps: 15, gifWidth: 1440 },
    article: { inputPath: input.inputPath },
    visuals: input.visuals || [],
    status: 'running'
  };
}

export function setRunStage(manifest: AglRunManifest, stage: AglWorkflowStage): AglRunManifest {
  return { ...manifest, stage, updatedAt: nowIso(), status: stage === 'completed' ? 'completed' : stage === 'failed' ? 'failed' : manifest.status };
}

export function updateVisualStatus(manifest: AglRunManifest, visualId: string, patch: Omit<Partial<AglVisualManifest>, 'validation'> & { status?: AglVisualStatus; validation?: Partial<AglVisualManifest['validation']> }): AglRunManifest {
  const updated = manifest.visuals.map(visual => visual.id === visualId ? { ...visual, ...patch, validation: { ...visual.validation, ...(patch.validation || {}) } } : visual);
  return { ...manifest, visuals: updated, updatedAt: nowIso() };
}

export function validateManifest(manifest: AglRunManifest) {
  const errors: string[] = [];
  if (!manifest.runId) errors.push('runId is required');
  if (!manifest.createdAt || !manifest.updatedAt) errors.push('timestamps are required');
  if (manifest.render.engine !== 'hyperframes') errors.push('render.engine must be hyperframes');
  if (manifest.render.poweredBy !== 'HyperFrames from HeyGen') errors.push('render.poweredBy must be HyperFrames from HeyGen');
  const seen = new Set<string>();
  for (const visual of manifest.visuals) {
    if (!visual.id) errors.push('visual.id is required');
    if (seen.has(visual.id)) errors.push(`duplicate visual id: ${visual.id}`);
    seen.add(visual.id);
    if (!visual.status) errors.push(`visual ${visual.id} missing status`);
    if (!visual.validation) errors.push(`visual ${visual.id} missing validation`);
  }
  return { ok: errors.length === 0, errors };
}

export function visualFromSpot(spot: { id: string; visualIdea: string; captionSuggestion?: string; aspectPreset?: string; durationSeconds?: number; directive?: AglVisualManifest['directive'] }): AglVisualManifest {
  return {
    id: spot.id,
    status: 'planned',
    directive: spot.directive,
    aspectPreset: spot.aspectPreset,
    durationSeconds: spot.durationSeconds,
    visualIdea: spot.visualIdea,
    caption: spot.captionSuggestion || spot.visualIdea,
    validation: { htmlSafe: false, hyperframesLint: false, ffprobeOk: false }
  };
}
