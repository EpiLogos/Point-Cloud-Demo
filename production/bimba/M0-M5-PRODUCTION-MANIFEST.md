# M0–M5 production manifest — first Bimba → M′ corpus cut

**Tranche:** first proper Bimba → M′ pass (K-AW-EXPRESSION-PRODUCTION-ALIGNMENT §5–6).
**Worker:** QL-MEF #201, lane 3 (Bimba Expression production), 2026-09-17.
**QL-MEF consumed at:** commit `e87d6bcef81d005e848b978a11a0ab53b7739973`, branch `session/k-aw-expression-production-2026-09-17`.
**Registry consumed:** `fixtures/kernel/m-tree-v1.json` (`ql.m-tree/v1`, 1,876 nodes / 21,083 relations / 6 roots), `registry_revision 259a2f496c5f3a76d31e5c480dc9afdb45ad1282a7034cc28c528c39a71442e4`, source revision `daa660cbc1b8c5da83828698665a753852cb0287`.
**Point-Cloud-Demo at:** `main` `c0502649691bb01a3b2d862befddc821f093b016` (this tranche adds only files under `production/bimba/`).
**Real depths used (2–3, per the corrected map):** depth-2 branch families (the profiles), depth-3 leaves (the artifacts), plus the registry's own `/` aperture notation at depth 3 (`#0-3-0/1`, `#0-5-0/1`, `#2-5-0/1`, `#3-5-5/0`, `#3-5-5/0-0/360`). No invented depth ontology.
**Separator law:** the registry writes compound refs with `-`, with `.` under `#4`/`#5-4`/`#2-4` subtrees, and `/` for apertures — all carried verbatim in labels, descriptions and binding records. Artifact/scene/entity ids mangle `# . /` away because the engine id grammar excludes them (defect D2 below).

## 1. Corpus table — coordinate → M′ instrument → grammar → artifact → refs

