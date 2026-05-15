# HyperFrames implementation brief

## Project type

Short product/demo video built with HyperFrames. Use real screen recordings if available, otherwise use stylized UI recreations that match the app.

## Duration

Target root duration: 55 seconds.

Suggested scene timings:

```json
[
  { "id": "hook", "start": 0, "duration": 4 },
  { "id": "platform-problem", "start": 4, "duration": 6 },
  { "id": "intro", "start": 10, "duration": 6 },
  { "id": "spotting", "start": 16, "duration": 9 },
  { "id": "preview", "start": 25, "duration": 8 },
  { "id": "render", "start": 33, "duration": 8 },
  { "id": "portable-output", "start": 41, "duration": 8 },
  { "id": "close", "start": 49, "duration": 6 }
]
```

## Composition notes

- Build a single-root HyperFrames clip with nested scene groups.
- Avoid runtime `fetch()`.
- Avoid unseeded `Math.random()`.
- Avoid infinite GSAP repeats.
- If using screenshots/videos, keep them in `assets/` and reference local files.
- Use readable captions and large overlays because hackathon judges may watch in a small player.

## Visual direction

Style: dark editorial product demo.

Mood:

- Smart, practical, writer-first.
- Slightly playful at the hook.
- No corporate vapor.

## Required text overlays

Use these exact overlays unless changed later:

```text
AI writing needs a visual layer.
HTML embeds do not travel well.
Animated Graphics Lab
Built for the HeyGen Hackathon
Article -> visual spots -> live previews
Preview first. Render after approval.
Powered by HyperFrames from HeyGen
MP4 + GIF export
Medium. Substack. X. Newsletters. Docs.
HTML when you are designing. GIF when you are publishing.
```

## Voiceover sync

Use `voiceover.txt` as source. Target speech is about 118 words per minute for 55 seconds, casual pace. If TTS comes out too slow, cut this sentence first:

```text
If the visual misses the point, you fix it before rendering.
```

If TTS comes out too fast, add a small hold after:

```text
So for the HeyGen Hackathon, I built Animated Graphics Lab.
```

## Assets directory convention

Create:

```text
video/hackathon-demo/assets/
  screenshots/
  recordings/
  audio/
  exports/
```

Expected files after manual gathering:

```text
assets/audio/voiceover.wav
assets/recordings/agl-article-mode.mp4
assets/recordings/agl-visual-spots.mp4
assets/recordings/agl-preview.mp4
assets/recordings/agl-render.mp4
assets/exports/render.mp4
assets/exports/render.gif
```

## Fallback if no real footage is ready

Build all UI shots as animated mockups in HyperFrames:

- Article card with text lines.
- Platform cards.
- AGL app frame with article pane and visual spot pane.
- Preview card showing stateless vs memory-backed agent.
- Pipeline row: HTML/GSAP -> HyperFrames -> MP4 -> GIF.
- Output grid with platform cards.

Make sure the final video does not pretend mocked footage is a live app recording. It is fine for a hackathon demo to mix real and illustrative UI as long as the narration stays accurate.

## End card

Use:

```text
Animated Graphics Lab
Local-first article visuals
Built for the HeyGen Hackathon
Powered by HyperFrames
```

Optional footer:

```text
github.com/hungryclaw/animated-graphics-lab
```
