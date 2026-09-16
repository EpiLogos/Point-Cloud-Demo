# Expression Atelier Execution Lock

**Standing:** owner-directed execution lock, 16 September 2026.  
**Canonical material owner:** `EpiLogos/Point-Cloud-Demo`.  
**Parent protocol:** `field-studies-journeys/docs/AGENT_EXPRESSION_ATELIER_PROTOCOL.md`.  
**Programme:** Point-Cloud-Demo #6 · O:I #306/#335/#352/#336 · QL-MEF #201 · Antykathera-Essay-Work #65 · ai-kit #317 · Actuation #91 · Factory #241.  
**Purpose:** freeze the production relation deeply enough that independent Agent sessions can now implement the Atelier, Ta-Onta seam and corpus in parallel without inventing local substitutes.

---

## 0. What is now fixed

The following is no longer an open design question for this tranche.

1. **The running Expressions application is the Atelier.** Agents craft actual Expressions through the real editor/model/engine rather than generating a parallel scene language for later rendering.
2. **Point-Cloud-Demo is the bounded material workshop and artifact bank.** Accepted editable Expressions, their content-arising visual material, evidence captures, iteration receipts and practice observations accrue here.
3. **Source worlds remain elsewhere.** Bimba/QL-MEF and the Return-of-Zero authored world retain their own semantic/source authority. This repository stores bindings, artifacts and practice evidence, not replacement canonical meaning.
4. **Glyphs, images, ASCII, diagrams and other forms arise through making.** No separate pre-production visual procurement programme decides the corpus vocabulary in advance.
5. **Ta-Onta is exercised live by production.** Khora, Hen, Pleroma, Chronos, Anima and Aletheia are not a decorative metadata layer applied after the work.
6. **Anima and Aletheia contain explicit relational offices.** A single model may embody several offices, but the office from which a determination was made remains attributable.
7. **Artistic learning is returned evidence, not hidden model folklore.** Successful and failed material acts become scoped practice observations, then practice candidates, then recognised Methods/Skills only after reuse and Recognition.
8. **Colour, layout and form never become semantic truth by repetition alone.** Their reasons and standing remain typed.
9. **Parallel production uses revision-safe Atelier sessions.** Two Agents never silently race-write the same Expression generation.
10. **Human use stays first-class.** The ordinary editor, Library, capture, import/export and recovery workflows remain usable without Ta-Onta.

The exact human-readable names of suboffices, filesystem details and API method spelling may still refine during implementation. The relations above may not be silently weakened.

---

# I. The live material world

## 1. One host, one authoring model, many bounded sessions

The intended host is one local service over the existing application, equivalent to:

```text
npm run atelier
    ↓
real Expressions application
    + real native PointCloudField engine
    + structured application operations
    + current parameter/capability discovery
    + repository artifact/admission operations
```

The service is not another renderer and not another composition engine.

The browser UI and Agent surface must mutate the same logical Expression/Scene/Entity state. Where the current UI already calls a shared model operation, the Agent seam should expose that operation or the same underlying function rather than reproducing its behaviour in an Agent-only controller.

### 1.1 Required session reading

Every active session can disclose at least:

```text
AtelierSessionSnapshot {
    atelier_session_ref
    actor_ref
    ta_onta_office / suboffice

    app_revision
    engine_revision
    authoring_schema_revision

    expression_ref
    expression_working_generation
    scene_ref
    selection/focus refs
    playback / pause state

    engine_readiness / degradation
    available operation families
    current parameter registry / domains
    available source kinds
    capture/media capability
    persistence/library capability

    source/world packet refs
    profile/family/corpus refs
    activity/receipt lineage
}
```

No Agent should need a stale prompt containing every slider or button name in order to use the instrument competently.

### 1.2 Mutation law

A mutation carries:

```text
atelier_session_ref
actor_ref
office_ref
basis_working_generation
target refs
operation + structured arguments
returned working_generation
activity / receipt refs
```

Mutations on one live session are serialized or optimistic-revision-gated. A stale operation is refused with the actual current generation; it does not overwrite later work.

Aletheia observers may inspect, replay, capture and propose without automatically receiving mutation authority.

---

## 2. Operation vocabulary

The Agent interface must expose the broad real authoring vocabulary, not a reduced content-generator subset.