| Lead coordinate (verbatim) | M′ instrument relation | Inherited grammar | Artifact | Exact refs (binding record) |
|---|---|---|---|---|
| `#0-3` → `#0-3-0/1` (+`-0`, `-1`) | M0′ Project/Wiki/Graph ↔ Expression graph/source depth | `family-anuttara-language` | `anuttara/bimba-m0-mirror-frame-operator.journey.json` | nodes `75b4f96f2c8f4aeb`, `fa7a7435b8a8cfce`, `a0308bf43b409553`, `1acf68b0ec611631`; rels `11a4c005…`, `5dec0943…`, `a152d361…` |
| `#0-5` (+`#0-5-0/1`, `#0-5-5/0`) | M0′ Project/Wiki/Graph ↔ Expression graph/source depth | `family-anuttara-language` | `anuttara/bimba-m0-siva-shakti-apertures.journey.json` | nodes `c2424584…`, `4b48975f…`, `ce5772d8…`; rels `2dea7528…`, `07c7b9fa…`, `04595204…` (OPERATES_THROUGH → `#0-3-0/1`) |
| `#1-3` (+`-0`,`-1`,`-2`,`-3`) | M1′ Canvas/Constellation ↔ M1 topology/geometry | `family-paramasiva-topology` | `paramasiva/bimba-m1-spanda-poles.journey.json` | node `e78f97ad…` + 4 stage nodes; 4× CONTAINS_SPANDA_STAGE rels + `056b8440…` (`#1-2`→`#1-3`) |
| `#1-2` (+`-0`…`-5`) | M1′ Canvas/Constellation ↔ M1 topology/geometry | `family-paramasiva-topology` | `paramasiva/bimba-m1-ananda-matrices.journey.json` | node `17b2d4e9…` + 6 matrix nodes; rel `1e8cc4ee…` (`#1-2`→`#1-2-0`) |
| `#2-5` (+`#2-5-0/1`, `#2-5-5`, `#2-5-6`, `#2-5-9`) | M2′ Relation Field/Timeline ↔ M2 resonance/material | `family-parashakti-resonance` | `parashakti/bimba-m2-planetary-harmonics.journey.json` | nodes `2810fa29…`, `11a998cf…`, `19afdde1…` (Pluto); rels `107e78a1…`, `7807d0fe…`; leaf membership cited structurally (no typed `#2-5`→leaf rows exist) |
| `#2-4` → `#2-4.3` | M2′ Relation Field/Timeline ↔ M2 resonance/material | `family-parashakti-resonance` | `parashakti/bimba-m2-maqamat-arena.journey.json` | nodes `ea338ce2…`, `bc808c96…`; membership structural only |
| `#3-1` (+`-0`…`-7`) | M3′ Journey/Scenes ↔ real Expression Scenes | `family-mahamaya-transcription` | `mahamaya/bimba-m3-iching-octave.journey.json` | node `60ffed1f…`, `900a3a62…` (Qian); rel `0c985d83…` (`#3-5-2`→`#3-1-0` EMBODIES_EARLIER_HEAVEN) |
| `#3-3` (+`-0`, `-3`, `-4`) | M3′ Journey/Scenes ↔ real Expression Scenes | `family-mahamaya-transcription` | `mahamaya/bimba-m3-transcription-families.journey.json` | node `b60c0db3…`, `c3f14575…`; rels `03d09cde…`, `8ce09f29…` |
| `#3-5` (+`#3-5-5/0`, `#3-5-5/0-0/360`, `#3-5-1`…`#3-5-4`) | **M3′ bridge** — 3:3/4:2 crossing as ordered source-backed Scenes | `family-mahamaya-transcription` | `mahamaya/bimba-m3-axis-mundi-wheel.journey.json` | nodes `73f1f3c0…`, `f0c7dcb3…`, `9bfcc279…`, `ece8b41d…`; rels `3560ab42…`, `851f7f0e…` |
| `#4.4` (+`#4.4.0`, `#4.4.3`, `#4.4.4`, `#4.4.5`) | M4′ Places/World ↔ Nara/EarthBody/situated | `family-nara-situated` | `nara/bimba-m4-lenses.journey.json` | nodes `2a916f3e…`, `aa8a6e8a…`; rels `814eb220…`, `a127ad85…`, `1e76badc…` (DEVELOPS_INTO `#4.5`) |
| `#2-5-0/1` (+`-0`, `-1`…`-7`) | M4′ Places/World ↔ Nara/EarthBody/situated | `family-nara-situated` | `nara/bimba-m4-seven-centres-earth.journey.json` | nodes `11a998cf…`, `93c88344…`, `5ae70b60…`, `ec1ec945…`; rels `7807d0fe…`, `197fe32e…`, `0096a0db…` |
| `#5-4` (+`#5-4.0`…`#5-4.5`) | M5′ Palace/integral articulation ↔ Epii/Agent depth | `family-epii-return` | `epii/bimba-m5-agent-apertures.journey.json` | nodes `ba3d62ca…`, `ca27ca7e…`, `11ce7eb9…`; rels `3bf6e5e8…`, `774495b2…` |
| `#5-5` (+`-0`…`-5`) | M5′ Palace ↔ Epii depth and Return (closes into M0) | `family-epii-return` | `epii/bimba-m5-logos-return.journey.json` | nodes `828a9ee0…`, `4e7e6e38…`, `c36e158e…`; rels `15483063…`, `053f75da…` (HAS_LOGOS_STAGE) |

13 artifacts, all `oi.journey` v1, all passing `validateJourney` + `importDocuments` at generation time. Full refs (registry node ids, exact `bimba:relation:*` refs, scene→coordinate map) live in `bindings/bimba-<slug>.binding.json` per artifact.

## 2. Inheritance tree

