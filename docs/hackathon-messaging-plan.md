# Hackathon messaging plan

> **For Hermes:** This is a copy and positioning plan, not an implementation plan. Use it as the shared language source for the live site, GitHub repo, local app, and demo video.

**Goal:** Keep Animated Graphics Lab consistent everywhere judges and users see it.

**Core idea:** AGL starts from a writer problem, not a rendering demo. AI can produce more articles, but many of them feel visually flat. AGL gives agents and writers a local-first way to turn article context into portable animated visuals, rendered with HyperFrames from HeyGen and exported as GIF/MP4 assets that work on platforms that do not allow arbitrary HTML embeds.

**Primary audience:** HeyGen Hackathon judges, agent builders, technical writers, newsletter writers, indie tool builders, and people publishing on Medium, Substack, X, docs, or owned sites.

---

## 1. The plain-English pitch

Use this whenever space allows:

Animated Graphics Lab is a local-first visual layer for AI-assisted writing. A writing agent can place `AGL_GRAPHIC` markers inside an article, AGL turns those markers into live HTML animation previews, and HyperFrames from HeyGen renders the approved animation into GIF/MP4 files that can be used anywhere.

The writer gets preview-before-render control. The agent gets a simple contract. The output works on Medium, Substack, X, newsletters, docs, and owned websites.

## 2. One-liners

Use these across the repo, site, app, and video:

- HTML when you are designing. GIF when you are publishing.
- A local-first visual layer for AI-assisted articles.
- Turn article context into portable animated visuals.
- Agents write the visual intent. HyperFrames renders the asset.
- Preview the animation before spending render time.
- Built for writers publishing on platforms they do not control.
- Powered by HyperFrames from HeyGen.
- Built for the HeyGen Hackathon.

Best short tagline:

```text
HTML when you are designing. GIF when you are publishing.
```

Best technical tagline:

```text
Agent-written article context -> HTML/GSAP preview -> HyperFrames render -> GIF/MP4 export.
```

Best writer-first tagline:

```text
AI writing needs a visual layer.
```

## 3. Words and phrases to use

Use:

- writer-first
- local-first
- agent-native
- article-native
- visual layer
- visual intent
- visual spots
- `AGL_GRAPHIC` placeholders
- live preview
- preview-before-render
- approved animation
- portable media
- GIF/MP4 export
- HTML/GSAP animation
- HyperFrames render
- local runner
- local credentials
- owned site
- platforms you do not control
- Medium, Substack, X, newsletters, docs

Use carefully:

- autonomous, only for the CLI flow
- cloud, only for the demo/docs surface
- hosted, only when explaining the public Cloudflare page
- BYOK, only in setup docs or settings
- deterministic, only for validation/render architecture, not marketing copy

Avoid:

- seamless
- game-changing
- revolutionary
- democratize
- unlock creativity
- vibrant ecosystem
- robust platform
- cutting-edge
- delve
- leverage, unless in a technical sentence where it is unavoidable
- magic
- AI-powered creativity slop
- generic "create stunning visuals" language

## 4. Messaging hierarchy

### Level 1: Writer problem

AI can write articles fast. Many still feel flat. Text alone often fails to carry the mechanism, rhythm, or memory of an idea.

### Level 2: Platform problem

HTML animations are great on owned websites, but writers also publish on Medium, Substack, X, newsletters, and docs. Those platforms usually do not allow arbitrary HTML animation embeds.

### Level 3: AGL solution

AGL lets agents mark visual moments inside the article, turns those markers into live HTML/GSAP previews, then renders approved animations with HyperFrames from HeyGen.

### Level 4: Output promise

The final asset is portable: GIF/MP4 plus exported Markdown/HTML. It can travel across platforms without relying on fragile custom embeds.

### Level 5: Trust promise

The production flow runs locally. Agent credentials and subscription access stay on the user's device. The hosted site is a demo and documentation surface.

## 5. Product story

Use this as the canonical narrative:

I built AGL from a writer's point of view. AI can help draft articles, but many generated articles still look and feel like polished walls of text. A useful visual can make an idea easier to remember, especially when the article explains a loop, workflow, comparison, system, or transformation.

On an owned website, the answer could be direct HTML animation. But most writers also publish on platforms they do not control. Medium, Substack, X, newsletters, and docs do not give you full animation embed freedom.

AGL bridges that gap. A writing agent adds `AGL_GRAPHIC` placeholders where a visual would help. AGL imports those placeholders, generates live HTML/GSAP previews, lets the writer approve or revise them, then uses HyperFrames from HeyGen to render portable GIFs and MP4s.

The result is a workflow where agents can help create visual intent, writers keep control, and the final media works almost anywhere.

## 6. Live site direction

The live site should be positioned as:

```text
Demo + documentation hub. Private rendering runs locally.
```

Hero copy option:

```text
Turn articles into animated graphics without losing local control.
```

Subhead option:

