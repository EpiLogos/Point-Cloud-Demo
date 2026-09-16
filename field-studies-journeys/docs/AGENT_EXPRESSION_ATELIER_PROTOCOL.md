# Agent Expression Atelier Protocol

**Standing:** owner-directed production and Ta-Onta proving protocol, 16 September 2026.  
**Owner:** `EpiLogos/Point-Cloud-Demo` — the actual Expressions editor, native point-cloud engine and artifact workshop.  
**Tracks:** Point-Cloud-Demo #6 · O:I #306/#335/#352 · QL-MEF #201 / PR #202 · Antykathera-Essay-Work #65.  
**Purpose:** make the running Expressions system itself the place where Agents learn to compose, perform, criticise and refine a new agent-native artistic modality.

---

## 0. Existing material ground

This protocol begins from what this repository already is, not from a hypothetical authoring API.

The current Expressions application already provides:

- the native `PointCloudField` GPU medium;
- named Expressions containing named/saved scenes;
- formations and force-only pins in one shared medium;
- object sequences using text/glyph, image and ASCII sources;
- field material, palette and semantic-field colour;
- resonance, cymatics, morph, relational and pointer dynamics;
- camera/framing, working planes and saved views;
- scene timing, sequencing and transitions;
- property automation and recorded takes;
- page text and toolbelt state;
- still/video capture;
- IndexedDB draft recovery;
- browser Library, import/export and living HTML;
- the current `oi.journey/1` authoring envelope over the native engine.

The production programme therefore does **not** ask Agents to emit decorative JSON and hand it to a renderer. Agents must work **inside this instrument** and use the same real powers the person uses.

---

# 1. The Atelier is one running service over the real editor

## 1.1 Host law

The intended development form is one local Atelier host, equivalent in spirit to:

```text
npm run atelier
    ↓
serve the actual Expressions application
    + expose structured local authoring operations
    + expose current capability/parameter registry
    + expose exact application/engine/schema revision
```

The service is a bridge into the live application, not a second composer.

The human UI and Agent interface act on the same Expression/Scene/Entity model and native engine. A command exposed to Agents should call the same application operation or shared model function used by the UI wherever practical.

Do not create:

- an Agent-only scene schema;
- an Agent-only parameter vocabulary which can drift from Studio;
- a hidden second simulation;
- browser-coordinate/DOM scraping as the semantic API;
- a public unauthenticated mutation endpoint.

## 1.2 Capability discovery

An Agent entering the Atelier must be able to ask what is actually available now.

The service should disclose, from current implementation:

```text
editor/engine revision
current Expression + working generation
current Scene + selection
native engine readiness / degradation
available Actions/operations
parameter registry + domains
formation/pin/source kinds
capture capabilities
storage/library capabilities
portal/native-source capabilities when installed
```

The Agent should not need a stale prompt enumerating every slider.

## 1.3 Operation families

The structured seam should reach the broad real editor:

```text
Expression
    new · open · fork · save · import · export · library

Scene
    create · select · save · copy-next · reorder · remove · restore
    duration · transition · playback

Object
    add formation · add pin · select · remove · position · size · rotation
    force · lock · source · sequence · glyph/text/image/ASCII

Field
    material · palette · semantic colour · particle/physics parameters
    resonance · cymatics · morph · relational · pointer

Time / performance
    automation · groups · property tracks/takes · focus passage

Presentation
    camera · framing · planes · text · capture · cover · video

Native relation
    source/Surface/portal/focus/Action hooks as O:I contracts land
```

Generic operations may expose stable property paths/registries rather than one bespoke method per parameter.

---

# 2. Atelier sessions, actors and revision safety

One host may carry several `AtelierSessionRef`s so parallel corpus lanes can work through one service without sharing one uncontrolled mutable document.

Every active session must correspond to:

- a real editor/engine instance; or
- an explicitly suspended working copy whose next activation restores the real editor state.

