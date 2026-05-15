import type { AglInputKind, AglRunManifest, AglRunMode, AglVisualManifest, AglVisualStatus, AglWorkflowStage } from './types.js';
export declare function createRunId(prefix?: string): string;
export declare function createRunManifest(input: {
    runId?: string;
    mode?: AglRunMode;
    inputKind: AglInputKind;
    inputPath?: string;
    title?: string;
    agentKind?: AglRunManifest['agent']['kind'];
    agentCommand?: string;
    model?: string;
    visuals?: AglVisualManifest[];
}): AglRunManifest;
export declare function setRunStage(manifest: AglRunManifest, stage: AglWorkflowStage): AglRunManifest;
export declare function updateVisualStatus(manifest: AglRunManifest, visualId: string, patch: Omit<Partial<AglVisualManifest>, 'validation'> & {
    status?: AglVisualStatus;
    validation?: Partial<AglVisualManifest['validation']>;
}): AglRunManifest;
export declare function validateManifest(manifest: AglRunManifest): {
    ok: boolean;
    errors: string[];
};
export declare function visualFromSpot(spot: {
    id: string;
    visualIdea: string;
    captionSuggestion?: string;
    aspectPreset?: string;
    durationSeconds?: number;
    directive?: AglVisualManifest['directive'];
}): AglVisualManifest;
