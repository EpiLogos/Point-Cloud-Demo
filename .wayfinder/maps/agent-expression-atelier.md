# Wayfinder — Agent Expression Atelier

**Owner:** Point-Cloud-Demo #6  
**Standing:** executable planning map, 16 September 2026.  
**Deep contract:** `field-studies-journeys/docs/AGENT_EXPRESSION_ATELIER_PROTOCOL.md` + `field-studies-journeys/docs/EXPRESSION_ATELIER_EXECUTION_LOCK.md`.  
**Cross-product consumers:** O:I #306/#335/#352/#336 · QL-MEF #201 · Antykathera-Essay-Work #65 · ai-kit #317 · Actuation #91 · Factory #241.

This map is deliberately decomposed for **independent parallel Agent sessions**. A worker claims one lane, reads the deep contract and its exact dependencies, changes only its owner surface, and returns receipts to the integration lane. No lane may solve a missing cross-product seam by inventing a local substitute.

---

## 0. Programme law

```text
SOURCE WORLD
  Bimba / Return of Zero / ordinary O:I subjects
        ↓ exact packet
TA-ONTA ENTRY
  Khora → Hen → Pleroma → Chronos
        ↓
ATELIER SESSION
  real Expressions editor + native engine
        ↓
ANIMA
  composition · material · temporal · integration
        ↓
ALETHEIA
  witness · critic · curator · praxis
        ↓
REPO ARTIFACT + OCCURRENCES + RECEIPTS
        ↓
PRACTICE CANDIDATE
        ↓ reuse / counterexample / Recognition
ANIMA METHOD / SKILL
```

No step above licenses semantic source invention.

---

# 1. Parallel launch board

## Launch immediately

| lane | session | owns | start condition | primary return |
|---|---|---|---|---|
| **AT0** | contract/integration | shared schemas + merge order | now | stable seam + integration ledger |
| **AT1** | live host | structured bridge into real app | now | running Atelier service |
| **AT2** | action/session | operation discovery + revision-safe sessions | now | session/action contract |
| **AT3** | repository Library | artifacts/assets/occurrences/receipts | now | durable repo-backed Library |
| **AT4** | office runtime | Anima/Aletheia office attribution | now | office-aware execution harness |
| **AT5** | evidence/practice | iteration + colour + practice evidence | now | practice record/admission rules |
| **AT6** | source/corpus adapter | source packet → Atelier work order | now | generic corpus ingress adapter |
| **AT7** | browser/human parity | UI/Agent same-operation parity | now | parity/regression evidence |
| **AT8** | stress/concurrency | multi-session/resource/recovery proof | after AT1/AT2 skeleton | stress receipts |
| **AT9** | joined acceptance | real target through full loop | after AT1–AT6 minimum | first accepted live proof |

AT0 is the only lane allowed to reconcile shared interfaces across lanes. Other workers propose interface changes through AT0 rather than editing each other's schemas ad hoc.

---

# 2. AT0 — shared contract and integration writer

**Purpose:** keep one stable seam while AT1–AT8 work independently.

### Read

- both Atelier docs named above;
- current `field-studies-journeys/src/model.ts`;
- current native bridge/editor operation and parameter-registry owners;
- Point-Cloud #6 coordination;
- O:I #335/#352 generic contract when touching cross-product shapes.

### Own

Prefer a small dedicated integration/schema surface rather than scattering shared types through unrelated UI files. Exact placement follows current code shape.

### Lock / reconcile

```text
AtelierSessionRef
AtelierSessionSnapshot
AtelierOperationRequest / Result
AtelierCapabilitySnapshot
ExpressionWorkOrder
ExpressionArtifactRecord
AtelierAssetOccurrence
AtelierIterationReceipt
OfficeReceipt / office_ref
ExpressionPracticeObservation
ExpressionPracticeCandidate
ExpressionAdmission
```

