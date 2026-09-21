# S2 AIKit — full-depth corpus fan-out receipt — 2026-09-21

**Pass:** wave-2 full-depth production fan-out (three parallel workers; this receipt covers S2 AIKit). 
**Admission:** unchanged from wave-1 — the Return-of-Zero essay's S register (record S2, product, T25 census, register episteme, essay bytes at `Antykathera-Essay-Work` 7d96ada2, sha256 `2618122e4da9ccfd…`); T26 ratification remains the owner's.
**Whole-first:** the wave-1 corpus-root journey `production/s-products/aikit/sp-aikit.journey.json` carries the product's own movement path (#0 → #5→0). The full-depth journeys below bind the remaining inventoried records; they reference the whole and never duplicate it.

## Census basis and verification

- Inventory: `Antykathera-Essay-Work working/expression-corpus/P1-census-aikit.json` at main `ddbe871c` — frozen-census-basis, 104 records hashed at `EpiLogos/ai-kit@23dea85` (`techne/agency-mint`).
- **Hash verification:** every one of the 104 census `sha256` entries was re-verified byte-exact from fresh read-only clones (git object storage only) on 2026-09-21: **104/104 match**. No record is bound on the census's word alone.
- **Privacy:** bound bytes are the published `origin/main` (`ace1496`) bytes for every record. 101 of the 104 inventoried records are byte-identical across the census commit and main; **3 drifted on main** since the census freeze and are bound at current main bytes (delta named below). The source repos' dirty in-flight lanes were never read — records are hashed from git objects only.

## Classification — full depth

- Census total: **104**.
- Bound in wave-1 (carried by reference, not duplicated): **6**.
- Bound this pass: **97** records as scenes across **10** journeys.
- Excluded: **1** (each with a one-line reason below; nothing dropped silently).
- Coverage: 6 (wave-1) + 97 (this pass) = **103 of 104** bound; 1 excluded.

Wave-1 bound records (carried by `sp-*.journey.json`): `docs/v2/01-PRODUCT-AND-OWNERSHIP.md`; `docs/v2/02-RESOLUTION-AND-CONTEXT-COGNITION.md`; `docs/adr/0003-user-baselines-and-skill-usage-overlays.md`; `docs/v2/15-MODEL-ROSTER-CAPABILITY-FIT.md`; `docs/v2/HARNESS-ADMISSION-AND-ADAPTER-SDK.md`; `docs/v2/21-PROJECT-REFLECTION-AND-LOCAL-ARTICULATION.md`. (wave-1 replaced the drifted ai-kit README.md with docs/v2/01-PRODUCT-AND-OWNERSHIP.md; this pass binds README.md at its current origin/main bytes (see drift table).)

### Exclusions

| Record | Reason |
| --- | --- |
| `.github/pull_request_template.md` | CI/PR-process template (verification checklist), not authored product-corpus prose |

### Main-drift records (bound at current `origin/main` bytes, delta noted)

| Record | Bound sha256 (main bytes) |
| --- | --- |
| `docs/implementation/CAW-MODEL-DISPATCH.md` | `c223ed484dbd8453…` |
| `README.md` | `3092263f31439082…` |
| `registry/capsules/skill/aikit/knowledge-navigation/payload/SKILL.md` | `e13b11a7a5dd4402…` |

## Journeys (one per inventory family, ≤ 12 scenes each)

| Artifact | Family | Scenes |
| --- | --- | --- |
| `aikit/sp-aikit-fd-adr-implementation.journey.json` | adr-implementation | 9 |
| `aikit/sp-aikit-fd-docs-p1.journey.json` | docs | 9 |
| `aikit/sp-aikit-fd-docs-p2.journey.json` | docs | 8 |
| `aikit/sp-aikit-fd-ground.journey.json` | ground | 7 |
| `aikit/sp-aikit-fd-periphery.journey.json` | periphery | 11 |
| `aikit/sp-aikit-fd-plans.journey.json` | plans | 10 |
| `aikit/sp-aikit-fd-skills-p1.journey.json` | skills | 10 |
| `aikit/sp-aikit-fd-skills-p2.journey.json` | skills | 10 |
| `aikit/sp-aikit-fd-v2-p1.journey.json` | v2 | 12 |
| `aikit/sp-aikit-fd-v2-p2.journey.json` | v2 | 11 |

Binding records: `bindings/<artifact-id>.binding.json` per journey — S-record admission (path + sha256), per-scene material source ref (repo@commit:path), bound sha256 with census-vs-main status per record.

## Scene law