A session carries at least:

```text
atelier_session_ref
actor_ref
ta_onta_office / suboffice
expression_ref
working_generation / basis_revision
scene_ref
selection/focus refs
profile/family/corpus refs where supplied
source-content basis refs
activity/receipt lineage
```

Mutations on one session are serialized or optimistic-revision-gated. A stale writer fails honestly instead of silently replacing another Agent's composition.

Aletheia observers may inspect, capture and propose without being granted mutation authority merely because they share the session.

---

# 3. Point-Cloud-Demo is the bounded artifact workshop

## 3.1 Repo-backed production library

The browser/IndexedDB Library remains first-class for live work and recovery. Submission/corpus production additionally needs a repository-visible Library so accepted artifacts and their practice history remain bounded here.

Choose exact paths through implementation, reusing existing build/source conventions, but preserve these logical objects:

```text
ExpressionArtifact
    editable Expression data
    exact editor/engine/schema revision
    source/content basis refs + revisions
    profile/family/lane refs
    accepted scenes
    selected cover/evidence captures

AtelierAssetOccurrence
    glyph/image/ASCII/diagram/form source
    provenance / rights / licence where applicable
    subject/motif refs
    Expression/Scene occurrence refs

AtelierIterationReceipt
    actor + Ta-Onta office
    basis generation
    operations / parameter changes
    intended burden
    observed result
    captures/evidence
    critique / disposition

ExpressionAdmission
    accepted artifact revision
    curator receipt
    source/profile/currentness basis
    unresolved/degraded conditions
```

The repository Library is an artifact and evidence store for this medium. It is not the semantic owner of Bimba, Antykathera, Wiki or source material.

## 3.2 Assets arise from the work

There is no independent pre-production "find all glyphs/images" lane.

The normal movement is:

```text
content packet
    ↓
composition encounters a need for a figure/form/image/glyph/ASCII relation
    ↓
Anima finds / derives / creates / adapts the needed form
    ↓
form is used and tested in the actual Expression
    ↓
Aletheia records provenance, standing and occurrences
    ↓
accepted reusable form enters the local bank/index
```

Reuse `field-studies-journeys/sources/` and the existing image/ASCII normalisation pipeline where appropriate. Do not fork a second source-sampling implementation for corpus work.

A subject may have many visual forms. A form may occur in many Expressions. Neither direction defines semantic truth.

---

# 4. Ta-Onta is exercised by making the corpus

Corpus production is a sustained Ta-Onta conformance run.

## S0′ Khora — enter the actual work

Resolves:

```text
source/world/corpus packet
subject / coordinate / record
source revision
Expression family/profile basis
existing artifact or new working Expression
Atelier service/session
continuation / restoration state
```

## S1′ Hen — disclose the form horizon

Resolves:

- inherited profile/scene grammar;
- current forms and source assets;
- available glyph/image/ASCII candidates;
- canonical page/verso/source relation;
- authored variants and prior occurrences.

Hen tells the Agent what forms exist and how they stand. It does not decide in advance what the finished artwork should be.

## S2′ Pleroma — disclose operative powers

Resolves the actual usable body now:

- Atelier operations;
- M/M′ readings;
- native source/portal Actions;
- capture/media bodies;
- specialist Agents and Methods;
- degraded/unavailable capabilities.

`available != selected != permitted != invoked` remains binding.

## S3′ Chronos — keep the act current

Binds:

- source revision;
- profile/artifact revision;
- working generation;
- scene sequence/checkpoints;
- iteration and capture time;
- original performance vs later reinterpretation.

A prior successful Expression is not silently current after its source, profile or engine has materially changed.

## S4′ Anima — perform the creative act

Anima is the situated compositional act in the medium. It owns actual mutation and performance through the Atelier under present authority.

## S5′ Aletheia — receive actuality and Return