These are Atelier application/evidence envelopes. They do not replace `oi.expression/v1`, the native engine snapshot or external source schemas.

### Deliver

- shared type/schema definitions actually required by implementation;
- revision/generation semantics;
- serialization/validation rules;
- compatibility with current `oi.journey/1` authoring body until generic O:I contract supersedes it;
- integration ledger recording lane dependency versions;
- no unused speculative framework.

### Acceptance

AT1–AT6 can depend on the same refs/revision law without importing one another's private implementation modules.

---

# 3. AT1 — live Atelier host/service

**Purpose:** make the actual Expressions editor structurally operable by Agents.

### Non-negotiable

Do not implement a second headless scene composer.

### Work

1. inspect the current application/model command boundaries;
2. select the smallest bridge into the live app;
3. add a local-only host/start command, equivalent to `npm run atelier`;
4. expose health/revision/session endpoints or equivalent structured IPC;
5. create/activate/suspend/close real Atelier sessions;
6. provide snapshot reads without DOM/WebGL scraping;
7. call the same model/editor operations the human UI uses;
8. preserve normal `npm run dev` use.

### Security

- bind locally by default;
- no public unauthenticated mutation service;
- no secrets in session snapshots/receipts;
- native consequential Actions remain outside this repo's ambient authority.

### Acceptance walk

```text
start Atelier
→ create session
→ inspect exact app/engine/schema revisions
→ open current expression
→ select scene
→ apply one real model mutation
→ observe new working generation in UI and Agent snapshot
→ human edits same document
→ stale Agent mutation is rejected
→ save/export remains normal
```

### Return to AT0

Exact service API, lifecycle and any shared contract pressure.

---

# 4. AT2 — action discovery, parameter registry and session safety

**Purpose:** expose the instrument's actual powers without copying the UI into a hard-coded Agent prompt.

### Work

- inspect existing parameter/property/action registries;
- define operation discovery grouped by Expression/Scene/Object/Field/Time/Presentation/native relation;
- expose parameter path, type/domain, current value, scope and mutability;
- distinguish inspectable / editable / unavailable / degraded;
- serialize/revision-gate mutations;
- implement selection/focus refs independent of DOM nodes;
- keep engine runtime state vs authored configuration distinction explicit;
- expose meaningful checkpoints without claiming exact GPU rewind.

### Prove

- adding/reordering a scene;
- formation + pin creation;
- exact transform edit;
- glyph/text/image/ASCII source edit;
- field/material parameter edit;
- automation edit;
- camera edit;
- capture request;
- invalid/stale operation refusal;
- unavailable feature disclosure.

### Do not

- maintain a second list of 100+ sliders;
- infer current selection from screenshots;
- silently convert native schema-4 snapshots into authoring truth.

---

# 5. AT3 — repository-backed Library and occurrence index

**Purpose:** make accepted work durable and agent-readable inside this repository.

### Logical body

```text
field-studies-journeys/atelier/
  expressions/
  assets/
  occurrences/
  receipts/
  practice/
  schemas/
```

AT3 may tune exact subpaths after inspecting build/export conventions. Keep the logical separation.

### Work

- import/admit editable Expression artifacts from live session;
- never make browser storage the only persisted production copy;
- record source/profile/engine revisions;
- store selected covers/captures without duplicating transient screenshots indiscriminately;
- index form occurrences bidirectionally;
- retain rights/provenance/generated standing;
- preserve rejected/alternative variants as evidence where useful;
- support accepted/superseded/disposition status;
- add deterministic inventory generation/check if appropriate.

### Key query acceptance

```text
subject/motif/coordinate → all admitted forms → all scene occurrences
asset/form → source/provenance/rights → all uses
expression → all source/profile/assets/receipts
```

### No pre-procurement catalogue

Assets enter because a real production lane needed and materially tested them.

---

# 6. AT4 — Anima/Aletheia office-aware execution

**Purpose:** make the team relation operational rather than prose-only.

### Stable office IDs