```text
O:I global → Epi global
  └─ bimba-corpus-base              (profiles/bimba-corpus-base.profile.json)
       field/engine/view baseline · label grammar · source law (verbatim refs,
       relation-citation discipline, no manufactured graph, colour-is-presentation)
       ├─ family-anuttara-language     M0  #0-3, #0-5    void-dark ground, label-first,
       │                               aperture pairs mirrored, force none/weak
       ├─ family-paramasiva-topology   M1  #1-2, #1-3    pole pairs + joining attract,
       │                               synthesis unforced third, matrices as one body
       ├─ family-parashakti-resonance  M2  #2-4, #2-5    cymatic + declared presentation
       │                               frequencies, orbital radii by registry child order
       ├─ family-mahamaya-transcription M3 #3-1, #3-3, #3-5  sequences in registry order,
       │                               wheel walked by its own anchors, print material
       ├─ family-nara-situated         M4  #4.4 (+ #2-5-0/1 body)  byte-identical ground
       │                               per lens scene, seven-centre column, no station authority
       └─ family-epii-return           M5  #5-4, #5-5    still agent apertures, logos-stage
                                       sequence, Return scene returns to the M0 void ground
            └─ (branch variants / scene overrides — authored per artifact, recorded in descriptions)
```

Every artifact's `profile_lineage` is in its binding record; every description states what varies and why (source-backed variation only).

## 3. Defect entries for Point-Cloud-Demo #6

Verified against `main` `c0502649`. No shared code was modified; these are returned for the one shared repair path.

