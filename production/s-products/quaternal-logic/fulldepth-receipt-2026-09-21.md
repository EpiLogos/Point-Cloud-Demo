# S5 Quaternal Logic — full-depth corpus fan-out receipt — 2026-09-21

**Pass:** wave-2 full-depth production fan-out (three parallel workers; this receipt covers S5 Quaternal Logic). 
**Admission:** unchanged from wave-1 — the Return-of-Zero essay's S register (record S5, product, T25 census, register episteme, essay bytes at `Antykathera-Essay-Work` 7d96ada2, sha256 `36a4828c5771769c…`); T26 ratification remains the owner's.
**Whole-first:** the wave-1 corpus-root journey `production/s-products/ql/sp-ql.journey.json` carries the product's own movement path (#0 → #5→0). The full-depth journeys below bind the remaining inventoried records; they reference the whole and never duplicate it.

## Census basis and verification

- Inventory: `Antykathera-Essay-Work working/expression-corpus/P1-census-quaternal-logic.json` at main `ddbe871c` — frozen-census-basis, 148 records hashed at `EpiLogos/Quaternal-Logic@81d1af1` (`session/k-aw-expression-production-2026-09-17`).
- Repo name: the census receipt names `EpiLogos/Quaternal-Logic`; that repository has been renamed `EpiLogos/QL-MEF` (the census commit 81d1af15 is present there; same git history).
- **Hash verification:** every one of the 148 census `sha256` entries was re-verified byte-exact from fresh read-only clones (git object storage only) on 2026-09-21: **148/148 match**. No record is bound on the census's word alone.
- **Privacy:** bound bytes are the published `origin/main` (`2bcdc78`) bytes for every record. 144 of the 148 inventoried records are byte-identical across the census commit and main; **4 drifted on main** since the census freeze and are bound at current main bytes (delta named below). The source repos' dirty in-flight lanes were never read — records are hashed from git objects only.

## Classification — full depth

- Census total: **148**.
- Bound in wave-1 (carried by reference, not duplicated): **6**.
- Bound this pass: **138** records as scenes across **15** journeys.
- Excluded: **4** (each with a one-line reason below; nothing dropped silently).
- Coverage: 6 (wave-1) + 138 (this pass) = **144 of 148** bound; 4 excluded.

Wave-1 bound records (carried by `sp-*.journey.json`): `README.md`; `docs/QL-VAK-KERNEL-RECONCILIATION.md`; `docs/KERNEL-RECURSIVE-M-REGISTRY.md`; `docs/HOLOGRAPHIC-KERNEL-FORMAL-REFERENCE.md`; `docs/QL-STRUCTURAL-CARRIER-CONTRACT-V1.md`; `docs/L5-TECHNE-INTEGRATED-DEVELOPMENT-WAYFINDER.md`. (wave-1 compared against origin/main 5970757e; main has since advanced to 2bcdc78c, so this pass re-compares against the current head.)

### Exclusions

| Record | Reason |
| --- | --- |
| `ProjectCentral/now/day/2026-09-06.md` | derived ProjectCentral NOW closure reading — generated state explicitly marked "not Project canon", not authored corpus material |
| `ProjectCentral/now/day/2026-09-07.md` | derived ProjectCentral NOW closure reading — generated state explicitly marked "not Project canon", not authored corpus material |
| `ProjectCentral/now/day/2026-09-08.md` | derived ProjectCentral NOW closure reading — generated state explicitly marked "not Project canon", not authored corpus material |
| `ProjectCentral/now/day/2026-09-11.md` | derived ProjectCentral NOW closure reading — generated state explicitly marked "not Project canon", not authored corpus material |

### Main-drift records (bound at current `origin/main` bytes, delta noted)

| Record | Bound sha256 (main bytes) |
| --- | --- |
| `docs/L5-TECHNE-DUAL-READING-LOCK.md` | `f884ce4202f75a4c…` |
| `.wayfinder/maps/k-aw-expression-production.md` | `ed57b00405f7bd72…` |
| `AGENTS.md` | `0f842d6da6c6c674…` |
| `docs/kernel-rebuild/UX-SPINE-RECONCILIATION.md` | `8c26b55617713ed9…` |