```text
anima.composition
anima.material
anima.temporal
anima.integration

aletheia.witness
aletheia.critic
aletheia.curator
aletheia.praxis
```

Human-readable role names may refine later; stable IDs must migrate deliberately if changed.

### Work

- session may change active office without changing actor identity;
- every mutation receipt can state actor + office;
- Aletheia observers can read/capture/propose without mutation by default;
- `anima.integration` owns final write merge for multi-Anima contributions;
- critique is proposal/evidence, not silent mutation;
- curation/admission is explicit;
- one Agent may execute several offices serially;
- multi-agent team may split offices while sharing exact work order/source refs.

### First team proof

Use one small real target. Produce two variants with different material/temporal decisions, have Aletheia compare them, revise through Anima, and admit one while retaining the other as evidence.

### Return

Observed pressure on the office split is itself Aletheia evidence; propose refinements rather than rewriting the protocol silently.

---

# 7. AT5 — practice evidence, colour and craft learning

**Purpose:** turn production into a discoverable artistic apprenticeship.

### Work

Implement/store `ExpressionPracticeObservation` and `ExpressionPracticeCandidate` with:

- exact basis refs/revisions;
- intended expressive burden;
- operation/parameter deltas;
- form/asset changes;
- evidence captures;
- Aletheia critique;
- human response where explicitly supplied;
- disposition;
- scope;
- confidence/open question;
- counterexamples.

### Colour role enum/reading

At minimum retain the distinction:

```text
source-backed correspondence
M/register navigation
subject/figure association
affect/mood
material/contrast/legibility
experimental association
```

A source-backed correspondence may be semantic evidence from the source world; the other roles remain presentation/practice unless separately grounded.

### Practice transfer proof

One accepted practice candidate must be deliberately reused on a second target and return one of:

```text
works
fails
narrower-than-thought
revised
```

Only then is it eligible for Recognition/named Method/Skill work.

---

# 8. AT6 — source packet / corpus ingress

**Purpose:** give Bimba and Antykathera workers one bounded way into the Atelier without moving source ownership here.

### `ExpressionWorkOrder`

Resolve or consume:

```text
source_world
source_revision
subject / record / coordinate refs
canonical home / register / branch / type
exact declared relation refs / bounded local whole
source/claim/human-amplification standing where applicable
profile lineage basis
family / lane
scene/sequence burden
native source/portal Action refs
existing admitted form occurrences
expected artifact identity / continuation
```

### Work

- adapter from Antykathera generated packet/census output;
- adapter from QL Bimba coordinate/branch binding;
- no corpus-specific scene schema;
- no semantic relation synthesis from visual proximity;
- preserve unresolved/unavailable refs;
- allow work order to resume an existing artifact after source/profile change.

### Acceptance

One Antykathera record and one Bimba coordinate produce valid work orders and enter separate real Atelier sessions with their source identity intact.

---

# 9. AT7 — human/Agent parity and regression

**Purpose:** ensure Agent-native authoring strengthens rather than forks the editor.

### Test matrix

For representative operations:

```text
human UI operation
Agent structured operation
save/export/import
recovery/reopen
```

assert equivalent authored configuration/result semantics.

Cover:

- scene lifecycle;
- object transforms;
- source sequence states;
- parameter/property changes;
- automation;
- camera;
- Library admission/export;
- source-heavy expressions;
- failure/refusal states.

Do not require identical UI event paths; require the same model truth and evidence.

---

# 10. AT8 — concurrency, lifecycle and stress

**Purpose:** prove one running atelier can support real parallel production safely.

### Scenarios

- several sessions against separate Expressions;
- two Agents attempting the same artifact generation;
- suspended session resume;
- browser reload/recovery while service remains;
- image-heavy artifacts;
- 62k-particle real native field;
- capture during authoring;
- engine unavailable/context loss;
- storage failure/export fallback;
- session close while Aletheia observer exists;
- long-running corpus batch without memory/resource growth hiding failures.

