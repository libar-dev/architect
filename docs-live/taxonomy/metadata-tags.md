# Metadata Tag Reference

**Purpose:** Complete metadata tag definitions with all fields

---

## Metadata Tag Definitions

60 metadata tags with full details.

| Tag                      | Format       | Purpose                                                                    | Required | Repeatable | Values                                                                                                                                                                                                                               | Default  |
| ------------------------ | ------------ | -------------------------------------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `pattern`                | value        | Explicit pattern name                                                      | Yes      | No         | -                                                                                                                                                                                                                                    | -        |
| `status`                 | enum         | Work item lifecycle status (per PDR-005 FSM)                               | No       | No         | roadmap, active, completed, deferred                                                                                                                                                                                                 | roadmap  |
| `core`                   | flag         | Marks as essential/must-know pattern                                       | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `usecase`                | quoted-value | Use case association                                                       | No       | Yes        | -                                                                                                                                                                                                                                    | -        |
| `uses`                   | csv          | Patterns this depends on                                                   | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `used-by`                | csv          | Patterns that depend on this                                               | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `phase`                  | number       | Roadmap phase number (unified across monorepo)                             | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `release`                | value        | Target release version (semver or vNEXT for unreleased work)               | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `brief`                  | value        | Path to pattern brief markdown                                             | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `depends-on`             | csv          | Roadmap dependencies (pattern or phase names)                              | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `enables`                | csv          | Patterns this enables                                                      | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `implements`             | csv          | Patterns this code file realizes (realization relationship)                | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `extends`                | value        | Base pattern this pattern extends (generalization relationship)            | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `quarter`                | value        | Delivery quarter for timeline tracking                                     | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `completed`              | value        | Completion date (YYYY-MM-DD format)                                        | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `effort`                 | value        | Estimated effort (4h, 2d, 1w format)                                       | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `effort-actual`          | value        | Actual effort spent (4h, 2d, 1w format)                                    | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `team`                   | value        | Responsible team assignment                                                | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `workflow`               | enum         | Workflow discipline for process tracking                                   | No       | No         | implementation, planning, validation, documentation                                                                                                                                                                                  | -        |
| `risk`                   | enum         | Risk level for planning                                                    | No       | No         | low, medium, high                                                                                                                                                                                                                    | -        |
| `priority`               | enum         | Priority level for roadmap ordering                                        | No       | No         | critical, high, medium, low                                                                                                                                                                                                          | -        |
| `product-area`           | value        | Product area for PRD grouping                                              | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `user-role`              | value        | Target user persona for this feature                                       | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `business-value`         | value        | Business value statement (hyphenated for tag format)                       | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `constraint`             | value        | Technical constraint affecting feature implementation                      | No       | Yes        | -                                                                                                                                                                                                                                    | -        |
| `adr`                    | value        | ADR/PDR number for decision tracking                                       | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `adr-status`             | enum         | ADR/PDR decision status                                                    | No       | No         | proposed, accepted, deprecated, superseded                                                                                                                                                                                           | proposed |
| `adr-category`           | value        | ADR/PDR category (architecture, process, tooling)                          | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `adr-supersedes`         | value        | ADR/PDR number this decision supersedes                                    | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `adr-superseded-by`      | value        | ADR/PDR number that supersedes this decision                               | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `adr-theme`              | enum         | Theme grouping for related decisions (from synthesis)                      | No       | No         | persistence, isolation, commands, projections, coordination, taxonomy, testing                                                                                                                                                       | -        |
| `adr-layer`              | enum         | Evolutionary layer of the decision                                         | No       | No         | foundation, infrastructure, refinement                                                                                                                                                                                               | -        |
| `level`                  | enum         | Hierarchy level for epic->phase->task breakdown                            | No       | No         | epic, phase, task                                                                                                                                                                                                                    | phase    |
| `parent`                 | value        | Parent pattern name in hierarchy (links tasks to phases, phases to epics)  | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `title`                  | quoted-value | Human-readable display title (supports quoted values with spaces)          | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `executable-specs`       | csv          | Links roadmap spec to package executable spec locations (PDR-007)          | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `roadmap-spec`           | value        | Links package spec back to roadmap pattern for traceability (PDR-007)      | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `behavior-file`          | value        | Path to behavior test feature file for traceability                        | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `discovered-gap`         | value        | Gap identified during session retrospective                                | No       | Yes        | -                                                                                                                                                                                                                                    | -        |
| `discovered-improvement` | value        | Improvement identified during session retrospective                        | No       | Yes        | -                                                                                                                                                                                                                                    | -        |
| `discovered-risk`        | value        | Risk identified during session retrospective                               | No       | Yes        | -                                                                                                                                                                                                                                    | -        |
| `discovered-learning`    | value        | Learning captured during session retrospective                             | No       | Yes        | -                                                                                                                                                                                                                                    | -        |
| `see-also`               | csv          | Related patterns for cross-reference without dependency implication        | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `api-ref`                | csv          | File paths to implementation APIs (replaces 'See:' Markdown text in Rules) | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `extract-shapes`         | csv          | TypeScript type names to extract from this file for documentation          | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `shape`                  | value        | Marks declaration as documentable shape, optionally with group name        | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `arch-role`              | enum         | Architectural role for diagram generation (component type)                 | No       | No         | bounded-context, command-handler, projection, saga, process-manager, infrastructure, repository, decider, read-model, service                                                                                                        | -        |
| `arch-context`           | value        | Bounded context this component belongs to (for subgraph grouping)          | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `arch-layer`             | enum         | Architectural layer for layered diagrams                                   | No       | No         | domain, application, infrastructure                                                                                                                                                                                                  | -        |
| `include`                | csv          | Cross-cutting document inclusion for content routing and diagram scoping   | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `target`                 | value        | Target implementation path for stub files                                  | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `since`                  | value        | Design session that created this pattern                                   | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `convention`             | csv          | Convention domains for reference document generation from decision records | No       | No         | testing-policy, fsm-rules, cli-patterns, output-format, pattern-naming, session-workflow, config-presets, annotation-system, pipeline-architecture, publishing, doc-generation, taxonomy-rules, codec-registry, process-guard-errors | -        |
| `claude-module`          | value        | Module identifier for CLAUDE.md module generation (becomes filename)       | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `claude-section`         | enum         | Target section directory in \_claude-md/ for module output                 | No       | No         | core, process, testing, infrastructure, workflow                                                                                                                                                                                     | -        |
| `claude-tags`            | csv          | Variation filtering tags for modular-claude-md inclusion                   | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `sequence-orchestrator`  | value        | Identifies the coordinator module for sequence diagram generation          | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `sequence-step`          | number       | Explicit execution ordering number for sequence diagram steps              | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `sequence-module`        | csv          | Maps Rule to deliverable module(s) for sequence diagram participants       | No       | No         | -                                                                                                                                                                                                                                    | -        |
| `sequence-error`         | flag         | Marks scenario as error/alternative path in sequence diagram               | No       | No         | -                                                                                                                                                                                                                                    | -        |

