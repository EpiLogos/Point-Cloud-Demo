# Workcell (S4) — full-depth fan-out receipt, 2026-09-21

Wave-2 full-depth pass of the S-seeded product corpus for **EpiLogos/Workcell** (S4,
"situated existence"). Companion to and extending the wave-1 whole-first corpus-root
journey `production/s-products/workcell/sp-workcell.journey.json` (the S4 movement path
#0 → #5→0), which is referenced, not duplicated. Admission unchanged: the essay's S
register (T25 census, register episteme), record `S4`
(`submission-package/essay/symbolon/episteme/products/S4-Workcell.md`, sha256
`add7ce79a43ab76a76fbdc5ce31c188d430fb5524fdbb7a1e48d1de57037ff7f` at
Antykathera-Essay-Work `7d96ada2`).

## Coverage

- **Census basis:** `Antykathera-Essay-Work working/expression-corpus/P1-census-workcell.json`
  (frozen-census-basis, 30 records, frozen at EpiLogos/Workcell `5ddf156d`).
- **Bound: 30 of 30** — wave-1 bound 6, this pass binds the remaining **24** as 207-scene
  programme member (24 scenes below).
- **Exclusions: none.** All 30 census records are authored corpus material (product docs,
  ProjectCentral governance, skills, SDK README); no build outputs, lockfiles, generated
  content, dotfiles or CI files appear in the inventory.
- **Census deltas (2)** — changed on published main since the census freeze; the **current
  committed bytes are bound**, delta noted in the scene page and binding record:
  - `docs/DEPLOYMENT-PROFILES.md`
  - `docs/MODEL-SERVING-CONFORMANCE.md`

## Privacy verification

Every bound record re-hashed from **EpiLogos/Workcell git object storage at published
`origin/main` `d911bfd9597f126df6c818cec9641023a06034b1`** on 2026-09-21 and compared
against the census receipt's sha256 (28/28 unchanged, 2 changed-on-main bound at current
bytes). No working tree read; no dirty content bound; source repo untouched.

## Journeys (this pass, 24 scenes)

| Artifact | Scenes | Family |
| --- | --- | --- |
| `workcell/sp-workcell-projectcentral.journey.json` | 4 | ProjectCentral ground — repo covenant, capability matrix, telos |
| `workcell/sp-workcell-sdk-and-skills.journey.json` | 3 | SDK and skills — provider authoring, workcell operation |
| `workcell/sp-workcell-docs-sources.journey.json` | 3 | Source integrations — Arrakis, Docker, OpenSandbox |
| `workcell/sp-workcell-docs-operations.journey.json` | 3 | Material operations — CAW procedures and secret projection |
| `workcell/sp-workcell-docs-connectivity.journey.json` | 5 | Connectivity and placement — fabric, control service, interop, cells |
| `workcell/sp-workcell-docs-platform.journey.json` | 6 | Platform understanding — deployment, worlds, model serving, wayfinder |

Every artifact carries a binding record `bindings/sp-workcell-<family>.binding.json`
(per-scene material path + sha256 + delta note; admission block with the S4 record), a
real-renderer cover `workcell/sp-workcell-<family>.cover.png`, profile lineage
`s-products-corpus-base` → `family-workcell`, and ≤6 formations per scene (ground disc +
heading-term glyph row + material glyph — under the 10-formation runtime limit).

## Gates (2026-09-21, this branch)

```
$ node production/return-of-zero/tools/validate.mjs <33 new journeys>
VALID  production/s-products/workcell/sp-workcell-projectcentral.journey.json  scenes=4 [...]
VALID  production/s-products/workcell/sp-workcell-sdk-and-skills.journey.json  scenes=3 [...]
VALID  production/s-products/workcell/sp-workcell-docs-sources.journey.json    scenes=3 [...]
VALID  production/s-products/workcell/sp-workcell-docs-operations.journey.json scenes=3 [...]
VALID  production/s-products/workcell/sp-workcell-docs-connectivity.journey.json scenes=5 [...]
VALID  production/s-products/workcell/sp-workcell-docs-platform.journey.json   scenes=6 [...]
all artifacts valid            (33/33 VALID across the three products)

$ npx tsx scripts/production-inventory.ts
namespace s-products/
  ok  workcell/sp-workcell-*.journey.json (all six import; wave-1 root imports)
production inventory OK: 4 namespace(s), every journey file imports, namespaces disjoint

$ node production/return-of-zero/tools/capture.mjs <six journeys>
CAPTURED production/s-products/workcell/sp-workcell-projectcentral.cover.png   (… / Repo content)
CAPTURED production/s-products/workcell/sp-workcell-sdk-and-skills.cover.png   (… / Workcell SDK)
CAPTURED production/s-products/workcell/sp-workcell-docs-sources.cover.png     (… / Arrakis provider source integration)
CAPTURED production/s-products/workcell/sp-workcell-docs-operations.cover.png  (… / Installed-world and second-placement procedure)
CAPTURED production/s-products/workcell/sp-workcell-docs-connectivity.cover.png (… / Workcell connectivity fabric)
CAPTURED production/s-products/workcell/sp-workcell-docs-platform.cover.png    (… / Deployment profiles and reference specimens)
```

Covers inspected visually: product tint ground disc, the bound record's own heading terms
as glyph row, margin page quoting the bound path + sha256 + census note. Shared defect #2
(per-scene capture unreliable) stands — covers are first-scene renders; no shared tool
was patched.

## Findings (recorded, not patched)

- The census receipt's `source.commit` (`5ddf156d…`) is **not reachable from published
  `origin/main`** (`d911bfd9…`) on EpiLogos/Workcell — the census was frozen from a
  checkout ahead of (or divergent from) the published branch. All 30 records were still
  byte-identical on published main except the two delta files above, so the inventory
  binds cleanly; the receipt's frozen commit is not verifiable from the published repo.
- Capture tooling precondition: `node server/index.mjs` requires `npm run build:journeys`
  and a built `dist/` (`npx vite build`) — undocumented in `tools/capture.mjs`; recorded
  here, nothing patched.
