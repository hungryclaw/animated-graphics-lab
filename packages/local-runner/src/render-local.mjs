import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runCommand } from './commands.mjs';
import { ensureDir, visualPaths } from './artifacts.mjs';

export function smokeHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}.stage{width:960px;height:270px;position:relative;overflow:hidden;background:transparent;font-family:Inter,system-ui,sans-serif;color:#17171c}.dot{position:absolute;width:34px;height:34px;border-radius:50%;background:#5e6ad2;left:80px;top:118px}.line{position:absolute;height:4px;background:#ccd1ff;left:120px;top:133px;width:720px;transform-origin:left center}.label{position:absolute;left:360px;top:92px;font-size:34px;font-weight:700}</style></head><body><div class="stage" data-composition-id="main" data-width="960" data-height="270" data-start="0" data-duration="3"><div class="line"></div><div class="dot"></div><div class="label">AGL render smoke</div></div><script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script><script>const tl=gsap.timeline({id:'main'});tl.from('.line',{scaleX:0,duration:1}).to('.dot',{x:720,duration:1.4},.2).from('.label',{opacity:0,y:10,duration:.6},.8);window.__timelines=window.__timelines||{};window.__timelines.main=tl;window.__hf={duration:3,seek:(t)=>{tl.time(t,true);tl.pause();}};</script></body></html>`;
}

export async function renderHtmlFile({ sourceHtml, outDir, fps = 30, gifFps = 15, gifWidth = 1440, workers = 2, dryRun = false }) {
  outDir = path.resolve(outDir);
  await ensureDir(outDir);
  const indexHtml = path.join(outDir, 'index.html');
  await writeFile(indexHtml, sourceHtml);
  if (dryRun) return { sourceHtmlPath: indexHtml };
  console.log('Rendering locally with HyperFrames from HeyGen.');
  await runCommand('npx', ['hyperframes', 'lint'], { cwd: outDir, stream: true });
  await runCommand('npx', ['hyperframes', 'snapshot', '--at', '0,1,2'], { cwd: outDir, stream: true });
  const mp4 = path.join(outDir, 'render.mp4');
  await runCommand('npx', ['hyperframes', 'render', '--output', mp4, '--fps', String(fps), '--quality', 'high', '--workers', String(workers)], { cwd: outDir, stream: true });
  await runCommand('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'default=nw=1:nk=1', mp4]);
  const gif = path.join(outDir, 'render.gif');
  await runCommand('ffmpeg', ['-y', '-i', mp4, '-vf', `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', gif], { stream: true });
  await runCommand('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size', '-of', 'default=nw=1:nk=1', gif]);
  return { sourceHtmlPath: indexHtml, mp4Path: mp4, gifPath: gif };
}

export async function renderSmoke({ outDir = '.agl/runs/render-smoke', dryRun = false } = {}) {
  const paths = visualPaths(outDir, 'smoke');
  return renderHtmlFile({ sourceHtml: smokeHtml(), outDir: paths.dir, dryRun });
}