## Tag Details

### `pattern`

| Property   | Value                                    |
| ---------- | ---------------------------------------- |
| Format     | value                                    |
| Purpose    | Explicit pattern name                    |
| Required   | Yes                                      |
| Repeatable | No                                       |
| Example    | `@architect-pattern CommandOrchestrator` |

### `status`

| Property     | Value                                        |
| ------------ | -------------------------------------------- |
| Format       | enum                                         |
| Purpose      | Work item lifecycle status (per PDR-005 FSM) |
| Required     | No                                           |
| Repeatable   | No                                           |
| Valid Values | roadmap, active, completed, deferred         |
| Default      | roadmap                                      |
| Example      | `@architect-status roadmap`                  |

### `core`

| Property   | Value                                |
| ---------- | ------------------------------------ |
| Format     | flag                                 |
| Purpose    | Marks as essential/must-know pattern |
| Required   | No                                   |
| Repeatable | No                                   |
| Example    | `@architect-core`                    |

### `usecase`

| Property   | Value                                                 |
| ---------- | ----------------------------------------------------- |
| Format     | quoted-value                                          |
| Purpose    | Use case association                                  |
| Required   | No                                                    |
| Repeatable | Yes                                                   |
| Example    | `@architect-usecase "When handling command failures"` |

### `uses`

| Property   | Value                                    |
| ---------- | ---------------------------------------- |
| Format     | csv                                      |
| Purpose    | Patterns this depends on                 |
| Required   | No                                       |
| Repeatable | No                                       |
| Example    | `@architect-uses CommandBus, EventStore` |

### `used-by`