```text
Animated Graphics Lab lets agents mark visual moments inside an article, previews them as HTML/GSAP animations, then renders approved visuals with HyperFrames from HeyGen into GIFs and MP4s you can publish anywhere.
```

Primary CTA labels:

- Try the article demo
- Import graphic placeholders
- View local setup
- Open GitHub repo

Secondary copy blocks:

### For writers

```text
Add motion where the idea needs it. AGL turns article context into short visual moments that make mechanisms, comparisons, and workflows easier to follow.
```

### For agents

```text
Agents do not need to render files. They write normal Markdown and add `AGL_GRAPHIC` comments where a visual would help. AGL handles preview, revision, render, and export.
```

### For local users

```text
Use the hosted page for demo and docs. Run the full private flow locally so Codex/Hermes credentials and render artifacts stay on your machine.
```

### For judges

```text
Evaluate the contract: article context -> visual placeholder -> live preview -> HyperFrames render -> GIF/MP4 export.
```

Site sections to prioritize:

1. Hero: writer pain + portable animation promise.
2. Demo path: paste article, import placeholders, preview, render, export.
3. Agent contract: show the `AGL_GRAPHIC` block.
4. Local-first architecture: credentials stay local, hosted page is docs/demo.
5. HyperFrames from HeyGen: HTML animation rendered to MP4.
6. Judge path: five-minute evaluation checklist.

## 7. GitHub repo direction

The README should answer these in the first screen:

1. What is it?
2. Why does it exist?
3. How is HeyGen/HyperFrames used?
4. What can a judge run in five minutes?
5. What stays local?

Recommended README opening:

```md
# Animated Graphics Lab

Animated Graphics Lab is a local-first visual layer for AI-assisted articles. Writing agents add `AGL_GRAPHIC` placeholders where an animation would help the reader. AGL turns those placeholders into live HTML/GSAP previews, renders approved animations with HyperFrames from HeyGen, and exports GIF/MP4 assets that work on Medium, Substack, X, newsletters, docs, and owned sites.

Built for the HeyGen Hackathon. Powered by HyperFrames.
```

Recommended repo bullets:

- `AGL_GRAPHIC` gives agents a simple visual-intent contract.
- Preview-before-render keeps the writer in control.
- HyperFrames turns approved HTML/GSAP into MP4.
- ffmpeg converts MP4 into GIF for article embeds.
- The hosted Cloudflare page is the demo/docs surface.
- The private production flow runs locally.
- Codex/Hermes credentials stay on the user's device.

Docs to keep linked from README:

- `docs/agents.md`
- `docs/agent-instruction-pack.md`
- `docs/local-quickstart.md`
- `docs/macbook-local-testing.md`
- `docs/hackathon-judge-guide.md`
- `docs/hackathon-local-setup.md`
- `docs/hackathon-messaging-plan.md`

## 8. Local app direction

The local app should feel like a writing tool, not a render dashboard.

Preferred language:

- Article mode
- Visual spots
- Import graphic placeholders
- Generate live preview
- Revise preview
- Approve render
- Export article

Avoid making the app sound like a generic AI image generator. The user is not asking for a random graphic. They are turning a specific article moment into a small animation.

Good UI microcopy:

```text
Paste an article. AGL will find moments where motion can clarify the idea.
```

```text
Import `AGL_GRAPHIC` placeholders from your agent draft.
```

```text
Preview first. Render only after the visual matches the argument.
```

```text
Rendered with HyperFrames from HeyGen. Exported as GIF/MP4 for platforms that do not support HTML embeds.
```

```text
Local mode keeps your agent credentials and render artifacts on this machine.
```

Progress labels:

- Reading article context
- Finding visual spots
- Local agent drafting HTML animation
- Live preview ready
- HyperFrames rendering MP4
- Converting GIF with ffmpeg
- Export ready

Empty state idea:

```text
Start with an article, not a prompt.

AGL works best when the animation has context. Paste a draft or use an agent-written article with `AGL_GRAPHIC` placeholders.
```

## 9. Demo video direction

### Video thesis

```text
AI writing needs a visual layer, and that layer has to survive real publishing platforms.
```

### Runtime target

60-90 seconds.

### Opening hook options

Option A:

```text
AI can write articles fast. But a lot of those articles still feel flat.
```

Option B:

```text
I built this because I write, and I got tired of AI articles looking like polished oatmeal.
```

Option C:

```text
HTML animations are beautiful. Medium, Substack, and X usually do not want your HTML.
```

### Scene plan

1. Bland article
   - Show a text-heavy AI article.
   - Line: "AI can write articles fast. The result can still feel visually dead."

2. Platform constraint
   - Show Medium/Substack/X/newsletter cards.
   - Line: "On your own site, you can embed HTML. On publishing platforms, you usually need GIF or MP4."

3. AGL placeholder
   - Show an article with an `AGL_GRAPHIC` block.
   - Line: "AGL gives agents a simple way to mark visual intent inside the article."

