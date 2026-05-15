import { useMemo } from 'react';
import { aspectRatios, type AspectPresetId } from '@agl/composition-schema';

type Props = { html?: string; aspectId: AspectPresetId; duration: number; bare?: boolean };

function scaledSrcDoc(html: string, scale: number, width: number, height: number, bare = false) {
  const backgroundReset = bare ? 'html,body,.stage,[data-composition-id="main"]{background:transparent!important;background-color:transparent!important;box-shadow:none!important}' : '';
  const fitStyle = `<style id="agl-preview-fit">html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:transparent}.stage{transform:scale(${scale});transform-origin:top left}${backgroundReset}</style>`;
  const autoplay = `<script id="agl-preview-autoplay">\n(function(){\n  var tries = 0;\n  function start(){\n    tries++;\n    try {\n      var tl = window.__timelines && window.__timelines.main;\n      if (tl && typeof tl.restart === 'function') {\n        if (typeof tl.repeat === 'function') tl.repeat(-1);\n        if (typeof tl.repeatDelay === 'function') tl.repeatDelay(0.8);\n        tl.restart(true, false);\n        return;\n      }\n    } catch (err) { console.error('AGL preview autoplay failed', err); return; }\n    if (tries < 80) setTimeout(start, 100);\n    else console.error('AGL preview autoplay failed: window.__timelines.main not found');\n  }\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);\n  else start();\n})();\n</script>`;
  const withStyle = html.includes('</head>') ? html.replace('</head>', `${fitStyle}</head>`) : `<!doctype html><html><head>${fitStyle}</head><body>${html}</body></html>`;
  return withStyle.includes('</body>') ? withStyle.replace('</body>', `${autoplay}</body>`) : `${withStyle}${autoplay}`;
}

export function PreviewCanvas({ html, aspectId, duration, bare = false }: Props) {
  const aspect = aspectRatios[aspectId];
  const scale = Math.min(1, 540 / aspect.width, 520 / aspect.height);
  const viewportHeight = Math.round(Math.max(260, Math.min(620, aspect.height * scale + (bare ? 0 : 64))));
  const srcDoc = useMemo(() => html ? scaledSrcDoc(html, scale, aspect.width, aspect.height, bare) : '', [html, scale, aspect.width, aspect.height, bare]);

  return <div className={bare ? 'preview-shell bare-preview' : 'preview-shell'}>
    {!bare && <div className="preview-toolbar generated">
      <span>{aspect.width}×{aspect.height}</span>
      <span>{duration}s deterministic GSAP/HyperFrames source</span>
      {html && <button onClick={() => navigator.clipboard.writeText(html)}>Copy HTML</button>}
    </div>}
    <div className="preview-viewport" style={{ height: viewportHeight }}>
      {html ? <iframe
        title="Generated animated graphic preview"
        sandbox="allow-scripts"
        className="generated-preview-frame"
        style={{ width: aspect.width * scale, height: aspect.height * scale }}
        srcDoc={srcDoc}
      /> : <div className="preview-empty">
        <strong>No generated graphic yet.</strong>
        <span>Click “Generate live preview” first. The model will interpret the concept and create matching HTML before anything is queued for rendering.</span>
      </div>}
    </div>
  </div>;
}
