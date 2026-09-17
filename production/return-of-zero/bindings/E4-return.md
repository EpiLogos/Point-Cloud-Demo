# E4 Return — Matheme register (80 records)

**Worker:** E4 ("matheme"), Return-of-Zero Expression corpus, issue #65, 2026-09-17.
**Source:** EpiLogos/Antykathera-Essay-Work @ `dbf3b17`, census receipt `working/pre-manuscript-refinement-2026-09-10/T25-current-census-acceptance.json`.
**Authoring surface:** Point-Cloud-Demo @ `f257de5`, collection `production/return-of-zero/matheme/`.

## Artifacts written (all validated by tools/validate.mjs, all covers captured through tools/capture.mjs)

| Artifact | Scenes | Domain coverage | Cover |
|---|---|---|---|
| `matheme/roz-matheme-four-files.journey.json` | 28 | definition (7) · process (7) · quilt (7) · music (7) | `roz-matheme-four-files.cover.png` |
| `matheme/roz-matheme-logics.journey.json` | 6 | dia-syn (3) · mono-poly (3) | `roz-matheme-logics.cover.png` |
| `matheme/roz-matheme-ql-spanda.journey.json` | 9 | ql (8) · spanda (1) | `roz-matheme-ql-spanda.cover.png` |
| `matheme/roz-matheme-topology-harmonics.journey.json` | 15 | topology (7) · harmonics (8) | `roz-matheme-topology-harmonics.cover.png` |
| `roz-matheme-formal-neighbours.journey.json` | 17 | formal-neighbours (17) | `roz-matheme-formal-neighbours.cover.png` |
| `roz-matheme-computation.journey.json` | 5 | computation (5) | `roz-matheme-computation.cover.png` |

80/80 packet records bound, one scene per record. Bindings: `bindings/roz-matheme-*.binding.json` (per-scene record_id + canonical path + sha256 + claim status + verbatim relations; profile lineage `roz-corpus-base → register-matheme`).

Profile: `profiles/register-matheme.profile.json` — paśyantī baseline (dark ground `#101216`, whiteOnBlack ink, bone-white + paśyantī blue-grey palette, calm motion for derivation legibility). Presentation only; no semantic colour claims.

## Load-bearing derivations — how they are SHOWN, not decorated

- **Eight determinations as one plate** (`ql-eight-determinations`, 14s): the canonical concentric mandala per ql-expression-grammar §III — centre the `0/1` threshold; stations `?/!` N 0°, `−/+` E 90°, `X/x` W 270°, `AM/IS` S 180°; enclosing ring as the `#0/#5` envelope with `−/−` opening above the centre and `1/0` returning at the rim; body carries the slash-form reading and the torus flat-projection warrant (`4+2`).
- **Both Spanda equations** (`spanda-equations` + `proc-spanda`, 14s): each equation runs as a live entity step sequence (First: `0=(0/0)` → `(0/1)/(1/0)` → `T₀` → `T₁` → `1/0+0/1` → `1/1 = 100%`; Second: `100%` → `64+36` → `64/36` → `÷4 → 16/9` → `4+2 · 4:2`), full equations verbatim in the bodies with every change of operation named.
- **Crossed-zero sequence** (`ql-crossed-zero`, 14s): `0 → Ø → X → Ø/X → (0/Ø)/(1/X) → 1 ↷ 0/1` as a literal step sequence with occlusion/mediation/recognition staging.
- **`2+2² = 4+2 = 6`** (`ql-binary-of-binary`, `ql-two-ones`, `har-perfect-six`): terms row + four ordered pairings row + count glyph; von Neumann succession as a step sequence.
- **Torus/covering** (`top-torus-cover-winding`, 14s; also `quilt-topology`): fundamental square + torus ring, boundary word `aba⁻¹b⁻¹`, winding sequence `γ(t)=[2t,−t]` → lift `(2,−1)` → concatenate → `(1,2)`, `π₁(T²) ≅ ℤ×ℤ`, `χ = 0`, rational closure vs irrational density.
- **Ratio chain `64/36 → 16/9 → 9/8 → 2/1`**: step sequences plus cymatic entities at the worked frequencies (240/320/360/480 Hz; 288/384/432/576 Hz; modes n=1,2,3) — cymatics used only where the record is itself about resonance.
- **Dia/syn locked expressions** (`dia`, `syn`): `/ = −/−` staged; `(-1)/(+1)` → the three operator changes as a sequence; `(0/1)/(1/0)` seam held as the governing glyph.

