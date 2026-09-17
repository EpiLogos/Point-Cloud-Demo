# Return-of-Zero corpus production — shared editor/engine defects for Point-Cloud-Demo #6

**Producer:** E0 parent session (issue #65), 2026-09-17, six-worker fan-out, 52 artifacts / 473 scenes.
**Law:** shared defects are repaired once here, not patched per corpus lane (EXPRESSION-PRODUCTION-SANDBOX.md §6).
Each item names the evidence and the workers that hit it. None was patched locally by corpus workers.

## High impact

1. **Schema/runtime formation-limit mismatch.** `validateJourney` admits 32 entities/scene, but the native field refuses to import above **10 formations** ("The native field supports 10 formations per scene"). A validating scene silently fails to load. E4 lost equation plates to this; E5's 13-formation spine-index had to be redesigned. Either the validator should enforce the runtime limit or the runtime should accept the schema.
2. **Capture scene navigation.** `--all-scenes`-style navigation from a script is unreliable: `__FIELD_STUDIES__.openScene` does not exist (E2 observed the live API is `setScene(index)`), and switching + a fixed settle still lags the autoplay clock, so stills drift one scene behind (E1, E2, E5, E6). Single-scene (default first-scene) captures are reliable — final covers used that path. A deterministic per-scene capture API would make draft inspection trustworthy.
3. **Sequenced-glyph rasterisation fits text to box width.** Sequence-step glyph text scales to the step's box, so narrow boxes compress equations into illegible mush (E4, E3 confirmed as a hard constraint). Boxes sized to natural string width would let derivations ride sequences.

## Medium

4. **Text-layer size floor misreports.** `TextLayer.size` below 14 is rejected with the generic "Invalid page text." — cost real debug time (E1, E3). Name the actual limit in the error.
5. **Dark-scene text contrast.** Text layers keep the light-mode `--muted` colour in `whiteOnBlack` scenes, leaving body text low-contrast (E1, E5). Text layers need a colour field or palette-follow.
6. **Field paints over text.** At high particle counts the medium renders across text layers; there is no text-protect/margin treatment (E6, visible in E0's cover acceptance pass).
7. **ASCII sources may render nothing.** ASCII-art sources validate but can produce no formation (E4; a tetraktys had to be rebuilt as text-row glyphs).
8. **Markdown renders literally** in text layers (E5 stripped it manually) — either strip or render.
9. **Cymatic default renders square.** The default cymatic shape is square; a circular template had to be set explicitly (E5).

## Minor / craft-relevant

10. **Capture chrome.** A UI dot renders bottom-left in every screenshot (E4, E5, E6, E0's own samples) — a presentation/capture mode without chrome would keep covers clean.
11. **Sequence stills are phase-dependent** (motion continues; a still catches one phase) — inherent, but a deterministic settle (fixed sim time before shot) would make covers reproducible (E1, E2).
12. **Tooling note (E0's own helper, recorded for completeness):** `production/return-of-zero/tools/capture.mjs` kills its server in a `finally`, but a hard crash can orphan it (observed once; PID killed manually).

## Repairs already landed by the parallel enablement session (not re-filed)

- Enter-commit render crash, shape-picker glyph commit-on-input, textarea validator limits (9de1105).
