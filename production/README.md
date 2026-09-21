# production/

Durable corpus output for the Expression production sandbox (Point-Cloud-Demo #6;
ground: `field-studies-journeys/docs/EXPRESSION-PRODUCTION-SANDBOX.md`). Browser
storage (the localStorage library, IndexedDB recovery drafts) is per-browser and
is **not** corpus output; accepted artifacts live here as files.

## Root law (every namespace)

- One namespace per source-world programme. Namespaces are **disjoint**: a
  `bimba/` artifact never references `return-of-zero/` material and vice versa.
- One artifact is one editable `oi.journey` v1 document (`.journey.json` or the
  editor-export `.expression.json` suffix — both are the same schema). No new
  scene schema, no runtime, no service.
- A `<slug>.native-scene.json` sibling is a derived native snapshot, never the
  authoring truth. The journey document is the authoring truth.
- Covers and captures come from the real renderer in a browser; headless
  generation cannot produce them.
- No worker modifies engine/editor code. Shared defects return to
  Point-Cloud-Demo #6 and are repaired once.
- No worktrees for artifact generation; write directly into your own namespace.
- A path-proof fixture is engineering evidence, not corpus content; label it as
  such in its `description`.

## Namespaces

| Namespace | Corpus | Owner | Contract |
| --- | --- | --- | --- |
| `production/bimba/` | Bimba / QL Expressions | QL-MEF #201 | `bimba/README.md` |
| `production/return-of-zero/` | Return-of-Zero Expressions | Antykathera-Essay-Work #65 | `return-of-zero/README.md` |
| `production/epii-antichrist/` | Epii M5-1 / Antichrist Expressions | O-I #65 corpus programme (source: EpiLogos/research-canvas) | `epii-antichrist/README.md` |

Each namespace's own README defines its internal layout (family directories,
binding records, profiles, tools). The root law above is the part every
namespace shares. `production/shared/` may be added only when a form is
genuinely used by both corpora; until that need is real, do not create it.

## Repeating production

Creation needs no bespoke tool. In order of preference:

- **(a) The editor.** `npm run dev`, author, Library → save/import, then
  Export JSON (→ `<slug>.expression.json`), optionally Export native and
  Capture image. Move the file into your namespace.
- **(b) Headless generation with the real model API.** Worked example:

  ```sh
  npx tsx scripts/bimba-path-proof.ts
  ```

  It builds a journey with `blankJourney`/`blankScene`/`entity`/`pin`
  (`field-studies-journeys/src/model.ts`), passes it through
  `validateJourney`, writes it, and re-imports it through `importDocuments`
  (`field-studies-journeys/src/nativeBridge.ts`) — the exact gate the app's
  Import uses. Copy the script and change the document body; keep the
  validate + import steps in the loop.

## Health check

```sh
npx tsx scripts/production-inventory.ts
```

Validates every journey file under `production/` through the app's real import
gate, checks native-snapshot siblings, and scans for cross-namespace path
references. Run it before landing corpus changes. Each namespace's own tools
(e.g. `return-of-zero/tools/validate.mjs`) may enforce more; this script is the
cross-namespace floor, not a replacement.
