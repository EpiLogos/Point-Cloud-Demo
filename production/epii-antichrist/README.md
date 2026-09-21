# production/epii-antichrist/ — Epii M5-1 / Antichrist Expression corpus

**Owner:** the distinct Epii M5-1 / Antichrist corpus programme, under EpiLogos/O-I#65
(corpus-production obligation: "distinct Epii M5-1/Antichrist corpus").
**Source ground:** EpiLogos/research-canvas (the Antichrist Project, a.k.a. Research Canvas),
`antichrist-vault/`, admitted by `antichrist-vault/knowledge-manifest.json`
(schemaVersion 1, contentRevision 2 — the manifest's `sources[]` is this corpus's
admission boundary; 24 admitted records: episode chats/scripts, the ep-1.1 QL units,
the Naked Face sourcebook, episode-2 research reports, timeline and resonance ledgers).
**Root law:** `production/README.md`. Engine: the existing `oi.journey` v1 editor/engine.
Shared defects are not patched here — they return to Point-Cloud-Demo #6.

## Layout

```text
production/epii-antichrist/
  README.md                        this contract
  bindings/                        one binding record per artifact (exact source refs + sha256)
  profiles/                        corpus base + family profiles (ordinary JSON + lineage docs)
  ep1-ql-units/                    episode 1.1's manifest-admitted QL units (one scene per record)
  ep1-naked-face/                  episode 1.0 as a whole (its ten movements, whole-first)
```

## Artifact conventions

Same discipline as the sibling namespaces: one artifact is one editable
`<slug>.journey.json` (`oi.journey` v1), ids prefixed `epii-`; scene ids derive
from the canonical identity (unit slugs, movement ids); every artifact carries a
binding record in `bindings/<slug>.binding.json` with the source repo, branch,
commit, per-record sha256 and per-scene source refs; covers come only from the
real renderer.

## Source law specific to this corpus

- The knowledge manifest is the admission boundary. Records it does not admit
  (positions 0–5, double-helix, self-identity-complexio-argument drafts,
  supporting-bits essays) are **not** corpus members this pass; admitting them is
  an owner disposition, not a production decision.
- The vault is authored private-source prose that is published at the pinned
  revision. Bindings pin the exact commit; the frozen wave records are
  byte-identical to the published remote (verified before generation). If the
  vault moves, the binding sha256 values invalidate the affected artifacts only.
- Scene texts compress and quote; they never invent claims. Where the source
  names a relation (parent node, sibling units, spectral enactments), the scene
  stages that relation; the corpus never manufactures graph edges.
- Presentations mappings — tints, formations, forces, the "vault reading" vs
  "episode stage" grounds — are declared craft, not source claims.

## Wave 1 (this pass, 2026-09-21)

Two artifacts, 17 scenes, both through the full E0 gates (validateJourney,
importDocuments, real-engine covers):

| Artifact | Scenes | Source records |
| --- | --- | --- |
| `ep1-ql-units/epii-ep1-ql-units.journey.json` | 7 | the 7 manifest ql-units of ep-1.1 |
| `ep1-naked-face/epii-ep1-naked-face.journey.json` | 10 | Episode_0_1_The_Naked_Face_v9.md (whole) |

Known shared defect reconfirmed live during capture: per-scene navigation from
the capture tool is unreliable (E0-POINT-CLOUD-DEFECTS #2; this run:
`openScene` undefined → "Cannot read properties of undefined (reading
'transition')"). Covers are first-scene renders, which the defect list names
reliable.
