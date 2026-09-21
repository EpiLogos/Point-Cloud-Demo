# Central (S0) — full-depth fan-out receipt, 2026-09-21

Wave-2 full-depth pass of the S-seeded product corpus for **EpiLogos/Central** (S0,
"meaningful continuity"). Companion to and extending the wave-1 whole-first corpus-root
journey `production/s-products/central/sp-central.journey.json` (the S0 movement path
#0 → #5→0), which is referenced, not duplicated. Admission unchanged: the essay's S
register (T25 census, register episteme), record `S0`
(`submission-package/essay/symbolon/episteme/products/S0-Central.md`, sha256
`8cfac85fee243e0c7f68c362602fb930d7c935db6672d8d41b091b321100f063` at
Antykathera-Essay-Work `7d96ada2`).

## Coverage

- **Census basis:** `Antykathera-Essay-Work working/expression-corpus/P1-census-central.json`
  (frozen-census-basis, 61 records, frozen at EpiLogos/Central `87341be4`).
- **Bound: 61 of 61** — wave-1 bound 6, this pass binds the remaining **55** (55 scenes below).
- **Exclusions: none.** All 61 census records are authored corpus material. The one fixture
  in the inventory (`skills/control-maintenance/fixtures/product-ground-pressure.md`) is an
  authored prose document ("Fixture — returned reality pressures product ground without
  rewriting it") — kept, not excluded: the exclusion class is fixtures *without* authored
  prose.
- **Census deltas (3)** — changed on published main since the census freeze; the **current
  committed bytes are bound**, delta noted in the scene page and binding record:
  - `docs/CONNECTOR-SDK-RUST.md`
  - `docs/CONNECTOR-SDK-SPEC.md`
  - `skills/connector-authoring/SKILL.md`

## Privacy verification

Every bound record re-hashed from **EpiLogos/Central git object storage at published
`origin/main` `36113051d748fded53166d7717083bd76f996fe7`** on 2026-09-21 and compared
against the census receipt's sha256 (58/58 unchanged, 3 changed-on-main bound at current
bytes). Note Central's main has moved since wave-1 (wave-1 verified against
`48568e54…`); the wave-1-bound six were not re-bound here and are not touched. No working
tree read; no dirty content bound; source repo untouched.

## Journeys (this pass, 55 scenes)

| Artifact | Scenes | Family |
| --- | --- | --- |
| `central/sp-central-root-and-connectors.journey.json` | 4 | Root handoff and connector SDK faces |
| `central/sp-central-projectcentral.journey.json` | 1 | ProjectCentral user ground — capability matrix and telos |
| `central/sp-central-ctrl-defaults.journey.json` | 8 | Distributed default ground — governance and ProjectCentral starters |
| `central/sp-central-docs-vision.journey.json` | 6 | Product vision and system spec |
| `central/sp-central-docs-governance.journey.json` | 9 | Governance protocols and the ProjectCentral contract |
| `central/sp-central-docs-connectors.journey.json` | 7 | Connector SDK and integration surfaces |
| `central/sp-central-docs-operations.journey.json` | 9 | Operations — CLI, install, census, native reading, extension |
| `central/sp-central-skills.journey.json` | 9 | Skills — connector authoring, control maintenance, docs methodology |
| `central/sp-central-surfaces.journey.json` | 2 | Surfaces — Raycast and Shortcuts |

Every artifact carries a binding record `bindings/sp-central-<family>.binding.json`
(per-scene material path + sha256 + delta note; admission block with the S0 record), a
real-renderer cover `central/sp-central-<family>.cover.png`, profile lineage
`s-products-corpus-base` → `family-central`, and ≤6 formations per scene (under the
10-formation runtime limit).

## Gates (2026-09-21, this branch)

```
$ node production/return-of-zero/tools/validate.mjs <33 new journeys>
… VALID  production/s-products/central/sp-central-*.journey.json (all nine; scenes=1…9)
all artifacts valid            (33/33 VALID across the three products)

$ npx tsx scripts/production-inventory.ts
namespace s-products/
  ok  central/sp-central-*.journey.json (all nine import; wave-1 root imports)
production inventory OK: 4 namespace(s), every journey file imports, namespaces disjoint

$ node production/return-of-zero/tools/capture.mjs <nine journeys>
CAPTURED production/s-products/central/sp-central-projectcentral.cover.png      (… / Central capabilities and relations)
CAPTURED production/s-products/central/sp-central-root-and-connectors.cover.png (… / Git Synchronizer Connector)
CAPTURED production/s-products/central/sp-central-ctrl-defaults.cover.png       (… / The day closes)
CAPTURED production/s-products/central/sp-central-docs-vision.cover.png         (… / Central — public framing handoff)
CAPTURED production/s-products/central/sp-central-docs-governance.cover.png     (… / Central — layered human-authored Agent governance sources)
CAPTURED production/s-products/central/sp-central-docs-connectors.cover.png     (… / Capability matrices and product accounts)
CAPTURED production/s-products/central/sp-central-docs-operations.cover.png     (… / Central CLI reference)
CAPTURED production/s-products/central/sp-central-skills.cover.png              (… / Capability matrices)
CAPTURED production/s-products/central/sp-central-surfaces.cover.png            (… / Central Raycast Surface)
```

Covers inspected visually: product tint ground disc, the bound record's own heading terms
as glyph row, margin page quoting the bound path + sha256. Shared defect #2 (per-scene
capture unreliable) stands — covers are first-scene renders; no shared tool was patched.

## Findings (recorded, not patched)

- EpiLogos/Central `origin/main` moved after wave-1 (`48568e54…` → `36113051…`). The three
  census-delta files above are the movement this pass consumed; no wave-1-bound record was
  among the changed files, so wave-1 bindings remain valid as frozen.
- Capture tooling precondition: `node server/index.mjs` requires `npm run build:journeys`
  and a built `dist/` (`npx vite build`) — undocumented in `tools/capture.mjs`; recorded
  here, nothing patched.
