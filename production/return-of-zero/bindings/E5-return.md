# E5 (symbolon) — durable return, Return-of-Zero Expression corpus, 2026-09-17

Worker: E5 "symbolon", under E0, issue #65. Source revision `dbf3b17`; authoring surface Point-Cloud-Demo `a39cf5f`. Writes confined to `production/return-of-zero/{symbolon,bindings,profiles}/`.

## Artifacts written

| Artifact | Scenes | Validation | Cover |
|---|---|---|---|
| `symbolon/roz-symbolon-whole.journey.json` | 6 (whole-root, held-matheme, held-mytheme, held-episteme, whole-held, whole-return) | VALID (real `validateJourney`) | `symbolon/roz-symbolon-whole.cover.png` (authored count) |
| `symbolon/roz-symbolon-spine.journey.json` | 13 (8 roots in spine order, 4 head traversals, spine-index) | VALID | `symbolon/roz-symbolon-spine.cover.png` (authored count) |
| `profiles/register-symbolon.profile.json` | — | craft baseline doc (ordinary JSON + lineage) | — |
| `bindings/roz-symbolon-whole.binding.json`, `bindings/roz-symbolon-spine.binding.json` | — | per-artifact bindings, census sha256 per record | — |

## How the semantic burden is staged

- **Whole/register relation (whole artifact).** Symbolon is staged as parā: an opening whole scene (`0/1` inside the envelope, `1/0` at the rim, the self-nesting 3+1 declared), three held-register scenes (Matheme/paśyantī with the full equation `0/1 = 4+2 = 5→0 = 1/0 = 4′+2′ = 5′→0′ = 0/1`; Mytheme/madhyamā as a formed cymatic image; Episteme/vaikharī as an instituted lattice), a containment scene (three distinct presences, one whole, slash active between them — held, not collapsed, not a fourth sibling), and a return scene mirroring the opening (`1/0` at centre). Register records are referenced, never restaged.
- **Twelvefold traversal (spine artifact).** The eight roots walk in spine order with their locked notation as the governing formation of each scene (`−/−`, `0/1`, `?/!` with the four corners and SILENCE, `−/+` with a breathing automation lane, `X/x` with recurring instances, `AM/IS`, `∞/dx` with the calculus anchor, `1/0` with mirrored geometry); the four heads follow as traversal scenes (mono-poly — the only Argued band, staged as one mark held by many; complexio as the `#` mark; self-identity as `A = A`; subject-logics as the `0 → Ø → X → Ø/X → (0/Ø)/(1/X) → 1` walk); the spine-index closes as the mandala: centre `0/1` threshold, four cardinal stations per the theorem §II(a) degree table, one envelope ring carrying the #0/#5 office with `−/−` entering above and `1/0` returning below. Claim-status bands appear on every scene text layer exactly per record frontmatter. Every depth scene keeps a small faint ring — the whole retained — and a source-of-record line.

## Captures inspected, revised, rejected

All 19 scenes were inspected at draft count (8000) and again at authored count (62000, sequential captures on port 47915). Revisions the loop forced:

1. **Native 10-formation limit (engine boot failure).** The first spine-index staged 13 formations; the native field refused to load ("The native field supports 10 formations per scene") while `validateJourney` admits 32. Restaged to 9 formations; the four heads are declared in the scene text and binding, which the lane's craft bar sanctions. Restaged again when the first fix (two rings) produced an inner band that fills into a bright disc at authored count, burying the cardinal marks — the shipped mandala uses the single-envelope geometry proven by the whole scenes.
2. **Off-viewport marks.** Rim marks at y ±1.24 fell outside the visible extent (~±1.05); moved to ±0.96.
3. **Dash slabbing.** `−` in a near-square formation box renders as a solid rectangle at 62000 (glyph is stretched to fill the box); flattened the boxes so `/ = −/−` reads as two strokes and a slash.
4. **Composite notation blur.** `(0/Ø)/(1/X)` blurred into mush at authored count; split into its exact parts `(0/Ø)` `/` `(1/X)` at scene particle size 1.9.
5. **1-0 mirror not applied.** My first entity layout showed `0/1` twice; corrected so the return scene reads `1/0`.
6. **Cymatic default renders square.** The mytheme presence used `templateGeometry: circular` + `templateFrequency: 3`, which forms a proper quatrefoil "formed image".
7. **Text layers render literally.** Markdown `**`/`*` markers appear as asterisks in page text; stripped from all bodies.
8. **Remnant/text collision.** The retained-whole ring originally sat upper-left under the editorial column; moved upper-right.

## Defects observed (shared editor/engine — for Point-Cloud-Demo #6)

- **Native formation cap vs validator:** native field boots max 10 formations/scene; authoring schema allows 32 and gives no warning. `validateJourney` should carry the native limit (or the bridge should document it).
- **`--all-scenes` capture lag:** `tools/capture.mjs --all-scenes` screenshots can lag one scene behind its own `openScene` switch (2500 ms wait insufficient through a 1.5 s transition + resample), producing wrong-scene covers. Workaround used: per-scene single-scene journeys (the app always opens scene 1). Deterministic and reproducible.
- **Text layers do not follow inkMode:** `.page-text` body/kicker stay `--muted` (#74766b) in whiteOnBlack scenes — legible but dim on deep fields; the "muted" token is not re-derived from the field palette in presentation.
- Minor: sequence-step `hold`/`transition` and `backgroundMode: vignette` interplay untested here (no automation-on-cover path); formation glyphs stretch to fill their box aspect (documented behaviour, worth a note in the editor's placement UI).

## Honest remainers

- Scene text layers are compressed refractions carrying source-of-record lines; the canonical records remain source truth and are never edited.
- The spine-index field shows the eight (centre + cardinals + thresholds + envelope); the four heads are present as their own scenes and declared in text/binding, not as field marks — the 10-formation limit forces the choice, and the record's own law ("this index adds no thirteenth determination") is why the heads were not compressed into invented composite glyphs.
- mono-poly's eight "many" marks are lowercase `x` entities that render X-like at weight 900; read as instances-of-capacity, noted rather than silently accepted.
- The minus-plus breathing lane (field.dispersion LFO) is authored but invisible in still covers; it plays in the live engine.
- Full-count evidence for the two ring-heavy scenes (spine-index, whole-held) lives in session scratch (`/tmp/roz-e5-fullcount/`) and is referenced in the bindings, not shipped beside the artifacts (the cover convention is one authored cover per artifact).

## Asset manifest summary

All field marks are authored notation glyphs and authored diagram geometry (rings, square, circular cymatic) — no external imagery, nothing requiring licence provenance. Palette/tint policy (near-black field `#14161a`, paper ink `#e9e5d9`, presence tints matheme `#9fb4c8` / mytheme `#c9ad7a` / episteme `#9aa89b`) is recorded in `profiles/register-symbolon.profile.json` as presentation policy only.
