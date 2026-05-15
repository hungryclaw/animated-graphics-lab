# Design System Visual QA

Use this checklist before demos and after UI changes.

## Viewports

- 1366x768 laptop viewport.
- 390x844 mobile viewport.
- Reduced motion enabled.
- Keyboard-only navigation.

## Checks

- Open Options.
- Hover/focus every preset.
- Confirm the larger preview rail updates.
- Confirm each preset shows actual diagram objects, readable labels, connectors, and a motion cue.
- Confirm no visible labels/descriptions/docs use brand names like Apple, Linear, Stripe, Vercel, Notion, Figma, Anthropic, etc.
- Click Compare styles and select a style.
- Paste a valid `DESIGN.md`; preview should appear with imported badge.
- Paste invalid markdown; error should be clear and non-crashing.
- Generate preview, switch style, confirm `Restyle current preview` appears.
- Confirm reduced motion does not make previews blank.
