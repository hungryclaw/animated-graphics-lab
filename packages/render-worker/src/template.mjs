export function labelsFromConcept(input) {
  const clean = String(input || '').trim() || 'Idea becomes visual explanation';
  const chunks = clean.split(/[.!?;:\n]+/).map(s => s.trim()).filter(Boolean);
  if (chunks.length >= 4) return chunks.slice(0,4).map(s => s.split(/\s+/).slice(0,4).join(' '));
  const words = clean.split(/\s+/).filter(Boolean);
  return ['Input','Model','Signal','Output'].map((fallback, i) => words.slice(i*3, i*3+3).join(' ') || fallback);
}

export function renderHtml(job) {
  const generated = htmlFromJobSpec(job);
  if (generated) return generated;
  const width = job.width || 1920, height = job.height || 540, duration = job.duration_seconds || 7;
  const labels = labelsFromConcept(job.concept_text);
  const style = styleMap[job.style_preset] || styleMap.appleMinimal;
  return `<!doctype html><html><head><meta charset="utf-8"><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><style>
  *{box-sizing:border-box} body{margin:0;background:${style.bg};font-family:${style.font};color:${style.text}} .stage{width:${width}px;height:${height}px;position:relative;overflow:hidden;background:${style.bg}} .ambient{position:absolute;border-radius:999px;filter:blur(90px);opacity:.22}.one{width:34%;height:42%;left:6%;top:8%;background:${style.accent}}.two{width:36%;height:48%;right:5%;bottom:0;background:#22d3ee}.diagram{position:absolute;inset:0;display:grid;grid-template-columns:1fr 150px 1fr 150px 1fr 150px 1fr;align-items:center;padding:0 8%}.node{min-height:${Math.round(height*.24)}px;display:grid;place-items:center;text-align:center;padding:22px 28px;font-size:${Math.max(28,Math.round(width/54))}px;font-weight:850;line-height:1.08;border:2px solid;letter-spacing:-.04em}.prompt{background:linear-gradient(145deg,${style.accent},#111827);color:white;border-color:transparent;border-radius:${style.radius}px;box-shadow:${style.shadow}}.response{background:${style.surface};color:${style.text};border-color:rgba(20,20,25,.1);border-radius:${style.radius}px;box-shadow:${style.shadow}}.arrow{height:44px;position:relative;display:flex;align-items:center}.arrow-line{height:4px;width:110px;border-radius:999px;background:${style.accent};opacity:.75}.arrow-head{width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:15px solid ${style.accent};position:absolute;right:22px}.signal{width:18px;height:18px;border-radius:50%;position:absolute;left:4px;background:${style.accent};box-shadow:0 0 28px ${style.accent}}
  </style></head><body><div class="stage" data-composition-id="main" data-width="${width}" data-height="${height}" data-start="0" data-duration="${duration}"><div class="ambient one"></div><div class="ambient two"></div><div class="diagram">${labels.map((l,i)=>`<div class="node ${i%2?'response':'prompt'}" id="n${i+1}">${escapeHtml(l)}</div>${i<3?`<div class="arrow" id="a${i+1}"><div class="arrow-line"></div><div class="arrow-head"></div><div class="signal" id="s${i+1}"></div></div>`:''}`).join('')}</div></div><script>
  const DURATION=${duration}; const tl=gsap.timeline({id:'main',defaults:{ease:'power3.out'}}); gsap.set('.node',{opacity:0,y:24,scale:.94,filter:'blur(10px)'}); gsap.set('.arrow-line',{scaleX:0,transformOrigin:'left center'}); gsap.set('.arrow-head',{opacity:0,x:-12}); gsap.set('.signal',{opacity:0,scale:.4,x:0}); ['#n1','#n2','#n3','#n4'].forEach((id,idx)=>{const t=.25+idx*1.15;tl.to(id,{opacity:1,y:0,scale:1,filter:'blur(0px)',duration:.65,ease:'expo.out'},t);if(idx<3){tl.to('#a'+(idx+1)+' .arrow-line',{scaleX:1,duration:.48,ease:'power2.inOut'},t+.5).to('#a'+(idx+1)+' .arrow-head',{opacity:1,x:0,duration:.32},t+.78).to('#s'+(idx+1),{opacity:1,scale:1,duration:.15},t+.54).to('#s'+(idx+1),{x:92,duration:.46,ease:'power2.inOut'},t+.58).to('#s'+(idx+1),{opacity:0,scale:.65,duration:.18},t+.98)}}); tl.to({}, {duration: Math.max(.3, DURATION-4.4)}); window.__timelines=window.__timelines||{}; window.__timelines.main=tl; window.__hf={duration:DURATION,seek:(t)=>{tl.time(t,true);tl.pause();}};
  </script></body></html>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function htmlFromJobSpec(job){
  if (!job?.composition_spec_json) return null;
  try {
    const spec = JSON.parse(job.composition_spec_json);
    if (typeof spec.generatedHtml !== 'string') return null;
    validateGeneratedHtml(spec.generatedHtml);
    return spec.generatedHtml;
  } catch (err) {
    throw new Error(`Invalid generated HTML spec: ${err instanceof Error ? err.message : String(err)}`);
  }
}
function validateGeneratedHtml(html){
  const lower = html.toLowerCase();
  const required = ['window.__hf','window.__timelines','gsap'];
  for (const token of required) if (!lower.includes(token)) throw new Error(`missing ${token}`);
  if (!lower.includes('data-composition-id="main"') && !lower.includes("data-composition-id='main'")) throw new Error('missing main composition id');
  const blocked = ['fetch(', 'xmlhttprequest', 'websocket', 'eventsource', 'localstorage', 'sessionstorage', 'document.cookie', 'navigator.sendbeacon', '<iframe', '<object', '<embed', '<form', 'import(', 'eval(', 'new function'];
  for (const token of blocked) if (lower.includes(token)) throw new Error(`blocked token: ${token}`);
}
const styleMap={appleMinimal:{bg:'#f5f5f7',text:'#111114',accent:'#007aff',surface:'rgba(255,255,255,.82)',radius:42,shadow:'0 24px 60px rgba(20,20,25,.105)',font:'-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif'},linear:{bg:'#f7f8fb',text:'#17171c',accent:'#5e6ad2',surface:'#fff',radius:18,shadow:'0 18px 46px rgba(25,28,33,.09)',font:'Inter,ui-sans-serif,system-ui'},terminalDark:{bg:'#05070b',text:'#d9ffe8',accent:'#35f6a5',surface:'rgba(5,18,24,.82)',radius:16,shadow:'0 0 38px rgba(53,246,165,.16)',font:'ui-monospace,monospace'},stripe:{bg:'#f8fbff',text:'#0a2540',accent:'#635bff',surface:'rgba(255,255,255,.78)',radius:28,shadow:'0 24px 70px rgba(50,50,93,.14)',font:'Inter,ui-sans-serif,system-ui'},handDrawn:{bg:'#fbf6ea',text:'#241f1a',accent:'#e4572e',surface:'#fffaf0',radius:24,shadow:'8px 8px 0 rgba(36,31,26,.16)',font:'Comic Sans MS,system-ui'},brutalist:{bg:'#f4ff00',text:'#050505',accent:'#ff3b30',surface:'#fff',radius:4,shadow:'10px 10px 0 #000',font:'Arial Black,Impact,system-ui'}};
