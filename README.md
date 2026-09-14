# O:I — Expressions

A canvas-first instrument for living particle compositions. Place formations and
force-only pins, shape the shared medium, compose motion, and author named scenes
into a portable **expression**. The default application uses the existing native
`PointCloudField` GPU engine, not the earlier preview deformation renderer.

## Run

Node.js 22 is the tested runtime. No API key is needed for the field instrument.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:3000`). The native
Expressions workspace is the root route. The original React workbench remains
at `/legacy.html` rather than being silently discarded.

```sh
npm run build
npm run preview
```

`dist/` is a static deployment containing both applications. The independently
openable, offline build is `field-studies-journeys/field-studies.html`.
It includes the native engine, renderer, editor and expression data, with no
external scripts, font requests or network requirements. WebGL2 with floating-
point render targets is required; unsupported devices receive an explicit engine
error rather than a misleading visual fallback.

## Work on the canvas

Interact is the first and default tool. Clicking a different tool opens its
context, clicking it again closes that context, and the next click returns to
Interact. The thinner rail keeps every icon on the same centre line.

Choose **Pin**, then click to place one attractor. It remains selected and the
tool returns to Select. Drag its centre, edit exact coordinates or nudge with the
arrow keys. Its characteristic radius shows Gaussian falloff, not a hard cutoff.
Formations own particle allocations; pins do not. All forces share one medium.

The bottom-left orbital controller rotates with dragging, pans with Shift/right-
drag, and zooms with the wheel or its buttons. Axis targets and keyboard controls
provide precise alternatives. Camera gestures do not apply particle forces.
Bottom-right XYZ reports the pointer's world-space construction-plane position.
Camera orientation, working plane, arrangement plane and confinement are separate.

Contextual editing exposes Scene, Objects, Field and Motion without resizing the
canvas. The motion editor opens below it. Scenes have names, saved views and
timing; authored text is optional, with no compulsory opening caption. The scene
strip sequences whole compositions, not instantaneous physical-state seeking.
The main workspace has direct still-image and live-video icons and a small
nonmodal capture-options panel.

## The Expressions library

One Library icon opens a full-page collection with image, name and subtitle
cards. About, browser saving, import, JSON export and self-contained HTML export
live here. Browsing preserves the current expression and camera, pauses physical
time, and resumes without hidden elapsed-time catch-up.

**Modes** offers every material study, native composition preset and factory
preset as an editable starting composition. Opening one forks ordinary data;
there is no hidden mode flag overwriting later edits. Previous work stays in the
collection. Import adds entries without replacing the live expression, and an
ID conflict produces an imported variation rather than overwriting an existing
version. When browser storage is unavailable, entries remain available in the
session and the library explicitly offers portable export.

Save stores configuration in this browser; JSON exports that configuration.
Living HTML includes the expression, engine and editor. Existing `oi.journey/1`
files remain compatible: Expression is the public name, not a destructive schema
rename. Current covers come from native capture; other cards use labelled static
composition previews loaded as they come into view. Optional text in existing
user documents is preserved.

## Verify

```sh
npm run lint
npm test
npm run build
npm run test:journeys
python -m pip install -r field-studies-journeys/tests/requirements.txt
python -m playwright install chromium
npm run test:gpu
npm run test:browser
npm run test:workspace
python field-studies-journeys/tests/module_browser.py
```

Acceptance comprises 70 native/bridge regressions, 23 authoring-model checks,
five real GPU suites, 25 original browser workflows and 23 Expressions workspace
checks. The served-module test exercises the actual default route and its
module-to-standalone export. PNG and recorded video are decoded, not merely
checked for file existence.

GPU/browser fixtures use 2,048 particles with software WebGL. Set
`FIELD_HARDWARE=1` for device measurements; `CHROMIUM_EXECUTABLE` can select an
installed Chromium executable. Inline-content storage checks declare their test
double. The separate HTTP test requires a browser policy allowing its test server.
See [the native acceptance report](field-studies-journeys/docs/NATIVE_ACCEPTANCE.md)
and [the Expressions review](field-studies-journeys/docs/EXPRESSION_UI_REVIEW.md)
for coverage and limits.

## Ownership and limits

The shell schedules one frame loop; the native engine owns simulation time,
phases, automation, sequences and resonator state. A stage unit is 400 native
world pixels. There are up to ten formations and eight pins. Count changes and
explicit resets are the only particle reseed operations. The default is 62,000
particles; reduce allocation for slower hardware.

Image capture re-renders existing native state at the output dimensions without
stepping or reseeding. Video is a silent live performance with detected codecs,
fixed dimensions and review/save. Thirty frames per second is a request, not a
hardware guarantee. Recording is limited to two minutes / 128 MB and stops for a
viewport resize or hidden tab. Exact checkpoints, arbitrary physical seeking,
seamless physical loops and controlled offline clips are not implemented.
Configuration restoration does not restore accumulated particle/resonator state.

The original handoff and UX contracts remain in `field-studies-journeys/docs/`.
The later Expressions review records the user's visual refinements. Original
snapshots and legacy browser keys are never overwritten by conversion.

## Physis desktop integration

This checkout also provides the local `physis` command, an Omarchy bar toggle,
transparent desktop rendering, and direct capture-to-screensaver storage. See
[PHYSIS.md](PHYSIS.md) for installation, controls and desktop-specific validation.
