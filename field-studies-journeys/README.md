# O:I · Field Studies / Journeys

A functioning canvas-first authoring shell built from the supplied alternate visual direction. The large stippled O/I, cream paper, crosshair, editorial typography and restrained transport survive. The alternate simulation engine does not.

Open **`field-studies.html`** directly in a modern browser. No build, server, account, external assets or fonts are needed for the standalone version. The browser must allow scripts in the downloaded HTML. The same file is deployed as `public/index.html` for ordinary static hosting.

## Explore

The opening is **Ink**, the first of eight named scenes. Use the bottom arrows to explore; **Journey** plays the whole passage. Click the scene name to see its strip. **Shape this scene** opens contextual editing without shrinking or rebuilding the canvas. The O/I wordmark opens the library, including Seven centres and A small language.

Choose **Pin** (P), then click where the force centre belongs. Move its centre or falloff handle, or enter exact coordinates. Choose **Formation** (A) to place a glyph or shape. The visible working plane determines depth; the camera does not change the physics. Select from the canvas or Objects; Shift-click adds to selection. The editor exposes Scene, Objects, Field and Motion in context.

A scene contains its name, character, formations, pins, spatial arrangement, material, phase instrument, sequences, automation, optional page text and saved view. A journey arranges whole scenes in time. Page text can be edited, moved, added or removed; it is part of the artwork rather than interface chrome.

**Keep this journey** distinguishes four outputs: a clean PNG image, a silent live video, an editable JSON journey, and a self-contained living HTML artifact. Live recording has fixed output dimensions, requests 30 fps, detects the browser encoder, and is bounded to two minutes / approximately 128 MB buffered data. It is not an offline deterministic renderer.

## What is real here, and what awaits your engine

Authoring, scene playback, placement, sequences, clocks, evaluated automation, text, file exports and native media capture are implemented. A separate WebGL **layout preview** makes that experience usable and visually alive. It renders authored glyphs, grain treatments and procedural spatial deformations. It is **not fluid simulation, sand transport, or a physical resonator**. The label and unavailable controls say so throughout the UI.

The preview retains the interesting material controls: size distribution, print-lattice irregularity, roundness, ragged edges, softness, elongation/orientation, density contrast/phase/scale, edge emphasis, halo, thickness and warp. Physical controls and a continuous resonant band have an explicit integration home but do not pretend to operate. When WebGL is unavailable there is a reduced Canvas2D layout fallback; it is not visually or parametrically equivalent to the WebGL preview.

**`docs/ENGINE_HANDOFF.md` is the dev-agent entry point.** Read it before integrating `fieldModel.ts`, `entityRuntime.ts` and `PointCloudField.ts` from the actual production repository. Those production sources were not in the supplied ZIP and were not changed here. In particular, the reported production pin bug still requires reproduction and repair there.

## Develop

Requires Node.js 20.11+ and TypeScript 5.8.3. No runtime packages.

```sh
npm install
npm run build
npm run dev
```

The dev server listens on port 4173. `npm run build` performs strict TypeScript checks, creates ES modules in `build/` for tests, and emits the self-contained site. Do not edit generated HTML or `build/` as source.

```sh
npm test                 # strict build + model/clock/camera/history tests
npm run test:browser     # Python, Playwright, Chromium; see tests/harness.py
```

The recorded browser suite uses real software WebGL and real browser media encoding. Its explicit in-memory storage test double isolates persistence from the container's opaque local-content origin. Read `docs/TEST_REPORT.md` for actual evidence and exclusions. No browser URL security policies are disabled by the harness.

## Source map

`model.ts` owns the separate journey authoring schema and curated starting points. `store.ts` owns edit history and the browser library. `camera.ts` owns coordinate projection and explicit plane placement. `timeline.ts` contains pure timing/sequence/automation/layout evaluation. `registry.ts` lists controls. `inspector.ts` renders scoped controls. `app.ts` routes input, commands, the single preview clock and page composition. `capture.ts` owns clean output. `engine.ts` defines the replaceable boundary; **`preview.ts` is disposable**, not a simulation module to port.

## Storage and deployment

The format is **`oi.journey`, version 1**. It is intentionally not the existing engine's schema-4 snapshot. Unsupported documents fail visibly instead of being silently “migrated.” Journeys are editable configurations, not particle/resonator checkpoints. Browser storage belongs to the current origin and can be unavailable; export a file for portability. The library keeps the latest 24 journeys on this origin.

For hosting, deploy the `public/` directory as a static site; no backend or secrets are required. Downloaded HTML is a working standalone site, not a publicly hosted URL. The requested public preview remains dependent on an authorised hosting connection.

MIT. UI visual direction and the graphics-test environment are derived from the user's supplied MIT-licensed alternate project. No bundled font files or proprietary assets.

For browser-test prerequisites, install `tests/requirements.txt` in a Python environment and install a Playwright Chromium browser or supply `CHROMIUM_EXECUTABLE`. Xvfb is used automatically when available on Linux.