| Property   | Value                                 |
| ---------- | ------------------------------------- |
| Format     | csv                                   |
| Purpose    | Patterns that depend on this          |
| Required   | No                                    |
| Repeatable | No                                    |
| Example    | `@architect-used-by SagaOrchestrator` |

### `phase`

| Property   | Value                                          |
| ---------- | ---------------------------------------------- |
| Format     | number                                         |
| Purpose    | Roadmap phase number (unified across monorepo) |
| Required   | No                                             |
| Repeatable | No                                             |
| Example    | `@architect-phase 14`                          |

### `release`

| Property   | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Format     | value                                                        |
| Purpose    | Target release version (semver or vNEXT for unreleased work) |
| Required   | No                                                           |
| Repeatable | No                                                           |
| Example    | `@architect-release v0.1.0`                                  |

### `brief`

| Property   | Value                                             |
| ---------- | ------------------------------------------------- |
| Format     | value                                             |
| Purpose    | Path to pattern brief markdown                    |
| Required   | No                                                |
| Repeatable | No                                                |
| Example    | `@architect-brief docs/briefs/decider-pattern.md` |

### `depends-on`

| Property   | Value                                          |
| ---------- | ---------------------------------------------- |
| Format     | csv                                            |
| Purpose    | Roadmap dependencies (pattern or phase names)  |
| Required   | No                                             |
| Repeatable | No                                             |
| Example    | `@architect-depends-on EventStore, CommandBus` |

### `enables`

| Property   | Value                                                    |
| ---------- | -------------------------------------------------------- |
| Format     | csv                                                      |
| Purpose    | Patterns this enables                                    |
| Required   | No                                                       |
| Repeatable | No                                                       |
| Example    | `@architect-enables SagaOrchestrator, ProjectionBuilder` |

### `implements`

| Property   | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| Format     | csv                                                            |
| Purpose    | Patterns this code file realizes (realization relationship)    |
| Required   | No                                                             |
| Repeatable | No                                                             |
| Example    | `@architect-implements EventStoreDurability, IdempotentAppend` |

### `extends`

| Property   | Value                                                           |
| ---------- | --------------------------------------------------------------- |
| Format     | value                                                           |
| Purpose    | Base pattern this pattern extends (generalization relationship) |
| Required   | No                                                              |
| Repeatable | No                                                              |
| Example    | `@architect-extends ProjectionCategories`                       |

### `quarter`

| Property   | Value                                  |
| ---------- | -------------------------------------- |
| Format     | value                                  |
| Purpose    | Delivery quarter for timeline tracking |
| Required   | No                                     |
| Repeatable | No                                     |
| Example    | `@architect-quarter Q1-2026`           |

### `completed`

| Property   | Value                               |
| ---------- | ----------------------------------- |
| Format     | value                               |
| Purpose    | Completion date (YYYY-MM-DD format) |
| Required   | No                                  |
| Repeatable | No                                  |
| Example    | `@architect-completed 2026-01-08`   |

### `effort`

| Property   | Value                                |
| ---------- | ------------------------------------ |
| Format     | value                                |
| Purpose    | Estimated effort (4h, 2d, 1w format) |
| Required   | No                                   |
| Repeatable | No                                   |
| Example    | `@architect-effort 2d`               |

### `effort-actual`

| Property   | Value                                   |
| ---------- | --------------------------------------- |
| Format     | value                                   |
| Purpose    | Actual effort spent (4h, 2d, 1w format) |
| Required   | No                                      |
| Repeatable | No                                      |
| Example    | `@architect-effort-actual 3d`           |

### `team`

| Property   | Value                       |
| ---------- | --------------------------- |
| Format     | value                       |
| Purpose    | Responsible team assignment |
| Required   | No                          |
| Repeatable | No                          |
| Example    | `@architect-team platform`  |

### `workflow`

| Property     | Value                                               |
| ------------ | --------------------------------------------------- |
| Format       | enum                                                |
| Purpose      | Workflow discipline for process tracking            |
| Required     | No                                                  |
| Repeatable   | No                                                  |
| Valid Values | implementation, planning, validation, documentation |
| Example      | `@architect-workflow implementation`                |

### `risk`

| Property     | Value                    |
| ------------ | ------------------------ |
| Format       | enum                     |
| Purpose      | Risk level for planning  |
| Required     | No                       |
| Repeatable   | No                       |
| Valid Values | low, medium, high        |
| Example      | `@architect-risk medium` |

### `priority`

