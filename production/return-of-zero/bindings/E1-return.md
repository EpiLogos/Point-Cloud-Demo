# E1 return — essay-rooms (Return-of-Zero Expression corpus, issue #65)

Worker: E1, 2026-09-17. Source revision: EpiLogos/Antykathera-Essay-Work main `dbf3b17` (canonical, read-only for this worker). Authoring surface: EpiLogos/Point-Cloud-Demo, engine validated at working-tree HEAD `f257de5` (the task brief named `a39cf5f`; the checkout had moved — the oi.journey v1 schema is unchanged between them for everything these artifacts use). All artifacts live under `production/return-of-zero/` and validate with `node production/return-of-zero/tools/validate.mjs <file>` (final run: "all artifacts valid", 9/9).

## 1. Artifacts written

| Artifact | Scenes | Scene ids | Cover |
|---|---|---|---|
| `essay/roz-essay-reading.journey.json` | 9 | `00-integral-threshold` … `07-instrument-returns`, `08-the-return` | `essay/roz-essay-reading.cover.png` |
| `rooms/roz-room-00-integral-threshold.journey.json` | 6 | `movement-01`…`movement-06` | `rooms/roz-room-00-integral-threshold.cover.png` |
| `rooms/roz-room-01-differentiating-mind.journey.json` | 6 | `movement-07`…`movement-12` | `rooms/roz-room-01-differentiating-mind.cover.png` |
| `rooms/roz-room-02-return-of-zero.journey.json` | 6 | `movement-13`…`movement-18` | `rooms/roz-room-02-return-of-zero.cover.png` |
| `rooms/roz-room-03-two-logics.journey.json` | 6 | `movement-19`…`movement-24` | `rooms/roz-room-03-two-logics.cover.png` |
| `rooms/roz-room-04-mathematical-substrate.journey.json` | 6 | `movement-25`…`movement-30` | `rooms/roz-room-04-mathematical-substrate.cover.png` |
| `rooms/roz-room-05-psychoid-flowering.journey.json` | 6 | `movement-31`…`movement-36` | `rooms/roz-room-05-psychoid-flowering.cover.png` |
| `rooms/roz-room-06-objective-internality.journey.json` | 6 | `movement-37`…`movement-42` | `rooms/roz-room-06-objective-internality.cover.png` |
| `rooms/roz-room-07-instrument-returns.journey.json` | 6 | `movement-43`…`movement-48` | `rooms/roz-room-07-instrument-returns.cover.png` |

Profiles: `profiles/register-essay.profile.json` (sovereign reading path baseline + station grammar + withholdings policy) and `profiles/family-section-room.profile.json` (the ONE shared movement-scene grammar across all eight rooms, with the recorded per-movement variations and the carrier-tint policy). Both are craft baselines only; no semantic claims.

Bindings: `bindings/roz-essay-reading.binding.json` + 8 × `bindings/roz-room-<slug>.binding.json`. Each carries: exact canonical paths at `dbf3b17` with sha256 computed at authoring time (these publication surfaces are outside the 288-record census receipt, so hashes are computed, not receipt-carried — stated in the binding), per-scene source refs and relation maps (movement identity, P1 canonical route as data, previous/next with exact titles, the M48→M01 Return), asset provenance (all authored, engine-native; no external imagery), capture provenance, and craft notes/defects.

## 2. Semantic burden — how it is carried

