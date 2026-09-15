# Terminal WebGL context disposal

Implementation evidence, 2026-09-15. Compatibility starting source:
`47c465d78aeb282f95bba65ecfc0dd0cbc476152`.

`WebGLRenderer.dispose()` frees renderer resources but leaves its canvas context
alive. The native browser regression holds the actual WebGL context strongly:
terminal adapter disposal previously emitted no context-loss event. Removing the
canvas therefore did not satisfy O:I's disabled-runtime context invariant.

`PointCloudField.destroy({releaseContext:true})` now loses the context explicitly
after resource cleanup. Resource destruction is idempotent; a previously
resource-disposed engine can still finish terminal context release.

Default `destroy()` preserves context reuse for recovery and the legacy React
StrictMode caller. `ProductionAdapter.dispose()` is terminal and opts into release.
The adapter retains its last context owner between `recover-context` and the next
render, so cancelling recovery with immediate disposal also releases the context.
A fresh render replaces that retained owner. The adapter's loss listener is
removed before terminal release; retained-field subclasses keep their existing
lease/listener cleanup before calling this method.

The actual native regression passed after failing before the repair:

- Real rendered fields and strongly held contexts; no context or renderer double.
- Ordinary reset and recovery reuse the same healthy canvas context.
- Real `WEBGL_lose_context` loss refuses rendering; restoration and explicit
  recovery render a finite field with actual captured marks.
- Terminal disposal loses all three observed contexts, including disposal between
  recovery and redraw. Repeated disposal is safe.
- A fresh instance on a fresh canvas renders without reviving old contexts.

`npm run lint` and `npm run build:journeys` passed. Focused browser evidence is in
`field-studies-journeys/evidence-native/context-disposal-{before,after}.json`.
The regression is part of the existing `npm run test:gpu` acceptance suite.
O:I consumes this clean native compatibility source through its vendor tool;
ordinary presentation release remains the host's retained-field operation.
