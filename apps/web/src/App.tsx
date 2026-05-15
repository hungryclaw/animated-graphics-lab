import { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, ChevronDown, Download, KeyRound, Layers3, Paperclip, Send, Settings2, Sparkles, Wand2 } from 'lucide-react';
import { ArticleAnalysisRequestSchema, aspectRatios, stylePresets, DraftRequestSchema, JobRequestSchema, parseDesignMdToAglDesignSystem, stylePresetToDesignSystem, type AglDesignSystem, type AspectPresetId, type StylePresetId } from '@agl/composition-schema';
import { PreviewCanvas } from './compositions/PreviewCanvas';
import { analyzeArticle, createDraft, createJob, getJob, uploadReference, waitForArticleAnalysis, waitForDraft, type PollProgress } from './lib/api';
import { articleBaseName, buildArticleHtml, buildArticleMarkdown, downloadText, splitArticleParagraphs } from './lib/article-export';
import { buildArticleGifDownloads, downloadGif, downloadGifBatch, gifDownloadFilename } from './lib/gif-downloads';
import { directiveToSpot, extractGraphicDirectives, inferTitle, stripGraphicDirectives } from './lib/graphic-directives';
import { clearActiveOperation, loadActiveOperation, loadAppState, saveActiveOperation, saveAppState, shouldResumeOperation, type ActiveOperation } from './lib/resume-state';
import { DesignSystemPreview } from './components/DesignSystemPreview';
import { ResultsPage } from './components/ResultsPage';
import { demoArticles } from './data/demo-articles';
import { sampleConcepts } from './lib/sample-concepts';
import type { ArticleSpotState, ArticleVisualizationPlan, GraphicDraft, Job } from './types';

const defaultConcept = 'A model interprets a messy article idea, designs a custom animation, previews it in the browser, then sends the approved HTML to Hermes for rendering.';
const defaultArticle = `# The Agentic Article Workflow

A writer often starts with a rough paragraph, a few scattered claims, and one central idea that is not yet visual. Readers can follow the prose, but the mechanism behind the idea is still hidden.

An agent can read the article, identify where the reader's mental model gets overloaded, and propose a small animation exactly at that point. The goal is not decoration. The goal is to make the hard part easier to understand.

The first useful visual moment is usually a transformation: raw input becomes a structured explanation. The second is often a stack: tools, model reasoning, rendering, and export build on each other. The third is usually a feedback loop where the author previews, revises, approves, and renders.

Instead of generating one generic illustration for the top of the article, the better workflow inserts targeted animations inside the article. Each animation has to be previewed before rendering so the author can correct the idea while it is still cheap to change.

Once the author approves the animations, the system exports the full article with visual placeholders, GIFs, or videos inserted in the right locations.`;

const styleExamples: Partial<Record<StylePresetId, { title: string; example: string; bars: string[] }>> = {
  appleMinimal: { title: 'Soft editorial card', example: 'Clean white stage, calm motion, spacious labels.', bars: ['78%', '44%', '58%'] },
  linear: { title: 'Precise product diagram', example: 'Muted surfaces, crisp arrows, low-noise UI detail.', bars: ['62%', '70%', '36%'] },
  stripe: { title: 'Gradient explainer', example: 'Light gradients, glass cards, polished transitions.', bars: ['84%', '52%', '68%'] },
  terminalDark: { title: 'Terminal system map', example: 'Dark CRT feel, monospace labels, neon signals.', bars: ['50%', '74%', '46%'] },
  handDrawn: { title: 'Sketch-note flow', example: 'Warm paper texture, loose shapes, human annotation.', bars: ['68%', '42%', '76%'] },
  brutalist: { title: 'Bold poster graphic', example: 'High contrast blocks, loud text, hard cuts.', bars: ['92%', '64%', '38%'] }
};

const aspectExamples: Record<AspectPresetId, string> = {
  articleBanner: 'Best for Medium/Substack article headers.',
  wideBanner: 'Best for website hero graphics and wide embeds.',
  square: 'Best for social feed posts.',
  verticalShort: 'Best for reels/shorts/story-like videos.',
  landscape: 'Best for X/LinkedIn embeds and video thumbnails.'
};

type Step = 'idea' | 'article' | 'preview' | 'render';
type Mode = 'graphic' | 'article';
type OperationProgress = { title: string; detail: string; status: string; startedAt: number; id?: string; steps: string[]; activeStep: number; events?: { createdAt: string; level: string; message: string; data?: { detail?: string } }[] };
type SavedAppState = {
  mode?: Mode;
  conceptText?: string;
  articleText?: string;
  articleContext?: string;
  stylePreset?: StylePresetId;
  aspectPreset?: AspectPresetId;
  durationSeconds?: number;
  authMode?: 'master'|'byok';
  provider?: string;
  model?: string;
  referenceAssetId?: string;
  designMdAssetId?: string;
  draft?: GraphicDraft | null;
  job?: Job | null;
  articlePlan?: ArticleVisualizationPlan | null;
  articleSpots?: ArticleSpotState[];
  designMdText?: string;
  customDesignSystem?: AglDesignSystem;
  designLocked?: boolean;
};

const savedState = typeof window !== 'undefined' ? loadAppState<SavedAppState>(window.localStorage) : null;

function spotToAspect(value: string): AspectPresetId {
  return Object.prototype.hasOwnProperty.call(aspectRatios, value) ? value as AspectPresetId : 'articleBanner';
}

function ProgressPanel({ progress, elapsedSeconds, compact = false }: { progress: OperationProgress; elapsedSeconds?: number; compact?: boolean }) {
  return <div className={compact ? 'progress-panel compact' : 'progress-panel'}>
    <div className="progress-top"><span className="spinner"/><div><strong>{progress.title}</strong><p>{progress.detail}</p></div>{typeof elapsedSeconds === 'number' && <time>{elapsedSeconds}s</time>}</div>
    {progress.id && <code>{progress.id}</code>}
    <div className="progress-steps">{progress.steps.map((step, i) => <span key={step} className={i < progress.activeStep ? 'done' : i === progress.activeStep ? 'active' : ''}>{step}</span>)}</div>
    {progress.events?.length ? <div className="progress-events">{progress.events.slice(-4).map((event, i) => <p key={`${event.createdAt}-${i}`}><span>{event.level}</span>{event.message}{event.data?.detail ? <small>{event.data.detail}</small> : null}</p>)}</div> : null}
  </div>;
}

type ArticleEmbeddedPreviewProps = {
  title: string;
  summary: string;
  articleText: string;
  spots: ArticleSpotState[];
  openSpotId: string | null;
  setOpenSpotId: (id: string | null) => void;
  updateSpot: (spotId: string, patch: Partial<ArticleSpotState>) => void;
  previewSpot: (spotId: string, revision?: boolean) => void;
  renderSpot: (spotId: string) => void;
  exportArticle: (format: 'html'|'md') => void;
  saveSpotGif: (spot: ArticleSpotState) => void;
  saveArticleGifs: () => void;
  renderStatusLabel: (status: Job['status']) => string;
};