- Room identity, movement identity (canonical titles with chassis prefixes, exactly as authored), global movement numbers 01–48, and every previous/next relation travel in scene text. M48 carries "return to the opening → M01 The Question Before the Mechanism" in text and in its binding relations.
- The essay path is one continuous path: nine addressable station/return scenes in reading order, each carrying the station burden (verbatim from the reading root), its first movement, the room's release line, and the station chain. No cards.
- P1 canonical alignment routes are carried per movement as data (route layer, e.g. "P1-M16 → A10 · A18 / C21 · C52 · C61 — Symbol/Account/Trust + crossed-zero Matheme"). The A/A′/C records are referenced by id, never restaged. Claim statuses travel as data: each movement scene's italic layer is the frontmatter `claim_status` verbatim (including the long mixed statuses of M14, M25, M26, M29, M45–M48).
- Withholdings hold in the imagery, verified in captures: no mechanism imagery anywhere before `movement-45` (where the nested-ring instrument finally enters, on the earned dark ground); no `0/1` glyphs before `movement-18` (§1·#5→0, "the loan returns"); the crossed zero `Ø` appears exactly once, at `movement-16`, with its one job (stroke fused into the zero it crosses). Station-level scenes respect the same ordering.
- Carrier identities stay distinct: room surfaces differ by material/tint policy (mytheme red in rooms 01/03/05, matheme blue in rooms 02/04, episteme green in room 06, print material for the lattice rooms 04/06, round material for room 01, deep ground for room 07) — presentation policy recorded in the family profile, never claimed as source relation.

## 3. Captures inspected; what was revised, rejected, kept

Draft loop: `--count 8000` drafts for the essay journey (all 9 scenes) and rooms 00/02 (all-scenes), then — after the all-scenes drift defect emerged (below) — 26 single-scene inspection captures across all nine artifacts, each READ and judged. Final covers: all nine artifacts at the authored count 62000 through the real engine; covers re-shot after a layout revision.

Revised after judging drafts:
1. Text overflow — movement/station body blocks (claim + navigation) overflowed the bottom edge at the first size/position; trimmed duplicated content (the room pointer that repeated the kicker; the burden that appeared in both italic and body), moved blocks up, reduced size. Verified fixed in re-captures.
2. Route layer invisible at first (placed at negative y = off-screen), then collided with tall glyphs at top-right; final placement: bottom-left corner, size 14, verified clear in re-captures.
3. M20 (Dia-Ballein): rejected the first form — solid "−1"/"+1" text glyphs rendered one huge bar straight over the claim text. Replaced with two diffuse disc poles around a retained axis pin; the signed form stays in the scene's own claim text, which quotes "(−1)/(+1)" from the source. Verified fixed.
4. M46 (Sovereign Commons): the commons ring clipped the top edge and crowded the route text; lowered and resized. Verified fixed.
5. M18/M21: inverse-orientation glyph pairs kept (they read strongly) but narrowed/offset so the composition breathes.

Kept after judging: the Ø single-glyph scene (M16) — exactly its one job; the earned 0/1 ↔ 1/0 pair (M18); the eight-step traversal sequence (M25) and quarter-turn triangle (M27); twin psychoid discs (M31); X/x pair (M32); the dark instrument (M45, nested brass rings on night ground — the withholding's payoff); the six-product hexagon (essay station 06); the closing return scene (0/1 on deep ground, loop back to the lit threshold). Full-count covers confirmed the ink/round/print materials and the positional grammar read clearly at 62000 particles.

## 4. Defects observed (also recorded in every binding's notes; for Point-Cloud #6)

1. **capture.mjs `--all-scenes` drift (shared tool defect):** from the third scene onward, screenshots show an earlier scene than requested — `openScene(id)` + 2500 ms does not settle (DOM text on the screenshot confirms the wrong scene). Single-scene captures are reliable. E1 used the reliable path for all inspection and covers; the shared tool file was not modified.
2. **TextLayer.size minimum is 14** with the generic error "Invalid page text." — a range message would help.
3. **Dark-scene body contrast:** editorial body text renders dim grey on near-black (no colour field on TextLayer; engine-owned). Legible, low-contrast.
4. **Sequence scenes are temporal:** a still cover catches one phase (M25's cover caught the settled `0/1` step; M34 drafts caught mid-morph). The artifact carries the full sequence.

## 5. E0 acceptance repair (2026-09-17, second pass)

E0's acceptance pass found text-over-field collisions on the essay cover (italic subtitle and the reading-root line overprinting the threshold disc's dense left edge at authored count). Repair, applied through the generator and re-validated:

- **Rule:** formations sit right-of-centre (single-formation group centre +0.2; essay station scenes +0.3); oversized formations trimmed (positional ring 1.7→1.55; Ø 1.7×2.1→1.5×1.9; instrument rings 2.25/1.5/0.85→1.75/1.3/0.8; essay return ring 2.6→1.9; arche-topos ring 1.9→1.55; field ring 2.5→1.9; commons ring lowered); M20's polarity discs moved to an upper band clear of the claim text; the two inverse-pair scenes (M18, M21) re-centred at ±0.5 about the shifted group with pair glyphs 0.8×1.6.
- **Text:** movement column 400→360 (320 on M18/M21); essay station column 400→350 (320 on station 03); route/metadata layers moved from the bottom-left to a stacked top-left block (route y 0.05; room-door/loop y 0.155) — this also removed a body-vs-metadata collision the narrower columns had introduced mid-repair.
- **Covers:** all nine re-captured at authored count 62000, sequentially on port 47911; essay cover and room-03 cover read and verified clear.
- **Spot-checks at 8000** (single-scene captures, all READ): the three mandated — movement-14 (room-02), movement-30 (room-04), movement-45 (room-07) — plus movement-18 (room-02), movement-20 (room-03), movement-31 (room-05), and essay 08-the-return. All seven clear; no remaining same-class collision found.
- One line "E0 acceptance repair: …" added to all nine binding notes naming the affected scenes per artifact; layout rule recorded in `profiles/family-section-room.profile.json`.

## 6. Honest remainers

- The canonical essay manuscript (`THE-RETURN-OF-ZERO.md`) currently holds section structure only; the station scenes quote burdens/releases from the reading root and rooms, and will deserve a re-bind when the continuous prose lands (the bindings' sha256s make the invalidation exact).
- The `arguments/` shelf (21 historical carriers) under `section-rooms/` was not staged — it is provenance material, and the rooms route to the canonical field per their authored alignments.
- READING.md exists for rooms 00 and 02 only; the room bindings bind ROOM + P1 + movements. If READING surfaces spread to the other rooms, their bindings can gain those refs.
- Draft all-scenes captures in `/tmp/roz-e1-drafts/` are inspection evidence only and are not part of the collection.