## Journeys (one per inventory family, ≤ 12 scenes each)

| Artifact | Family | Scenes |
| --- | --- | --- |
| `quaternal-logic/sp-ql-fd-craft.journey.json` | craft | 9 |
| `quaternal-logic/sp-ql-fd-docs-p1.journey.json` | docs | 12 |
| `quaternal-logic/sp-ql-fd-docs-p2.journey.json` | docs | 12 |
| `quaternal-logic/sp-ql-fd-epi-logos-p1.journey.json` | epi-logos | 11 |
| `quaternal-logic/sp-ql-fd-epi-logos-p2.journey.json` | epi-logos | 11 |
| `quaternal-logic/sp-ql-fd-epi-logos-p3.journey.json` | epi-logos | 11 |
| `quaternal-logic/sp-ql-fd-epi-logos-p4.journey.json` | epi-logos | 10 |
| `quaternal-logic/sp-ql-fd-fixtures.journey.json` | fixtures | 10 |
| `quaternal-logic/sp-ql-fd-geometry.journey.json` | geometry | 5 |
| `quaternal-logic/sp-ql-fd-ground.journey.json` | ground | 5 |
| `quaternal-logic/sp-ql-fd-kernel-rebuild-p1.journey.json` | kernel-rebuild | 10 |
| `quaternal-logic/sp-ql-fd-kernel-rebuild-p2.journey.json` | kernel-rebuild | 10 |
| `quaternal-logic/sp-ql-fd-kernel-rebuild-p3.journey.json` | kernel-rebuild | 8 |
| `quaternal-logic/sp-ql-fd-periphery.journey.json` | periphery | 6 |
| `quaternal-logic/sp-ql-fd-skills.journey.json` | skills | 8 |

Binding records: `bindings/<artifact-id>.binding.json` per journey — S-record admission (path + sha256), per-scene material source ref (repo@commit:path), bound sha256 with census-vs-main status per record.

## Scene law

