# Return-of-Zero Expression production collection

**Owner:** EpiLogos/Antykathera-Essay-Work issue #65 (E0 parent session).
**Ground:** `field-studies-journeys/docs/EXPRESSION-PRODUCTION-SANDBOX.md`, Point-Cloud-Demo #6.
**Engine:** the existing `oi.journey` v1 Expression engine/editor in this repository. No new scene language.

This is the durable, repository-visible corpus body for the Return-of-Zero
Expression corpus. The essay repository keeps the authoritative census and the
source→artifact inventory; artifacts bind back to it by exact source refs and
revisions.

## Layout

```text
production/return-of-zero/
  README.md                    this contract
  profiles/                    family/profile baselines (ordinary JSON param + lineage docs, not a new schema)
  bindings/                    one binding record per artifact (exact source refs + revisions)
  essay/                       E1 — sovereign essay reading path
  rooms/                       E1 — eight section rooms, 48 movements as addressable scenes
  arguments-a/                 E2 — A01–A36 family
  conjugates-a-prime/          E2 — A01′–A36′ family
  episteme/                    E3 — C family, A/C root, S/S0–S5, histories, dossiers, etymologies, lenses, aphorism
  matheme/                     E4 — Matheme register (80 records)
  symbolon/                    E5 — root twelvefold, spine index, whole/register relation
  mytheme/                     E6 — Whole Mythemes, one sequenced Expression per whole
  tools/                       validate.mjs + capture.mjs (shared authoring helpers only)
```

## Artifact conventions

- One artifact is one editable Expression file: `<slug>.journey.json` (`oi.journey`, version 1),
  validated by `node tools/validate.mjs <file>`.
- `id` fields are kebab-case prefixed `roz-` (e.g. `roz-a-arguments`, `roz-mytheme-job`).
  Scene ids are stable and derived from the canonical identity
  (e.g. `a01`, `a01p`, `c41`, `m-00-integral-threshold`, `movement-08`).
- Covers are captured, not drawn: `<slug>.cover.png` beside the artifact,
  produced by `tools/capture.mjs` through the real engine.
- Every artifact has a binding record in `bindings/<slug>.binding.json`:

```json
{
  "artifact": "arguments-a/roz-a-arguments.journey.json",
  "family": "arguments-a",
  "worker": "E2",
  "profile_lineage": ["roz-corpus-base", "register-episteme", "family-argument"],
  "source_revision": {
    "repo": "EpiLogos/Antykathera-Essay-Work",
    "commit": "<sha>",
    "census": "working/pre-manuscript-refinement-2026-09-10/T25-current-census-acceptance.json",
    "records": [{ "record_id": "A01", "path": "<canonical path>", "sha256": "<from census receipt>" }]
  },
  "pointcloud_revision": "<sha>",
  "scenes": [{ "scene_id": "a01", "source_ref": "A01", "relations": "<room/conjugate/return refs preserved verbatim>" }],
  "assets": [{ "kind": "ascii|glyph|image|diagram|html", "ref": "<path or inline>", "provenance": "authored|external:<licence/source>" }],
  "capture": "arguments-a/roz-a-arguments.cover.png",
  "status": "authored | captured | reviewed",
  "notes": "<craft observations, defects, honest remainers>"
}
```

## Boundaries

- Workers write only inside their own family directory (plus bindings/profiles entries for their artifacts).
- No worker modifies engine/editor code. Shared defects are recorded in the binding `notes` and
  returned to Point-Cloud-Demo #6 for one repair.
- Canonical essay/source authority stays in Antykathera-Essay-Work. Nothing here is source truth.
- External imagery is admitted only with provenance/licence recorded; authored glyph/ASCII/diagram
  forms record `provenance: "authored"`.
