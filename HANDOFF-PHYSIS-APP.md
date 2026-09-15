# Handoff: rebuild Physis as the "Physis" Omarchy web app

> **Status: implemented** on `feat/physis-webapp` (2026-09-15) — main `7306b7b`
> plus the ported desktop commits, with hardware detection (`server/quality.mjs`,
> `src/physis/hardware.ts`), auto/eco quality tiers, adaptive render surfaces,
> and `scripts/install-webapp.py`. See PHYSIS.md "Web app delivery" for usage.
> Kept as the original brief and hardware record.

Written 2026-09-15 after decommissioning the Physis desktop system (screensaver,
bar widget, service). The code is retained and this file is the brief for the
subagent that rebuilds it. Do not resurrect the removed desktop integration as
it was — the target architecture is different (web app wrapper).

## Mission (user's words, structured)

1. Update Physis to the newest form: **`main` @ `7306b7b`** — "feat(expressions):
   pin cycle clocks, live cycle surface, render-cost and interaction polish"
   (pushed as `22c02d5..7306b7b` on EpiLogos/Point-Cloud-Demo).
2. Refine the actual system for this Linux machine (Omarchy / Hyprland).
3. Run the full thing simply in an **Omarchy web app wrapper named "Physis"** —
   full app experience (studio + desktop scene), not a dev server URL.
4. Add a **hardware detection + quality affordance system** around particle
   count and other render params, because this machine is weak (see profile).

## Code geography

- Repo: `/home/frank/Central/Work/Physis` (origin: EpiLogos/Point-Cloud-Demo).
- `main` = `7306b7b` (newest upstream, fetched & ff-ed 2026-09-15).
- `feat/physis-master` = `187cd63`, 3 commits ahead of `origin/master`
  (`040627d`) — the desktop/screensaver integration that was just decommissioned.
  Working tree clean; nothing lost.
- `feat/physis-desktop` = `bc486a2` — older `main`-based desktop checkpoint.
- `PHYSIS.md` documents the previous architecture (native GTK/WebKit host,
  loopback node server, systemd unit). Read it first; most of it still applies
  to the engine/server, less to the delivery shell.

## What was removed from the desktop (2026-09-15)

- `physis.service` (user unit) — stopped, disabled, unit file deleted.
- `~/.local/bin/physis` CLI shim and `~/.local/share/applications/physis.desktop`.
- Omarchy bar plugin `org.epilogos.physis` (bar widget) —
  directory deleted and entry removed from `~/.config/omarchy/shell.json`.
- `frank.idle` screensaver command restored from `physis screensaver` back to
  `~/.local/bin/oi-screensaver` (mpv point-cloud videos, app-id
  `org.omarchy.screensaver`). Pre-physis copies:
  `~/.local/state/physis/backups/20260914-020453/`.
- **Kept on purpose:** the media library `~/.local/share/physis/`
  (images/videos/scenes/thumbnails/settings.json) and the whole repo.

## Hardware profile (measured 2026-09-15)

Old MacBook Air (Ivy Bridge era):

- CPU: Intel i5-3427U @ 1.80 GHz (2 cores / 4 threads, max 2.8 GHz).
- GPU: Intel HD Graphics 4000 (i915), no discrete GPU. Old Mesa; treat WebGL2
  extensions as unreliable, prefer plain point-sprite rendering.
- RAM: 3.7 GiB total, typically only ~1.2 GiB available. A Docker container
  running Java holds ~1.2 GiB. **The machine OOM-crashed out of its graphical
  session on 2026-09-15** (global OOM killed chromium + omarchy shell). Memory
  discipline is not optional: cap worker count, avoid large preallocated
  buffers, watch `MemAvailable`.
- Previous finding (PHYSIS.md): Quickshell/Qt WebEngine fails to initialize on
  this machine — that is why the old build used a native GTK/WebKit host. Any
  web-app wrapper choice must be tested here (WebKitGTK-based `omarchy
  webapp`/spawn vs a firefox/chromium app window) before committing.

## Hardware detection + quality affordance spec

