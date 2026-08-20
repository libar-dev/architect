# Annotation Guide

> **Manual guide:** use the auto-generated [Annotation Reference Guide](../docs-live/reference/ANNOTATION-REFERENCE.md) for the live catalog. This file explains the retained authoring model in plain language.

How to annotate TypeScript and Gherkin files for pattern extraction, generated documentation, and queryable architecture context.

For the exact retained tag list, regenerate docs with `pnpm pkg:docs` and read [../docs-live/TAXONOMY.md](../docs-live/TAXONOMY.md).

---

## Getting started

### File-level opt-in

Every file that participates in the annotation system needs the bare `@architect` opt-in marker. Files without that marker are ignored by the scanner.

**TypeScript** uses a file-level JSDoc block:

```typescript
/**
 * @architect
 * @architect-implements MyPattern
 * @architect-role service
 * @architect-bounded-context generation
 * @architect-uses EventStore, CommandBus
 *
 * ## My Pattern
 *
 * Paragraph describing the implementation surface.
 */
```

**Gherkin** uses file-level tags before `Feature:`:

```gherkin
@architect
@architect-pattern:MyPatternExecutableTests
@architect-implements:MyPattern
@architect-status:completed
@architect-bounded-context:generation
Feature: My Pattern executable tests

  Rule: Important invariant
    **Invariant:** The rule that must stay true.
```

### Ownership model

The executable feature is the canonical pattern definition. TypeScript annotations are additive and focus on implementation discoverability.

| Source            | Owns                                                                                     | Representative tags                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Feature files** | Pattern identity, lifecycle, executable linkage, structural grouping, rich rule content  | `pattern`, `status`, `implements`, `executable-specs`, `bounded-context`, `unlock-reason` |
| **TypeScript**    | Implementation dependencies, use guidance, implementation classification, decision links | `uses`, `role`, `bounded-context`, `decision`                                             |

The important boundary is simple: feature files define the pattern, TypeScript files explain how the code realizes it.

---

## Shape extraction

Shape extraction pulls TypeScript declarations into generated documentation. The supported modes are file-level explicit names and stub-targeted extraction.

### Mode 1: file-level explicit names

List the declarations in the file-level JSDoc:

```typescript
/**
 * @architect
 */
```

### Mode 2: stub-targeted extraction

Stub files can point at their future production home while still exposing shapes:

```typescript
/**
 * @architect
 * @architect-target src/services/command-orchestrator.ts
 */
```

## Annotation patterns by file type

### Service or module file

```typescript
/**
 * @architect
 * @architect-implements TransformDataset
 * @architect-role service
 * @architect-bounded-context generation
 * @architect-uses PatternGraph, ExtractedPattern
 * @architect-decision DD-12
 */
```

### Interface or contract file

```typescript
/**
 * @architect
 * @architect-implements DocumentationBundle
 * @architect-role contract
 */
```

### Barrel file

```typescript
/**
 * @architect
 * @architect-implements ProjectionBarrel
 * @architect-role barrel
 */
```

### Executable feature file

```gherkin
@architect
@architect-pattern:ProcessGuardLinterExecutableTests
@architect-implements:ProcessGuardLinter
@architect-status:completed
@architect-bounded-context:validation
Feature: Process Guard linter executable tests

  Rule: Completed specs require unlock reason
    **Invariant:** A completed spec cannot be modified without an explicit unlock reason.
    **Rationale:** This prevents accidental drift after a pattern is closed.
    **Verified by:** Reject modification without unlock reason

  @acceptance-criteria @happy-path
  Scenario: Reject modification without unlock reason
    Given a spec with status "completed"
    When I modify a deliverable
    Then validation fails with "completed-protection"
```

---

## Quick reference by tag group

| Group            | Representative retained tags                  |
| ---------------- | --------------------------------------------- |
| **Core**         | `pattern`, `status`                           |
| **Relationship** | `uses`, `implements`, `extends`, `see-also`   |
| **Architecture** | `role`, `bounded-context`                     |
| **Timeline**     | `completed`                                   |
| **PRD**          | `product-area`                                |
| **ADR**          | `adr`, `adr-status`, `adr-theme`, `adr-layer` |
| **Hierarchy**    | `title`                                       |
| **Stub**         | `target`                                      |
| **Other**        | `unlock-reason`, `level`, `parent`            |

### Format types

| Format         | Syntax example                             |
| -------------- | ------------------------------------------ |
| `flag`         | `@architect`                               |
| `value`        | `@architect-pattern Foo`                   |
| `enum`         | `@architect-status roadmap`                |
| `csv`          | `@architect-uses A, B, C`                  |
| `number`       | `@architect-adr:2`                         |
| `quoted-value` | `@architect-unlock-reason "Correct drift"` |

---

## Verification

### CLI commands

```bash
# Structured live taxonomy registry
pnpm architect:q 'g.graph.tagRegistry'

# Curation candidates and diagnostic annotation coverage
pnpm architect:graph census

# Inventory counts by source type
pnpm architect:q 'Object.fromEntries(Object.entries(g.graph.bySourceType).map(([type, patterns]) => [type, patterns.length]))'

# Full pattern context
pnpm architect:q 'g.pattern("GraphHandle")'

# Regenerate the docs projections
pnpm docs:all
```

### Common issues

| Symptom                             | Cause                                                  | Fix                                                                                     |
| ----------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Pattern missing from scanner output | Missing `@architect` opt-in                            | Add the file-level marker                                                               |
| `uses` edge rejected                | Target does not resolve to a declared pattern          | Point `@architect-uses` at a real `@architect-pattern` / `@architect-implements` target |
| Shape shows `z.infer<>`             | Extracted the alias instead of the schema constant     | Use the `*Schema` name                                                                  |
| Rule lacks back-link                | `**Verified by:**` not updated after a scenario rename | Update the Rule metadata and the scenario name together                                 |
| Feature and TS docs disagree        | Ownership boundary was crossed                         | Keep feature identity in Gherkin and implementation detail in TypeScript                |

---

## Related documentation

| Topic                  | Document                                             |
| ---------------------- | ---------------------------------------------------- |
| Live taxonomy snapshot | [../docs-live/TAXONOMY.md](../docs-live/TAXONOMY.md) |
| Taxonomy concepts      | [TAXONOMY.md](./TAXONOMY.md)                         |
| Config surface         | [CONFIGURATION.md](./CONFIGURATION.md)               |
| Runtime architecture   | [ARCHITECTURE.md](./ARCHITECTURE.md)                 |
| Validation rules       | [VALIDATION.md](./VALIDATION.md)                     |