Aletheia receives what really happened: material result, mismatch, failures, successful relations, critique, human response and possible reusable praxis. It prepares Return without automatically changing source or artistic canon.

---

# 5. Anima team — four relational offices in making

These are **relational offices**, not mandatory separate processes. A single Agent can embody several offices in sequence. A complex target can assign them to subagents. Every operation/receipt retains the office from which it was made.

## `anima.composition` — Composer / director

Carries the whole relation being expressed.

Responsibilities:

- choose scene/branch grammar;
- maintain hierarchy and balance;
- decide what becomes foreground/background;
- decide what belongs in one scene versus a sequence;
- govern text presence/absence;
- preserve deliberate quiet;
- hold relation to source packet and neighbouring corpus Expressions;
- determine when a proposed change alters the whole rather than a local object.

## `anima.material` — Field artist / iconographer

Works in the material medium itself:

- formations and pins;
- glyph/text/image/ASCII states;
- source normalisation choices;
- palette and semantic colour;
- particle/material parameters;
- resonance/cymatics;
- force/relational behaviour;
- scale, density and legibility;
- content-arising visual forms.

This is where glyphs/images/forms are normally discovered or created because the **actual content** requires them.

## `anima.temporal` — Choreographer / performer

Owns time and passage:

- scene duration and transitions;
- camera movement/framing changes;
- property takes and automation;
- morph/focus motion;
- pacing, pause and dwell;
- replay/performance through the real engine.

It distinguishes an effective still composition from one whose meaning requires enactment.

## `anima.integration` — Expression integrator

Keeps the composition inside its larger world:

- exact source/graph/record refs;
- profile inheritance;
- native portal/action relations;
- corpus continuity;
- merge of changes proposed by creative offices;
- candidate revision handed to Aletheia.

This office is the single mutation integrator when several Anima subagents contribute to one Expression.

---

# 6. Aletheia team — four relational offices in Return

## `aletheia.witness` — Witness

Records the actual state:

- exact artifact/engine generation;
- capture/video where useful;
- readiness/degradation;
- operation failures;
- before/after differences;
- intended operation versus observed material effect.

## `aletheia.critic` — Critic / comparator

Asks whether this Expression actually works **here**:

- source/content fidelity;
- formal legibility;
- expressive force;
- pacing;
- associative coherence;
- visual/sonic overstatement or under-articulation;
- continuity with related Expressions;
- whether an engine feature clarifies the object or merely decorates it.

Critique returns attributable proposals. It does not silently mutate the artifact.

## `aletheia.curator` — Curator / archivist

Owns admission into the bounded Library:

- accepted Expression revision;
- cover/evidence captures;
- source/profile/engine basis;
- asset provenance/rights;
- occurrence tags;
- relation to sibling/variant Expressions;
- retention of useful rejected alternatives as evidence rather than corpus canon.

## `aletheia.praxis` — Praxis crystalliser

Compares this act against previous acts to discover reusable artistic practice.

It may propose, with examples and counterexamples:

- a family/profile refinement;
- a recurring composition pattern;
- a material/physics gesture;
- a colour-association convention;
- a Mytheme sequencing practice;
- a camera/pacing practice;
- a source-to-form strategy;
- a new Anima Method/Skill candidate.

It never treats repeated appearance as sufficient proof of universal applicability.

---

# 7. Iteration and artistic learning

## 7.1 Practice observations

A meaningful iteration should be able to emit an attributable observation:

```text
basis:
    source/content refs
    Expression/Scene refs
    editor/engine/profile revisions

act:
    Anima actor + office(s)
    operations
    parameter / asset / sequence changes
    intended expressive burden

return:
    observed result
    witness evidence
    Aletheia critique
    human response if available
    accepted | rejected | variant | unresolved

scope:
    local
    family-candidate
    corpus-candidate
    engine-general-candidate

question / confidence / counterexample
```

The purpose is not to score aesthetics. It is to preserve what relation between **content, tool use, material result and judgement** produced the learning.