```text
Expression
  new · open · fork · save · restore · import · export · library

Scene
  create · select · save · copy-next · reorder · remove
  timing · transition · playback · pause · present

Object / formation / pin
  add · select · remove · position · size · rotation · lock
  force · share/allocation · sequence · source · tint

Form / source
  text · glyph · bundled glyph tree · image · ASCII
  sampled source mode · generated form where admitted

Field / material
  particle/material parameters · palette · semantic colour
  physics · resonance · cymatics · morph · relational forces · pointer

Time / performance
  scene timing · automation groups · target ranges
  property takes · focus passage · camera passage

Presentation
  camera · saved view · plane · framing · authored page text
  still capture · cover · live video where supported

Native world relation
  subject/source binding · focus · portal · Surface/native Action hooks
```

Use current registries/property paths wherever they already exist. A second handwritten Agent parameter table is a drift bug.

---

# II. Artifact and library body

## 3. Browser Library and repository Library are complementary

IndexedDB/browser storage remains the immediate human working/recovery surface.

Production also requires a repository-visible body so that accepted work is branchable, diffable, reviewable and available to other Agents without depending on one browser profile.

Implementation may refine exact paths, but the logical repository body is fixed as:

```text
field-studies-journeys/atelier/
  expressions/      # editable admitted Expression artifacts / editions
  assets/           # admitted content-arising reusable material
  occurrences/      # subject ↔ form ↔ Expression/Scene indexes
  receipts/         # iteration / witness / critique / admission evidence
  practice/         # observations and practice candidates
  schemas/          # portable Atelier-only envelopes where truly required
```

This body is an artifact/practice store. It never becomes the canonical graph/source store for Bimba, the essay, Central files or Wiki subjects.

### 3.1 Expression artifact

An admitted artifact retains at least:

```text
ExpressionArtifactRecord {
    artifact_ref
    expression_ref
    expression_revision
    editable_expression_body_or_path

    source/world refs + revisions
    profile/family/lane refs
    app/engine/schema revisions

    accepted scene refs
    cover/capture refs[]
    asset_occurrence_refs[]
    iteration/admission receipt refs[]

    status: draft | candidate | accepted | superseded | rejected-variant
    produced_by actor/offices
    admitted_at
    unresolved/degraded conditions[]
}
```

Rejected or alternate variants can remain useful evidence without appearing as accepted corpus work.

---

## 4. Forms arise from content

The visual vocabulary is discovered through actual expressive pressure.

```text
source-bound content
    ↓
Anima encounters a representational/material need
    ↓
search / derive / generate / adapt candidate form
    ↓
use it in the real Expression
    ↓
play / inspect / capture / compare
    ↓
Aletheia judges the actual occurrence
    ↓
accepted occurrence is indexed for reuse
```

No worker produces a generic bank of symbols merely because a future scene might need them.

### 4.1 Asset occurrence

```text
AtelierAssetOccurrence {
    asset_ref + revision
    kind: glyph | svg | image | ascii | diagram | texture | generated-form | other
    native_source_ref?
    creator / provenance / rights / licence
    generated_standing?

    subject_refs[]
    role_in_this_occurrence
    expression_ref
    scene_ref
    entity/sequence_step_ref?

    source-backed meaning refs[]
    presentational associations[]
    capture/evidence refs[]
}
```

A subject can have several visual forms. One form can serve several subjects. The occurrence index preserves those relations without making the image the identity of the subject.

### 4.2 Reuse law

Reuse is always contextual:

```text
asset → all occurrences
subject / motif / coordinate → available forms → all occurrences
```

An Agent considering reuse should be able to inspect where a form succeeded, failed or changed office before applying it again.

---

# III. Expression minting and profile continuity

## 5. The unit is an Expression family, not a pile of bespoke applications

Repeated source forms should normally resolve through family/profile grammar.

Examples:

```text
A01–A36          → A-family Expression/profile grammar
A′ family        → conjugate family grammar
C records        → concept family grammar
A/C              → root/relational family grammar
S records        → S-family grammar
Bimba branch     → branch profile + coordinate-derived variants
```

Every record/coordinate remains separately addressable. Repeated form does not erase identity.

Mytheme is deliberately different: a Whole Mytheme may require a genuine multi-scene sequence because the ending and transformation must remain able to qualify the beginning.

## 5.1 Profile inheritance

```text
O:I substrate defaults
→ Epi global profile
→ corpus / M-family profile
→ register / branch / repeated-family profile
→ record / coordinate authored variant
→ scene-local override
→ encounter overlay
```

The parent levels carry continuity rather than repeated magic values:

- baseline material/stage relation;
- typography/text grammar;
- camera/framing defaults;
- particle/form scale and resource budget;
- transition/motion rhythm;
- reading HUD/aperture conventions;
- portal treatment;
- source/glyph/image fallback policy;
- reduced-motion/theme behaviour.

Local variation remains legitimate and explicit.

---

## 6. Scene-type knowledge is learned, not declared complete in advance