There is already a manual quality system: `physis quality
gentle|balanced|fluid` → fps 20/30/60, particleLimit 50k/100k/200k,
pixelRatio 0.75/1.0/1.0 (see `scripts/physis`, wired to `/api/overlay`).
The screensaver also has an adaptive loop (60 fps target, pixel ratio
0.85 → 0.5 below 40 fps) and a 16k particle cap. Build on these; don't
duplicate them.

### 1. Detection (run at app start, cache in settings.json)

Browser-side (preferred, works in any wrapper):

- `navigator.deviceMemory` (GiB, capped at 8), `navigator.hardwareConcurrency`.
- `WEBGL_debug_renderer_info` renderer string → classify: "HD Graphics 4000/4400"
  and pre-2020 Intel iGPU → low tier; Apple/AMD/discrete → higher tiers.
- `devicePixelRatio` × screen area → effective pixel throughput demand.

Server-side (loopback node server already exists):

- `/proc/meminfo` `MemAvailable`, `/proc/pressure/memory` & `/proc/pressure/cpu`
  (PSI) sampled every few seconds — this machine's PSI will spike from the
  Docker Java container and Chromium; use it as a *co-*signal, not the only one.
- Optionally `/sys/class/drm/card*/` for the active GPU.

### 2. Tier mapping (initial values; recalibrate on this machine)

| Tier | fps cap | particle budget | pixel ratio | notes |
|------|---------|-----------------|-------------|-------|
| eco (auto on this machine) | 24–30 | 6k–12k | 0.5–0.66 | no overlays/post FX |
| balanced | 30 | 25k | 0.75 | |
| fluid | 60 | 50k+ | 1.0 | only if detection says so |

The old presets (50k/100k/200k) are far too optimistic for HD 4000 — measured
reality here was 43–58 fps at **16k particles / 0.75 ratio** (PHYSIS.md), under
no competing load. Start eco below that.

### 3. Affordance (the "nice" part — make the system legible)

- Auto tier by default, shown in UI as a badge: "Eco · auto (Intel HD 4000,
  1.2 GiB free)" with a manual override (Eco/Balanced/Fluid/Auto) persisted in
  settings.json.
- First-run 2-second probe: render 2k → 64k particles, measure frame time,
  pick tier; skip if a saved tier exists.
- Live readout (fps, particle count, pixel ratio) in the desktop-controls panel
  (`field-studies-journeys/src/physis.ts` already hosts those controls).
- Hysteresis: degrade fast (2 consecutive seconds below target fps → drop pixel
  ratio 15%, then particle budget 25%), recover slow (10 s above target → step
  back one notch). Never thrash. Log tier changes to the server log.
- Idle/tab-hidden pauses already exist upstream — keep them; on this machine
  also pause rendering while the O:I mpv screensaver or lock screen is up.

### 4. Placement

- Detection module: `src/physis/hardware.ts` (browser) + optional
  `server/hardware.mjs` endpoint returning MemAvailable/PSI.
- Tier logic: extend the existing quality object in `server/index.mjs` state
  API so `scripts/physis quality auto` works like the other tiers.
- UI affordance: desktop-controls panel + CLI (`physis status` already dumps
  state JSON — include the tier and live fps there).

## Wrapper guidance

- Name must be exactly **"Physis"** so `omarchy launch or-focus-webapp Physis`
  keeps working (the old CLI already used it — match the URL/WM-class).
- Verify which browser engine the omarchy webapp wrapper uses on this machine
  and that WebGL actually initializes in it (Qt WebEngine did NOT). Fallback
  that already works here: the GTK/WebKit host in `desktop/` — it can host the
  same `render.html` full-bleed if a pure-web wrapper falls short.
- Keep the loopback-only server posture (origin/Host/client-header checks in
  `server/index.mjs`).

## Verification checklist

1. `npx tsx --test tests/ambient.test.ts`, `npm run test:physis`,
   `npm run test:physis:browser` (README + PHYSIS.md).
2. On this machine: eco tier holds ≥ 24 fps with Chromium + Docker Java running.
3. `MemAvailable` never driven below ~300 MiB by Physis.
4. Idle → screensaver path still works with `oi-screensaver` OR the new Physis
   screensaver, user's choice — ask before switching the idle plugin again.
