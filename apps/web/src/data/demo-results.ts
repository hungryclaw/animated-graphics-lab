import type { StylePresetId } from '@agl/composition-schema';
import { demoArticles } from './demo-articles';

export type DemoResultAnimation = {
  id: string;
  label: string;
  grammar: 'sequence' | 'loop' | 'comparison' | 'stack' | 'transformation' | 'network' | 'timeline' | 'metaphor';
  insertAfterParagraph: number;
  caption: string;
};

export type DemoResult = {
  id: string;
  articleId: string;
  title: string;
  sourceUrl: string;
  stylePreset: StylePresetId;
  createdAt: string;
  summary: string;
  animations: DemoResultAnimation[];
};

const today = '2026-05-15';

export const demoResults: DemoResult[] = [
  {
    id: 'coding-agents-workspace-before-after',
    articleId: 'smartoolbox-coding-agents-boring-setup',
    title: 'Coding agents: workspace setup becomes the product',
    sourceUrl: 'https://smartoolbox.com/blog/coding-agents-boring-setup',
    stylePreset: 'terminalDark',
    createdAt: today,
    summary: 'Shows how a loose chat-with-code flow becomes an agent running inside a configured development workspace.',
    animations: [
      { id: 'workspace-prereqs', label: 'Workspace prerequisites', grammar: 'stack', insertAfterParagraph: 4, caption: 'Useful agents need repo, runtime, credentials, tests, and review surface in place.' },
      { id: 'agent-feedback-loop', label: 'Agent feedback loop', grammar: 'loop', insertAfterParagraph: 9, caption: 'The useful loop is run → test → review → fix, not one-shot code generation.' }
    ]
  },
  {
    id: 'cleanup-debt-before-after',
    articleId: 'smartoolbox-ai-tools-cleanup-debt',
    title: 'AI tools: less cleanup debt after the demo',
    sourceUrl: 'https://smartoolbox.com/blog/ai-tools-cleanup-debt',
    stylePreset: 'stripe',
    createdAt: today,
    summary: 'Turns the cleanup-debt argument into a before/after visual model for evaluating AI products.',
    animations: [
      { id: 'cleanup-debt-meter', label: 'Cleanup debt meter', grammar: 'comparison', insertAfterParagraph: 5, caption: 'The real test is how much repair work remains after automation.' },
      { id: 'demo-to-workflow', label: 'Demo to workflow', grammar: 'transformation', insertAfterParagraph: 11, caption: 'A good AI tool compresses the path from impressive output to usable artifact.' }
    ]
  },
  {
    id: 'real-time-ai-before-after',
    articleId: 'smartoolbox-real-time-ai-collaboration',
    title: 'Real-time AI: shared attention, not faster chat',
    sourceUrl: 'https://smartoolbox.com/blog/real-time-ai-collaboration',
    stylePreset: 'stripe',
    createdAt: today,
    summary: 'Contrasts turn-based prompting with collaborative timing, attention, and multimodal state.',
    animations: [
      { id: 'turns-to-shared-state', label: 'Turns to shared state', grammar: 'transformation', insertAfterParagraph: 3, caption: 'Real-time AI changes the interaction model from message exchange to shared context.' },
      { id: 'attention-loop', label: 'Attention loop', grammar: 'loop', insertAfterParagraph: 8, caption: 'The loop is observe → infer → respond → adjust while the user keeps working.' }
    ]
  },
  {
    id: 'build-room-before-after',
    articleId: 'smartoolbox-model-not-moat-build-room',
    title: 'Enterprise AI: the moat moves into the build room',
    sourceUrl: 'https://smartoolbox.com/blog/model-not-moat-build-room',
    stylePreset: 'brutalist',
    createdAt: today,
    summary: 'Visualizes why model access matters less than data, permissions, workflow logs, and deployment muscle.',
    animations: [
      { id: 'model-vs-build-room', label: 'Model vs build room', grammar: 'comparison', insertAfterParagraph: 4, caption: 'The model is one block; the build room is the system that makes it useful.' },
      { id: 'enterprise-stack', label: 'Enterprise AI stack', grammar: 'stack', insertAfterParagraph: 10, caption: 'Data, permissions, evals, observability, and rollout turn model access into value.' }
    ]
  },
  {
    id: 'workflow-compression-before-after',
    articleId: 'smartoolbox-ai-headcount-metric',
    title: 'Workflow compression as the new AI metric',
    sourceUrl: 'https://smartoolbox.com/blog/ai-headcount-metric',
    stylePreset: 'handDrawn',
    createdAt: today,
    summary: 'Explains workflow compression as a sequence of removed handoffs, waiting time, and duplicated work.',
    animations: [
      { id: 'workflow-compression', label: 'Workflow compression', grammar: 'transformation', insertAfterParagraph: 5, caption: 'Compression means fewer handoffs between intent and finished work.' },
      { id: 'headcount-signal', label: 'Headcount signal', grammar: 'timeline', insertAfterParagraph: 10, caption: 'The metric shifts from AI demo quality to operational work removed.' }
    ]
  }
];

export function demoArticleForResult(result: DemoResult) {
  return demoArticles.find(article => article.id === result.articleId);
}
