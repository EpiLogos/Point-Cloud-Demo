# E3 Return — Episteme register (worker: episteme)

**Worker:** E3 ("episteme"), Return-of-Zero Expression corpus, issue #65, 2026-09-17.
**Source:** EpiLogos/Antykathera-Essay-Work @ `dbf3b17`, census receipt `working/pre-manuscript-refinement-2026-09-10/T25-current-census-acceptance.json`.
**Authoring surface:** Point-Cloud-Demo @ `f257de5`, collection `production/return-of-zero/episteme/`.

## Artifacts written (all validated by tools/validate.mjs, all covers captured through tools/capture.mjs)

| Artifact | Scenes | Coverage | Cover |
|---|---|---|---|
| `episteme/roz-c-concepts-1.journey.json` | 32 (`c01`…`c32`) | C01–C32 | `roz-c-concepts-1.cover.png` |
| `episteme/roz-c-concepts-2.journey.json` | 32 (`c33`…`c64`) | C33–C64 | `roz-c-concepts-2.cover.png` |
| `episteme/roz-ac-root.journey.json` | 5 | A/C root (`AC.md`) as its own small expression | `roz-ac-root.cover.png` |
| `episteme/roz-s-products.journey.json` | 7 | S whole + S0–S5, each product holding its whole assigned lens pair | `roz-s-products.cover.png` |
| `episteme/roz-histories.journey.json` | 10 | the 10 packet HISTORY.md records | `roz-histories.cover.png` |
| `episteme/roz-dossiers.journey.json` | 7 | the 7 dossiers | `roz-dossiers.cover.png` |
| `episteme/roz-etymologies.journey.json` | 6 | the 6 etymology whole-fields | `roz-etymologies.cover.png` |
| `episteme/roz-lenses-aphorism.journey.json` | 3 | lens-baudrillard, lens-foucault, aphorism-investigation-and-faith | `roz-lenses-aphorism.cover.png` |

102/102 packet records bound, one scene per record (A/C split into five scenes of one record). Bindings: `bindings/roz-{c-concepts-1,c-concepts-2,ac-root,s-products,histories,dossiers,etymologies,lenses-aphorism}.binding.json` — per-scene record_id + canonical path + sha256 computed at `dbf3b17` + verbatim relations + per-scene form note. Profiles: `profiles/family-concept.profile.json`, `family-product.profile.json`, `family-history.profile.json`, `family-dossier.profile.json`, `family-etymology-whole.profile.json` (lineage `roz-corpus-base → family-*`; presentation baselines only).

## Family grammars — the source/type distinctions kept

- **C concepts (one grammar, 64 addressable scenes):** episteme print treatment (print material, cooler paper `#e9ece7`, ink `#20262b` — the instituted lattice per `roz-corpus-base`). One governing formation per concept shaped by that concept's own operation (appearing-ring with the given inside, cut with its slash, window-in-cage, sealed counterfeit square, broken token, merged fusion disc, occupied centre, focal disc with satellites, static `0/1` for C48 …). Card = kicker `<id> · <CLAIM_STATUS>` / record title / declared relations (argument consumers, concept links, sources — capped in the card with `+n more`, exact lists in the binding); body = the record's governing proposition compressed from the record's opening only.
- **A/C root:** five scenes — the self-describing `0/1` field; the A face with the frozen *Respect for Experience* ethic **carried by reference only** (title, six movement names, frozen path; never restated or altered); the crossed-zero sequence `0 → Ø → X → Ø/X → (0/Ø)/(1/X) → 1 ↺ 0/1` staged as a token arc around the ring; the C face's constitutional sixfold; the shared close (`(0/1)/(1/0)`, "the thing that is its own condition").
- **S products:** each product scene holds its **whole assigned lens pair as two text columns — both lens bodies, six terms each with their offices**, compressed from the record's own lens sections (S0 L0 Quaternal × L5′ Divine Logos; S1 L1 Causal × L4′ Scientific; S2 L2 Logical × L3′ Chronological; S3 L3 Processual × L2′ Alchemical-Elemental; S4 L4 Phenomenological × L1′ Phenomenal; S5 L5 Para Vāk × L0′ Archetypal-Numerical), with two lens formations joined by a seam bar. The S whole scene carries the six offices and the verbatim pair table.
- **Histories / dossiers / etymology wholes:** three further grammars (stream-and-stations; evidential plate with section cells; centre-envelope-six-operations) — the six etymology wholes share one grammar because the source form itself repeats; histories and dossiers each get their own.
- **Lenses + aphorism:** refraction grammar (source-discipline ring overlapping native-operation ring); the aphorism scene carries the complete four-line form verbatim in its body.