| Property     | Value                               |
| ------------ | ----------------------------------- |
| Format       | enum                                |
| Purpose      | Priority level for roadmap ordering |
| Required     | No                                  |
| Repeatable   | No                                  |
| Valid Values | critical, high, medium, low         |
| Example      | `@architect-priority high`          |

### `product-area`

| Property   | Value                                  |
| ---------- | -------------------------------------- |
| Format     | value                                  |
| Purpose    | Product area for PRD grouping          |
| Required   | No                                     |
| Repeatable | No                                     |
| Example    | `@architect-product-area PlatformCore` |

### `user-role`

| Property   | Value                                |
| ---------- | ------------------------------------ |
| Format     | value                                |
| Purpose    | Target user persona for this feature |
| Required   | No                                   |
| Repeatable | No                                   |
| Example    | `@architect-user-role Developer`     |

### `business-value`

| Property   | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| Format     | value                                                          |
| Purpose    | Business value statement (hyphenated for tag format)           |
| Required   | No                                                             |
| Repeatable | No                                                             |
| Example    | `@architect-business-value eliminates-event-replay-complexity` |

### `constraint`

| Property   | Value                                                 |
| ---------- | ----------------------------------------------------- |
| Format     | value                                                 |
| Purpose    | Technical constraint affecting feature implementation |
| Required   | No                                                    |
| Repeatable | Yes                                                   |
| Example    | `@architect-constraint requires-convex-backend`       |

### `adr`

| Property   | Value                                |
| ---------- | ------------------------------------ |
| Format     | value                                |
| Purpose    | ADR/PDR number for decision tracking |
| Required   | No                                   |
| Repeatable | No                                   |
| Example    | `@architect-adr 015`                 |

### `adr-status`

| Property     | Value                                      |
| ------------ | ------------------------------------------ |
| Format       | enum                                       |
| Purpose      | ADR/PDR decision status                    |
| Required     | No                                         |
| Repeatable   | No                                         |
| Valid Values | proposed, accepted, deprecated, superseded |
| Default      | proposed                                   |
| Example      | `@architect-adr-status accepted`           |

### `adr-category`

| Property   | Value                                             |
| ---------- | ------------------------------------------------- |
| Format     | value                                             |
| Purpose    | ADR/PDR category (architecture, process, tooling) |
| Required   | No                                                |
| Repeatable | No                                                |
| Example    | `@architect-adr-category architecture`            |

### `adr-supersedes`

| Property   | Value                                   |
| ---------- | --------------------------------------- |
| Format     | value                                   |
| Purpose    | ADR/PDR number this decision supersedes |
| Required   | No                                      |
| Repeatable | No                                      |
| Example    | `@architect-adr-supersedes 012`         |

### `adr-superseded-by`

| Property   | Value                                        |
| ---------- | -------------------------------------------- |
| Format     | value                                        |
| Purpose    | ADR/PDR number that supersedes this decision |
| Required   | No                                           |
| Repeatable | No                                           |
| Example    | `@architect-adr-superseded-by 020`           |

### `adr-theme`

| Property     | Value                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Format       | enum                                                                           |
| Purpose      | Theme grouping for related decisions (from synthesis)                          |
| Required     | No                                                                             |
| Repeatable   | No                                                                             |
| Valid Values | persistence, isolation, commands, projections, coordination, taxonomy, testing |
| Example      | `@architect-adr-theme persistence`                                             |

### `adr-layer`

| Property     | Value                                  |
| ------------ | -------------------------------------- |
| Format       | enum                                   |
| Purpose      | Evolutionary layer of the decision     |
| Required     | No                                     |
| Repeatable   | No                                     |
| Valid Values | foundation, infrastructure, refinement |
| Example      | `@architect-adr-layer foundation`      |

### `level`

| Property     | Value                                           |
| ------------ | ----------------------------------------------- |
| Format       | enum                                            |
| Purpose      | Hierarchy level for epic->phase->task breakdown |
| Required     | No                                              |
| Repeatable   | No                                              |
| Valid Values | epic, phase, task                               |
| Default      | phase                                           |
| Example      | `@architect-level epic`                         |

### `parent`

| Property   | Value                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| Format     | value                                                                     |
| Purpose    | Parent pattern name in hierarchy (links tasks to phases, phases to epics) |
| Required   | No                                                                        |
| Repeatable | No                                                                        |
| Example    | `@architect-parent AggregateArchitecture`                                 |