## 7.2 Colour has typed reasons

When colour matters, retain why it is there:

```text
source-backed correspondence
M/register navigational differentiation
subject / figure association
scene affect / mood
material / contrast / legibility
experimental association
```

The same hue can have different offices in different Expressions. Repetition can become a convention only through explicit Return/Recognition; it never becomes semantic truth by frequency alone.

## 7.3 From observations to Anima craft

Use the existing Ta-Onta/AW lifecycle rather than inventing a style-memory store:

```text
practice observation(s)
      ↓
Aletheia comparison
      ↓
ExpressionPracticeCandidate
    examples
    counterexamples
    applicability
    source/engine/profile basis
      ↓
reuse on later target
      ↓
human/native Recognition
      ↓
recognised named Method / Anima Skill refinement
```

The eventual **Anima Expression Skill** is therefore not a giant fixed prompt. It is the living, evidence-bearing method by which an Agent enters the actual medium, reads its current capabilities, composes, performs, inspects the result, calls for critique and recognises the limits of its own learned practice.

---

# 8. Development runs with the team in play

Where practical, implementation of the Atelier service and first corpus wave should itself use the Ta-Onta offices being tested.

First joined proving loop:

```text
Khora
  enter one real Antykathera or Bimba target
    ↓
Hen
  disclose profile/form/source horizon
    ↓
Pleroma
  disclose actual editor powers
    ↓
Chronos
  bind exact current generation
    ↓
Anima
  compose + perform through running Atelier
    ↓
Aletheia
  witness + criticise + curate + crystallise
    ↓
Anima revision
    ↓
accepted repo artifact
    ↓
practice candidate
    ↓
second target tests whether the practice transfers
```

A real failure in O:I/AIKit/Actuation/QL ownership is useful evidence. Repair the owner seam; do not hide it with a private Atelier shortcut.

The agent-team protocol is explicitly refinable through the programme. Stable runtime IDs should remain versioned, but the current human-readable role names and division of labour may change when repeated use shows a better relation.

---

# 9. Relation to corpus lanes

Antykathera/Bimba lanes remain source owners and selectors of **what must be expressed**.

The Atelier owns **how the accepted target becomes an actual crafted Expression artifact**.

Therefore each content lane should normally carry the full loop:

```text
source packet
→ AtelierSession
→ content-local asset/form discovery
→ live composition
→ Aletheia critique
→ revision
→ accepted artifact/library admission
→ practice Return
```

There is no separate corpus-wide visual-procurement lane preceding production. Cross-corpus asset indexing and global profile refinement emerge from the accumulated works and their Aletheia receipts.

---

# 10. Acceptance

This protocol is materially real when:

1. one local service hosts the actual Expressions application and exposes structured authoring against the same model/engine;
2. Agents can discover and use the broad editor capability/parameter vocabulary without DOM/WebGL scraping;
3. parallel Atelier sessions remain revision-safe and do not produce invisible write races;
4. a real corpus target is made by the Anima offices through the actual running engine;
5. the Aletheia offices return evidence and critique against that same artifact generation;
6. the accepted artifact is durably admitted into a repo-backed Library;
7. required glyph/image/ASCII/form material was discovered through the content act and remains source/provenance/occurrence traceable;
8. human editing, browser Library, export and recovery remain fully usable without Ta-Onta;
9. at least one practice candidate is tried on a later target and produces an explicit `works | fails | narrower-than-thought | revised` Return;
10. a recognised pattern can enter the existing named Method/Skill path with examples, applicability and counterexamples;
11. QL-MEF #201 can point to the run as live TA0–TA7 evidence rather than schema conformance alone;
12. the produced corpus remains bounded in this repository while semantic source authority remains with its native owners.

The destination is an artistic instrument which an Agent can **learn to play**, not a preset generator which happens to be controlled by an Agent.