- One scene per bound record, in the census's own order; journeys grouped by the inventory's own directory families; larger families split into sequential parts (`-p1`, `-p2`, …).
- Staging per scene: ground disc + up to four term glyphs drawn from the record's own heading words + one glyph naming the record — 6 formations (runtime limit 10), 7 entities (schema limit 32).
- Text: the same margin-column page relation as wave-1 (x 0.78, width 300, size 17); page body is plain text (shared defect #8: markdown renders literally).
- Scene texts quote the bound record (its heading and opening prose) plus binding facts; no claims are invented; product cross-relations stay in the S records and are not manufactured as graph edges.
- Tints: product tint pairs from `profiles/s-products-corpus-base.profile.json` (aikit `#d2e6e2`/`#2e6f6c`, ql `#e6dcf2`/`#7a5ca8`); the full-depth grammar is declared in `profiles/family-aikit-fulldepth.profile.json` and `profiles/family-ql-fulldepth.profile.json`.

## Gates (executed 2026-09-21)

### `production/return-of-zero/tools/validate.mjs` — VALID, all 15 journeys

```text
VALID  production/s-products/quaternal-logic/sp-ql-fd-craft.journey.json  scenes=9
VALID  production/s-products/quaternal-logic/sp-ql-fd-docs-p1.journey.json  scenes=12
VALID  production/s-products/quaternal-logic/sp-ql-fd-docs-p2.journey.json  scenes=12
VALID  production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p1.journey.json  scenes=11
VALID  production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p2.journey.json  scenes=11
VALID  production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p3.journey.json  scenes=11
VALID  production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p4.journey.json  scenes=10
VALID  production/s-products/quaternal-logic/sp-ql-fd-fixtures.journey.json  scenes=10
VALID  production/s-products/quaternal-logic/sp-ql-fd-geometry.journey.json  scenes=5
VALID  production/s-products/quaternal-logic/sp-ql-fd-ground.journey.json  scenes=5
VALID  production/s-products/quaternal-logic/sp-ql-fd-kernel-rebuild-p1.journey.json  scenes=10
VALID  production/s-products/quaternal-logic/sp-ql-fd-kernel-rebuild-p2.journey.json  scenes=10
VALID  production/s-products/quaternal-logic/sp-ql-fd-kernel-rebuild-p3.journey.json  scenes=8
VALID  production/s-products/quaternal-logic/sp-ql-fd-periphery.journey.json  scenes=6
VALID  production/s-products/quaternal-logic/sp-ql-fd-skills.journey.json  scenes=8
```

### `npx tsx scripts/production-inventory.ts` — OK

```text
production inventory OK: 4 namespace(s), every journey file imports, namespaces disjoint
(all 15 new journeys import via importDocuments; s-products internal dirs (bindings/, profiles/) not cross-referenced)
```

### `production/return-of-zero/tools/capture.mjs` — covers through the real engine (SwiftShader)

```text
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-craft.cover.png  (S-seeded products — S5 Quaternal Logic full depth · craft / Jankó Keyboard as a QL Instrument Figure)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-docs-p1.cover.png  (S-seeded products — S5 Quaternal Logic full depth · docs (1) / Quaternal Logic CI topology)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-docs-p2.cover.png  (S-seeded products — S5 Quaternal Logic full depth · docs (2) / L5 Technē TB0 — The Pinned Connective Base)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p1.cover.png  (S-seeded products — S5 Quaternal Logic full depth · epi-logos (1) / AW / S′ continuity ledger)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p2.cover.png  (S-seeded products — S5 Quaternal Logic full depth · epi-logos (2) / Epi / QL-MEF holographic C-kernel orientation)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p3.cover.png  (S-seeded products — S5 Quaternal Logic full depth · epi-logos (3) / Epi-Logos / Pratibimba Product Build Order)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-epi-logos-p4.cover.png  (S-seeded products — S5 Quaternal Logic full depth · epi-logos (4) / Epi-Logos R2 focused deep-dive protocol)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-fixtures.cover.png  (S-seeded products — S5 Quaternal Logic full depth · fixtures / Foreign portable knowledge)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-geometry.cover.png  (S-seeded products — S5 Quaternal Logic full depth · geometry / Canonical constellation resolution — L5.3 Geometry)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-ground.cover.png  (S-seeded products — S5 Quaternal Logic full depth · ground / Wayfinder — K / AW Expression Production)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-kernel-rebuild-p1.cover.png  (S-seeded products — S5 Quaternal Logic full depth · kernel-rebuild (1) / Agent practice and the QL bootstrap bridge)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-kernel-rebuild-p2.cover.png  (S-seeded products — S5 Quaternal Logic full depth · kernel-rebuild (2) / K8 coupled event v1)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-kernel-rebuild-p3.cover.png  (S-seeded products — S5 Quaternal Logic full depth · kernel-rebuild (3) / M3 source bindings and semantic parity)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-periphery.cover.png  (S-seeded products — S5 Quaternal Logic full depth · periphery / L5 Technē Instrument Surfaces — refinement home)
CAPTURED production/s-products/quaternal-logic/sp-ql-fd-skills.cover.png  (S-seeded products — S5 Quaternal Logic full depth · skills / QL-owned Skill sources)
ql capture exit: 0 (25 covers total across both products; page errors: none — capture exits non-zero on page errors)
```

Known shared defect reconfirmed: per-scene navigation from the capture tool is unreliable (E0-POINT-CLOUD-DEFECTS #2); covers are first-scene renders, which the defect list names reliable. Covers inspected by eye after capture.

## Defects observed (shared tooling — recorded, not patched)

- The capture prerequisite `field-studies-journeys/build/` is a gitignored build artifact; a fresh clone fails `capture.mjs` with `ERR_MODULE_NOT_FOUND` until `npm run build:journeys` is run. The tool does not build or name it. (Recorded for Point-Cloud-Demo #6; `npm ci` + `npm run build:journeys` is the working sequence.)
- No new defects in `validate.mjs` or `production-inventory.ts`; no gate was weakened.

## What a reviewer can check

```bash
node production/return-of-zero/tools/validate.mjs production/s-products/quaternal-logic/sp-*-fd-*.journey.json
npx tsx scripts/production-inventory.ts
node production/return-of-zero/tools/capture.mjs production/s-products/quaternal-logic/sp-*-fd-*.journey.json --port <free-port>
```

