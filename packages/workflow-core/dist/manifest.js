function nowIso() { return new Date().toISOString(); }
export function createRunId(prefix = 'agl') {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${stamp}-${rand}`;
}
export function createRunManifest(input) {
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
export function setRunStage(manifest, stage) {
    return { ...manifest, stage, updatedAt: nowIso(), status: stage === 'completed' ? 'completed' : stage === 'failed' ? 'failed' : manifest.status };
}
export function updateVisualStatus(manifest, visualId, patch) {
    const updated = manifest.visuals.map(visual => visual.id === visualId ? { ...visual, ...patch, validation: { ...visual.validation, ...(patch.validation || {}) } } : visual);
    return { ...manifest, visuals: updated, updatedAt: nowIso() };
}
export function validateManifest(manifest) {
    const errors = [];
    if (!manifest.runId)
        errors.push('runId is required');
    if (!manifest.createdAt || !manifest.updatedAt)
        errors.push('timestamps are required');
    if (manifest.render.engine !== 'hyperframes')
        errors.push('render.engine must be hyperframes');
    if (manifest.render.poweredBy !== 'HyperFrames from HeyGen')
        errors.push('render.poweredBy must be HyperFrames from HeyGen');
    const seen = new Set();
    for (const visual of manifest.visuals) {
        if (!visual.id)
            errors.push('visual.id is required');
        if (seen.has(visual.id))
            errors.push(`duplicate visual id: ${visual.id}`);
        seen.add(visual.id);
        if (!visual.status)
            errors.push(`visual ${visual.id} missing status`);
        if (!visual.validation)
            errors.push(`visual ${visual.id} missing validation`);
    }
    return { ok: errors.length === 0, errors };
}
export function visualFromSpot(spot) {
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