Production will discover recurring expressive forms. A scene may function, for example, as:

- source/claim disclosure;
- graph/constellation inhabitation;
- relation/tension scene;
- formal/diagrammatic scene;
- figure/iconographic encounter;
- whole-story movement;
- transition/return;
- quiet field or pause;
- portal/deep-reading hinge;
- dialogical/Nara scene;
- material/resonant demonstration.

This list is descriptive, not a closed ontology.

When a recurring treatment proves useful, `aletheia.praxis` may propose a family/profile Method. Its admissibility is determined by repeated use and Recognition, not by naming the pattern once.

---

# IV. Ta-Onta as the live creative team

## 7. The six S′ organs are exercised on every meaningful production act

```text
Khora
  enter exact source/world/record/coordinate + Atelier continuation

Hen
  disclose profile lineage, source standing, forms, prior occurrences and variants

Pleroma
  disclose actual available editor powers, M′ instruments, specialist Agents and native Actions

Chronos
  bind source/profile/engine/current working generations and iteration lineage

Anima
  make / perform the work through the real Atelier

Aletheia
  witness actuality, criticise, curate, return practice
```

The same loop may be lightweight for a simple glyph scene or elaborate for a Whole Mytheme.

---

## 8. Anima offices

These are stable machine-office intentions for this tranche. One Agent may carry several offices serially; complex targets may allocate them separately.

### `anima.composition`

Carries the whole Expression relation: hierarchy, scene grammar, sequence, framing, foreground/background, textual presence and deliberate quiet.

**Input:** source packet + profile horizon + prior work.  
**Output:** compositional intent and candidate scene/sequence changes.  
**May mutate:** through the current Atelier session.  
**Must not:** invent semantic source relations.

### `anima.material`

Works the medium: formations, pins, glyph/image/ASCII, source sampling, density, scale, physics, resonance, palette and semantic colour.

**Input:** compositional burden + material capabilities.  
**Output:** concrete field/form treatment and content-arising forms.  
**Must retain:** reason/provenance/standing of visual material.

### `anima.temporal`

Carries passage: timing, dwell, transition, camera motion, automation, property takes, focus and morph.

**Output:** performed/replayed Expression, not merely parameter values.

### `anima.integration`

Carries exact source/record/coordinate refs, profile lineage, graph/portal/Action relation and corpus continuity. It is the single revision integrator where several Anima subagents work one artifact.

---

## 9. Aletheia offices

### `aletheia.witness`

Records what actually happened at exact app/engine/expression generations, including captures, failures and degradation.

### `aletheia.critic`

Compares actual result to source burden and expressive intention: fidelity, legibility, force, pacing, associative coherence, continuity and decorative excess.

Critique proposes. It does not silently edit.

### `aletheia.curator`

Admits the accepted artifact, forms, provenance, occurrence links and selected evidence into the repository Library.

### `aletheia.praxis`

Compares iterations/works for reusable craft and emits scoped practice candidates with examples and counterexamples.

---

# V. Artistic learning / Anima Skill

## 10. Every meaningful iteration can return a practice observation

```text
ExpressionPracticeObservation {
    basis source / expression / scene / profile / engine refs
    actor refs
    anima office refs[]

    intended expressive burden
    operations / parameter deltas
    asset/form changes
    capture/evidence refs[]

    observed result
    aletheia critique
    human response if supplied
    disposition: accepted | rejected | variant | unresolved

    scope: local | family-candidate | corpus-candidate | engine-general-candidate
    confidence / unresolved question
    counterexample refs[]
}
```

The point is to retain the relation between content, material act and observed result—not to generate aesthetic scores.

## 10.1 Colour observations are typed

When colour matters, the receipt records which office it is performing:

```text
source-backed correspondence
M/register navigation
a subject/figure association
scene affect / mood
material contrast / legibility
experimental association
```

The same hue may perform several different offices in different works. Repetition may become an artistic convention only after explicit practice Return; it does not become source truth.

## 10.2 Promotion path

```text
practice observations
→ Aletheia comparison
→ ExpressionPracticeCandidate
    examples
    counterexamples
    applicability
    source/profile/engine basis
→ reuse on another target
→ works | fails | narrower-than-thought | revised
→ human/native Recognition
→ named Method / Anima Skill refinement
```

The desired Anima Expression Skill is therefore a living craft protocol that knows how to inspect the present instrument, make with it, judge its material result and recognise where its learned pattern does not apply.

Do not replace this with one enormous immutable style prompt.

---

# VI. Cross-product source worlds

## 11. Bimba / QL-MEF

Bimba provides coordinate and branch identity, relation/readings and M/M′ standing. The Atelier provides the material craft body.