### `title`

| Property   | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| Format     | quoted-value                                                      |
| Purpose    | Human-readable display title (supports quoted values with spaces) |
| Required   | No                                                                |
| Repeatable | No                                                                |
| Example    | `@architect-title:"Process Guard Linter"`                         |

### `executable-specs`

| Property   | Value                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| Format     | csv                                                                    |
| Purpose    | Links roadmap spec to package executable spec locations (PDR-007)      |
| Required   | No                                                                     |
| Repeatable | No                                                                     |
| Example    | `@architect-executable-specs platform-decider/tests/features/behavior` |

### `roadmap-spec`

| Property   | Value                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Format     | value                                                                 |
| Purpose    | Links package spec back to roadmap pattern for traceability (PDR-007) |
| Required   | No                                                                    |
| Repeatable | No                                                                    |
| Example    | `@architect-roadmap-spec DeciderPattern`                              |

### `behavior-file`

| Property   | Value                                                  |
| ---------- | ------------------------------------------------------ |
| Format     | value                                                  |
| Purpose    | Path to behavior test feature file for traceability    |
| Required   | No                                                     |
| Repeatable | No                                                     |
| Example    | `@architect-behavior-file behavior/my-pattern.feature` |

### `discovered-gap`

| Property   | Value                                              |
| ---------- | -------------------------------------------------- |
| Format     | value                                              |
| Purpose    | Gap identified during session retrospective        |
| Required   | No                                                 |
| Repeatable | Yes                                                |
| Example    | `@architect-discovered-gap missing-error-handling` |

### `discovered-improvement`

| Property   | Value                                                  |
| ---------- | ------------------------------------------------------ |
| Format     | value                                                  |
| Purpose    | Improvement identified during session retrospective    |
| Required   | No                                                     |
| Repeatable | Yes                                                    |
| Example    | `@architect-discovered-improvement cache-invalidation` |

### `discovered-risk`

| Property   | Value                                               |
| ---------- | --------------------------------------------------- |
| Format     | value                                               |
| Purpose    | Risk identified during session retrospective        |
| Required   | No                                                  |
| Repeatable | Yes                                                 |
| Example    | `@architect-discovered-risk data-loss-on-migration` |

### `discovered-learning`

| Property   | Value                                                   |
| ---------- | ------------------------------------------------------- |
| Format     | value                                                   |
| Purpose    | Learning captured during session retrospective          |
| Required   | No                                                      |
| Repeatable | Yes                                                     |
| Example    | `@architect-discovered-learning convex-mutation-limits` |

### `see-also`

| Property   | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| Format     | csv                                                                  |
| Purpose    | Related patterns for cross-reference without dependency implication  |
| Required   | No                                                                   |
| Repeatable | No                                                                   |
| Example    | `@architect-see-also AgentAsBoundedContext, CrossContextIntegration` |

### `api-ref`

| Property   | Value                                                                      |
| ---------- | -------------------------------------------------------------------------- |
| Format     | csv                                                                        |
| Purpose    | File paths to implementation APIs (replaces 'See:' Markdown text in Rules) |
| Required   | No                                                                         |
| Repeatable | No                                                                         |
| Example    | `@architect-api-ref @libar-dev/platform-core/src/durability/outbox.ts`     |

### `extract-shapes`

| Property   | Value                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| Format     | csv                                                                          |
| Purpose    | TypeScript type names to extract from this file for documentation            |
| Required   | No                                                                           |
| Repeatable | No                                                                           |
| Example    | `@architect-extract-shapes DeciderInput, ValidationResult, ProcessViolation` |

### `shape`

| Property   | Value                                                               |
| ---------- | ------------------------------------------------------------------- |
| Format     | value                                                               |
| Purpose    | Marks declaration as documentable shape, optionally with group name |
| Required   | No                                                                  |
| Repeatable | No                                                                  |
| Example    | `@architect-shape api-types`                                        |

### `arch-role`

| Property     | Value                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Format       | enum                                                                                                                          |
| Purpose      | Architectural role for diagram generation (component type)                                                                    |
| Required     | No                                                                                                                            |
| Repeatable   | No                                                                                                                            |
| Valid Values | bounded-context, command-handler, projection, saga, process-manager, infrastructure, repository, decider, read-model, service |
| Example      | `@architect-arch-role projection`                                                                                             |

### `arch-context`