### D1 — No structured source/provenance envelope in `oi.journey` (blocks the O-I #366 seam)
- **Where:** `field-studies-journeys/src/model.ts:46` (`Journey` interface) and `validateJourney` at `model.ts:104`.
- **What breaks:** the document schema has no place for source identity — no metadata/source-ref envelope. Bimba coordinates, M′ instrument, profile lineage and relation refs can only ride unstructured `description` prose or out-of-band sidecar JSON; nothing in the validate/import path reads or preserves them structurally.
- **Why it matters:** the runtime Wiki→Expression materialisation gate (O-I #366) cannot bind an expression to its Bimba subject from the artifact alone.
- **Minimal repro:** import any `production/bimba/**/*.journey.json`, re-export it from the editor — the coordinate refs survive only as description text; no API can enumerate which coordinates the expression binds.

### D2 — Engine id grammar cannot carry exact compound coordinates
- **Where:** `model.ts:104` — `safeId = /^[a-zA-Z0-9_.:-]{1,160}$/`.
- **What breaks:** canonical Bimba refs contain `#` and `/` (e.g. `#3-5-5/0`, `#2-5-0/1-1`, `#3-5-5/0-0/360`). Any scene/entity/step id containing them is rejected, so every corpus worker must mangle refs into ids (`bimba-3-5-5-0`) and keep the exact ref only in `name`/`text` (≤120 chars) — a silent identity-mangling step re-implemented per worker.
- **Minimal repro:** `validateJourney({...journey, scenes:[{...scene, id:'#3-5-5/0'}]})` throws "Invalid or duplicate scene."; same for an entity id `#2-5-0/1-1` → "Invalid entity."

### D3 — No collection/manifest semantics at the import seam (capability gap for corpus accumulation)
- **Where:** `field-studies-journeys/src/nativeBridge.ts:178-184` (`importDocuments`).
- **What breaks:** an array of documents is flattened into a journey list with per-entry errors; there is no collection/group/manifest concept, and profile files (`profiles/*.profile.json`, ordinary JSON by namespace contract) are never read by the app. Inheritance (what children receive) is enforced only by generator discipline, and a corpus cannot be imported/audited as a unit with its family relations intact.
- **Minimal repro:** `importDocuments([a, b, c])` returns `{journeys:[…]}` with no collection field; editing `family-paramasiva-topology.profile.json` changes nothing in the app's behaviour.

## 4. Runtime Wiki→Expression seam (O-I #366 — named gate, not yet present)

How the seam would bind these artifacts when it lands:

1. **Subject resolution.** Each artifact's binding record names exact registry coordinates + node ids. #366 materialisation would resolve `subject_ref` = canonical coordinate (`MCoordinate.canonical_ref`) through the QL registry/`RegistryDisclosureProvider`, and attach the artifact as the Expression-side projection — the same refs byte-verbatim, per the M0′ row of the K/L5 ledger (`TechneWhole`/`ground_ref` already define the traversal shape).
2. **Envelope need (D1).** The seam requires the structured envelope of D1 to read source identity from the artifact; until then the binding records are the envelope of record, and the wiki-side `ql-mef/shape-binding/v1` extension shows the pattern (subject_ref equality + member retention) a journey envelope should follow.
3. **Constellation/layout discipline.** Any canvas arrangement of these artifacts' subjects stays presentation; constellation grain comes from members (`QlShape`/`ConstellationGrain` law, shape_binding validation) — the corpus never manufactures graph relations, only cites `bimba:relation:*` refs.
4. **M3′ bridge.** `bimba-m3-axis-mundi-wheel` is the seed of the Journey→Scene-ref persistence the lock requires: its six scenes are real, independently addressable `oi.journey` scene refs; a #366/Journey lane would bind subject refs per scene frame and route reorder through the Expression owner's native Action (no shadow persistence).
5. **M5′/Return.** `bimba-m5-agent-apertures` and `bimba-m5-logos-return` stage apertures only; runtime agent depth arrives through Epii's own operations, not through this corpus.

## 5. Honest remainers

- The 360 wheel leaves (`#3-5-5/0-1` … `-359`) are represented by their Alpha-Omega ref; the engine caps a journey at 64 scenes, so the full ring is never staged leaf-by-leaf.
- `#2-5` → planetary leaves (incl. `#2-5-9` Pluto) and `#2-4` → maqamat have no typed relation rows in the registry; membership is cited structurally (node ids + parent), never dressed as typed relations.
- Covers (`<slug>.cover.png`) are absent: covers must come from the real renderer in a browser (namespace root law); this headless tranche cannot produce them. All artifacts are `status: authored`.
- Frequencies, tints, radii and rotations are declared presentation mappings in each artifact's description; none is a source claim.
- Registry node ids for a handful of secondary leaves (e.g. `#1-2-2`…`#1-2-4`, mid-sequence trigrams/centres/stages) exist in the registry and are pinned in `fixtures/kernel/m-tree-v1.json`; the binding records pin the nodes each artifact directly stages.

## 6. Validation

```sh
npx tsx /tmp/bimba-mprime-corpus.ts        # generate: per-artifact validateJourney + importDocuments — 13/13 ok
npx tsx scripts/production-inventory.ts    # cross-namespace floor: every journey under production/ re-imported
```

Results recorded in the tranche return; no shared code was touched, so `npm test`/lint coverage of engine behaviour is unchanged.

## 7. Second cut — depth 3→4 widening (2026-09-17, next pass)

Six authored variations, one per family profile, each covering a real depth-3 branch with its real depth-4 children. Every variation is declared in the artifact's description (inherited → varied → why); only `bimba:relation:*` refs count as relations; registry node ids are pinned in the binding records (`cut: widening-2-depth-3-to-4`).

| Family | Branch → children (real registry rows) | Artifact | Declared variation |
|---|---|---|---|
| anuttara | `#0-2-9` Paramesvara — Principle 9 → 9 virtue leaves (`#0-2-9-0…8`; 5 GENERATIVE_SYNTAX_FLOW + 4 HAS_VIRTUE_COMPONENT) | `anuttara/bimba-m0-paramesvara-virtues.journey.json` | ninefold ring instead of aperture pairs; scene 2 selects only the four HAS_VIRTUE_COMPONENT leaves |
| paramasiva | `#1-3-4` Contextual Flowering → `.0/1` dynamic sixfold, `.0000` static void frame, `.4.0-4.4/5` nested synthesis, `.5/0` recursive integration | `paramasiva/bimba-m1-dynamic-process.journey.json` | widens the first cut's own Spanda branch to its depth-4 frames; the source's dynamic/static naming drives circulation, not force |
| parashakti | `#2-1-0` Archetypal-Numerical Foundation → six HAS_SUB_LENS cause lenses (`#2-1-0-0…5`: potential/what/how/who/when-where/why) | `parashakti/bimba-m2-archetypal-lenses.journey.json` | lens-row grammar instead of planetary/maqamat rows; the six-cause framing is the source's own |
| mahamaya | `#3-1-0` Qian → eight hexagram rows (`#3-1-0-0…7`) | `mahamaya/bimba-m3-qian-octave.journey.json` | widens INTO the octave head staged from above in the first cut; square template + registry-order walk; **no typed relations exist** — membership is structural only |
| nara | `#4.3-2` Dialogical & Inquiry Containers → three CONTAINS_MODALITY practices (`#4.3-2.0 Bohmian Dialogue`, `#4.3-2.1 Native Talking Circle`, `#4.3-2.2 Diamond Approach Inquiry`) | `nara/bimba-m4-dialogue-containers.journey.json` | opens the untouched `#4.3` branch; three containers held apart; no personal subject present or simulated |
| epii | `#5-1` Epi-Logos → six HAS_POSITION positions (`#5-1-0…5`) | `epii/bimba-m5-epilogos-positions.journey.json` | **honest depth**: `#5` has no depth-4 leaves; the deepest unexplored real row is used and says so; position 0 return is presented, not claimed as the operative Return |

### 7.1 Runtime receipts — every widening coordinate through the production M′ source

The QL side of this pass landed `ql techne reading` (QL-MEF `98216fa`): the production `WikiTechneAdapter` (registry provider + shape-aware refraction engine, store-free) as a CLI surface. Each featured branch was emitted as a `WikiRefractionTarget` (shape binding attached where the member row admits a constellation grain) and read through the adapter. Receipts + the exact input targets live beside their binding records in `bindings/` (`<slug>.target.json`, `<slug>.techne-reading.json`):

| Coordinate | Target input | Reading result |
|---|---|---|
| `#0-2-9` (9 members) | `bindings/bimba-m0-paramesvara-virtues.target.json` | ground disclosed; **no whole** — canvas honestly unavailable (9 members admit no constellation grain) |
| `#1-3-4.0/1` (leaf) | `bindings/bimba-m1-dynamic-process.target.json` | ground disclosed; canvas honestly unavailable |
| `#2-1-0` (6 members) | `bindings/bimba-m2-archetypal-lenses.target.json` | ground + canvas; whole `anchor:#2-1-0`, `ql:shape:1.0.0:constellation:sixfold`, members = the six real cause lenses |
| `#3-1-0` (8 untyped members) | `bindings/bimba-m3-qian-octave.target.json` | ground disclosed; canvas honestly unavailable |
| `#4.3-2` (3 members) | `bindings/bimba-m4-dialogue-containers.target.json` | ground + canvas; whole `anchor:#4.3-2`, `ql:shape:1.0.0:constellation:threefold-123` |
| `#5-1` (6 members) | `bindings/bimba-m5-epilogos-positions.target.json` | ground + canvas; whole `anchor:#5-1`, `ql:shape:1.0.0:constellation:sixfold` |

Shape-binding provenance in the receipts is `PROPOSED` (test/widening-scoped binding of real children into QL positions), never canon; member subject refs are the exact registry children.

### 7.2 Widening validation

```sh
npx tsx /tmp/bimba-mprime-widening.ts     # 6/6 validateJourney + importDocuments ok
npx tsx scripts/production-inventory.ts   # cross-namespace floor: 72 journeys, namespaces disjoint
cd /Users/admin/Central/Work/Quaternal-Logic && cargo test -p ql-cli --test techne_reading  # 2/2 (adapter surface)
```
