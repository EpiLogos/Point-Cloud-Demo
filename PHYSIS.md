# Physis on Omarchy

Physis hosts the **current `master` Expressions application**, based on `569a9eb`, with local media storage, a video screensaver and a click-through Wayland renderer. The original editor, native engine, built-in capture workflow, expression library, and offline export remain the source of truth. The old React workbench is still at `/legacy.html` as upstream specifies.

```sh
physis                       # open/focus the Expressions studio
physis overlay toggle        # or: on / off
physis screensaver           # preview the video screensaver
physis library               # open the output directory
physis status
```

**✧ in the Omarchy bar** toggles the live desktop scene; right-click opens Physis. **✧ in the application's top toolbar** opens desktop controls: use the current scene, toggle rendering, adjust opacity/quality, save an expression to disk, or load a disk copy. The bar says ON after the native renderer reports its first frame.

Use the application's existing **Capture image** icon and **Record video → Stop → Save recording** workflow. When hosted by Physis, these write to `~/.local/share/physis/images/` and `videos/`. Capture options retain upstream's output size, aspect, text inclusion, and transparent-PNG controls. On ordinary websites and in offline HTML exports, they retain upstream's normal browser downloads.

`scenes/` stores the full `oi.journey` expression, selected scene index, and current camera in a version-2 Physis envelope. Capture metadata links to that expression and preserves output settings. Older version-1 Physis scene configurations remain readable through the current engine's native migration. Saving is configuration persistence, not a simulation checkpoint.

Completed videos feed the existing Omarchy idle integration at 150 seconds; locking remains at 300 seconds. Playback shuffles and loops complete Physis recordings. The original themed O:I videos remain the fallback before recordings exist. The player retains the `org.omarchy.screensaver` app ID, does not inhibit locking, and dismisses on keyboard/button input or pointer movement. It opens on the active monitor. Live desktop overlays are separate surfaces on every monitor.

```sh
physis quality gentle        # 20 fps / <= 50k requested particles / 0.75 pixel ratio
physis quality balanced      # 30 fps / <= 100k / 1.0
physis quality fluid         # 60 fps / <= 200k / 1.0
physis opacity 0.35
physis scenes
physis scene SCENE_ID
physis mp4 VIDEO_ID           # optional FFmpeg conversion beside a WebM
```

The current scene runs autonomously on the desktop with the same `ProductionAdapter` and `PointCloudField` as Expressions. There is one scheduler per overlay surface. Editor guides, page text and the paper background are omitted. Native input regions are empty, keyboard focus is disabled, and no screen space is reserved. The service terminates the renderer when switched off and suspends it during locking/screensaver playback. Monitor hotplug is handled by the host. The scene and quality persist, but the overlay starts off after a service restart/login.

## Build and installation

```sh
npm ci
npm run build
npm run desktop:build
npm run install:desktop
```

The native build uses the installed C compiler, pkg-config, Wayland scanner/protocols, GTK3 and WebKitGTK 4.1 development files. It builds a pinned gtk-layer-shell source revision locally in ignored `build/`, retaining the source and LGPL license. No system packages are installed. GTK/WebKit is a separate process; this machine's Quickshell/Qt WebEngine combination failed initialization, so the desktop shell only hosts the bar widget.

The installer adds the user command, desktop launcher, user systemd service, `org.epilogos.physis` Omarchy plugin/bar entry, and changes the existing `frank.idle` screensaver command. It preserves user configuration backups under `~/.local/state/physis/backups/<timestamp>/`. `/usr/share/omarchy` is untouched. This installer expects this machine's existing custom idle integration.

Omarchy retains its idle service across plugin reloads. When its launcher changes, installation queues a shell restart that waits until the session is unlocked. Check it with `systemctl --user status physis-apply-shell`; the transient unit disappears after success. A fresh login also loads the updated idle service.

```sh
systemctl --user status physis
journalctl --user -u physis -f
systemctl --user restart physis
```

For removal, turn off the overlay, run `systemctl --user disable --now physis`, remove the Physis bar entry, and restore the `frank.idle` launch command to `oi-screensaver`. Then remove the Physis launcher, desktop entry, service unit and plugin directory; run `systemctl --user daemon-reload` and `omarchy-shell shell rescanPlugins`. Keep the media library. Use backups selectively so subsequent unrelated configuration changes are preserved.

## Source layout and checks

- `field-studies-journeys/src/physis.ts`: optional desktop controls and output sink, integrated with existing capture actions.
- `src/physis/render.ts`: a minimal renderer using the current production adapter, with bounded frame rate and no editor UI.
- `server/index.mjs`: loopback-only production host, versioned scene storage, atomic media publication, SSE and renderer lifecycle. Foreign origins, unexpected Host headers and writes lacking the client header are rejected.
- `desktop/overlay.c`: transparent per-monitor surfaces, no input region or keyboard focus, native readiness reporting.
- `scripts/`: build, reversible user installation, command and screensaver.

Run the upstream tests documented in [README.md](README.md), plus:

```sh
npm run test:physis
npm run test:physis:browser
```

The Physis browser test exercises the current Expressions app, both PNG alpha modes, decoded animated video, complete expression provenance, disk load, and the production overlay page. It uses isolated test storage and 2,048-particle fixtures with software WebGL. Device-specific monitor hotplug, scaling and fullscreen behavior need hardware verification.

Videos are live performances: browser/encoder speed determines actual frame rate and duration. The upstream limits and hidden-tab/resize stop behavior apply. There is no claim of deterministic replay, seamless physical loops or runtime checkpoints. Earlier Physis work based on `main` is preserved only in local checkpoint `bc486a2` on `feat/physis-desktop`; the active integration is based on `master`.