Claim-status bands travel in every kicker (`MATHENE · <record_id> · DERIVED/ARGUED/OFFERED`); bodies keep each record's defined/undefined seam and Open/Offered boundaries verbatim in substance.

## Captures inspected, revised, rejected

- Review loop: ~90 authored-count (62000) screenshots read as images across two full passes plus targeted recaptures; per-scene drafts at `/tmp/roz-e4-drafts2` (a/b frames; the journey's sequence clock means single frames sometimes land mid-step-morph — both frames kept as evidence).
- **Rejected/revised:** bodies initially carried full derivations — the capture path caps body columns at ~230 px/11 px and overflowed; all 80 bodies recompressed to the governing derivation (≤ ~450 chars), tokens bare (raw backticks render literally in the engine; the backtick convention is an essay-surface rule — noted in bindings).
- **Glyph metrics:** measured from captures — static multi-char glyphs render legibly by height; sequenced step text is rasterised fit-to-entity-box-width, so narrow boxes turned equations to mush. All sequenced boxes resized to natural string width; all steps shortened to ≤ ~17 chars.
- **Collisions:** an estimated-width checker ran to zero overlap/edge flags (was 100+); panel keep-out added (bottom-left body panel zone).
- **ASCII tetraktys** source did not render through the engine (sparse idle particles) — replaced with four authored text-row glyphs (`· / · · / · · · / · · · ·`), which render as the triangular figure; provenance still "authored".

## Defects observed (returned for Point-Cloud-Demo #6; recorded in every binding's notes)

1. **Schema/runtime mismatch (blocking, worked around):** `validateJourney` admits 32 entities/scene, but the native field refuses import above **10 formations** ("The native field supports 10 formations per scene. Nothing was imported or discarded.") — validation passes, the scene silently fails to render. Two scenes (proc-ql-positions at 13, music-lens-anchors at 14) were consolidated to ≤10.
2. Sequenced-glyph rasterisation scales to entity box width (see above) — authoring hazard, not just craft.
3. Capture tooling: `--scene-id` filters which scenes screenshot but the page still shows scene 0, so a non-first `--scene-id` cover captures the wrong scene (topology cover = its opening scene; noted in that binding). Presentation auto-advance also fights per-scene capture during `--all-scenes` runs.
4. Multi-line ASCII-art sources were admitted by validation but produced no formation in captures (may be authoring-path only).

## Source reconciliation for E0

Census receipt hash mismatch, working tree clean at `dbf3b17`, for exactly three records: `matheme-fde-catuskoti`, `matheme-kauffman-iterants`, `matheme-noether-symmetry-conservation` (files last changed at `5c22906`, 2026-09-10 — the receipt's hashes predate that landing for these three). 77/80 verified exact. Bindings record the current sha256 at `dbf3b17` for the three and flag the delta; E0 should reconcile the census receipt.

## Honest remainers

- Sequence steps are compressed stage tokens (e.g. `T₀: 0/(0/1)`), not the full equation strings — full equations ride in the scene bodies verbatim from the records. Forcing long strings into sequenced glyphs is not legible at current engine rasterisation (defect 2).
- Covers show the first scene per the shared tool; per-scene review frames live in `/tmp/roz-e4-drafts2` (session evidence, not repo artifacts).
- The optional authored HTML companion was not built: the two-logics layered views are fully carried by `roz-matheme-logics` scenes plus `ql-eight-determinations`/`spanda-equations` plates, and an HTML side-surface would have added a second rendering path without new derivation content.
- Mid-morph frames exist in the draft set by design (the field is alive); covers were accepted when their composition read whole — ql-spanda's cover catches the relation mid-turn with the seam line crisp.
