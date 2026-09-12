# O:I — Field Studies

A canvas-first instrument for living particle compositions. Place formations and
force-only pins, shape the shared medium, compose motion, and author named scenes
into a portable **journey**. The default application uses the existing native
`PointCloudField` GPU engine — not the earlier preview deformation renderer.

## Run

Node.js 22 is the tested runtime. No API key is needed for the field instrument.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:3000`). The new native
journey instrument is the root route. The original React workbench is retained
at `/legacy.html` rather than silently discarded.

```sh
npm run build
npm run preview
```

`dist/` is a static deployment containing both applications. The independently
openable, offline build is `field-studies-journeys/field-studies.html`.
It includes the native engine, renderer, editor and journey data; there are no
external scripts, font requests or network requirements in that standalone file.
WebGL2 with floating-point render targets is required; unsupported devices receive
an explicit engine error instead of a misleading visual fallback.

## Work on the canvas

Choose **Pin**, then click to place one attractor. It remains selected and the
tool returns to Select. Drag its centre, edit exact coordinates or nudge with the
arrow keys. Its characteristic radius shows Gaussian falloff, not a hard cutoff.
Formations own particle allocations; pins do not. All forces share one medium.

Open Edit to inspect Scene, Objects, Field or Motion. Motion opens below the
canvas; inspectors never resize the artwork. Scenes have names, optional page
text, saved views and timing. The scene strip sequences whole compositions; it
is not an instant physics scrubber. The Library includes editable seven-centre,
Kundalini and chakra/resonance compositions, with separate add and replace actions.

**Save journey** stores configuration in this browser. **Export journey** writes
that configuration to a file. **Living artifact** exports a self-contained HTML
journey with the editor inside. **Capture image** re-renders the current native
state at the chosen dimensions. **Record performance** captures clean live
frames, with detected codec support, fixed dimensions, limits and review/save.

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
python field-studies-journeys/tests/module_browser.py
```

GPU/browser tests default to software WebGL. Set `FIELD_HARDWARE=1` for device
measurements. `CHROMIUM_EXECUTABLE` can select an installed Chromium executable.
The GPU and interaction suites use inline local content; the module-entry test
uses a local HTTP server and therefore needs a browser policy that permits it.

The tested baseline comprises 70 native/bridge regressions, 19 authoring-model
checks, five GPU acceptance suites and 25 browser workflows. Inspect the evidence
and limitations in [the native acceptance report](field-studies-journeys/docs/NATIVE_ACCEPTANCE.md).

## Ownership and limits

The shell schedules one frame loop; the native engine owns simulation time,
phases, automation, sequences and resonator state. A stage unit is 400 native
world pixels. There are up to ten formations and eight pins. Count changes and
explicit resets are the only particle reseed operations. The default is 62,000
particles; reduce allocation for slower hardware.

Thirty frames per second is a recording request, not a performance guarantee.
Recordings are silent, limited to two minutes / 128 MB, and stop for a viewport
resize or hidden tab. Exact checkpoints, physical seeking, seamless-loop claims
and controlled offline clip rendering are **not implemented**. A saved journey
restores its configuration, not the accumulated particle/resonator state.

The full original handoff and UX contracts remain in
`field-studies-journeys/docs/`; implementation differences and the native parameter
inventory are documented beside them. Original snapshots and legacy browser keys
are never overwritten by conversion.
