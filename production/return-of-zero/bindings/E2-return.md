# E2 Return — A + A′ argument families (worker: arguments)

Date: 2026-09-17. Source revision: `EpiLogos/Antykathera-Essay-Work` @ `dbf3b17`. Authoring surface: `Point-Cloud-Demo` @ `a39cf5f`. Census receipt: `working/pre-manuscript-refinement-2026-09-10/T25-current-census-acceptance.json`.

## Artifacts written

| Artifact | Scenes | Validation | Cover |
|---|---|---|---|
| `production/return-of-zero/arguments-a/roz-a-arguments.journey.json` | 36 (`a01`…`a36`) | VALID (`tools/validate.mjs`, oi.journey v1) | `arguments-a/roz-a-arguments.cover.png` (tools/capture.mjs, authored count 62000) |
| `production/return-of-zero/conjugates-a-prime/roz-a-prime-conjugates.journey.json` | 36 (`a01p`…`a36p`) | VALID | `conjugates-a-prime/roz-a-prime-conjugates.cover.png` |
| `production/return-of-zero/profiles/family-argument.profile.json` | — | presentation baseline | — |
| `production/return-of-zero/profiles/family-conjugate.profile.json` | — | presentation baseline | — |
| `production/return-of-zero/bindings/roz-a-arguments.binding.json` | 36 scene records | — | — |
| `production/return-of-zero/bindings/roz-a-prime-conjugates.binding.json` | 36 scene records | — | — |

Family grammar: ONE A-family construction carries all 36 arguments (one governing formation per record shaped by its declared operation; editorial text card = kicker `<id> · <CLAIM_STATUS>` / record title / declared relations / body compressed from the record only). ONE A′-family construction carries the 36 conjugates — the same grammar under its registered material treatment (print material, cooler ground `#e9ece7`, cooler ink), each A′ scene mirroring its A partner's operation because the record itself declares the re-siting. Records stay independently addressable (scene id = lower-cased census record id).

## Captures inspected, and what changed because of them

All 72 scenes were captured at count 8000 and read; six revision rounds followed:

1. **Body clipping (rejected draft layout).** The single editorial card put the record's governing proposition in a narrow column that ran off the viewport. Split into two text layers: card (kicker/title/italic) high-left, body as its own layer (width 600, size 15) — full bodies now readable.
2. **Movement list overflow.** Movements joined with `·` and no spaces cannot wrap; A18's twelve movements ran wide of the card. Joined with ` · `.
3. **Italic duplication.** Relation lines read "Other face A03p — A03′ — …" (census id plus the title's own ‣-id). Now "Other face A03′ — The Limit of Self-Surfacing".
4. **Transition smears in stills.** Notation-step sequences were caught mid-morph (A13, A14, A18, A34, A36 and conjugate partners). Holds lengthened to 3.4–5.2s, transitions shortened to 0.9s.
5. **Word-glyph legibility.** Word-carrying scenes (A06 speech descent, A14 process words, A34 order of dependence) rendered letterforms as horizontal streaks under the ink material's particle drift. Wide-flat entity boxes replaced with proportional boxes and quieter fields (lower speed/turbulence, higher recovery). Verified at authored count: A14's process words now hold; A36's "0/1" fully legible.
6. **A30/A30′ merged worlds.** The two operative-world discs read as one blob — the opposite of "unmerged". Separated (x ±0.55) with contrasting tintWeights; the overlap lens now reads as partial, not fused. Also: A09's opening state raised to a readable mass; A33's feature square given presence inside the test ring.

## Defects observed (shared; returned for one repair)

- **`tools/capture.mjs` `--all-scenes` is a silent no-op for scene switching.** It calls `window.__FIELD_STUDIES__.openScene(id)`, which no longer exists in the presentation build; the exposed API is `setScene(index)` (probe evidence: `hasOpenScene: false`, `getState().sceneIndex`). Captures therefore drift on the journey's autoplay clock — my first draft pass captured scene N with scene N−k's content. Draft per-scene captures for this pass used a scratch driver with the identical pipeline (same server, same `window.__JOURNEY__` injection) plus `setScene` + `sceneIndex` polling; the two final covers used `tools/capture.mjs` itself (first scene — faithful). File for the repair: `production/return-of-zero/tools/capture.mjs` (Point-Cloud-Demo #6).
- **Engine observation (not repaired here):** text entities with long words in wide/flat boxes render letterforms as streaks under particle drift; legibility is box-proportion and field-motion sensitive. Worth an editor hint or doc note.

## Census reconciliation finding (for E0)

Every `sha256` in `T25-current-census-acceptance.json` for these 72 records was computed at commit `82446f6` (T22) and no longer matches the same paths at the pinned revision `dbf3b17` — the files' content changed at `5c22906` (T23 "Land the T23 navigable surface and the T24 whole-field repair") after the receipt was frozen. Verified: no file in the repo hashes to the receipt values; the receipt's record ids, canonical homes and register/type all match. Both hashes are carried per record in the bindings (`sha256_census_receipt`, `sha256_working_dbf3b17`). The receipt needs a refresh pass before T26 so future packets don't inherit stale hashes.

## Honest remainers

- **Notation stills are phase-dependent.** A still of a live sequence can catch a morph (A34 was recaptured three times for this reason). In the running journey the operations read; the covers and most per-scene stills show formed states.
- **A-family status accents are few.** Only five records are Derived (A11, A13, A14, A16, A18); all conjugates are Argued, so the A′ family shows a single accent. The encoding is still recorded as data for when the corpus gains Offered-status records.
- **A06's room service** comes from the record body's declared movement consumers (M29·M30·M44, plus M38·M42 philosophical returns) because the room alignment files do not list A06; A05's three-movement declaration (M07·M13·M48) is likewise record-declared and merged with the alignment file's M07. Bindings carry the merged lists; the per-record source is noted.
- **Draft per-scene captures live in `/tmp`** (inspection artefacts, not repo bodies). The repo keeps the two tool-produced covers as the durable visual evidence, per the README's cover convention.

## Asset manifest summary

No external imagery. All scene content is engine-native: field materials, shape entities, inline text sources (the records' own notation tokens only, provenance "authored"), text layers. No npm installs, no engine/editor changes, no commits; writes confined to `production/return-of-zero/{arguments-a,conjugates-a-prime,bindings,profiles}/`.

## Addendum — E0 acceptance repair (2026-09-17)

E0's acceptance pass found the italic relation block overlapping the field's left edge on the a01 cover. Repair, applied at grammar level:

- The editorial card is now three layers: kicker+title card (x .033, width 340), a dedicated relations layer carrying the italic line (x .033, y .26, width 290, size 19) that wraps fully inside the left margin, and the body layer (y .50). Verified clear on a01, a01p, and a18 (the widest relation line — twelve movements, wraps in 8 lines inside the margin).
- Same class found from the other side on a30/a30p spot-check: the left world's rim reached under the text column. Those two scenes' formations now use a vertical nesting arrangement (worlds at y ±0.42, x +0.1), which clears the text column entirely and suits the records' "mutually nested" relation; recorded as an explicit per-scene variation.
- Both covers re-captured with `tools/capture.mjs` at authored count (port 47912, sequential) and verified clean. Binding notes carry the line "E0 acceptance repair: relation-block overlap fixed on …" for both artifacts; both family profiles updated to describe the three-layer text grammar.
