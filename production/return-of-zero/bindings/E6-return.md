# E6 return — Whole Mythemes (mytheme-wholes)

Worker: E6, issue #65, 2026-09-17. Canonical source: EpiLogos/Antykathera-Essay-Work @ `dbf3b1771724bd56663e4e3410df13e9d3ae681b`, census `working/pre-manuscript-refinement-2026-09-10/T25-current-census-acceptance.json`. Authoring surface: Point-Cloud-Demo @ `a39cf5f5fa45cd6526d1c8af432dad711c9758ec`.

## Artifacts written

25 Whole Mytheme Expressions, `production/return-of-zero/mytheme/roz-mytheme-<slug>.journey.json`, all `oi.journey` v1, all **VALID** under `tools/validate.mjs` (final full pass: 25/25 valid). 143 scenes total (Tier-1 full craft: ares 7, indra 7, uroboros 7, antikythera 6, apollo-dionysus-daphne 6, ovid-daphne 6, eros-psyche 6, job 8, pauli 7, jigsaw 6, neumann 8; Tier-2 whole-arc: prisoner 5, mother 4, goethe 4, taylor-images 5, attica 5, hypostasis 5, fanon 5, aion 5, maya 5, avatar 5, glass 5, meal 5, valentinian 6, mirror 5).

25 binding records, `production/return-of-zero/bindings/roz-mytheme-<slug>.binding.json`: per-scene phase bindings to the records' own `#0…#5→0` sections and anchor ids; derivative occurrence index (figures/things/places/actions/motifs → exact whole-story occurrence); `human_amplified` flags carried verbatim per relation (yes and no rows both); declared cross-story relations only (double-net, torus/uroboros with Māyā-not-the-hole + paśu correction, Daphne ↔ Apollo/Dionysus bracket, the mirror's three-instrument comparison, and the named unratified cross-whole comparisons); assets marked `authored`; craft observations; shared editor defects.

Profiles: `profiles/register-mytheme.profile.json` (madhyamā register: round material, richer palettes, calmer speed/turbulence than the ink baseline, scene grammar for the whole-first law) + `profiles/family-hellenic.profile.json` and `profiles/family-frank-taylor.profile.json` (the only genuinely shared families; all other worlds are one-record families documented in their bindings). Craft baselines only — no semantic claims.

25 covers, `mytheme/roz-mytheme-<slug>.cover.png`, captured through `tools/capture.mjs` via the real engine at authored params (scene 1, count 62000), final pass 25/25, no page errors.

## Captures inspected; what was revised and why

- Full draft pass at `--count 8000` over all 143 scenes; covers inspected individually at authored count through four iterations.
- **Dark-scene title ink**: engine text layers take the first palette colour for title/italic; on dark grounds the title rendered dark-on-dark. Fixed by light-first palette ordering for dark scenes (`whiteOnBlack` ink mode was already set by luminance).
- **Body overflow**: story prose at size 14 overflowed the 800px frame on long scenes. Went through: occurrence lines split into their own right column → two-column prose flow with the occurrence index folded into column 2 → margin-column geometry (col1 left, col2 right, centre left free for formations) with a word-boundary split and a higher/wider variant for occurrence-heavy columns. Empirically calibrated (~50 chars/line, ~21.6–23px/line at size 14) and verified on the worst scenes (val-5, ovid-5, ava-3) via reordered temp copies captured as covers. Five of my longest authored scene texts were tightened (val-5 ×2, mir-5, ava-3, meal-3, meal-5) without dropping any story fact or occurrence; canonical records untouched.
- **Cover legibility**: at authored count the dense field paints over text; the occurrence column moved to the clear right margin (x .765). Two-column dark-scene covers keep a partial particle overlay on column 2 where the formation's arc passes — legible, recorded as accepted.
- **Rejected**: rendering the egg dream's four eggs as a single static emblem (the record explicitly warns its force disappears without the two origins); a decorative "torus symbol" for attica/uroboros instead of the staged ring-with-hole; any kiss-waking or modernised iconography for Eros/Psyche; any Aquarian/finally-unmasked dramatisation for Aion and the Prisoner beyond the written witnesses.

