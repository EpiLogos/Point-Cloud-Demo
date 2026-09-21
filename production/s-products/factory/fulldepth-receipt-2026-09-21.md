# S3 Software Factory — full-depth fan-out receipt (2026-09-21)

**Worker:** S3 full-depth lane (wave 2 of the S-seeded products corpus programme, O-I#65).
**Scope:** bind the remaining Software Factory census records after the wave-1 slice.
**Branch:** `corpus/s-products-factory-fulldepth-20260921` (Point-Cloud-Demo, off `main` @ `96135fca`).

## Result

**224 of 224 remaining census records bound** — with wave-1's 6, the frozen P1-census-factory
inventory (230 records) is fully covered. 19 new journeys, 243 scenes (19 whole-reference
openings + 224 record scenes), 19 binding receipts, 19 real-renderer covers.

- Census: `Antykathera-Essay-Work working/expression-corpus/P1-census-factory.json` @ `ddbe871c`
  (frozen-census-basis, 230 records; source freeze `EpiLogos/Factory@fbabaaad`, branch
  `techne/telemetry-watch-compare-settings`).
- Privacy boundary: every bound record is hashed from git object storage at **published
  `EpiLogos/Factory origin/main f59368de67a4bac32d344099aa827c31a7e6107b`** (same revision the
  wave-1 receipts verified against; 227 of 230 census records byte-identical to the census
  freeze; the 3 moved records are bound at their current committed bytes with the delta named
  below). No dirty working-tree content was read or bound; the Factory repo was only cloned
  read-only into `/private/tmp` for hashing.
- Whole-first: every new journey opens with a whole-reference scene that quotes the S3 office
  line and points at the wave-1 artifact `sp-factory` (six movements #0 → #5→0, essay S3 at
  Antykathera-Essay-Work `7d96ada2`) — referenced, not duplicated.
- Scene law: each record scene quotes the bound record's own committed bytes (H1 title + first
  prose line, markdown emphasis stripped per shared defect #8) and names the record's path,
  `origin/main` revision and sha256. Nothing is invented. 3 formations per scene, well under
  the 10-formation runtime limit (shared defect #1).

## The 19 artifacts

One journey per family of the inventory's own directory structure (split at ≤16 record scenes):

| Artifact | Family | Records | Scenes |
| --- | --- | --- | --- |
| `sp-factory-fd-product-root.journey.json` | product root ground (ProjectCentral, agents, docs root, factory, factory-ui) | 14 | 15 |
| `sp-factory-fd-docs-canon.journey.json` | project canon (docs/canon root, wave-1 slice excluded) | 14 | 15 |
| `sp-factory-fd-docs-canon-modules.journey.json` | canon — QL-MEF module + wayfinders | 14 | 15 |
| `sp-factory-fd-docs-program-research.journey.json` | docs/program, pstack-reduction, research | 11 | 12 |
| `sp-factory-fd-inkwell-claude-front.journey.json` | Inkwell .claude commands + herdr + sandbox-exe-dev skills | 11 | 12 |
| `sp-factory-fd-inkwell-orchestrator.journey.json` | Inkwell sssf-sandbox-orchestrator skill | 14 | 15 |
| `sp-factory-fd-inkwell-sssf-1.journey.json` | Inkwell sssf skill (1/2) | 16 | 17 |
| `sp-factory-fd-inkwell-sssf-2.journey.json` | Inkwell sssf skill (2/2) | 7 | 8 |
| `sp-factory-fd-inkwell-overview-appdocs.journey.json` | Inkwell overview (README/TREE/apps/ai_docs) + app_docs | 14 | 15 |
| `sp-factory-fd-inkwell-templates-adws.journey.json` | Inkwell .claude sssf prompt templates + adws/adw_data templates | 10 | 11 |
| `sp-factory-fd-inkwell-prompts.journey.json` | Inkwell prompts/ | 16 | 17 |
| `sp-factory-fd-inkwell-specs.journey.json` | Inkwell specs/ | 11 | 12 |
| `sp-factory-fd-ql-core.journey.json` | QL agent experiments — root docs, comparison, deep-ql, foundation | 13 | 14 |
| `sp-factory-fd-ql-experiments.journey.json` | QL agent experiments — experiments/ records | 15 | 16 |
| `sp-factory-fd-seed-docs.journey.json` | seed-docs/ | 9 | 10 |
| `sp-factory-fd-sites.journey.json` | sites/ | 4 | 5 |
| `sp-factory-fd-skills.journey.json` | skills/ (factory-bounded-work, factory-development, factory-operation, ql-html-account) | 7 | 8 |
| `sp-factory-fd-sssf-1.journey.json` | super-simple-software-factory skill (1/2) | 16 | 17 |
| `sp-factory-fd-sssf-2.journey.json` | super-simple-software-factory skill (2/2) | 8 | 9 |

Binding receipts: `production/s-products/bindings/sp-factory-fd-<slug>.binding.json` (one per
artifact; S3 admission block, census receipt, source revision, per-scene material refs + sha256).
Covers: `production/s-products/factory/sp-factory-fd-<slug>.cover.png`.

## Exclusions: none — with the classification disclosed

The census froze the committed `.md` surface only, so the census contained no build outputs, no
lockfiles, no generated binaries and no CI/workflow definition files to exclude. Candidate
records were read and judged individually rather than dropped by pattern:

- `factory-ui/THIRD_PARTY_NOTICES.md` — kept: authored provenance notice (names the upstream
  `disler/super-simple-software-factory` and pins revision `de313748…`), not a machine-generated
  license roll-up.
- The 71 `.claude/…` records (48 under `inkwell-agent-sandboxes-and-software-factory/.claude/`,
  23 under `super-simple-software-factory/.claude/`) — kept: they are authored skill, command,
  cookbook, reference and prompt-template documents that live in dot-directories; the "dotfiles"
  exclusion class is read as machine-config dotfiles, not authored prose. Spot-checked
  (`.claude/commands/prime.md`, `skills/sssf/cookbooks/install.md`, sssf scout `system.md`).
- `factory/tests/support/configuration-schemas/PROVENANCE.md` — kept: authored provenance note
  (the schema JSON fixtures themselves are not `.md` and were never census records).
- Thin records (`ql-agent-experiments/comparison/STATUS.md` at 54 bytes, the experiment
  `README.md` placeholders) — kept: authored status/baseline claims; full depth stipulated.
- `docs/CI-COVERAGE.md` — kept: authored documentation about CI coverage, not a workflow file.

Nothing else was a candidate; no record was silently dropped.

## Privacy deltas (census freeze → origin/main, bound at main bytes)

| Record | census sha256 @ `fbabaaad` | bound sha256 @ `f59368de` |
| --- | --- | --- |
| `docs/GUI-SSSF-SOURCE-FIDELITY.md` | `dab3e3d5263a…` | `46aba221dc9a…` |
| `docs/README.md` | `ee50c368de5b…` | `b1441673de97…` |
| `factory-ui/README.md` | `9bbeb40a9dc8…` | `a39d3a39601d…` |

All three are flagged in their binding receipts' `records_bound[].delta`. The other 227 records
match the census sha256 exactly.

## Gates

1. `node production/return-of-zero/tools/validate.mjs production/s-products/factory/sp-factory-fd-*.journey.json`
   → `VALID` on all 19 artifacts (scenes=5..17), `all artifacts valid`.
2. `npx tsx scripts/production-inventory.ts`
   → every journey imports via `importDocuments`, namespaces disjoint:
   `production inventory OK: 4 namespace(s), every journey file imports, namespaces disjoint`.
   The 19 new artifacts appear under `namespace s-products/` with their scene counts.
3. `node production/return-of-zero/tools/capture.mjs production/s-products/factory/sp-factory-fd-*.journey.json --port 47939`
   → `CAPTURED …cover.png` for all 19 (real renderer, SwiftShader via
   `--use-angle=swiftshader`; first-scene captures — the reliable path per shared defect #2;
   per-scene navigation remains unreliable and was not used). Covers inspected visually: atelier
   ground, amber ground disc, whole-reference glyphs and family-specific margin page render
   correctly. The bottom-left chrome dot is known shared defect #10.

Tooling note (recorded, not patched): the capture server (`server/index.mjs`) serves the vite
build at `dist/` and exits at startup if `npm run build` has not run in the checkout; a fresh
clone must build before `capture.mjs` can capture. `build:journeys` alone is not sufficient.
Shared tools were not modified.

## Coverage statement

Wave-1 bound 6 of 230; this pass binds the remaining 224. **230/230 inventoried records are now
bound across `sp-factory.journey.json` + the 19 `sp-factory-fd-*` artifacts.** Every bound
record's bytes are the published `origin/main f59368de` bytes, verified from git object storage
on 2026-09-21. The Factory repository itself was not written to.