For the first corpus cut, selected meaningful 2–3 registry depths are inhabited from the real branch structure. Do not invent a new depth ontology and do not hand-author 1,875 unrelated scene files.

Graph/constellation law:

```text
canonical bounded relation state
→ exact refs / relation refs / readings
→ optional source-backed QL layout grammar
→ Expression formation/material presentation
```

Visual proximity never creates a new semantic edge.

## 12. Return of Zero / Antykathera

The source world already contains the essay, section rooms, four registers Symbolon/Matheme/Mytheme/Episteme, A/A′/C/A/C/S, concepts and other canonical carriers.

Each corpus lane owns **what must be expressed** and sends exact source packets into the Atelier.

The Atelier owns **how that target becomes a crafted Expression and what craft evidence returns**.

Mytheme whole-first law remains binding: whole story → relational sequence → derivative motif/figure occurrences → cross-story comparison → Return.

---

# VII. Cross-product runtime ownership

## 13. Generic O:I substrate

O:I owns the generic Expression/Profile/Edition/SurfacePortal/joint-focus/ExpressiveAct world contract. Point-Cloud proves the material editor body but does not take O:I's wider source/window/world authority.

## 14. AIKit

AIKit owns provider/harness/capability/session resolution, including #317 provider-neutral realtime voice bodies. Availability never grants Action authority.

## 15. Actuation

Actuation owns canonical Agent/Agency/session/authority/Activity, including #91 Nara voice-body attachment, interruption and Nara→Epii delegation.

## 16. Factory

Factory owns consequential developmental work. Atelier failures that disclose real implementation defects may later travel through #241 into Commission/Journey/Run/Candidate/evidence and return to the same lived world.

A corpus worker must not patch another product locally to avoid a failed seam.

---

# VIII. Parallel launch boundary

## 17. Work that can begin immediately

Independent sessions may start now on:

- Atelier host/service bridge over the existing editor;
- session/revision/action/capability contracts;
- repository Library/admission/occurrence structure;
- O:I scene/portal/profile/agent-operation substrate;
- QL Ta-Onta API and M′/S′ alignment backcheck;
- Bimba Atlas/profile resolver and M/M′ expressive grammar;
- AIKit #317 realtime body;
- Actuation #91 dialogical Agency;
- Antykathera source-packet compilation and lane grounding;
- family/profile planning for corpus lanes;
- first manual/interactive craft studies in the existing editor, with provisional receipts clearly marked.

## 18. Work gated on the Atelier bridge

Once a worker can operate the real editor structurally through `AtelierSessionRef`, start all live corpus lanes in parallel and require their production to pass through Anima/Aletheia rather than emitting detached scene specs.

## 19. Work gated on joined runtime

Nara realtime #336, SharedField multi-Nara proof, self-inhabiting Factory #241 and final Skill crystallisation require enough of their native dependencies to exist materially. Their docs/contracts can proceed earlier; their acceptance claims cannot.

---

# IX. Convergence and final acceptance

## 20. Per-artifact acceptance

An artifact is accepted only when:

- canonical source/world basis is exact;
- it was materially opened/played in the real engine;
- the current profile lineage is known;
- Anima operation lineage is attributable;
- Aletheia witness/critique exists;
- required visual forms have provenance/standing;
- unresolved degradations are named;
- curator admission has produced a repository-visible artifact record.

## 21. Corpus acceptance

The programme reaches corpus closure only when:

- in-scope source censuses have complete/dispositioned Expression coverage;
- Bimba first-cut Atlas coverage exists at the selected real depths;
- all four essay registers remain themselves;
- Mytheme wholes remain whole;
- graph ↔ Expression focus carries the same canonical refs;
- source/file/page portals round-trip without identity loss;
- profile continuity has been reviewed across the corpus;
- asset occurrence/provenance traversal works;
- practice observations include both positive and failed examples;
- at least one practice candidate has been tested on a second target;
- the technical product/environmental stress gates are also green at their own evidence standing.

## 22. What may refine during the run

The programme intentionally allows returned reality to refine:

- exact API method names;
- office display names and whether one office splits/joins;
- repository path ergonomics;
- scene-family taxonomy;
- colour conventions;
- profile boundaries;
- artistic Methods and Skill content;
- which engine parameters prove artistically useful.

Such refinements must preserve receipts and reasons. They are evidence-bearing evolution of the modality, not silent drift.

---

## 23. Execution source

The executable decomposition of this lock lives in:

`/.wayfinder/maps/agent-expression-atelier.md`

That map is the session-launch surface. This document remains the deeper production contract behind it.