## Captures inspected, and what changed because of them

All 102 scenes drafted at count 8000 and read as images (`/tmp/roz-e3-drafts`, session evidence); revision rounds:

1. **Engine text-size floor.** First S build used lens text at sizes 11.5–13.5; `validateJourney` rejects text size below 14 ("Invalid page text"). All layers raised to ≥ 14 and layouts re-planned around the larger sizes.
2. **Sequenced-glyph blow-up (recurred, worked around).** ac-crossed-zero was first a live step sequence on one formation; the capture showed a single-character step (`X`) rasterised to the full entity-box width — a giant smear across the ring. Reworked as six static token stations sized to their own strings; the full sequence stays verbatim in the body. This confirms E4's defect 2 as a hard authoring constraint, not an occasional hazard.
3. **Card weight.** The relations italic with full bracketed source lists wrapped 4–6 lines and crowded the formation. Card lists now cap with `+n more` (exact lists remain in the bindings); bracket/quote artefacts of YAML stripped; titles cleaned of quoting.
4. **S layout collisions.** First S0 capture had lens columns overlapping the governing body and the right lens disc covering body text; two revisions (body to a right-top column, formations raised and shifted right, lens columns to y 0.57) verified clear in recaptures (s0/s2/s4/s5).
5. **ac-a-face merge.** The frozen-ethic plate and its envelope ring rendered as one merged mass; separated (plate full-weight, envelope larger and faint).
6. **Whole-S clipping.** The pair table ran off the viewport bottom; moved up and widened.

## Defects observed (shared; returned for Point-Cloud-Demo #6)

1. **`tools/capture.mjs --all-scenes` remains a silent no-op for scene switching** (calls `window.__FIELD_STUDIES__.openScene`, which no longer exists; exposed API is `setScene(index)` + `getState().sceneIndex` — confirmed in the built bundle). Draft per-scene inspection this pass used a scratch driver with the identical pipeline plus `setScene` + `sceneIndex` polling. E2 reported the same; still unrepaired.
2. **`validateJourney` text-size floor is undocumented:** sizes < 14 fail with the generic "Invalid page text" — cost a debug cycle. Worth a message naming the offending layer/field.
3. **Sequenced-glyph fit-to-box-width rasterisation** (E4's defect 2, reconfirmed): short steps fill the box width, so mixed-length step sequences cannot share one formation. Authoring guidance or per-step sizing would fix the class.
4. Minor: entity `text` fields of `''` are used for all shape formations (the model default entity carries `'O'`); validation accepts both, but the editor default seeding text into non-text shapes is a small papercut.

## Hash law — census reconciliation for E0

All 98 record sha256s were computed by me from the files at `dbf3b17`; every binding records both the current hash and the receipt's, with a per-record `hash_note`. Result: **79 of 98 receipt hashes are stale** (content moved at `5c22906` after the receipt snapshot); **19 match** (all 7 S records, both lenses, the aphorism, 5 dossiers, 3 etymologies, 1 concept — C01). The stale set includes all of C02–C64 except none — C01 is the only fresh C — all 10 histories, the A/C root, 2 dossiers, 3 etymologies. Receipt ids, canonical homes and record types all match. The receipt refresh remains another programme's duty; nothing here edits the census.

## Honest remainers

- **C-family formation mapping is craft, not source:** each concept's formation is my reading of its operation, recorded per scene as a `form` note in the binding. No formation asserts a source relation the record does not make.
- **C-records' own concept-map links ride in the card italic (capped) and in full in the bindings**, but the corpus's cross-scene Expression links (one scene pointing at another scene's object) are not built — the collection has no established cross-artifact scene-link convention yet; bindings carry the relations verbatim for that future pass.
- **Etymology/aphorism kickers without claim status:** `etymology-symbol-account-and-trust` and all 10 HISTORY.md records declare no `claim_status` frontmatter; their kickers carry the id (plus record type for histories) rather than an invented status, and binding `claim_status` is null with a note.
- **Covers show the first scene** per the shared tool convention; per-scene review frames live in `/tmp/roz-e3-drafts` (session evidence, not repo bodies).
- **The A/C root and S scenes quote the records' own formulations compressed**; where compression joined two of the record's sentences, both come from the same record and no new claim is made. Exact text remains sovereign in Antykathera-Essay-Work.
- No npm installs, no engine/editor code changes, no commits, no deletions; writes confined to `production/return-of-zero/{episteme,bindings,profiles}/`.
