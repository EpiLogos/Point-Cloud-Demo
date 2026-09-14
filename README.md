# Physis

A local point-cloud studio with PNG/WebM export, an Omarchy video screensaver, and a transparent Wayland desktop renderer. Based on [EpiLogos/Point-Cloud-Demo](https://github.com/EpiLogos/Point-Cloud-Demo), starting at `040627d`.

```sh
physis                       # open or focus the studio
physis overlay toggle        # toggle the desktop engine
physis overlay off
physis screensaver           # preview the video screensaver
physis library               # open the scene/media directory
physis status
```

The **✧** Omarchy bar button toggles the desktop engine. Right-click opens the studio. **✧ ON** means the native renderer has delivered its first frame; **✧ ·** means it is starting or suspended. The studio's bottom-left Physis panel saves scenes, exports images, records videos, loads scenes, and adjusts desktop quality and opacity. **To desktop** saves and activates the current scene. The editor's working configuration also persists locally.

Exports go to `~/.local/share/physis/`:

- `scenes/`: versioned JSON, configuration and camera state.
- `images/`: PNG and source-scene metadata. Transparent PNG is optional.
- `videos/`: WebM and source-scene metadata. Completed recordings are available to the screensaver.
- `thumbnails/`: reserved for future generated previews.
- `settings.json`: selected desktop scene, opacity, frame rate, and particle budget.

Images and recordings use the canvas's current pixel dimensions. Videos record the live engine for 5–120 seconds, with an early Stop button. Both particle pixels and the editor's atmospheric background are composited for opaque exports. Browser encoder support determines VP9/VP8 availability. Recording continues best with the editor visible; minimizing can throttle browser animation. Video recordings are real-time and do not guarantee mathematically seamless loops or deterministic replays.

Optional MP4 conversion uses the installed FFmpeg:

```sh
physis mp4 VIDEO_ID
```

The original WebM and its provenance remain in the library. The MP4 is placed beside it.

## Desktop behavior

The renderer runs in its own GTK3/WebKitGTK process, with a transparent layer-shell surface on each monitor. The surface uses an empty native input region and no keyboard focus; it reserves no desktop space. It appears above application windows across workspaces. Controls remain in the studio and bar. Pointer-reactive simulation is disabled in the overlay because it receives no mouse events.

The local Node service supervises the renderer. Switching it off terminates its web/GPU processes. It suspends rendering during Omarchy locking and video screensaver playback, and resumes an enabled scene afterwards. Monitor hotplug is handled by the native host. Quality presets cap particle count, pixel ratio and frame rate:

```sh
physis quality gentle        # 20 fps, <= 50,000 particles, 0.75 pixel ratio
physis quality balanced      # 30 fps, <= 100,000 particles, 1.0 pixel ratio
physis quality fluid         # 60 fps, <= 200,000 particles, 1.0 pixel ratio
physis opacity 0.35
physis scenes
physis scene SCENE_ID
```

The renderer starts **off after a service restart/login**; selected scene and quality settings persist. Explicit bar/editor activation keeps it on until disabled or the service stops. Startup/renderer failures are reported in the studio and `physis status`.

The existing `frank.idle` plugin launches `physis screensaver`, retaining the `org.omarchy.screensaver` app ID, current idle timeouts, and Omarchy lock handling. Completed Physis videos are shuffled and looped. Before the first recording, the existing `oi-screensaver` themed collection is used. Keyboard/button input and pointer movement dismiss the Physis player. The current screensaver player opens on the active monitor; multi-monitor live overlay surfaces are separate.

## Build and install

```sh
npm ci
npm run build
npm run desktop:build
npm run install:desktop
```

The native build uses installed C compiler, pkg-config, Wayland scanner/protocols, GTK3 and WebKitGTK 4.1 development files. `scripts/build-overlay.py` fetches a pinned gtk-layer-shell revision into ignored `build/`, retains its source/license, and compiles it as a local shared library. It does not install system packages. Quickshell/Qt WebEngine was tested first but is incompatible with this machine's Quickshell initialization; GTK/WebKit keeps the engine outside omarchy-shell.

The installer writes user-owned files only:

- `~/.local/bin/physis`
- `~/.local/share/applications/physis.desktop`
- `~/.config/systemd/user/physis.service`
- `~/.config/omarchy/plugins/org.epilogos.physis/`
- the Physis bar entry in `~/.config/omarchy/shell.json`
- the screensaver command in the existing `frank.idle/Service.qml`

It backs up changed existing files and records changed paths under `~/.local/state/physis/backups/<timestamp>/`. It enables the local service for the graphical session. The installer intentionally expects this machine's existing `frank.idle` integration and should be adapted before use on another desktop.

```sh
systemctl --user status physis
journalctl --user -u physis -f
systemctl --user restart physis
```

To remove the integration, first turn off the overlay and disable the service with `systemctl --user disable --now physis`. Remove the `org.epilogos.physis` bar entry and restore the idle launcher to `oi-screensaver` (or use the original backups). Remove the launcher, desktop entry, service unit and Physis plugin directory, then run `systemctl --user daemon-reload` and `omarchy-shell shell rescanPlugins`. The media library is independent and can be kept. Preserve other later Omarchy customizations when restoring backups.

## Architecture and validation

`src/engine/` is shared by the editor and `/render`. `src/physis/` implements persistence controls and capture. `server/index.mjs` serves the production build on `127.0.0.1:47831`, stores scenes/media atomically, streams status through SSE and supervises the native renderer. The API rejects foreign origins, unexpected Host headers and writes lacking its custom client header. `desktop/overlay.c` owns native surfaces; Omarchy owns the bar and idle lifecycle.

```sh
npm run lint
npm test
npm run test:browser
```

Service tests cover origin/host rejection, path traversal, transactional settings, and completed-media publication with scene provenance. Browser tests use an isolated service/library and installed Chromium, verify both PNG alpha modes, inspect recorded video dimensions and changing decoded frames with FFmpeg, and load the transparent renderer. Browser artifacts are in `build/` and `test-results/`. A small particle fixture keeps software-GPU tests practical.

Live multi-monitor scaling, bar click-through and compositor fullscreen interactions should be checked on the active desktop; headless browser checks do not establish those behaviors.