## Defects observed (shared, returned for Point-Cloud #6)

1. `tools/capture.mjs` single-scene mode (`--scene-id` without `--all-scenes`) never navigates; the screenshot always shows journey scene 1 while the output file is named for the requested scene. Covers unaffected (scene 1 by design).
2. `--all-scenes` `openScene` switch can lag the fixed 2.5s settle on morph-heavy scenes; some per-scene screenshots show the previous scene. Per-scene draft inspection was therefore layout-level for later scenes and full for early scenes; scene text carries the arc and was verified textually.
3. A small circular UI artefact (journey/scene indicator) renders bottom-left inside the authored frame on every capture.
4. Engine render order: field particles paint over text layers; text stays legible at moderate density but the densest formations partially obscure overlaid columns at authored count.

## Honest remainers

- Per-scene visual verification of later scenes is partial (defect 2); the arc-craft judgment rests on scene sequences and titles (textually verified), early-scene stills, and the verified layout system.
- Final covers are SwiftShader CPU renders through the real engine at authored count; motion/sequence behaviour (egg divisions, Daphne's transformation cycle, paper-scene erasure) is authored but evidenced here as stills only.
- The Antikythera artifact carries the withholding law (withheld-until-§5→0) as a standing note in its final scene and binding rather than by truncating the whole.
- Source debts named inside records (Cleary print collation, Barnstone–Meyer lead, Nims collation, Gebser quotation readiness, NASA frame selection, Neumann 1954 pagination, Aion printing equivalence) are preserved as-is in bindings; none settled here.
- `.aikit/` in the Point-Cloud worktree is not mine and was left untouched. No engine/editor code changed; no commits made (collection remains untracked for E0 to commit).

## Asset manifest summary

25 journeys (143 scenes; entities use text-glyph and word formations plus ring/disc/square/triangle/yantra/cymatic shapes; 14 multi-step sequences stage in-story transformations — bonds, egg division, tree transformation, paper erasure, wheel, enclosure-opening, lamp, fragments→model); 3 profile files; 25 bindings + this return; 25 cover PNGs. All artifact-internal imagery is authored; no external image assets were admitted, so no licences are due.

## E0 acceptance repair (title/field collisions), same day

E0's cover acceptance flagged the title/italic band crossing formation strokes (first found on the ares cover). Root cause had two layers: (1) the engine's world-y is screen-inverted (y up = screen up) and `autoFitSizes: true` re-fits the whole formation cluster, so entity placement could not be reasoned about stably; (2) small text glyphs render larger per size-unit than large shapes, so a size-only filter skipped them.

Fix, applied in the authoring library and regenerated into all 25 artifacts (no content changes):
- `autoFitSizes: false` on every scene — positions/sizes now render literally.
- Title/italic block narrowed 640 → 560.
- Per-scene clearance pass: any formation whose ellipse (text shapes use a larger unit, small glyphs included above a 50px floor) intersects the title box is iteratively scaled (×0.85/pass) and dropped screen-down until clear (≤6 passes). Model verified clear across all 143 scenes; ares re-captured and visually confirmed as the acceptance case.

All 25 covers re-captured at authored count. Spot-checks at `--count 8000` on the six E0-named artifacts (indra-net, uroboros-trickster, antikythera-attunement, travelling-jigsaw-atlas, the-prisoner, pauli-egg-dream) plus ares: all title bands clear; antikythera's Sun-glyph collision found in the first spot-check round and fixed by the small-glyph inclusion. Known accepted remainder (unchanged class, recorded in bindings): body/occurrence columns may pass over sparse formation edges; text renders above particles and stays legible.
