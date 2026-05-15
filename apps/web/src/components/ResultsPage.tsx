import { useMemo, useState, type ReactNode } from 'react';
import { aspectRatios, stylePresetToDesignSystem, type AspectPresetId, type StylePresetId } from '@agl/composition-schema';
import { demoArticleForResult, demoResults, type DemoResult, type DemoResultAnimation } from '../data/demo-results';
import { buildCurrentResultView, type CurrentArticleResult, type ResultAnimation } from '../lib/current-result-view';
import { PreviewCanvas } from '../compositions/PreviewCanvas';
import { ArticleMarkdownPreview } from './ArticleMarkdownPreview';

type Props = {
  onBack: () => void;
  onUseDemoArticle: (articleId: string) => void;
  currentArticleResult?: CurrentArticleResult;
};

type ResultView = {
  id: string;
  title: string;
  articleTitle: string;
  markdown: string;
  sourceUrl?: string;
  sourceLabel: string;
  stylePreset: StylePresetId;
  createdAt: string;
  summary: string;
  animations: ResultAnimation[];
  tags: string[];
  demoArticleId?: string;
  isCurrent?: boolean;
};

function demoResultToView(result: DemoResult): ResultView | null {
  const article = demoArticleForResult(result);
  if (!article) return null;
  return {
    id: result.id,
    title: result.title,
    articleTitle: article.title,
    markdown: article.markdown,
    sourceUrl: result.sourceUrl,
    sourceLabel: 'Smartoolbox article import',
    stylePreset: result.stylePreset,
    createdAt: result.createdAt,
    summary: result.summary,
    animations: result.animations,
    tags: article.tags,
    demoArticleId: result.articleId
  };
}

function spotToAspect(value?: string): AspectPresetId {
  return value && Object.prototype.hasOwnProperty.call(aspectRatios, value) ? value as AspectPresetId : 'articleBanner';
}

function DemoAnimationFigure({ animation }: { animation: ResultAnimation | DemoResultAnimation }) {
  const realAnimation = animation as ResultAnimation;
  const caption = animation.caption;
  if (realAnimation.mediaKind === 'gif' && realAnimation.gifUrl) {
    return <figure className={`demo-animation-figure real-animation grammar-${animation.grammar}`}>
      <img src={realAnimation.gifUrl} alt={caption} />
      <figcaption>{caption}</figcaption>
    </figure>;
  }
  if (realAnimation.mediaKind === 'mp4' && realAnimation.mp4Url) {
    return <figure className={`demo-animation-figure real-animation grammar-${animation.grammar}`}>
      <video src={realAnimation.mp4Url} autoPlay muted loop playsInline controls />
      <figcaption>{caption}</figcaption>
    </figure>;
  }
  if (realAnimation.mediaKind === 'html' && realAnimation.generatedHtml) {
    return <figure className={`demo-animation-figure real-animation grammar-${animation.grammar}`}>
      <PreviewCanvas bare html={realAnimation.generatedHtml} aspectId={spotToAspect(realAnimation.aspectPreset)} duration={realAnimation.durationSeconds || 7} />
      <figcaption>{caption}</figcaption>
    </figure>;
  }
  return <figure className={`demo-animation-figure grammar-${animation.grammar}`}>
    <div className="demo-animation-stage" aria-hidden="true">
      <span className="demo-node node-a">Input</span>
      <span className="demo-path" />
      <span className="demo-node node-b">{animation.label}</span>
      <span className="demo-pulse" />
    </div>
    <figcaption>{caption}</figcaption>
  </figure>;
}

function insertedAnimations(animations: ResultAnimation[]) {
  return animations.reduce<Record<number, ReactNode[]>>((acc, animation) => {
    acc[animation.insertAfterParagraph] = [...(acc[animation.insertAfterParagraph] || []), <DemoAnimationFigure key={animation.id} animation={animation} />];
    return acc;
  }, {});
}

export function ResultsPage({ onBack, onUseDemoArticle, currentArticleResult }: Props) {
  const resultViews = useMemo(() => {
    const current = buildCurrentResultView(currentArticleResult);
    return [current, ...demoResults.map(demoResultToView)].filter(Boolean) as ResultView[];
  }, [currentArticleResult]);
  const [activeId, setActiveId] = useState(resultViews[0]?.id || '');
  const active = resultViews.find(result => result.id === activeId) || resultViews[0];
  const activeDesign = active ? stylePresetToDesignSystem(active.stylePreset) : undefined;
  const inserts = useMemo(() => active ? insertedAnimations(active.animations) : {}, [active]);

  return <main className="app-shell results-shell">
    <header className="topbar results-topbar">
      <div className="brand"><span className="brand-mark">↔</span><span>Animated Graphics Lab</span></div>
      <div className="stepper" aria-label="Results sections"><span className="active">Saved results</span><span>Before</span><span>After</span></div>
      <div className="mode-tabs"><button onClick={onBack}>Back to app</button></div>
    </header>

    <section className="results-page">
      <div className="results-hero">
        <span className="kicker">Before / after examples</span>
        <h1>Articles with real generated animations inserted.</h1>
        <p>The left side shows the article as imported. The right side shows the same article with the actual generated HTML previews or rendered GIF/MP4 assets inserted in place. Static fixtures still use lightweight placeholders.</p>
      </div>

      <div className="results-layout">
        <aside className="results-list">
          {resultViews.map(result => {
            const design = stylePresetToDesignSystem(result.stylePreset);
            return <button key={result.id} className={result.id === active?.id ? 'result-card selected' : 'result-card'} onClick={() => setActiveId(result.id)}>
              <strong>{result.title}</strong>
              <span>{result.articleTitle}</span>
              <em style={{ color: design.colors.accent }}>{design.label} · {result.animations.length} animations{result.isCurrent ? ' · current' : ''}</em>
            </button>;
          })}
        </aside>

        {active && activeDesign && <section className={active.isCurrent ? 'result-detail current-result-detail' : 'result-detail'}>
          <div className="result-detail-head">
            <div>
              <span className="kicker">Saved result · {active.createdAt}</span>
              <h2>{active.title}</h2>
              <p>{active.summary}</p>
            </div>
            <div className="result-actions">
              {active.sourceUrl && <a className="ghost-button compact" href={active.sourceUrl} target="_blank" rel="noreferrer">Source</a>}
              {active.demoArticleId && <button className="send-button small-send" onClick={() => onUseDemoArticle(active.demoArticleId!)}>Use this demo article</button>}
              {active.isCurrent && <button className="send-button small-send" onClick={onBack}>Continue editing current article</button>}
            </div>
          </div>
          <div className="result-meta-row">
            <span>{activeDesign.label}</span>
            <span>{active.animations.length} animation slots</span>
            <span>{active.tags.slice(0, 3).join(' · ')}</span>
          </div>
          <div className="before-after-grid">
            <div className={active.isCurrent ? 'before-after-panel before-panel compact-before-panel' : 'before-after-panel'}>
              <div className="panel-label"><strong>Before</strong><span>{active.sourceLabel}</span></div>
              <ArticleMarkdownPreview markdown={active.markdown} />
            </div>
            <div className={active.isCurrent ? 'before-after-panel after-panel featured-after-panel' : 'before-after-panel after-panel'}>
              <div className="panel-label"><strong>After</strong><span>{active.isCurrent ? 'Real generated animations inserted' : 'Animation slots inserted'}</span></div>
              <ArticleMarkdownPreview markdown={active.markdown} insertAfterParagraph={inserts} />
            </div>
          </div>
        </section>}
      </div>
    </section>
  </main>;
}
