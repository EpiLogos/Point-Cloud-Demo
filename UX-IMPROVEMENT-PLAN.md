# O:I workspace UX improvement plan

Status: implemented, 14 September 2026. The design below records the agreed direction; implementation and verification notes follow.

## Product direction

The everyday workflow should be: choose a formation → edit its glyph states → shape the transition and physics → play and refine. Scene construction and exhaustive configuration should remain available in a deeper workspace.

Preserve the native engine and all supported authoring functionality. Reduce the navigation required to reach it. Use solid black for dark-mode bottom transport, left rail, and camera housing, with legible neutral text and subtle boundaries. Remove decorative chrome gradients; retain intentional artwork colour and background effects.

## Evidence and limits

Inspected the running root route at `http://100.109.102.82:3000/` in the internal browser, including Scene, Objects, and Motion, and traced the local implementation. The root route is the vanilla TypeScript Expressions workspace in `field-studies-journeys/src`; the React workbench remains a separate legacy surface, as documented in README.md.

The new browser session opened **Ink**, with two formations: **O — opening** and **I — interval**. Its selected O has one sequence step and sequence advance/manual links disabled. This does not reproduce the user's saved O↔I formation in Zen: browser-local saved state is not shared. Do not claim its second target has been lost without inspecting that exact document. The internal browser's narrow viewport also limits direct observation of desktop geometry; desktop layout findings below are established from CSS.

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Motion changes the inspector's shape and location | `app.ts:renderInspector` toggles `is-motion`; `styles.css` and `workspace.css` give it bottom placement, alternate dimensions and column layouts | Switching a subject also changes navigation geography; Motion additionally hides search |
| Numeric inputs already accompany the central range renderer | `inspector.ts:range` binds a number and slider to the same path | Make them unmistakable input boxes and verify completeness, rather than add a second competing control system |
| Favourites are navigation shortcuts | `inspector.ts:paramControl` adds stars; Field renders `favourites-strip` buttons using `reveal-param` | They still require menu navigation, and do not offer a persistent bank of editable controls |
| Theme is coupled to artwork | `app.ts:theme` derives `night` from scene background and `--ink` from palette | Chrome readability and user appearance preference need their own tokens and policy |
| Decorative surfaces are layered in CSS | `styles.css` contains repeated panel gradients and later overrides; `workspace.css` adds further responsive overrides | Consolidate the relevant rules instead of appending another competing override layer |
| Formation identity and its changing states are separated in the model | `model.ts:Entity` stores base shape/text plus sequence steps; `nativeBridge.ts:fromNativeEntity` maps native links into those steps | The object list should disclose its sequence rather than imply its base glyph is its whole identity |
| Native engine already supports persistent formations with changing targets | `src/engine/entityRuntime.ts` owns share-weighted particle partitions and current/next targets | First correct UI interpretation; a speculative replacement engine/model is unnecessary |
| Native sequence telemetry is available | `app.ts:updateLiveUI` reads `telemetry.sequences` for the selected formation | Display resolved state using native telemetry rather than introduce another independent animation clock |

## Three UX layers

### 1. Live workspace — make and play

The canvas remains dominant. Keep the left tool rail, camera controller and bottom transport in stable positions. Give the user a persistent, collapsible toolbelt of actual controls, and a compact sequence strip for the selected formation.

Sequence strip: formation selector/name, ordered glyph states, add state, play/hold, and transition access. Selecting a state exposes glyph replacement immediately. Provide duplicate, remove and reorder actions without going through Motion → Sequence → Shapes and intervals. Label this **Formation sequence**; the existing whole-scene strip is **Scene sequence**, reached from Studio or the scene selector.

The default toolbelt should offer a small starter selection of verified active controls, such as simulation speed, return spring, viscosity, turbulence, transition duration and manual morph amount when applicable. Final entries must map to real registry owners. Users can remove every starter control. Keep physics and motion available together.

At narrow widths, collapse the belt into a labelled drawer and allow sequence scrolling. Do not shrink numeric fields until they stop being usable. Opening a Motion control must not trigger a different layout.

### 2. Context inspector — refine what is selected