- One scene per bound record, in the census's own order; journeys grouped by the inventory's own directory families; larger families split into sequential parts (`-p1`, `-p2`, …).
- Staging per scene: ground disc + up to four term glyphs drawn from the record's own heading words + one glyph naming the record — 6 formations (runtime limit 10), 7 entities (schema limit 32).
- Text: the same margin-column page relation as wave-1 (x 0.78, width 300, size 17); page body is plain text (shared defect #8: markdown renders literally).
- Scene texts quote the bound record (its heading and opening prose) plus binding facts; no claims are invented; product cross-relations stay in the S records and are not manufactured as graph edges.
- Tints: product tint pairs from `profiles/s-products-corpus-base.profile.json` (aikit `#d2e6e2`/`#2e6f6c`, ql `#e6dcf2`/`#7a5ca8`); the full-depth grammar is declared in `profiles/family-aikit-fulldepth.profile.json` and `profiles/family-ql-fulldepth.profile.json`.

## Gates (executed 2026-09-21)

### `production/return-of-zero/tools/validate.mjs` — VALID, all 10 journeys

```text
VALID  production/s-products/aikit/sp-aikit-fd-adr-implementation.journey.json  scenes=9
VALID  production/s-products/aikit/sp-aikit-fd-docs-p1.journey.json  scenes=9
VALID  production/s-products/aikit/sp-aikit-fd-docs-p2.journey.json  scenes=8
VALID  production/s-products/aikit/sp-aikit-fd-ground.journey.json  scenes=7
VALID  production/s-products/aikit/sp-aikit-fd-periphery.journey.json  scenes=11
VALID  production/s-products/aikit/sp-aikit-fd-plans.journey.json  scenes=10
VALID  production/s-products/aikit/sp-aikit-fd-skills-p1.journey.json  scenes=10
VALID  production/s-products/aikit/sp-aikit-fd-skills-p2.journey.json  scenes=10
VALID  production/s-products/aikit/sp-aikit-fd-v2-p1.journey.json  scenes=12
VALID  production/s-products/aikit/sp-aikit-fd-v2-p2.journey.json  scenes=11
```

### `npx tsx scripts/production-inventory.ts` — OK

```text
production inventory OK: 4 namespace(s), every journey file imports, namespaces disjoint
(all 10 new journeys import via importDocuments; s-products internal dirs (bindings/, profiles/) not cross-referenced)
```

### `production/return-of-zero/tools/capture.mjs` — covers through the real engine (SwiftShader)

```text
CAPTURED production/s-products/aikit/sp-aikit-fd-adr-implementation.cover.png  (S-seeded products — S2 AIKit full depth · adr-implementation / Separate reusable project identity from live project instances)
CAPTURED production/s-products/aikit/sp-aikit-fd-docs-p1.cover.png  (S-seeded products — S2 AIKit full depth · docs (1) / Real harness acceptance through AIKit ACP)
CAPTURED production/s-products/aikit/sp-aikit-fd-docs-p2.cover.png  (S-seeded products — S2 AIKit full depth · docs (2) / Prior art)
CAPTURED production/s-products/aikit/sp-aikit-fd-ground.cover.png  (S-seeded products — S2 AIKit full depth · ground / AIKit agent protocol)
CAPTURED production/s-products/aikit/sp-aikit-fd-periphery.cover.png  (S-seeded products — S2 AIKit full depth · periphery / bkmr capsules)
CAPTURED production/s-products/aikit/sp-aikit-fd-plans.cover.png  (S-seeded products — S2 AIKit full depth · plans / bkmr through Central)
CAPTURED production/s-products/aikit/sp-aikit-fd-skills-p1.cover.png  (S-seeded products — S2 AIKit full depth · skills (1) / living project collaboration — guidance)
CAPTURED production/s-products/aikit/sp-aikit-fd-skills-p2.cover.png  (S-seeded products — S2 AIKit full depth · skills (2) / Profile and SkillSet management)
CAPTURED production/s-products/aikit/sp-aikit-fd-v2-p1.cover.png  (S-seeded products — S2 AIKit full depth · v2 (1) / Part VI — Agent and harness relation)
CAPTURED production/s-products/aikit/sp-aikit-fd-v2-p2.cover.png  (S-seeded products — S2 AIKit full depth · v2 (2) / SessionSpace first-party circuit evidence)
aikit capture exit: 0 (25 covers total across both products; page errors: none — capture exits non-zero on page errors)
```

Known shared defect reconfirmed: per-scene navigation from the capture tool is unreliable (E0-POINT-CLOUD-DEFECTS #2); covers are first-scene renders, which the defect list names reliable. Covers inspected by eye after capture.

## Defects observed (shared tooling — recorded, not patched)

- The capture prerequisite `field-studies-journeys/build/` is a gitignored build artifact; a fresh clone fails `capture.mjs` with `ERR_MODULE_NOT_FOUND` until `npm run build:journeys` is run. The tool does not build or name it. (Recorded for Point-Cloud-Demo #6; `npm ci` + `npm run build:journeys` is the working sequence.)
- No new defects in `validate.mjs` or `production-inventory.ts`; no gate was weakened.

## What a reviewer can check

```bash
node production/return-of-zero/tools/validate.mjs production/s-products/aikit/sp-*-fd-*.journey.json
npx tsx scripts/production-inventory.ts
node production/return-of-zero/tools/capture.mjs production/s-products/aikit/sp-*-fd-*.journey.json --port <free-port>
```