### Invariant

One session's pause/time/camera/selection/editor state must not leak into another unless an explicit shared relation says so.

---

# 11. AT9 — first joined production acceptance

**Purpose:** turn all preceding work into one real Ta-Onta creative proof.

Choose one bounded target with enough content to require genuine decisions but small enough to inspect completely.

Run:

```text
Khora enters exact target
→ Hen discloses profiles/forms/prior occurrences
→ Pleroma discloses current Atelier powers
→ Chronos fixes revisions/generation
→ anima.composition establishes whole
→ anima.material makes real field/form decisions
→ anima.temporal performs/replays
→ anima.integration produces candidate
→ aletheia.witness captures actuality
→ aletheia.critic returns grounded critique
→ Anima revises
→ aletheia.curator admits artifact + occurrences
→ aletheia.praxis emits one scoped practice candidate
→ second target tests transfer
```

### Acceptance

The proof is not complete if the result exists only as JSON generated outside the editor, if the asset bank was designed in advance, or if the practice candidate has no counterexample/applicability relation.

---

# 12. External lanes that should run alongside this map

These are not owned here and must be started in their native repositories.

| external lane | owner | relation to Atelier |
|---|---|---|
| O:I ES1/#352 | O:I | scene carriers, source/file/HTML/Surface portal |
| O:I ES3/#335 | O:I | generic Profile/Edition/Library-index semantics |
| O:I ES4/#335 | O:I | generic Agent operations, joint focus, ExpressiveAct |
| O:I #336 | O:I | Nara realtime application adapter |
| QL TA0 | QL-MEF #201 | six S′ SDK/API binding |
| QL TA0A | QL-MEF #201 | M′/S′ alignment ledger |
| QL TA1 | QL-MEF #201 | Bimba Atlas/profile resolver |
| QL TA2 | QL-MEF #201 | M/M′ expressive grammar |
| QL TA3–TA4 | QL-MEF #201 | Nara semantics + Epii enrichment |
| realtime body | ai-kit #317 | provider/body capability resolution |
| dialogical Agency | Actuation #91 | Agent/session/authority/delegation |
| essay corpus | Antykathera #65 | authored-world production lanes |
| self-inhabiting dev | Factory #241 | later repair/Return through native development |

If one external lane is not ready, record degradation in Pleroma/work order and continue only where the intended act remains honest.

---

# 13. Merge / convergence order

Parallel coding does **not** mean arbitrary merge order.

Recommended convergence:

```text
AT0 contract floor
   ├─ AT1 host
   ├─ AT2 actions/sessions
   ├─ AT3 repo Library
   ├─ AT4 offices
   ├─ AT5 practice
   ├─ AT6 ingress
   └─ AT7 parity
        ↓
AT8 stress
        ↓
AT9 joined proof
```

AT1–AT7 can merge incrementally when they conform to current AT0. AT0 changes after consumers exist require an explicit compatibility/migration note.

External O:I/QL/AIKit/Actuation contracts can land in parallel and should be consumed at the next integration checkpoint rather than blocking unrelated material implementation.

---

# 14. Session handoff template

Every lane session ends with a compact handoff:

```text
lane / issue
base revision → head revision
files owned / changed
contracts consumed + versions
what is now materially true
what remains unimplemented
real tests/evidence run
known degradation / debt
shared-contract pressure for AT0
next exact executable step
```

Do not report a design intention as runtime actuality.

---

# 15. Final programme gate

Point-Cloud #6 closes only when the real editor is an Agent-operable Atelier, repository artifacts/occurrences/receipts are durable, parallel sessions are safe, Anima/Aletheia offices have been exercised against real work, content-arising visual material is traceable, and a returned practice has been tested beyond the scene that created it.

Corpus completion, O:I substrate acceptance, QL semantic acceptance, realtime voice, SharedField and Factory self-development retain their own native closure gates.