function ArticleEmbeddedPreview({ title, summary, articleText, spots, openSpotId, setOpenSpotId, updateSpot, previewSpot, renderSpot, exportArticle, saveSpotGif, saveArticleGifs, renderStatusLabel }: ArticleEmbeddedPreviewProps) {
  const paragraphs = splitArticleParagraphs(stripGraphicDirectives(articleText));
  const sortedSpots = [...spots].sort((a, b) => a.insertAfterParagraph - b.insertAfterParagraph || a.priority - b.priority);
  const byParagraph = new Map<number, ArticleSpotState[]>();
  for (const spot of sortedSpots) {
    const key = Math.max(0, Math.min(paragraphs.length - 1, spot.insertAfterParagraph));
    byParagraph.set(key, [...(byParagraph.get(key) || []), spot]);
  }
  const acceptedCount = spots.filter(s => s.accepted).length;
  const gifDownloads = buildArticleGifDownloads(title || 'Visualized article', spots);
  const visualCount = spots.filter(s => s.accepted && (s.draft || s.job?.gifUrl || s.job?.mp4Url)).length;
  const pendingCount = spots.filter(s => s.accepted && !s.draft && !s.job).length;

  function renderInlineSpot(spot: ArticleSpotState) {
    const isOpen = openSpotId === spot.id;
    const caption = spot.captionSuggestion || spot.visualIdea;
    if (!spot.accepted) {
      return <aside key={spot.id} className="inline-spot-rejected">
        <span>Rejected animation opportunity · #{spot.priority}</span>
        <button className="ghost-button compact" onClick={() => updateSpot(spot.id, { accepted: true })}>Restore</button>
      </aside>;
    }

    return <figure key={spot.id} className={isOpen ? 'embedded-visual inline-spot open' : 'embedded-visual inline-spot'}>
      <button className="inline-spot-media-button" type="button" onClick={() => setOpenSpotId(isOpen ? null : spot.id)} aria-expanded={isOpen}>
        <div className="embedded-visual-media">
          {spot.job?.gifUrl ? <img src={spot.job.gifUrl} alt={caption}/> :
           spot.job?.mp4Url ? <video src={spot.job.mp4Url} autoPlay muted loop playsInline controls/> :
           spot.draft ? <PreviewCanvas bare html={spot.draft.generatedHtml} aspectId={spotToAspect(spot.aspectPreset)} duration={spot.durationSeconds}/> :
           <div className="embedded-placeholder inline-opportunity"><span className="kicker">Animation opportunity #{spot.priority}</span><strong>{spot.grammar} · {spot.durationSeconds}s</strong><p>{spot.visualIdea}</p><small>Click to edit or generate this visual in context.</small></div>}
        </div>
      </button>
      <figcaption>{caption}</figcaption>
      {isOpen && <div className="inline-spot-editor">
        <div className="inline-spot-editor-head"><div><span className="kicker">Inline visual editor</span><strong>#{spot.priority} · {spot.grammar}</strong></div><span>{spot.aspectPreset} · {spot.durationSeconds}s</span></div>
        <blockquote>{spot.anchorText}</blockquote>
        <label>Visual idea<textarea value={spot.visualIdea} onChange={e => updateSpot(spot.id, { visualIdea: e.target.value, conceptText: e.target.value })}/></label>
        <p>{spot.rationale}</p>
        <div className="spot-actions inline-actions">
          <button className="ghost-button compact" onClick={() => updateSpot(spot.id, { accepted: false })}>Reject</button>
          <button className="ghost-button compact" disabled={spot.busy} onClick={() => previewSpot(spot.id)}>Generate preview</button>
          {spot.draft && <button className="ghost-button compact" onClick={() => downloadText(`${spot.id}.html`, spot.draft!.generatedHtml, 'text/html;charset=utf-8')}>Save HTML</button>}
          {spot.job?.status === 'done' && spot.job.gifUrl && <button className="ghost-button compact" onClick={() => saveSpotGif(spot)}>Save GIF</button>}
          {spot.draft && <button className="ghost-button compact" disabled={spot.busy} onClick={() => renderSpot(spot.id)}>Render</button>}
        </div>
        {spot.error && <p className="error">{spot.error}</p>}
        {spot.busy && <ProgressPanel compact progress={{ title: spot.busyStatus === 'claimed' ? 'Agent is generating preview' : 'Preview job in progress', detail: spot.busyLabel || 'Starting…', status: spot.busyStatus || 'starting', id: spot.busyId, startedAt: Date.now(), steps: ['Queue','Claim','Generate','Ready'], activeStep: spot.busyStatus === 'claimed' ? 2 : 1 }}/>} 
        {spot.draft && <div className="inline-revision-box"><textarea className="spot-revision" value={spot.changePrompt || ''} onChange={e => updateSpot(spot.id, { changePrompt: e.target.value })} placeholder="Ask for changes to this animation…"/><button className="send-button small-send" disabled={spot.busy || !spot.changePrompt?.trim()} onClick={() => previewSpot(spot.id, true)}>Apply change</button></div>}
        {spot.job && <div className="spot-render-progress"><div className="render-head"><strong>{spot.job.id}</strong><span className={`status-pill ${spot.job.status}`}>{spot.job.status}</span></div><p>{renderStatusLabel(spot.job.status)}</p>{spot.job.queuePosition && <p>Queue position: {spot.job.queuePosition}</p>}{spot.job.events?.length ? <div className="events">{spot.job.events.slice(-3).map((ev, i) => <div key={i} className={ev.level}><time>{new Date(ev.createdAt).toLocaleTimeString()}</time>{ev.message}</div>)}</div> : null}</div>}
      </div>}
    </figure>;
  }

  return <article className="message assistant embedded-preview-message">
    <div className="avatar"><Layers3 size={16}/></div>
    <div className="bubble embedded-preview-bubble">
      <div className="preview-head inline-preview-head"><div><span className="kicker">Article visual editor</span><h2>{title || 'Visualized article'}</h2><p>{summary}</p></div><div className="downloads"><button className="ghost-button compact" onClick={() => exportArticle('html')}>Export HTML</button><button className="ghost-button compact" onClick={() => exportArticle('md')}>Export MD</button>{gifDownloads.length > 0 && <button className="ghost-button compact" onClick={saveArticleGifs}>Save all GIFs</button>}</div></div>
      <div className="article-visual-stats"><span>{acceptedCount} proposed visuals</span><span>{visualCount} previewed</span><span>{pendingCount} waiting for preview</span><span>{gifDownloads.length} GIF{gifDownloads.length === 1 ? '' : 's'} ready</span><span>Click any placeholder or animation to edit</span></div>
      <div className="article-document-preview inline-editing-preview">
        <h1>{title || 'Visualized article'}</h1>
        {paragraphs.map((paragraph, index) => {
          const isHeading = /^#{1,6}\s+/.test(paragraph);
          const clean = paragraph.replace(/^#{1,6}\s+/, '');
          const duplicatesTitle = index === 0 && isHeading && clean.trim().toLowerCase() === (title || 'Visualized article').trim().toLowerCase();
          return <div key={`${index}-${paragraph.slice(0, 18)}`} className="article-preview-block">
            {!duplicatesTitle && (isHeading ? (index === 0 ? <h2>{clean}</h2> : <h3>{clean}</h3>) : <p>{paragraph}</p>)}
            {(byParagraph.get(index) || []).map(renderInlineSpot)}
          </div>;
        })}
      </div>
    </div>
  </article>;
}

const agentDirectiveExample = `<!-- AGL_GRAPHIC
id: memory-loop
type: loop
description: Show task -> result -> memory -> improved next task as a simple loop.
caption: Memory turns one-off work into compounding progress.
placement: after
aspect: articleBanner
duration: 7
must_include:
  - task card
  - result card
  - memory layer
  - improved next run
avoid:
  - colored background panel
  - fake dashboard chrome
-->`;

const githubCloneCommands = `git clone https://github.com/hungryclaw/animated-graphics-lab.git
cd animated-graphics-lab
npm install`;

const githubForkCommands = `git clone git@github.com:<your-user>/animated-graphics-lab.git
cd animated-graphics-lab
git remote add upstream https://github.com/hungryclaw/animated-graphics-lab.git
git fetch upstream
git checkout -b my-agl-changes
npm install`;

const localSetupCommands = `# Default: Hermes + openai-codex provider
npm run local:setup

# Direct local Codex CLI instead:
codex login
npm run local:setup:codex

# Custom local agent/LLM CLI instead:
export AGL_AGENT_COMMAND=/path/to/my-agent
export AGL_AGENT_ARGS_JSON='["--prompt","{prompt}","--json"]'
npm run local:setup:custom`;

const localRunCommands = `npm run local:dev
# Opens the Worker API, render worker, and Vite UI together.
# Then open http://localhost:5173`;

const manualLocalRunCommands = `# Terminal 1
npm run dev:api

# Terminal 2
set -a
source .env.render-worker.local
set +a
npm run dev:render

# Terminal 3
npm run dev:web`;

const autonomousRunCommands = `# Codex/Hermes credentials stay local on your device.
npm run agl:codex:check
npm run agl:render:test -- --dry-run
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --no-render --out .agl/runs/demo-no-render
# Full local render after Codex + HyperFrames are verified:
npm run agl:run -- --input examples/articles/directive-demo.md --agent codex --render --out .agl/runs/demo-full`;
function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  return <div className="instruction-copy-block"><div className="copy-block-head"><strong>{label}</strong><button className="ghost-button compact" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></div><pre>{text}</pre></div>;
}

function InstructionsPage({ onBack }: { onBack: () => void }) {
  function scrollToInstruction(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#/instructions/${id}`);
  }

  useEffect(() => {
    const id = window.location.hash.replace(/^#\/instructions\/?/, '');
    if (!id) return;
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 0);
  }, []);

  return <main className="app-shell instructions-shell">
    <header className="topbar instructions-topbar">
      <div className="brand"><span className="brand-mark"><Wand2 size={17}/></span><span>Animated Graphics Lab</span></div>
      <nav className="instructions-nav"><button type="button" onClick={() => scrollToInstruction('agents')}>Agents</button><button type="button" onClick={() => scrollToInstruction('autonomous')}>Autonomous</button><button type="button" onClick={() => scrollToInstruction('local')}>Local setup</button><button type="button" onClick={() => scrollToInstruction('judges')}>Judges</button><button type="button" onClick={() => scrollToInstruction('troubleshooting')}>Troubleshooting</button></nav>
      <div className="mode-tabs"><button onClick={onBack}>Back to app</button></div>
    </header>
    <section className="instructions-page">
      <div className="instructions-hero">
        <span className="kicker">Cloud demo + local autonomous runner</span>
        <h1>Turn articles into animated graphics without losing local control.</h1>
        <p>This Cloudflare page is the demo and documentation hub. Private Codex subscription use and full HyperFrames rendering run on your own device through the local runner. Rendering is powered by HyperFrames from HeyGen.</p>
        <div className="instruction-links"><a href="https://github.com/hungryclaw/animated-graphics-lab">GitHub repo</a><a href="https://github.com/hungryclaw/animated-graphics-lab/blob/main/docs/agents.md">Agent docs</a><a href="https://github.com/hungryclaw/animated-graphics-lab/blob/main/docs/local-quickstart.md">Local quickstart</a><a href="https://github.com/hungryclaw/animated-graphics-lab/blob/main/docs/macbook-local-testing.md">MacBook testing</a></div>
      </div>

      <section id="agents" className="instruction-section">
        <div><span className="kicker">For agents</span><h2>Write placeholders. Do not render files.</h2></div>
        <p>External writing agents should produce normal Markdown articles and insert <code>AGL_GRAPHIC</code> HTML comments where an animation would clarify the argument. AGL imports those comments as editable visual spots, or the autonomous CLI can process them without opening the browser.</p>
        <ol>
          <li>Write the article normally.</li>
          <li>Add 2-5 placeholders only where a visual helps comprehension.</li>
          <li>Make each <code>description</code> self-contained.</li>
          <li>Avoid fake UI chrome, full colored backgrounds, and decoration-only visuals.</li>
          <li>Hand the Markdown draft to the user; AGL handles preview, revision, render, and export.</li>
        </ol>
        <CopyBlock label="AGL_GRAPHIC directive" text={agentDirectiveExample}/>
        <CopyBlock label="Install the agent instruction pack" text={`npm run agent:pack\nhermes chat -f .agl/example-article-prompt.md`}/>
      </section>

      <section id="autonomous" className="instruction-section">
        <div><span className="kicker">No human-in-the-loop</span><h2>Run the agentic flow from the CLI.</h2></div>
        <p>The autonomous runner reads an article or topic, uses your local Codex/Hermes/custom agent adapter, generates visual draft HTML, renders locally with HyperFrames from HeyGen, converts GIFs with ffmpeg, and exports Markdown/HTML artifacts under <code>.agl/runs/&lt;run-id&gt;</code>. Codex subscription credentials stay on your device.</p>
        <CopyBlock label="Autonomous local commands" text={autonomousRunCommands}/>
      </section>

      <section id="local" className="instruction-section">
        <div><span className="kicker">For local users</span><h2>Run the whole app locally.</h2></div>
        <p>Local mode runs a Wrangler Worker API, local D1 queues, Vite UI, and a pull-based render worker. No public Cloudflare deployment is required. Use the hosted Cloudflare page as a demo/docs surface; use local mode for private subscriptions and device rendering.</p>
        <CopyBlock label="Get the GitHub repo" text={githubCloneCommands}/>
        <CopyBlock label="Fork/developer GitHub setup" text={githubForkCommands}/>
        <CopyBlock label="Configure local rendering + LLM provider" text={localSetupCommands}/>
        <CopyBlock label="Start everything in one terminal" text={localRunCommands}/>
        <CopyBlock label="Manual three-terminal debug mode" text={manualLocalRunCommands}/>
        <p>Open <code>http://localhost:5173</code>, paste the master key printed by setup into Access settings, then paste an article or an agent draft.</p>
      </section>

      <section id="judges" className="instruction-section">
        <div><span className="kicker">For hackathon judges</span><h2>Five-minute demo path.</h2></div>
        <ol>
          <li>Open the hosted app or run the local quickstart.</li>
          <li>Paste an article containing the directive example above.</li>
          <li>Click <strong>Import graphic placeholders</strong>.</li>
          <li>Generate a live preview, revise it, then render if the local worker is available.</li>
          <li>Export HTML/Markdown and confirm the article embeds the visual or a pending marker.</li>
        </ol>
        <p>The important thing to evaluate is the agent-native contract and preview-before-render workflow, not just a single generated GIF.</p>
      </section>

      <section id="troubleshooting" className="instruction-section">
        <div><span className="kicker">Troubleshooting</span><h2>Common local setup fixes.</h2></div>
        <ul>
          <li><strong>ffmpeg missing:</strong> install with <code>brew install ffmpeg</code> or <code>sudo apt-get install -y ffmpeg</code>.</li>
          <li><strong>HyperFrames missing:</strong> run <code>npx --yes hyperframes --help</code>; setup expects local HyperFrames rendering through npm/npx.</li>
          <li><strong>Codex local mode fails:</strong> run <code>codex login</code>, then <code>npm run local:setup:codex</code> or <code>npm run setup:local -- --force --agent=codex</code>.</li>
          <li><strong>Switching provider:</strong> rerun setup with <code>--force --agent=codex</code>, <code>--force --agent=hermes</code>, or <code>--force --agent=custom</code>.</li>
          <li><strong>Unauthorized:</strong> paste the raw <code>MASTER_SUBMITTER_KEY</code>, not the hash.</li>
          <li><strong>Jobs stay queued:</strong> run <code>npm run local:dev</code> or start the render worker with <code>source .env.render-worker.local</code>.</li>
          <li><strong>R2 unavailable:</strong> expected in local mode; object storage is optional.</li>
        </ul>
      </section>
    </section>
  </main>;
}

export function App() {
  const [mode, setMode] = useState<Mode>(savedState?.mode || 'article');
  const [conceptText, setConceptText] = useState(savedState?.conceptText || defaultConcept);
  const [articleText, setArticleText] = useState(savedState?.articleText || defaultArticle);
  const [articleContext, setArticleContext] = useState(savedState?.articleContext || '');
  const [stylePreset, setStylePreset] = useState<StylePresetId>(savedState?.stylePreset || 'appleMinimal');
  const [aspectPreset, setAspectPreset] = useState<AspectPresetId>(savedState?.aspectPreset || 'articleBanner');
  const [durationSeconds, setDurationSeconds] = useState(savedState?.durationSeconds || 7);
  const [authMode, setAuthMode] = useState<'master'|'byok'>(savedState?.authMode || 'master');
  const [masterKey, setMasterKey] = useState(() => localStorage.getItem('agl_master_key') || '');
  const [byokKey, setByokKey] = useState('');
  const [provider, setProvider] = useState(savedState?.provider || 'codex');
  const [model, setModel] = useState(savedState?.model || 'gpt-5.5');
  const [referenceAssetId, setReferenceAssetId] = useState<string | undefined>(savedState?.referenceAssetId);
  const [designMdAssetId, setDesignMdAssetId] = useState<string | undefined>(savedState?.designMdAssetId);
  const [designMdText, setDesignMdText] = useState(savedState?.designMdText || '');
  const [customDesignSystem, setCustomDesignSystem] = useState<AglDesignSystem | undefined>(savedState?.customDesignSystem);
  const [designMdError, setDesignMdError] = useState('');
  const [designLocked, setDesignLocked] = useState(savedState?.designLocked ?? true);
  const [inspectedStylePreset, setInspectedStylePreset] = useState<StylePresetId | null>(null);
  const [pendingRestyle, setPendingRestyle] = useState(false);
  const [draft, setDraft] = useState<GraphicDraft | null>(savedState?.draft || null);
  const [changePrompt, setChangePrompt] = useState('');
  const [job, setJob] = useState<Job | null>(savedState?.job || null);
  const [articlePlan, setArticlePlan] = useState<ArticleVisualizationPlan | null>(savedState?.articlePlan || null);
  const [articleSpots, setArticleSpots] = useState<ArticleSpotState[]>(savedState?.articleSpots || []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Paste an article. I will find 3–5 moments worth visualizing, then you can preview and render each animation manually.');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [openSpotId, setOpenSpotId] = useState<string | null>(null);
  const [operationProgress, setOperationProgress] = useState<OperationProgress | null>(null);
  const [now, setNow] = useState(Date.now());
  const [routeHash, setRouteHash] = useState(() => typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '');

  useEffect(() => {
    const update = () => setRouteHash(window.location.hash.replace(/^#/, ''));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  const selectedAspect = aspectRatios[aspectPreset];
  const selectedStyle = stylePresets[stylePreset];
  const builtinDesignSystem = useMemo(() => stylePresetToDesignSystem(stylePreset), [stylePreset]);
  const activeDesignSystem = customDesignSystem || builtinDesignSystem;
  const inspectedDesignSystem = inspectedStylePreset ? stylePresetToDesignSystem(inspectedStylePreset) : activeDesignSystem;
  const activeStep: Step = mode === 'article' && articlePlan ? 'article' : job ? 'render' : draft ? 'preview' : 'idea';
  const draftRequest = useMemo(() => ({ conceptText, articleContext, stylePreset, designSystem: activeDesignSystem, designMdSource: customDesignSystem ? designMdText.slice(0, 120000) : undefined, designLocked, aspectPreset, authMode, provider, model, durationSeconds }), [conceptText, articleContext, stylePreset, activeDesignSystem, customDesignSystem, designMdText, designLocked, aspectPreset, authMode, provider, model, durationSeconds]);
  const draftValid = DraftRequestSchema.safeParse(draftRequest).success;
  const renderRequest = useMemo(() => ({ conceptText, articleContext, stylePreset, designSystem: activeDesignSystem, designMdSource: customDesignSystem ? designMdText.slice(0, 120000) : undefined, designLocked, aspectPreset, authMode, provider, model, referenceAssetId, designMdAssetId, durationSeconds, generatedHtml: draft?.generatedHtml, interpretation: draft?.interpretation }), [conceptText, articleContext, stylePreset, activeDesignSystem, customDesignSystem, designMdText, designLocked, aspectPreset, authMode, provider, model, referenceAssetId, designMdAssetId, durationSeconds, draft]);
  const renderValid = Boolean(draft?.generatedHtml) && JobRequestSchema.safeParse(renderRequest).success;
  const elapsedSeconds = operationProgress ? Math.max(0, Math.floor((now - operationProgress.startedAt) / 1000)) : 0;
  const detectedDirectives = useMemo(() => mode === 'article' ? extractGraphicDirectives(articleText) : [], [mode, articleText]);

  useEffect(() => {
    saveAppState(localStorage, { mode, conceptText, articleText, articleContext, stylePreset, aspectPreset, durationSeconds, authMode, provider, model, referenceAssetId, designMdAssetId, designMdText: designMdText.slice(0, 120000), customDesignSystem, designLocked, draft, job, articlePlan, articleSpots });
  }, [mode, conceptText, articleText, articleContext, stylePreset, aspectPreset, durationSeconds, authMode, provider, model, referenceAssetId, designMdAssetId, designMdText, customDesignSystem, designLocked, draft, job, articlePlan, articleSpots]);

  useEffect(() => {
    const active = loadActiveOperation(localStorage);
    if (!active || !shouldResumeOperation(active)) { if (active) clearActiveOperation(localStorage); return; }
    resumeActiveOperation(active);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!operationProgress) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [operationProgress]);

  useEffect(() => {
    if (authMode === 'master') { setProvider('codex'); setModel('gpt-5.5'); }
    else if (provider === 'codex') { setProvider('openrouter'); setModel('qwen/qwen3-coder:free'); }
  }, [authMode]);

  useEffect(() => {
    if (!job) return;
    if (['done','failed','cancelled'].includes(job.status)) {
      setOperationProgress(prev => prev ? { ...prev, id: job.id, status: job.status, detail: renderStatusLabel(job.status), activeStep: renderStep(job.status) } : prev);
      const doneTimer = setTimeout(() => setOperationProgress(null), 1800);
      return () => clearTimeout(doneTimer);
    }
    setOperationProgress(prev => prev ? { ...prev, id: job.id, status: job.status, detail: renderStatusLabel(job.status), activeStep: renderStep(job.status) } : prev);
    const id = setInterval(async () => { try { const next = await getJob(job.id); setJob(next); setOperationProgress(prev => prev ? { ...prev, id: next.id, status: next.status, detail: renderStatusLabel(next.status), activeStep: renderStep(next.status) } : prev); } catch (err) { console.warn(err); } }, 2500);
    return () => clearInterval(id);
  }, [job]);

  useEffect(() => {
    const activeJobs = articleSpots.filter(s => s.job && !['done','failed','cancelled'].includes(s.job.status));
    if (!activeJobs.length) return;
    const id = setInterval(async () => {
      const updates = await Promise.all(activeJobs.map(async s => ({ id: s.id, job: await getJob(s.job!.id).catch(() => s.job!) })));
      setArticleSpots(prev => prev.map(s => updates.find(u => u.id === s.id) ? { ...s, job: updates.find(u => u.id === s.id)!.job } : s));
    }, 2500);
    return () => clearInterval(id);
  }, [articleSpots]);

  function draftStep(progress: PollProgress) { return progress.status === 'claimed' ? 2 : 1; }
  function analysisStep(progress: PollProgress) { return progress.status === 'claimed' ? 2 : 1; }
  function renderStep(status: Job['status']) {
    if (status === 'queued') return 1;
    if (status === 'claimed' || status === 'composing') return 2;
    if (status === 'rendering_mp4') return 3;
    if (status === 'converting_gif' || status === 'uploading') return 4;
    if (status === 'done') return 5;
    return 1;
  }
  function renderStatusLabel(status: Job['status']) {
    const labels: Record<string,string> = {
      queued: 'Queued. Waiting for the render worker…',
      claimed: 'Render worker claimed the job…',
      composing: 'Preparing deterministic HTML composition…',
      rendering_mp4: 'HyperFrames is rendering MP4 frames…',
      converting_gif: 'ffmpeg is converting MP4 to GIF…',
      uploading: 'Publishing artifacts…',
      done: 'Render complete.',
      failed: 'Render failed.',
      cancelled: 'Render cancelled.'
    };
    return labels[status] || status;
  }
  function setSpotBusy(spotId: string, patch: Pick<ArticleSpotState, 'busyLabel'|'busyStatus'|'busyId'>) {
    setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, ...patch } : s));
  }

  async function resumeActiveOperation(active: ActiveOperation) {
    setBusy(true);
    setMessage('Restored an in-progress job after refresh. Continuing to watch it…');
    try {
      if (active.kind === 'graphic-draft') {
        setMode('graphic');
        setOperationProgress({ title: 'Restoring preview generation', detail: 'Reconnecting to the draft job…', status: 'queued', id: active.id, startedAt: active.startedAt, steps: ['Queue draft','Local agent writes HTML','Preview ready'], activeStep: 0 });
        const created = await waitForDraft(active.id, p => setOperationProgress(prev => prev ? { ...prev, detail: p.label, status: p.status, id: p.id, events: p.events, activeStep: draftStep(p) } : prev));
        setDraft(created); setJob(null); clearActiveOperation(localStorage); setMessage(`Preview restored · ${created.grammar}.`);
      } else if (active.kind === 'article-analysis') {
        setMode('article');
        setOperationProgress({ title: 'Restoring article analysis', detail: 'Reconnecting to the analysis job…', status: 'queued', id: active.id, startedAt: active.startedAt, steps: ['Queue analysis','Agent reads article','Spot plan ready'], activeStep: 0 });
        const plan = await waitForArticleAnalysis(active.id, p => setOperationProgress(prev => prev ? { ...prev, detail: p.label, status: p.status, id: p.id, activeStep: analysisStep(p) } : prev));
        setArticlePlan(plan); setArticleSpots(plan.spots.map(spot => ({ ...spot, accepted: true, changePrompt: '' }))); clearActiveOperation(localStorage); setMessage(`Restored ${plan.spots.length} visualization ideas.`);
      } else if (active.kind === 'spot-draft') {
        setMode('article');
        setArticleSpots(prev => prev.map(s => s.id === active.spotId ? { ...s, busy: true, busyId: active.id, busyStatus: 'queued', busyLabel: 'Restored preview job after refresh…', error: undefined } : s));
        const created = await waitForDraft(active.id, p => setSpotBusy(active.spotId, { busyLabel: p.label, busyStatus: p.status, busyId: p.id }));
        setArticleSpots(prev => prev.map(s => s.id === active.spotId ? { ...s, draft: created, busy: false, busyLabel: undefined, busyStatus: undefined, busyId: undefined, changePrompt: '', error: undefined } : s));
        clearActiveOperation(localStorage); setMessage(`Preview restored for ${active.spotId}.`);
      }
    } catch (err) {
      clearActiveOperation(localStorage);
      setMessage(err instanceof Error ? err.message : String(err));
      if (active.kind === 'spot-draft') setArticleSpots(prev => prev.map(s => s.id === active.spotId ? { ...s, busy: false, error: err instanceof Error ? err.message : String(err) } : s));
    } finally {
      setBusy(false);
      setTimeout(() => setOperationProgress(null), 1200);
    }
  }

  async function onUpload(file: File, kind: 'reference_image'|'design_md') {
    setBusy(true);
    try {
      const out = await uploadReference(file, kind);
      if (kind === 'reference_image') setReferenceAssetId(out.assetId); else setDesignMdAssetId(out.assetId);
      setMessage(`${kind === 'reference_image' ? 'Reference image' : 'DESIGN.md'} uploaded: ${out.assetId}`);
    } catch (err) { setMessage(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  }

  function selectStylePreset(next: StylePresetId) {
    setStylePreset(next);
    setCustomDesignSystem(undefined);
    setInspectedStylePreset(next);
    if (draft) setPendingRestyle(true);
  }

  function applyDesignMdText() {
    try {
      const parsed = parseDesignMdToAglDesignSystem(designMdText);
      setCustomDesignSystem(parsed);
      setDesignMdError('');
      setMessage(`Imported design system: ${parsed.label}`);
      if (draft) setPendingRestyle(true);
    } catch (err) {
      setDesignMdError(err instanceof Error ? err.message : String(err));
    }
  }

  function loadSampleConcept(sample: (typeof sampleConcepts)[number]) {
    setMode('graphic');
    setConceptText(sample.conceptText);
    setArticleContext(sample.articleContext);
    setDraft(null);
    setJob(null);
    setMessage(`Loaded sample: ${sample.label}. Style previews are local and deterministic; Generate uses your configured API/local worker.`);
  }

  function loadDemoArticle(articleId: string) {
    const article = demoArticles.find(item => item.id === articleId);
    if (!article) return;
    setMode('article');
    setArticleText(article.markdown);
    setStylePreset(article.preferredStylePreset);
    setInspectedStylePreset(article.preferredStylePreset);
    setCustomDesignSystem(undefined);
    setArticlePlan(null);
    setArticleSpots([]);
    setOpenSpotId(null);
    setDraft(null);
    setJob(null);
    setDemoMenuOpen(false);
    setMessage(`Imported Smartoolbox demo article: ${article.title}`);
    if (window.location.hash.startsWith('#/results')) window.location.hash = '';
  }

  async function generatePreview(revision = false) {
    const payload = { ...draftRequest, currentHtml: revision ? draft?.generatedHtml : undefined, changePrompt: revision ? changePrompt : undefined };
    const parsed = DraftRequestSchema.safeParse(payload);
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message || 'Invalid draft request'); return; }
    setBusy(true);
    setOperationProgress({ title: revision ? 'Updating preview' : 'Generating preview', detail: 'Sending request to the draft queue…', status: 'starting', startedAt: Date.now(), steps: ['Validate request','Queue draft','Local agent writes HTML','Preview ready'], activeStep: 0 });
    try {
      if (masterKey) localStorage.setItem('agl_master_key', masterKey);
      setMessage(revision ? 'Applying your change request…' : 'Interpreting the concept and writing custom HTML…');
      const created = await createDraft(parsed.data, authMode === 'master' ? masterKey : undefined, authMode === 'byok' ? byokKey : undefined, p => {
        if (p.id) saveActiveOperation(localStorage, { kind: 'graphic-draft', id: p.id, startedAt: Date.now() });
        setOperationProgress(prev => prev ? { ...prev, detail: p.label, status: p.status, id: p.id, events: p.events, activeStep: draftStep(p) } : prev);
      });
      setDraft(created); setChangePrompt(''); setPendingRestyle(false); setJob(null); clearActiveOperation(localStorage);
      setOperationProgress(prev => prev ? { ...prev, detail: 'Preview ready. Showing the exact HTML that will be rendered.', status: 'done', activeStep: 3 } : prev);
      setMessage(`Preview ready · ${created.grammar}. Ask for changes or queue the approved render.`);
    } catch (err) { clearActiveOperation(localStorage); setMessage(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); setTimeout(() => setOperationProgress(null), 1200); }
  }

  async function submitRender() {
    const parsed = JobRequestSchema.safeParse(renderRequest);
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message || 'Generate a valid preview before rendering'); return; }
    setBusy(true);
    setOperationProgress({ title: 'Queueing render', detail: 'Submitting approved preview HTML to the render queue…', status: 'starting', startedAt: Date.now(), steps: ['Queue job','Worker claims','Render MP4','Convert GIF','Done'], activeStep: 0 });
    try {
      if (masterKey) localStorage.setItem('agl_master_key', masterKey);
      const created = await createJob(parsed.data, authMode === 'master' ? masterKey : undefined, authMode === 'byok' ? byokKey : undefined);
      setOperationProgress(prev => prev ? { ...prev, id: created.id, status: created.status, detail: renderStatusLabel(created.status), activeStep: renderStep(created.status) } : prev);
      setJob(created); setMessage(`Queued render ${created.id}. The local worker will render the exact preview HTML.`);
    } catch (err) { setMessage(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  }

  async function findArticleSpots() {
    const payload = { articleText, stylePreset, designSystem: activeDesignSystem, designMdSource: customDesignSystem ? designMdText.slice(0, 120000) : undefined, authMode, provider, model, maxSpots: 5 };
    const parsed = ArticleAnalysisRequestSchema.safeParse(payload);
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message || 'Article is too short or invalid'); return; }
    setBusy(true);
    setOperationProgress({ title: 'Finding article visual moments', detail: 'Sending article to the analysis queue…', status: 'starting', startedAt: Date.now(), steps: ['Validate article','Queue analysis','Agent reads article','Spot plan ready'], activeStep: 0 });
    try {
      if (masterKey) localStorage.setItem('agl_master_key', masterKey);
      setMessage('Reading the article and selecting the best visualization moments…');
      const plan = await analyzeArticle(parsed.data, authMode === 'master' ? masterKey : undefined, authMode === 'byok' ? byokKey : undefined, p => {
        if (p.id) saveActiveOperation(localStorage, { kind: 'article-analysis', id: p.id, startedAt: Date.now() });
        setOperationProgress(prev => prev ? { ...prev, detail: p.label, status: p.status, id: p.id, activeStep: analysisStep(p) } : prev);
      });
      setArticlePlan(plan);
      setArticleSpots(plan.spots.map(spot => ({ ...spot, accepted: true, changePrompt: '' })));
      setOpenSpotId(plan.spots[0]?.id || null);
      clearActiveOperation(localStorage);
      setOperationProgress(prev => prev ? { ...prev, detail: `Found ${plan.spots.length} grounded ideas.`, status: 'done', activeStep: 3 } : prev);
      setMessage(`Found ${plan.spots.length} grounded visualization ideas. Generate previews one by one, then export the article.`);
    } catch (err) { clearActiveOperation(localStorage); setMessage(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); setTimeout(() => setOperationProgress(null), 1200); }
  }

  async function previewSpot(spotId: string, revision = false) {
    const spot = articleSpots.find(s => s.id === spotId);
    if (!spot) return;
    setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, busy: true, busyLabel: revision ? 'Queueing revision…' : 'Queueing preview generation…', busyStatus: 'starting', error: undefined } : s));
    try {
      const payload = {
        conceptText: spot.conceptText,
        articleContext: `${spot.articleExcerpt}\n\nArticle summary: ${articlePlan?.summary || ''}`,
        stylePreset,
        designSystem: activeDesignSystem,
        designMdSource: customDesignSystem ? designMdText.slice(0, 120000) : undefined,
        designLocked,
        aspectPreset: spotToAspect(spot.aspectPreset),
        durationSeconds: spot.durationSeconds,
        authMode,
        provider,
        model,
        currentHtml: revision ? spot.draft?.generatedHtml : undefined,
        changePrompt: revision ? spot.changePrompt : undefined
      };
      const parsed = DraftRequestSchema.parse(payload);
      const created = await createDraft(parsed, authMode === 'master' ? masterKey : undefined, authMode === 'byok' ? byokKey : undefined, p => {
        if (p.id) saveActiveOperation(localStorage, { kind: 'spot-draft', id: p.id, spotId, revision, startedAt: Date.now() });
        setSpotBusy(spotId, { busyLabel: p.label, busyStatus: p.status, busyId: p.id });
      });
      setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, draft: created, busy: false, busyLabel: undefined, busyStatus: undefined, busyId: undefined, changePrompt: '', error: undefined } : s));
      setOpenSpotId(spotId);
      clearActiveOperation(localStorage);
      setMessage(`Preview ready for ${spot.id}.`);
    } catch (err) {
      clearActiveOperation(localStorage);
      setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, busy: false, busyLabel: undefined, busyStatus: undefined, busyId: undefined, error: err instanceof Error ? err.message : String(err) } : s));
    }
  }

  async function renderSpot(spotId: string) {
    const spot = articleSpots.find(s => s.id === spotId);
    if (!spot?.draft) return;
    setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, busy: true, busyLabel: 'Submitting render job…', busyStatus: 'starting', error: undefined } : s));
    try {
      const parsed = JobRequestSchema.parse({
        conceptText: spot.conceptText,
        articleContext: spot.articleExcerpt,
        stylePreset,
        designSystem: activeDesignSystem,
        designMdSource: customDesignSystem ? designMdText.slice(0, 120000) : undefined,
        designLocked,
        aspectPreset: spotToAspect(spot.aspectPreset),
        authMode,
        provider,
        model,
        referenceAssetId,
        designMdAssetId,
        durationSeconds: spot.durationSeconds,
        generatedHtml: spot.draft.generatedHtml,
        interpretation: spot.draft.interpretation
      });
      const created = await createJob(parsed, authMode === 'master' ? masterKey : undefined, authMode === 'byok' ? byokKey : undefined);
      setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, busy: false, busyLabel: undefined, busyStatus: undefined, busyId: undefined, job: created } : s));
      setMessage(`Queued render for ${spot.id}.`);
    } catch (err) {
      setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, busy: false, busyLabel: undefined, busyStatus: undefined, busyId: undefined, error: err instanceof Error ? err.message : String(err) } : s));
    }
  }

  function updateSpot(spotId: string, patch: Partial<ArticleSpotState>) { setArticleSpots(prev => prev.map(s => s.id === spotId ? { ...s, ...patch } : s)); }
  function importGraphicDirectives() {
    const spots = detectedDirectives.map((directive, index) => directiveToSpot(directive, articleText, index + 1));
    if (!spots.length) { setMessage('No AGL_GRAPHIC placeholders found in this draft.'); return; }
    const title = inferTitle(articleText);
    setArticlePlan({ title, summary: `Imported ${spots.length} embedded graphic request${spots.length === 1 ? '' : 's'} from AGL_GRAPHIC placeholders.`, spots });
    setArticleSpots(spots);
    setOpenSpotId(spots[0]?.id || null);
    setMessage(`Imported ${spots.length} graphic placeholder${spots.length === 1 ? '' : 's'}. Review, edit, then generate previews one by one.`);
  }
  function clearUi() {
    clearActiveOperation(localStorage);
    localStorage.removeItem('agl_saved_state');
    setMode('article');
    setConceptText('');
    setArticleText('');
    setArticleContext('');
    setStylePreset('appleMinimal');
    setAspectPreset('articleBanner');
    setDurationSeconds(7);
    setInspectedStylePreset(null);
    setCustomDesignSystem(undefined);
    setDesignMdText('');
    setDesignMdError('');
    setDraft(null);
    setJob(null);
    setArticlePlan(null);
    setArticleSpots([]);
    setOpenSpotId(null);
    setChangePrompt('');
    setPendingRestyle(false);
    setDemoMenuOpen(false);
    setOperationProgress(null);
    setBusy(false);
    setMessage('Cleared. Paste an article or describe a single graphic to start fresh.');
  }
  function exportArticle(format: 'html'|'md') {
    const title = articlePlan?.title || 'Visualized article';
    const spots = articleSpots.filter(s => s.accepted);
    const base = articleBaseName(title);
    if (format === 'html') downloadText(`${base}.html`, buildArticleHtml(articleText, spots, title), 'text/html;charset=utf-8');
    else downloadText(`${base}.md`, buildArticleMarkdown(articleText, spots), 'text/markdown;charset=utf-8');
  }
  async function saveSpotGif(spot: ArticleSpotState) {
    if (!spot.job?.gifUrl) {
      setMessage(`Render ${spot.id} first, then the GIF can be saved.`);
      return;
    }
    const title = articlePlan?.title || 'Visualized article';
    await downloadGif(spot.job.gifUrl, gifDownloadFilename(title, spot));
    setMessage(`Saved GIF for ${spot.id}.`);
  }
  async function saveArticleGifs() {
    const title = articlePlan?.title || 'Visualized article';
    const downloads = buildArticleGifDownloads(title, articleSpots);
    if (!downloads.length) {
      setMessage('No rendered GIFs yet. Render one or more article animations first.');
      return;
    }
    await downloadGifBatch(downloads);
    setMessage(`Saved ${downloads.length} GIF${downloads.length === 1 ? '' : 's'} for the article.`);
  }

  if (routeHash.startsWith('/instructions')) {
    return <InstructionsPage onBack={() => { window.location.hash = ''; setRouteHash(''); }}/>;
  }
  if (routeHash.startsWith('/results')) {
    return <ResultsPage onBack={() => { window.location.hash = ''; setRouteHash(''); }} onUseDemoArticle={loadDemoArticle} currentArticleResult={{ articleText, articlePlan, articleSpots, stylePreset }}/>;
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Wand2 size={17}/></span><span>Animated Graphics Lab</span></div>
      <div className="stepper" aria-label="Workflow progress"><span className={activeStep === 'idea' ? 'active' : ''}>Input</span><span className={activeStep === 'article' ? 'active' : ''}>Article plan</span><span className={activeStep === 'preview' ? 'active' : ''}>Preview</span><span className={activeStep === 'render' ? 'active' : ''}>Render</span></div>
      <div className="mode-tabs"><button type="button" className={mode === 'article' ? 'active' : ''} onClick={() => setMode('article')}>Article</button><button type="button" className={mode === 'graphic' ? 'active' : ''} onClick={() => setMode('graphic')}>Single graphic</button><button type="button" onClick={() => { window.location.hash = '/results'; setRouteHash('/results'); }}>Results</button><button type="button" onClick={() => { window.location.hash = '/instructions'; setRouteHash('/instructions'); }}><BookOpen size={13}/> Instructions</button><button type="button" className="danger-tab" onClick={clearUi}>Clear UI</button></div>
    </header>

    <section className="conversation">
      <article className="message assistant intro-message"><div className="avatar"><Sparkles size={16}/></div><div className="bubble glass"><div className="kicker">Agent-native article visualizer</div><h1>{mode === 'article' ? 'Paste an article. I’ll find the visual moments.' : 'Tell me the idea. I’ll turn it into a live animated graphic.'}</h1><p>{mode === 'article' ? 'The agent proposes 3–5 grounded animation ideas, previews each one before rendering, then exports the article with animations inserted.' : 'One flow: prompt → model interpretation → sandboxed preview → revision chat → approved HyperFrames render.'}</p><div className="meta-row"><span>{activeDesignSystem.label}{customDesignSystem ? ' · Imported' : ''}</span><span>{selectedAspect.label}</span><span>{durationSeconds}s</span><span>{provider}/{model}</span></div></div></article>

      {operationProgress && <article className="message assistant progress-message"><div className="avatar"><Activity size={16}/></div><div className="bubble progress-bubble"><ProgressPanel progress={operationProgress} elapsedSeconds={elapsedSeconds}/></div></article>}

      {mode === 'article' && detectedDirectives.length > 0 && !articlePlan && <article className="message assistant directive-import-message"><div className="avatar"><Layers3 size={16}/></div><div className="bubble directive-import-bubble"><div><span className="kicker">Agentic graphic placeholders</span><h2>Found {detectedDirectives.length} AGL_GRAPHIC request{detectedDirectives.length === 1 ? '' : 's'}</h2><p>Import these placeholders as editable visual spots, then approve, revise, preview, and render them into GIFs.</p>{detectedDirectives.some(d => d.parseStatus === 'error') && <p className="error">Some placeholders need review before generation.</p>}</div><button className="send-button" onClick={importGraphicDirectives}>Import graphic placeholders</button></div></article>}

      {articlePlan && mode === 'article' && <ArticleEmbeddedPreview title={articlePlan.title || 'Visualized article'} summary={articlePlan.summary} articleText={articleText} spots={articleSpots} openSpotId={openSpotId} setOpenSpotId={setOpenSpotId} updateSpot={updateSpot} previewSpot={previewSpot} renderSpot={renderSpot} exportArticle={exportArticle} saveSpotGif={saveSpotGif} saveArticleGifs={saveArticleGifs} renderStatusLabel={renderStatusLabel}/>} 

      {draft && mode === 'graphic' && <article className="message user"><div className="avatar user-avatar">HM</div><div className="bubble user-bubble"><strong>Concept</strong><p>{conceptText || 'No concept yet.'}</p>{articleContext && <small>Context: {articleContext}</small>}</div></article>}
      {draft && pendingRestyle && mode === 'graphic' && <article className="message assistant restyle-message"><div className="avatar"><Sparkles size={16}/></div><div className="bubble restyle-banner"><div><strong>Style changed to {activeDesignSystem.label}</strong><span>Your current preview still uses the old styling.</span></div><button className="send-button small-send" disabled={busy} onClick={() => { setChangePrompt('Restyle the existing animation using the selected design system. Keep the same concept, labels, layout intent, timing, and grammar. Change only colors, typography, surfaces, lines, shadows, and motion personality.'); generatePreview(true); }}>Restyle current preview</button></div></article>}
      {draft && mode === 'graphic' && <article className="message assistant preview-message"><div className="avatar"><Layers3 size={16}/></div><div className="bubble preview-bubble"><div className="preview-head"><div><span className="kicker">Live preview</span><h2>{draft.grammar} graphic</h2></div><button className="ghost-button compact" onClick={() => navigator.clipboard.writeText(draft.generatedHtml)}>Copy HTML</button></div><PreviewCanvas html={draft.generatedHtml} aspectId={aspectPreset} duration={durationSeconds}/><div className="interpretation-card"><strong>Model interpretation</strong><p>{draft.interpretation}</p>{draft.notes?.length ? <div className="note-row">{draft.notes.map((n, i) => <span key={i}>{n}</span>)}</div> : null}</div></div></article>}
      {job && mode === 'graphic' && <article className="message assistant render-message"><div className="avatar"><Activity size={16}/></div><div className="bubble render-bubble"><div className="render-head"><strong>{job.id}</strong><span className={`status-pill ${job.status}`}>{job.status}</span></div>{job.queuePosition && <p>Queue position: {job.queuePosition}</p>}{job.errorMessage && <p className="error">{job.errorMessage}</p>}<div className="events">{job.events?.slice(-6).map((ev, i) => <div key={i} className={ev.level}><time>{new Date(ev.createdAt).toLocaleTimeString()}</time>{ev.message}</div>)}</div>{job.status === 'done' && <div className="downloads"><Download size={16}/>{job.gifUrl && <button className="ghost-button compact" onClick={async () => { await downloadGif(job.gifUrl!, `${articleBaseName(conceptText || draft?.grammar || 'single-graphic')}.gif`); setMessage('Saved GIF for the current graphic.'); }}>Save GIF</button>}{job.mp4Url && <a href={job.mp4Url} download>MP4</a>}{job.sourceUrl && <a href={job.sourceUrl} download>Source</a>}</div>}</div></article>}
    </section>

    <section className="composer-wrap"><div className="sample-concepts"><button type="button" className="demo-import-trigger" onClick={() => { setMode('article'); setDemoMenuOpen(v => !v); }}>Use demo article</button>{sampleConcepts.map(sample => <button key={sample.label} type="button" onClick={() => loadSampleConcept(sample)}>{sample.label}</button>)}</div>{demoMenuOpen && <div className="demo-article-menu">{demoArticles.map(article => <button key={article.id} type="button" onClick={() => loadDemoArticle(article.id)}><strong>{article.title}</strong><span>{article.excerpt}</span><em>{stylePresetToDesignSystem(article.preferredStylePreset).label} · {article.tags.slice(0, 2).join(' / ')}</em></button>)}</div>}<div className="statusline"><span className={busy ? 'pulse-dot' : 'dot'}/>{message}</div><div className={settingsOpen ? 'composer composer-expanded' : 'composer'}><div className="composer-main"><textarea value={mode === 'article' ? articleText : (draft ? changePrompt : conceptText)} onChange={e => mode === 'article' ? setArticleText(e.target.value) : draft ? setChangePrompt(e.target.value) : setConceptText(e.target.value)} rows={mode === 'article' ? 8 : draft ? 3 : 4} placeholder={mode === 'article' ? 'Paste the full article here…' : draft ? 'Ask for changes to this preview…' : 'Describe the animated graphic you want…'}/>{mode === 'graphic' && <div className="quick-context"><textarea value={articleContext} onChange={e => setArticleContext(e.target.value)} rows={1} placeholder="Optional context: audience, tone, exact article section…"/></div>}</div><div className="inline-option-summary"><button type="button" className="summary-pill" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSettingsOpen(v => !v); }}><span className="swatch" style={{background:activeDesignSystem.colors.accent}}/>{activeDesignSystem.label}</button><button type="button" className="summary-pill" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSettingsOpen(v => !v); }}>{selectedAspect.label}</button><button type="button" className="summary-pill" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSettingsOpen(v => !v); }}>{durationSeconds}s</button><button type="button" className="summary-pill subtle" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setSettingsOpen(v => !v); }}><Settings2 size={15}/>{settingsOpen ? 'Hide options' : 'Options'}<ChevronDown size={13}/></button></div><div className="composer-options"><div className="option-section wide design-system-section"><div className="option-title"><strong>Design style</strong><span>No key needed: previews are local and deterministic.</span></div><div className="design-system-layout"><div className="design-preview-rail"><div className="option-title"><strong>{inspectedDesignSystem.label}</strong><span>{inspectedDesignSystem.description}</span></div><DesignSystemPreview design={inspectedDesignSystem} size="large"/><div className="design-preview-facts"><span>Motion: {inspectedDesignSystem.motion.personality}</span><span>Density: {inspectedDesignSystem.composition.diagramDensity}</span><span>Background: {inspectedDesignSystem.composition.backgroundPolicy}</span></div><details className="compare-details"><summary className="ghost-button compact">Compare styles</summary><div className="design-compare-grid">{(['appleMinimal','stripe','terminalDark','handDrawn','brutalist'] as StylePresetId[]).map(id => { const design = stylePresetToDesignSystem(id); return <div className="compare-card" key={id}><DesignSystemPreview design={design} size="compact"/><strong>{design.label}</strong><span>{design.description}</span><button className="ghost-button compact" type="button" onClick={() => selectStylePreset(id)}>Use this style</button></div>; })}</div></details></div><div className="design-card-grid">{Object.entries(stylePresets).map(([id]) => { const design = stylePresetToDesignSystem(id); return <button key={id} type="button" className={stylePreset === id && !customDesignSystem ? 'design-card selected' : 'design-card'} onMouseEnter={() => setInspectedStylePreset(id as StylePresetId)} onMouseLeave={() => setInspectedStylePreset(null)} onFocus={() => setInspectedStylePreset(id as StylePresetId)} onBlur={() => setInspectedStylePreset(null)} onClick={() => selectStylePreset(id as StylePresetId)}><DesignSystemPreview design={design} size="compact"/><span className="design-card-meta"><strong>{design.label}</strong><small>{design.description}</small></span><span className="design-card-badges"><em>{design.motion.personality}</em><em>{design.composition.diagramDensity}</em></span></button>; })}</div></div></div><div className="option-section wide"><div className="option-title"><strong>Format</strong><span>Pick where graphics will be used</span></div><div className="option-grid format-grid">{Object.entries(aspectRatios).map(([id, preset]) => <button key={id} className={aspectPreset === id ? 'option-chip selected' : 'option-chip'} onClick={() => setAspectPreset(id as AspectPresetId)}><span>{preset.label}</span><small>{preset.width}×{preset.height}</small><span className="option-preview format-preview" role="tooltip"><b>{preset.label}</b><i>{aspectExamples[id as AspectPresetId]}</i><em>{preset.width} × {preset.height}</em></span></button>)}</div></div><div className="option-section compact-section"><div className="option-title"><strong>Timing</strong><span>{durationSeconds}s animation</span></div><label className="range-card"><input type="range" min="3" max="12" step="0.5" value={durationSeconds} onChange={e => setDurationSeconds(Number(e.target.value))}/></label></div><div className="option-section wide design-md-section"><div className="option-title"><strong>Import DESIGN.md</strong><span>Paste markdown tokens and adapt them for animation</span></div><textarea value={designMdText} onChange={e => setDesignMdText(e.target.value)} rows={6} placeholder={`---
name: My Design
colors:
  primary: "#111114"
  tertiary: "#ff6b35"
---`}/><div className="design-md-actions"><button className="ghost-button compact" type="button" onClick={applyDesignMdText}>Preview imported design</button>{customDesignSystem && <button className="ghost-button compact" type="button" onClick={() => { setCustomDesignSystem(undefined); setDesignMdError(''); if (draft) setPendingRestyle(true); }}>Use built-in style instead</button>}<label className="toggle-row"><input type="checkbox" checked={designLocked} onChange={e => setDesignLocked(e.target.checked)}/><span>Lock design system during revisions</span></label></div>{designMdError && <p className="inline-error">{designMdError}</p>}{customDesignSystem && <div className="imported-design-preview"><span className="imported-badge">Imported</span><DesignSystemPreview design={customDesignSystem} size="large"/><div className="design-preview-facts"><span>{customDesignSystem.label}</span><span>Motion: {customDesignSystem.motion.personality}</span><span>Density: {customDesignSystem.composition.diagramDensity}</span></div></div>}</div><div className="option-section compact-section"><div className="option-title"><strong>Access</strong><span>{authMode === 'master' ? 'Local agent' : 'Bring your own key'}</span></div><div className="mode-switch"><button className={authMode === 'master' ? 'selected' : ''} onClick={() => setAuthMode('master')}>Master</button><button className={authMode === 'byok' ? 'selected' : ''} onClick={() => setAuthMode('byok')}>BYOK</button></div></div>{authMode === 'master' ? <label className="secret-field inline-secret"><KeyRound size={14}/> Master key<input value={masterKey} onChange={e => setMasterKey(e.target.value)} placeholder="gl_master_..." type="password"/></label> : <div className="byok-grid inline-byok"><label>Provider<input value={provider} onChange={e => setProvider(e.target.value)} placeholder="openrouter"/></label><label>Model<input value={model} onChange={e => setModel(e.target.value)} placeholder="qwen/qwen3-coder:free"/></label><label>BYOK API key<input value={byokKey} onChange={e => setByokKey(e.target.value)} type="password" placeholder="not stored"/></label></div>}<div className="upload-strip inline-upload"><label><Paperclip size={14}/> Reference image<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0], 'reference_image')}/><span>{referenceAssetId || 'optional'}</span></label><label><Paperclip size={14}/> DESIGN.md<input type="file" accept=".md,text/markdown,text/plain" onChange={e => e.target.files?.[0] && onUpload(e.target.files[0], 'design_md')}/><span>{designMdAssetId || 'optional'}</span></label></div></div><div className="composer-actions">{mode === 'graphic' && draft && <button className="ghost-button" disabled={busy || !renderValid} onClick={submitRender}><Download size={16}/> Queue render</button>}<button className="send-button" disabled={busy || (mode === 'article' ? !ArticleAnalysisRequestSchema.safeParse({ articleText, stylePreset, authMode, provider, model, maxSpots: 5 }).success : draft ? !changePrompt.trim() : !draftValid)} onClick={() => mode === 'article' ? findArticleSpots() : generatePreview(Boolean(draft && changePrompt.trim()))}>{busy ? 'Working…' : mode === 'article' ? 'Find visualization spots' : draft ? 'Apply change' : 'Generate preview'}<Send size={16}/></button></div></div></section>
  </main>;
}