Use one consistently positioned inspector with the same header, search and scrolling behavior for Form, Physics, Motion and Appearance. Selection determines its subject; changing tabs should not silently select another formation. When no formation is selected, offer a clear chooser.

Keep frequent controls expanded and specialist groups collapsed. Every pinnable control has an accessible **Add to toolbelt** action. **Open in Studio** opens the same subject and section in the detailed workspace. Returning restores inspector tab, scroll, selection, camera and toolbelt.

Scene management should no longer be the default destination of the primary edit action. The primary action opens the selected formation, or the live controls when there is no selection.

### 3. Studio — full-screen authoring

An explicit **Studio** action opens a full-screen settings workspace with persistent section navigation and parameter search. Suggested sections: Formations & states; Physics; Motion & automation; Appearance; Scene composition; Expression settings. Library/import/export may retain their existing surface with clear navigation from Studio.

Use wider layouts for full sequence editing, automation lanes, relationships, spatial arrangement, text layers, camera presets and scene ordering. Include the complete active parameter inventory. Retained compatibility values remain available and clearly inactive.

Studio edits the same document, command history and native engine configuration as the live workspace. No separate draft copy or second simulation. Preserve the current playback state on entry; provide an explicit hold/play control and optional live preview. Returning to canvas preserves camera, selection and simulation continuity. On small screens the same sections stack vertically.

## Formation, state and transition

Use this hierarchy in the interface:

```text
Expression
  Scene — a composition with timing and a saved view
    Formation — persistent identity and particle allocation
      States — O, I, another glyph or geometry
      Transitions — timing, easing and motion between states
    Pins — forces without particle allocation
    Shared field — physics, material and resonance
```

“State” here means an authored target, not a saved snapshot of every particle's position and velocity. Avoid implying that selecting a sequence step rewinds accumulated physics.

An O↔I formation should appear as, for example, **Formation 1 · O ↔ I**, with a separate live indication of the current source, destination and transition progress. Preserve a user-authored name. Show single-state formations accurately, and keep simultaneous independent O and I formations separate. Never automatically merge two entities merely because their glyphs resemble a morph pair.

Clicking a state chooses the target to edit. Manual morph control changes the blend through the existing native path. Automatic playback exposes the driven value without overwriting a number the user is currently typing. Make transition mode understandable: **Hold one state**, **Manual blend**, or **Play sequence**, mapped onto existing enable/manual/advance behavior without losing imported settings.

Before changing defaults, inspect the user's exact O↔I document and verify base shape, links, advance mode, manual mode, morph enablement, native projection and runtime resolution. An import/migration fix is warranted only if that trace demonstrates actual state loss.

## Numeric controls and toolbelt contract

Use one shared parameter definition and binding path across inspector, Studio and toolbelt. Extend the current registry/native target metadata to include scope, units, precision, step, soft slider range, hard input bounds, availability, automation support and pinning identity.

Every slider gets a visible bordered numeric field with tabular digits, adequate width and a unit label. Preserve logarithmic slider mapping while displaying real units. Respect hard bounds and imported valid values outside the slider's soft range. Allow temporary empty text or a minus sign during editing; reject invalid/non-finite commits without changing the engine. Enter commits, Escape restores, and blur has consistent commit behavior. A drag or committed text edit should produce one useful undo action, not a history entry per frame.

Automated parameters show **Base** and **Live** separately, plus their driver and the existing manual takeover action. Do not continually replace focused input content with telemetry.

Toolbelt entries are editable controls, not links. Support pin/unpin, reorder by pointer and keyboard, meaningful labels and an explicit scope. Distinguish controls following the selected formation from controls bound to one named formation; never silently retarget a named binding after deletion.

Store personal belt layout in versioned local workspace preferences, separate from artwork data. Existing scene favourites can be offered as a one-time import. Missing targets show an unavailable state with remove/rebind actions; storage failures preserve the in-memory belt with clear feedback. Use stable target IDs, not label strings or array indices. Changing views must not duplicate element IDs or event subscriptions.

## Implementation sequence