4. Live preview
   - Show AGL importing the placeholder and generating a browser preview.
   - Line: "The writer previews and revises before render. No blind generation."

5. HyperFrames render
   - Show progress: HTML/GSAP -> HyperFrames -> MP4 -> GIF.
   - Line: "HyperFrames from HeyGen turns the approved animation into portable media."

6. Published output
   - Show the same GIF/MP4 inside article/social contexts.
   - Line: "Now the visual works on Medium, Substack, X, newsletters, docs, and owned sites."

7. Local/agent close
   - Show terminal/local runner and output folder.
   - Line: "The full flow runs locally, integrates with agents, and keeps credentials on your device."

8. Final card
   - Text: "Animated Graphics Lab. HTML when you are designing. GIF when you are publishing. Built for the HeyGen Hackathon. Powered by HyperFrames."

### Demo source material

Use this article title:

```text
Memory Makes Agents Compound
```

Use this short article body:

```md
# Memory Makes Agents Compound

Most agents are stateless workers. They complete a task, lose the context, and repeat the same mistakes later.

<!-- AGL_GRAPHIC
id: stateless-vs-memory-agent
type: comparison
description: Compare a stateless agent loop that forgets each task with a memory-backed agent loop that improves after every task.
caption: Memory turns isolated tasks into compounding progress.
placement: after
aspect: articleBanner
duration: 7
must_include:
  - stateless loop
  - memory layer
  - improved next run
avoid:
  - fake dashboard chrome
  - neon AI brain
  - full colored background
-->

The difference is not magic. It is continuity.
```

Why this works:

- The visual idea is easy to understand.
- It shows comparison, loop, memory, and improvement.
- It avoids generic AI mascots.
- It demonstrates why motion helps.

### Final video narration draft

```text
AI can write articles fast. But a lot of those articles still feel flat. The words are there, but the idea has no visual rhythm.

As a writer, I wanted a way to add animated visuals to articles without depending on custom embeds. On my own site I can use HTML animations. But on Medium, Substack, X, newsletters, and docs, that usually does not work.

So for the HeyGen Hackathon, I built Animated Graphics Lab.

AGL is local-first and agent-native. A writing agent can add `AGL_GRAPHIC` placeholders inside an article. The app turns those placeholders into live HTML and GSAP previews, so the writer can inspect the visual before rendering.

When the preview is approved, HyperFrames from HeyGen renders the animation into MP4, and AGL exports GIFs and article files that can be used almost anywhere.

The workflow is simple: write the article, mark the visual, preview the animation, render with HyperFrames, ship the GIF.

HTML when you are designing. GIF when you are publishing.
```

## 10. Architecture language

Use this diagram everywhere:

```text
Article draft or agent topic
  -> AGL_GRAPHIC placeholders
  -> local agent adapter
  -> HTML/GSAP live preview
  -> writer approval or revision
  -> HyperFrames MP4 render
  -> ffmpeg GIF conversion
  -> Markdown/HTML export
  -> Medium/Substack/X/newsletters/docs
```

Short version:

```text
Article context -> visual intent -> HTML preview -> HyperFrames render -> GIF/MP4 export.
```

## 11. What to show, not just say

For the site:

- A before/after article.
- A real `AGL_GRAPHIC` block.
- The preview-before-render loop.
- Local setup commands.
- Output folder shape.

For GitHub:

- Five-minute judge path.
- Exact commands.
- Output tree.
- Security/local-first notes.
- Agent instruction pack.

For local app:

- Article mode first.
- Graphic mode secondary.
- Design presets as supporting tools, not the headline.
- Clear status labels during long work.

For video:

- Open with text-only article pain.
- Show the platform constraint.
- Show placeholder import.
- Show preview.
- Show HyperFrames render.
- Show exported GIF/MP4 in multiple places.

## 12. Copy quality rules

- Lead with the writer problem.
- Mention HeyGen Hackathon and HyperFrames, but do not make the whole story vendor-first.
- Say "agents" when explaining the contract, not as generic AI hype.
- Say "local-first" only when explaining privacy/control.
- Say "portable media" or "GIF/MP4" when explaining why this matters for platforms.
- Prefer concrete nouns over hype.
- Keep sentences short in UI copy.
- Do not promise perfect design output. Promise preview, revision, render, and export.

## 13. Acceptance checklist

Before updating site/repo/app/video copy, check:

- [ ] Does the first screen explain the writer problem?
- [ ] Does it say this is built for the HeyGen Hackathon?
- [ ] Does it say HyperFrames from HeyGen renders the animation?
- [ ] Does it explain why GIF/MP4 matters?
- [ ] Does it explain that private production runs locally?
- [ ] Does it show the `AGL_GRAPHIC` contract?
- [ ] Does it avoid generic AI marketing language?
- [ ] Does it make clear that preview happens before render?
- [ ] Does it point judges to a five-minute path?
