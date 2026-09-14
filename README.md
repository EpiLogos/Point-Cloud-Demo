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
Expressions workspace is the root route. The original React workbench is
retired legacy reference material at `/legacy.html`: clearly bannered in-app,
frozen, and excluded from feature work.

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

Live controls combines the selected formation’s glyph sequence with a personal
toolbelt of editable parameters. Add controls with their star, reorder with the
arrow buttons, and use Bind / Follow to choose a named formation or the current
selection. Toolbelt membership, order and bindings belong to each scene. Interface
appearance and panel dimensions remain browser preferences.

Select works directly on the canvas. Objects, page text and pointer controls open
local panels; Studio owns the detailed parameter pages without resizing the canvas. Every slider has an exact numeric input; Enter
commits, Escape cancels, and invalid empty values leave the field unchanged.
Studio floats over the canvas beside the right-hand toolbelt. Its focused sections
separate formations, glyph sequences, physics, pointer forces, relational forces,
material, resonance and automation. The former separate scene inspector is retired.
The thin top toolbar centres Library and Studio; formation controls sit at the left,
with the camera below. Panels have translucent backgrounds, solid focused controls,
and persistent pointer/keyboard resizing.

The scene strip distinguishes Draft, Saved and Edited since save. **Save scene**
stores an independent configuration; **Save & make next** starts a copy as a draft.
**Restore saved** restores that configuration. Scene playback uses saved versions and
skips unsaved drafts. Browser autosave backs up working edits separately; exporting
an expression retains both drafts and saved scenes. These are configuration states,
not particle runtime checkpoints. The starting menu lists recently opened local work
before the curated compositions. The question-mark button explains this workflow.

 Scenes have names, saved views and
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

## Semantic field

The continuous cymatic resonator is physically independent from chakra meaning.
Seven physical resonance anchors expose live modal energy; scene-level semantic
bindings map those anchors onto chakra definitions and bind them to ordinary moving
formations or pins. Spatial semantic colour is evaluated from world position after
the ordinary palette/entity-tint layers and never owns particles or force. Resonant
affinity, travelling focus, carrier motion and force values can be connected to
colour only through explicit authored mappings. New chakra compositions contain no
physical `chakraId` or `stationIndex` authority; those fields remain migration-only.

See [the semantic-field architecture](field-studies-journeys/docs/SEMANTIC_FIELD_REWORK.md)
and [its acceptance contract](field-studies-journeys/docs/SEMANTIC_FIELD_ACCEPTANCE.md).

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
python field-studies-journeys/tests/semantic_field_browser.py
python field-studies-journeys/tests/module_browser.py
```

Acceptance now includes 103 native/bridge/semantic regressions, 50 authoring-model checks,
six real GPU suites, the original native browser workflows, 25 Expressions workspace
checks and a 62,000-particle combined semantic-field run. The served-module test exercises the actual default route and its
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

Toolbelts now belong to individual scenes, including their order and named formation
bindings. **Add properties** opens a searchable multi-select picker with an explicit
Add selected action; there is no arbitrary 128-property limit. The right-edge ellipsis
opens the toolbelt. Its header offers property recording, take mode, and pointer controls.
Select stays a canvas tool; text and objects open their own local controls. Glyph selection
uses the formation sequence panel and a nested tree of the complete bundled glyph library.
Studio’s Glyph sequence, Morph, Travelling focus and Automation pages have separate ownership.

The footer expands into a centred scene-image strip with save, copy-next, restoration,
reordering and timing. It shares a seconds-based expression playhead with recorded
property tracks. Recording has a two-second count-in: replace reuses the last take’s
interval, while next section appends from its end. Takes retain held values, interpolate
changes, and preserve tracks outside the overwritten interval. They remain scene drafts
until saved. Native defaults and stable entity IDs are recorded through the real parameter
registry. Existing LFO/ramp layers still apply over those base values. Particle state is
not rewound by parameter scrubbing. Opening a work surface yields other large surfaces;
the toolbelt and one work surface can remain visible together, with the footer’s measured
height reserving their available space. Motion respects reduced-motion preferences.

Automation is presented as one oscillator or one-shot group with multiple parameter targets. The parameter wave button lets you choose an existing group or create a new one; **Add parameter** chooses an explicit target without creating a default Size Distribution lane. Each target retains its own range and blend. Removing the first target preserves the running group clock, including random waves and retriggered ramps, across the remaining targets. Native export/import retains membership.

LFO rate edits preserve accumulated phase. The **Morph drive** source uses the engine’s real toroidal/poloidal phase signal, including interference law, drive shape, depth and dwell. Quantum Superposition, Toroidal Hopf and Chiral Vortex Spiral remain geometry trajectories on the Morph page, where their original names and descriptions are visible. The older manifold scrub is retained for compatibility; the current entity path uses A→B Scrub and sequence controls.

The cycle monitor displays every target in its selected group. Toolbelt controls track evaluated values; direct manipulation offsets a replacing automation’s range, while **Take manual control** releases that target at its current value. Focused inputs remain stable, and slider drags do not replace their DOM nodes. Studio surfaces remain translucent.

Cursor choice and local-panel selection are independent. Text, formation sequence and object panels toggle in one click; placement controls appear only during placement. The retired three-step toolbar toggle and late pointer-inspector reopening patch are removed. Capture uses the camera icon; capture settings use the framed-image icon.
