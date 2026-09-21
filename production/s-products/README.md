# production/s-products/ — the six products, S-seeded Expression corpus

**Owner:** the six-products corpus programme under EpiLogos/O-I#65 (corpus-production
obligation). **Admission boundary:** the Return-of-Zero essay corpus's **S register** —
record `S` (product-field, `members: [S0..S5]`) and records `S0`–`S5` (product), register
`episteme`, in the frozen 288-record T25 census
(`Antykathera-Essay-Work working/pre-manuscript-refinement-2026-09-10/T25-current-census-acceptance.json`;
canonical homes `submission-package/essay/symbolon/episteme/products/`). This namespace
exists because the P1 parent pass wrongly reported the products' corpora as having "no
canonical authored-record census or admission disposition"; the correction (P1 map §7)
recognises the S register as that admission, and this wave is **seeded from S0–S5**.
**Source ground (material):** the six product repos' committed authored-prose surfaces as
frozen in `Antykathera-Essay-Work working/expression-corpus/P1-census-{central,actuation,
aikit,factory,workcell,quaternal-logic}.json` — candidate material inventories bound under
their S coordinates. **Root law:** `production/README.md`. Engine: the existing
`oi.journey` v1 editor/engine. Shared defects are not patched here — they return to
Point-Cloud-Demo #6.

## Layout

```text
production/s-products/
  README.md                        this contract
  bindings/                        one binding record per artifact (S record + material refs + sha256)
  profiles/                        corpus base + one family profile per product
  central/                         S0 Central — meaningful continuity
  actuation/                       S1 Actuation — living articulation
  aikit/                           S2 AIKit — potency
  factory/                         S3 Software Factory — transformation
  workcell/                        S4 Workcell — situated existence
  ql/                              S5 Quaternal Logic — Transcendent Relation
```

## Artifact conventions

Same discipline as the sibling namespaces: one artifact is one editable
`<slug>.journey.json` (`oi.journey` v1), ids prefixed `sp-`; whole-first means each
journey stages its S record's own movement path (`#0 → #5→0`, six scenes in the record's
order); scene ids derive from the S record's movement headings; every scene binds
(a) its S record — essay path, exact movement heading, sha256 at Antykathera-Essay-Work
`7d96ada2` — and (b) one material record from the frozen inventory (path + sha256 at the
product repo's frozen commit); every artifact carries a binding record in
`bindings/sp-<slug>.binding.json`; covers come only from the real renderer.

## Source law specific to this corpus

- **The S register is the admission.** What is a product corpus member *of the essay's
  field* is decided by the S records (product offices, paired lenses, argument/concept
  relations, local A/C constitutions). Which of the product's own committed records enter
  a wave is a production selection bound under that coordinate; the receipts' hash work
  stands, and their `frozen-census-basis` status is a material inventory, not a rival
  admission.
- **Product repos are read-only.** Several carry dirty in-flight owner/agent lanes
  (Actuation, Factory, ai-kit, Workcell, Central at survey time). Records are hashed from
  git object storage at the frozen commits; dirty working trees are never read, frozen or
  switched. T26 ratification of the S records' standing remains the owner's.
- **Privacy boundary.** Every bound record must be byte-identical to the product repo's
  published `origin/main`. All 36 wave-1 bound records were re-hashed from git objects and
  compared against `origin/main` on 2026-09-21: 36/36 identical. One candidate (ai-kit
  `README.md`) had drifted on main and was replaced in selection by
  `docs/v2/01-PRODUCT-AND-OWNERSHIP.md` rather than bound.
- **Scene law.** Scene texts compress and quote the S record and the material record;
  they never invent claims. Product cross-relations live in the S records' own
  argument/concept relations; the corpus does not manufacture graph edges. Presentation
  mappings (product tints, grounds, term rows) are declared craft.

## Wave 1 (this pass, 2026-09-21)

Six artifacts, 36 scenes — one whole-first journey per product, six movements each, one
material record bound per movement:

| Artifact | Scenes | S record | Material slice |
| --- | --- | --- | --- |
| `central/sp-central.journey.json` | 6 | S0 (m37) | 6 of 61 census records |
| `actuation/sp-actuation.journey.json` | 6 | S1 (m38) | 6 of 157 |
| `aikit/sp-aikit.journey.json` | 6 | S2 (m39) | 6 of 104 |
| `factory/sp-factory.journey.json` | 6 | S3 (m40) | 6 of 230 |
| `workcell/sp-workcell.journey.json` | 6 | S4 (m41) | 6 of 30 |
| `ql/sp-ql.journey.json` | 6 | S5 (m42) | 6 of 148 |

All through the full gates (generation with `validateJourney` + `importDocuments` in the
loop; `production/return-of-zero/tools/validate.mjs` VALID; `scripts/production-inventory.ts`
namespace floor; real-engine covers via `tools/capture.mjs`, SwiftShader). Known shared
defect reconfirmed during capture: per-scene navigation from the capture tool is
unreliable (E0-POINT-CLOUD-DEFECTS #2); covers are first-scene renders, which the defect
list names reliable. Wave-1 is a seeded slice, **not corpus-complete**: full per-product
depth (the whole inventoried surface as scenes) is the following fan-out.