1. **Stable shell and legible controls.** Consolidate chrome tokens; apply requested solid black dark surfaces; remove Motion-specific geometry/search suppression; make numeric fields visible. Preserve artwork rendering and validate desktop, tablet and narrow layouts.
2. **Shared binding and toolbelt.** Build on `registry.ts` and `nativeParameters.ts`; extract reusable rendering/binding from `inspector.ts` and `app.ts`; add scoped pinning, persistence, reordering and coordinated undo.
3. **Formation states at hand.** Add the live formation sequence strip and state-aware list summaries; use native telemetry; resolve the exact saved O↔I case before changing migration or defaults.
4. **Full-screen Studio.** Move deep composition/automation/settings into a navigable workspace using the same controls and document. Preserve direct access to every existing supported capability.
5. **Workflow and regression pass.** Walk the complete authoring journey, import/export round trips, presentation/capture and responsive navigation. Update README to describe the final behavior.

Each phase should be reviewable and functional on its own. Do not build a disconnected visual prototype with simulated controls. No new UI framework or second state store is needed.

## Acceptance and real verification

- In dark mode, computed backgrounds for bottom transport, left rail and camera housing are solid black with no decorative gradient images; text and focus remain readable across artwork palettes.
- Switching every inspector tab retains the same bounding rectangle for a given viewport, leaves camera transform unchanged and keeps search available. Check 1440×900, 1024×768 and 390×844.
- Every rendered range has its corresponding usable numeric field. Enter an exact value, confirm the native configuration/telemetry changes, drag the slider, and confirm the box synchronizes. Cover log scales, negative values, invalid commits, out-of-soft-range imported values and undo/redo.
- Pin physics and motion controls together; edit through the belt; inspect the same values in Studio; reload and recover order/scope. Change selection and delete a bound formation to verify target ownership.
- Create one formation with O and I states through real UI actions, enable its transition and observe native sequence telemetry and GPU rendering. The list identifies one formation with both states. Separately create two simultaneous formations and verify they remain two identities.
- Replace, add, duplicate, reorder and remove glyph states; round-trip the actual authored document through native export/import. Compare IDs, link order, timing overrides, shapes, forces and automation—not just screenshots.
- Enter and leave Studio while playing and paused. Verify selection, camera, simulation progression, undo history and document identity; check no hidden time catch-up or reseeding is introduced by navigation.
- Capture a still and video after edits; verify rendered artwork matches the configured scene and UI chrome is excluded. Retain the existing native engine failure/recovery behavior.

Use the existing TypeScript/model tests for pure binding and migration contracts and real WebGL/browser journeys for integration. Run `npm run lint`, `npm test`, `npm run test:journeys`, and `npm run build` as applicable; extend the workspace/native browser coverage for actual user flows. Tests must exercise production functionality rather than replace the engine with mocks. This planning pass did not change executable code or run the regression suites.


## Implementation and verification — 14 September 2026

Implemented the stable inspector, solid dark chrome, bordered numeric controls,
a live formation sequence editor, scoped/persistent toolbelt, direct editable
search results, and full-screen Studio using the same document and engine.
Formation lists now disclose authored states. Multi-state formations put the
base geometry under Held target, making its role explicit.

The background fix retains the old renderer’s stops and proportions while
precompositing translucent glow colours into opaque paper stops. This prevents
an intermediate bright ring. Live and exported artwork share `paintPaper`.
A further functional fix synchronizes held state glyph edits to native base
geometry. Continuous sliders now invalidate prepared native configuration while
retaining a single undo transaction.

Verification performed:

- 70 existing engine / migration tests passed.
- 30 journey tests passed, including seven new tests for real native toolbelt
  targets, persistent scope/order, invalid preferences, formation summaries,
  held-state projection and background falloff.
- TypeScript checking and production/portable builds passed.
- Real internal-browser checks: added and replaced glyph states; entered 0.75
  for Time Scale; pinned Max Size and entered 8.25 through its logarithmic
  control; both surfaces reflected the exact stored value. Empty numeric input
  retained 8.25 and displayed an error. Named O transition remained bound to O
  while I was selected (O = 2.5 seconds, I = 1 second); order, scope, values and
  dark appearance persisted after reload. Browser reported no console errors.