| Property   | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| Format     | value                                                             |
| Purpose    | Bounded context this component belongs to (for subgraph grouping) |
| Required   | No                                                                |
| Repeatable | No                                                                |
| Example    | `@architect-arch-context orders`                                  |

### `arch-layer`

| Property     | Value                                    |
| ------------ | ---------------------------------------- |
| Format       | enum                                     |
| Purpose      | Architectural layer for layered diagrams |
| Required     | No                                       |
| Repeatable   | No                                       |
| Valid Values | domain, application, infrastructure      |
| Example      | `@architect-arch-layer application`      |

### `include`

| Property   | Value                                                                    |
| ---------- | ------------------------------------------------------------------------ |
| Format     | csv                                                                      |
| Purpose    | Cross-cutting document inclusion for content routing and diagram scoping |
| Required   | No                                                                       |
| Repeatable | No                                                                       |
| Example    | `@architect-include reference-sample,codec-system`                       |

### `target`

| Property   | Value                                        |
| ---------- | -------------------------------------------- |
| Format     | value                                        |
| Purpose    | Target implementation path for stub files    |
| Required   | No                                           |
| Repeatable | No                                           |
| Example    | `@architect-target src/api/stub-resolver.ts` |

### `since`

| Property   | Value                                    |
| ---------- | ---------------------------------------- |
| Format     | value                                    |
| Purpose    | Design session that created this pattern |
| Required   | No                                       |
| Repeatable | No                                       |
| Example    | `@architect-since DS-A`                  |

### `convention`

| Property     | Value                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Format       | csv                                                                                                                                                                                                                                  |
| Purpose      | Convention domains for reference document generation from decision records                                                                                                                                                           |
| Required     | No                                                                                                                                                                                                                                   |
| Repeatable   | No                                                                                                                                                                                                                                   |
| Valid Values | testing-policy, fsm-rules, cli-patterns, output-format, pattern-naming, session-workflow, config-presets, annotation-system, pipeline-architecture, publishing, doc-generation, taxonomy-rules, codec-registry, process-guard-errors |
| Example      | `@architect-convention fsm-rules, testing-policy`                                                                                                                                                                                    |

### `claude-module`

| Property   | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| Format     | value                                                                |
| Purpose    | Module identifier for CLAUDE.md module generation (becomes filename) |
| Required   | No                                                                   |
| Repeatable | No                                                                   |
| Example    | `@architect-claude-module process-guard`                             |

### `claude-section`

| Property     | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Format       | enum                                                       |
| Purpose      | Target section directory in \_claude-md/ for module output |
| Required     | No                                                         |
| Repeatable   | No                                                         |
| Valid Values | core, process, testing, infrastructure, workflow           |
| Example      | `@architect-claude-section process`                        |

### `claude-tags`

| Property   | Value                                                    |
| ---------- | -------------------------------------------------------- |
| Format     | csv                                                      |
| Purpose    | Variation filtering tags for modular-claude-md inclusion |
| Required   | No                                                       |
| Repeatable | No                                                       |
| Example    | `@architect-claude-tags core-mandatory, process`         |

### `sequence-orchestrator`

| Property   | Value                                                             |
| ---------- | ----------------------------------------------------------------- |
| Format     | value                                                             |
| Purpose    | Identifies the coordinator module for sequence diagram generation |
| Required   | No                                                                |
| Repeatable | No                                                                |
| Example    | `@architect-sequence-orchestrator:init-cli`                       |

### `sequence-step`

| Property   | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| Format     | number                                                        |
| Purpose    | Explicit execution ordering number for sequence diagram steps |
| Required   | No                                                            |
| Repeatable | No                                                            |
| Example    | `@architect-sequence-step:1`                                  |

### `sequence-module`

| Property   | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| Format     | csv                                                                  |
| Purpose    | Maps Rule to deliverable module(s) for sequence diagram participants |
| Required   | No                                                                   |
| Repeatable | No                                                                   |
| Example    | `@architect-sequence-module:detect-context`                          |

### `sequence-error`

| Property   | Value                                                        |
| ---------- | ------------------------------------------------------------ |
| Format     | flag                                                         |
| Purpose    | Marks scenario as error/alternative path in sequence diagram |
| Required   | No                                                           |
| Repeatable | No                                                           |
| Example    | `@architect-sequence-error`                                  |

---

[Back to Taxonomy Reference](../TAXONOMY.md)
