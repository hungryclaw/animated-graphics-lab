# Short demo video script

**Target length:** 45-55 seconds  
**Tone:** fast, writer-first, a little punchy  
**Format:** screen recording + quick cuts + voiceover  
**Core line:** HTML when you are designing. GIF when you are publishing.

---

## Version A: punchy 50-second script

### 0:00-0:04 — Bland article hook

**Visual:** A boring, text-heavy AI article on screen. Highlight a long paragraph.

**Voiceover:**

AI can write articles fast. A lot of them still look like polished oatmeal.

**On-screen text:**

AI writing needs a visual layer.

---

### 0:04-0:10 — Platform problem

**Visual:** Quick cards for Medium, Substack, X, newsletter, docs. Then show an HTML animation with a “can’t embed this here” label.

**Voiceover:**

On your own site, HTML animations are great. But on Medium, Substack, X, and newsletters, you usually need something portable.

**On-screen text:**

HTML embeds do not travel well.

---

### 0:10-0:16 — Introduce AGL

**Visual:** Animated Graphics Lab UI. Paste a normal article or article idea. Do not show implementation syntax in the main cut.

**Voiceover:**

So for the HeyGen Hackathon, I built Animated Graphics Lab.

**On-screen text:**

Animated Graphics Lab
Built for the HeyGen Hackathon

---

### 0:16-0:25 — Autonomous visual spotting

**Visual:** Click/analyze article. Show AGL finding 3-5 visual opportunities in the draft. Optional fast flash: "agents can call the same flow" as a secondary badge.

**Voiceover:**

AGL reads the article, finds moments where motion would help, and turns those ideas into live HTML and GSAP previews.

**On-screen text:**

Article -> visual spots -> live previews

---

### 0:25-0:33 — Preview before render

**Visual:** Show the animation preview in the app. Then show a small revision or approval action.

**Voiceover:**

The writer previews it first. If the visual misses the point, you fix it before rendering.

**On-screen text:**

Preview first. Render after approval.

---

### 0:33-0:41 — HyperFrames render

**Visual:** Render progress: HTML/GSAP -> HyperFrames -> MP4 -> GIF.

**Voiceover:**

When it is approved, HyperFrames from HeyGen renders the animation to MP4, and AGL exports a GIF too.

**On-screen text:**

Powered by HyperFrames from HeyGen
MP4 + GIF export

---

### 0:41-0:49 — Portable output

**Visual:** Same GIF shown inside Medium/Substack/X/newsletter mockups or article previews.

**Voiceover:**

Now the same visual works almost anywhere you publish.

**On-screen text:**

Medium. Substack. X. Newsletters. Docs.

---

### 0:49-0:55 — Closing card

**Visual:** Final product logo/card. Optional quick terminal shot showing local run output folder.

**Voiceover:**

Animated Graphics Lab. HTML when you are designing. GIF when you are publishing.

**On-screen text:**

Animated Graphics Lab
Local-first article visuals
Built for the HeyGen Hackathon
Powered by HyperFrames

---

## Version B: even shorter 30-second script

**Visual:** Bland article.

**Voiceover:**

AI can write articles fast. But too many of them feel visually dead.

**Visual:** Medium, Substack, X cards. HTML animation blocked.

**Voiceover:**

HTML animations are great on your own site. They do not travel well to Medium, Substack, X, or newsletters.

**Visual:** AGL analyzes a normal article and suggests visual spots.

**Voiceover:**

Animated Graphics Lab reads an article and finds the moments where animation would actually help.

**Visual:** Live preview.

**Voiceover:**

It turns those spots into live HTML and GSAP previews, so the writer can approve the visual before rendering.

**Visual:** HyperFrames render -> MP4 -> GIF.

**Voiceover:**

Then HyperFrames from HeyGen renders the animation into portable MP4 and GIF assets.

**Visual:** GIF embedded in article/social mocks.

**Voiceover:**

HTML when you are designing. GIF when you are publishing.

**Final card:**

Animated Graphics Lab
Built for the HeyGen Hackathon
Powered by HyperFrames

---

## Screen recording checklist

Capture these shots in order:

1. Boring text-only article.
2. Platform cards: Medium, Substack, X, newsletter, docs.
3. AGL app open in article mode.
4. Paste a normal article, for example:

```md
# Memory Makes Agents Compound

Most agents are stateless workers. They complete a task, lose the context, and repeat the same mistakes later.

The difference is not magic. It is continuity. A memory-backed agent can use previous results to make the next run better.
```

5. Click the article analysis / find visual spots action.
6. Show AGL suggesting visual spots.
7. Generate live preview for one suggested spot.
8. Show preview animation.
9. Show render progress.
10. Show final `render.mp4` and `render.gif` output.
11. Show GIF/MP4 inside an article or social mockup.
12. Optional secondary shot: an agent or local runner calling the same flow.
13. Final title card.

---

## Captions / title card text

Use these as short overlays:

- AI writing needs a visual layer.
- HTML embeds do not travel well.
- Finds visual spots automatically.
- Preview first.
- Render with HyperFrames.
- Export GIF + MP4.
- Publish anywhere.
- HTML when you are designing. GIF when you are publishing.

---

## Notes

Do not make the video feel like a generic AI design tool pitch. The hook is the writer pain. The main proof is normal article -> automatic visual spot detection -> preview -> HyperFrames render -> portable GIF/MP4 flow. Agent integration is a supporting point, not the main demo path.
