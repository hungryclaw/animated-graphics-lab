# Storyboard

Target: 45-55 seconds, 16:9 landscape.

## Visual style

Use a clean product-demo style: dark editorial canvas, crisp cards, subtle motion, no neon AI brain, no fake robot mascot. The video should look like a tool a writer would use, not an AI image generator ad.

Suggested palette:

- Background: `#080b12`, `#101827`
- Text: `#eef2ff`, `#cbd5e1`
- Accent: `#7dd3fc`, `#a78bfa`, `#34d399`
- Warning/block state: `#fb7185`
- Paper/article surface: `#f8fafc`

Fonts:

- UI/text: Inter or system sans
- Code/terminal snippets: JetBrains Mono, SF Mono, or monospace

## Scene 1, 0:00-0:04, Bland article hook

Voiceover:

> AI can write articles fast. A lot of them still look like polished oatmeal.

Visual:

- Show a text-heavy article card on a dark canvas.
- Long gray paragraphs slide in.
- A red/pink annotation highlights "flat wall of text" or simply dims the whole article.

On-screen text:

```text
AI writing needs a visual layer.
```

Motion:

- Article card appears quickly.
- Paragraph lines stack too uniformly.
- Overlay text snaps in with a small shake or underline.

## Scene 2, 0:04-0:10, Platform problem

Voiceover:

> On your own site, HTML animations are great. But on Medium, Substack, X, and newsletters, you usually need something portable.

Visual:

- Left: a small HTML animation card labeled "HTML animation".
- Right: platform cards: Medium, Substack, X, Newsletter, Docs.
- An arrow tries to move HTML into platform cards and gets blocked.
- The HTML card transforms into GIF/MP4 badges.

On-screen text:

```text
HTML embeds do not travel well.
```

Motion:

- HTML card bounces off a platform boundary.
- GIF/MP4 badges appear and pass through.

## Scene 3, 0:10-0:16, Introduce AGL

Voiceover:

> So for the HeyGen Hackathon, I built Animated Graphics Lab.

Visual:

- Product name appears.
- Small HeyGen Hackathon badge.
- Show a simplified AGL app frame with article pasted in.

On-screen text:

```text
Animated Graphics Lab
Built for the HeyGen Hackathon
```

Motion:

- Logo/title wipes in.
- App frame scales from 96% to 100%.

## Scene 4, 0:16-0:25, Automatic visual spotting

Voiceover:

> AGL reads the article, finds moments where motion would help, and turns those ideas into live HTML and GSAP previews.

Visual:

- Article paragraphs on left.
- A scanning line moves down the article.
- 3 visual spot cards appear on right:
  - "stateless vs memory agent"
  - "task -> result -> memory loop"
  - "before/after article visual"
- A badge appears briefly: "Agents can call the same flow".
- One spot expands into a live preview card.

On-screen text:

```text
Article -> visual spots -> live previews
```

Motion:

- Scan line reveals small markers.
- Cards pop in with staggered timing.
- Chosen card expands into preview.

## Scene 5, 0:25-0:33, Preview before render

Voiceover:

> The writer previews it first. If the visual misses the point, you fix it before rendering.

Visual:

- Live animation preview of "stateless agent" vs "memory-backed agent".
- Show a tiny revision input or approval switch.
- Preview receives a green "approved" check.

On-screen text:

```text
Preview first. Render after approval.
```

Motion:

- Preview loops once.
- A correction text changes from "generic loop" to "memory improves next run".
- Approval check animates on.

## Scene 6, 0:33-0:41, HyperFrames render

Voiceover:

> When it is approved, HyperFrames from HeyGen renders the animation to MP4, and AGL exports a GIF too.

Visual:

- Pipeline diagram:

```text
HTML/GSAP -> HyperFrames -> MP4 -> GIF
```

- Use HeyGen/HyperFrames label cleanly.
- Show render progress bars or frame tiles.

On-screen text:

```text
Powered by HyperFrames from HeyGen
MP4 + GIF export
```

Motion:

- Each pipeline node lights up in order.
- Frame tiles flicker into an MP4 file icon.
- MP4 duplicates into GIF.

## Scene 7, 0:41-0:49, Portable output

Voiceover:

> Now the same visual works almost anywhere you publish.

Visual:

- Same animation asset appears inside cards for Medium, Substack, X, Newsletter, Docs.
- Keep platform logos generic if brand assets are not available.

On-screen text:

```text
Medium. Substack. X. Newsletters. Docs.
```

Motion:

- GIF/MP4 asset slides into each platform card.
- Cards fan out into a grid.

## Scene 8, 0:49-0:55, Close

Voiceover:

> Animated Graphics Lab. HTML when you are designing. GIF when you are publishing.

Visual:

- Final title card.
- Optional tiny terminal/output folder behind the title:

```text
render.mp4
render.gif
article.final.md
```

On-screen text:

```text
Animated Graphics Lab
Local-first article visuals
Built for the HeyGen Hackathon
Powered by HyperFrames
```

Motion:

- Product name locks center.
- Tagline appears last.
