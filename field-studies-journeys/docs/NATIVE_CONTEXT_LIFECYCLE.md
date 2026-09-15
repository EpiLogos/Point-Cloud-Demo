# Terminal WebGL context disposal

Implementation evidence, 2026-09-15. Current-main PR starting source:
`ae32714ec1f24ee894bd54bc2c32ed185d90ad5c` (accepted base `22c02d543dfee2c6eb30ded1f4a0a62225200eeb`).

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

`npm run lint`, `npm test` (112), `npm run build`, and `npm run test:journeys`
(50) passed. All nine cases in the actual `native-gpu.js` suite passed with no
browser errors, run through Playwright 1.63 against Chrome 152 / SwiftShader.
The Python Playwright 1.57 runner stalled with its browser gone; it was stopped
and the unchanged browser suite was rerun using the current Playwright driver.
Evidence: `field-studies-journeys/evidence-native/context-full-gpu-node.json`.

The exact consumed O:I engine predates the current native semantic schema.
Its scoped compatibility repair is native commit
`703b6970bfd405c482c2a15985c09c8925ec3b7d`, based on `47c465d` and ultimately
the consumed `9443f58`. The before/after held-context regression ran there,
and O:I consumes that clean source through its vendor tool. This current-main
change is the canonical equivalent in PR #5. Ordinary presentation release
remains the host's retained-field operation.