- Inspector bounds were identical across all four tabs at 1440×900, and across
  Field/Motion at 1024×768 and 390×844. Search remained visible. Mobile Studio
  and dark ambient background were visually inspected.
- Computed backgrounds for rail, transport and camera were `rgb(0, 0, 0)` with
  no background images. No duplicate element IDs were present across the live
  controls and inspector in the tested views.

Limits: the new browser does not share Zen’s local saved document. Its particular
O↔I state-loss report therefore remains unconfirmed; no speculative migration
or merger of independent formations was applied. Full video capture and the
older standalone Python browser suites were not rerun in this pass. Canvas
pixel sampling is not exposed by the internal browser’s read-only DOM tool;
background verification combines a real rendered visual check with tests of
the production gradient stop calculation.

## Second development round — canvas-first composition workspace

Implemented following the placement review:
- Horizontal top tools; centred, subdued Studio/Library affordances; a direct introductory guide.
- Left formation sequence and camera beneath; independent right toolbelt; persistent panel resizing with keyboard support.
- Floating translucent Studio replaces the separate scene inspector. Pointer and relational forces have their own sections, with compact numeric parameter rows.
- The old thumbnail scene cards are replaced by a named strip with explicit Draft / Saved / Edited since save states, duration, incoming transition, and numeric differences.
- Saved configurations are separate from automatic draft backups. Save & make next creates an independent draft; saved playback skips drafts; Restore saved returns the configuration. Existing documents migrate their scenes into saved configurations once.
- Recently opened local work precedes curated starting compositions.

Verification: 70 engine/native tests and 36 journey/model tests passed. Browser checks exercised save-and-copy, independent duration edits, dirty/saved status, restoration, playback controls, keyboard resizing, and the guide, with desktop and narrow-screen visual review. Saved scene tests cover independent snapshots, migration, validation and round-trip retention. Vite continues to report its existing large-chunk advisory.

## Interaction polish and property takes

The third round replaces global toolbelt ownership with scene configuration ownership;
adds a searchable checkbox picker and explicit confirmation; moves the toolbelt opener
to the right-edge ellipsis; and separates Select, Text, Objects, Pointer and glyph-sequence
actions. Studio no longer embeds cross-page motion tabs. The full bundled glyph categories
are available in the sequence panel’s nested library tree.

Scenes now occupy the expanding footer as small centred composition previews. Duration,
incoming transition, save/restore/copy-next and ordering live in that footer. Large work
surfaces yield to one another; the footer’s measured height also limits neighbouring panels.
Surface arrival/departure, resizing, hover and selection use short transitions with reduced-
motion alternatives.

Property takes use a two-second count-in and the expression’s seconds-based timeline.
Replace records the previous interval; next section appends. Tracks store native base
parameter values and stable formation bindings, preserve held values before gestures,
and interpolate without mutating authored scenes. Saved scenes retain tracks and toolbelts;
parameter seeking is explicitly distinguished from restoring particle runtime state.

## Interaction locking pass

Cursor choice is independent of the visible local panel. Toolbar buttons use one-click
open/close behavior; the legacy three-step toggle and pointer-inspector reopening patch
are retired. Formation selection yields placement controls, and the redundant top Scenes
and Sequence text buttons are removed. Capture and framing/settings have distinct icons.

Automation UI now groups targets under one oscillator or one-shot. Both the parameter wave
button and group Add parameter route use explicit target/group choices. The monitor lists
all targets. Group clock identity survives removal of its original target; native imports
and exports preserve this relationship. LFO rate changes integrate from the existing phase.
Toolbelt edits offset a replacing target’s range and leave sibling targets unchanged.

The morph source uses the actual native conjugate phase law, rather than an approximation
labelled as a topology. Quantum Superposition and the original geometry trajectory names
are restored with descriptions. All numeric legacy MorphPanel paths remain mapped; the
inactive legacy manifold scrub is explicitly distinguished from the supported A→B scrub.
Phase reset and sequence presets use the Studio page identity rather than removed tabs.
