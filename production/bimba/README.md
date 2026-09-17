# production/bimba/ — Bimba / QL Expression corpus

**Owner:** QL-MEF issue #201 (M/Bimba, the M→M′ instrument relation, Ta-Onta).
**Root law:** `production/README.md`.
**Engine:** the existing `oi.journey` v1 Expression engine/editor in this
repository. No new scene language. QL owns its content fan-out; shared
editor/engine defects are not patched here — they return to Point-Cloud-Demo
#6 and are repaired once.

## Layout

```text
production/bimba/
  README.md                this contract
  bindings/                one binding record per artifact (exact source refs + revisions)
  profiles/                family/profile baselines (ordinary JSON param + lineage docs, not a new schema)
  <family>/                one directory per real production family, as it arises
    <slug>.journey.json    the editable Expression (authoring truth)
    <slug>.cover.png       captured through the real renderer, not drawn
```

Families arise from actual content need — no advance catalogue.

## Artifact conventions

- One artifact is one editable Expression: `<slug>.journey.json`
  (`oi.journey`, version 1). `id` fields are kebab-case prefixed `bimba-`.
- Scene ids are stable and derived from the canonical identity (e.g. a Bimba
  coordinate `m2-5-9`, or `assembly`, `state-2`).
- Every artifact has a binding record in `bindings/<slug>.binding.json`:

```json
{
  "artifact": "<family>/<slug>.journey.json",
  "family": "<family>",
  "worker": "<QL lane id>",
  "profile_lineage": ["<profile ids, innermost last>"],
  "source_revision": {
    "repo": "<QL/Bimba source repository>",
    "commit": "<sha>",
    "records": [{ "coordinate": "M2-5-9", "ref": "<canonical source ref>" }]
  },
  "pointcloud_revision": "<this repo's sha at production time>",
  "scenes": [{ "scene_id": "<id>", "source_ref": "<coordinate/branch>" }],
  "assets": [{ "kind": "glyph|ascii|image|cymatic|yantra", "ref": "<path or inline>", "provenance": "authored|external:<licence/source>" }],
  "capture": "<family>/<slug>.cover.png or null",
  "status": "authored | captured | reviewed",
  "notes": "<craft observations, defects, honest remainers>"
}
```

- Semantic colour, coordinates and branch bindings carry QL's own source
  authority; nothing here is source truth. The essay corpus lives in its own
  namespace and is never referenced from here.

## Worked example

`path-proof/bimba-path-proof-fixture.journey.json` +
`bindings/bimba-path-proof-fixture.binding.json` prove the namespace path
end to end (model API → `validateJourney` → write → `importDocuments`). They
are **engineering evidence, not corpus content** — replace them with real work
when the corpus begins. Regenerate with `npx tsx scripts/bimba-path-proof.ts`.
