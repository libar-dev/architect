# Tag Taxonomy Reference

> ⚠️ **Auto-generated from `architect.config.ts`** - Do not edit manually.

## File Opt-In

All files must have this tag at the top to be included in documentation extraction:

| Tag          | Purpose                                    |
| ------------ | ------------------------------------------ |
| `@architect` | Gates extraction - file must have this tag |

## Category Tags

Sorted by priority (lower number = higher priority):

| Priority | Tag                                                       | Domain         | Description    |
| -------- | --------------------------------------------------------- | -------------- | -------------- |
| 1        | `@architect-core`                                         | Core           | Core patterns  |
| 2        | `@architect-api`                                          | API            | Public APIs    |
| 3        | `@architect-infra` (aliases: `@architect-infrastructure`) | Infrastructure | Infrastructure |

## Metadata Tags

| Tag                            | Format       | Purpose                                                                    | Required | Example                                                                      |
| ------------------------------ | ------------ | -------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `@architect-pattern`           | value        | Explicit pattern name                                                      | Yes      | `@architect-pattern CommandOrchestrator`                                     |
| `@architect-status`            | enum         | Work item lifecycle status (per PDR-005 FSM)                               | No       | `@architect-status roadmap`                                                  |
| `@architect-core`              | flag         | Marks as essential/must-know pattern                                       | No       | `@architect-core`                                                            |
| `@architect-usecase`           | quoted-value | Use case association                                                       | No       | `@architect-usecase "When handling command failures"`                        |
| `@architect-uses`              | csv          | Patterns this depends on                                                   | No       | `@architect-uses CommandBus, EventStore`                                     |
| `@architect-used-by`           | csv          | Patterns that depend on this                                               | No       | `@architect-used-by SagaOrchestrator`                                        |
| `@architect-phase`             | number       | Roadmap phase number (unified across monorepo)                             | No       | `@architect-phase 14`                                                        |
| `@architect-release`           | value        | Target release version (semver or vNEXT for unreleased work)               | No       | `@architect-release v0.1.0`                                                  |
| `@architect-brief`             | value        | Path to pattern brief markdown                                             | No       | `@architect-brief docs/briefs/decider-pattern.md`                            |
| `@architect-depends-on`        | csv          | Roadmap dependencies (pattern or phase names)                              | No       | `@architect-depends-on EventStore, CommandBus`                               |
| `@architect-enables`           | csv          | Patterns this enables                                                      | No       | `@architect-enables SagaOrchestrator, ProjectionBuilder`                     |
| `@architect-implements`        | csv          | Patterns this code file realizes (realization relationship)                | No       | `@architect-implements EventStoreDurability, IdempotentAppend`               |
| `@architect-extends`           | value        | Base pattern this pattern extends (generalization relationship)            | No       | `@architect-extends ProjectionCategories`                                    |
| `@architect-quarter`           | value        | Delivery quarter for timeline tracking                                     | No       | `@architect-quarter Q1-2026`                                                 |
| `@architect-completed`         | value        | Completion date (YYYY-MM-DD format)                                        | No       | `@architect-completed 2026-01-08`                                            |
| `@architect-effort`            | value        | Estimated effort (4h, 2d, 1w format)                                       | No       | `@architect-effort 2d`                                                       |
| `@architect-effort-actual`     | value        | Actual effort spent (4h, 2d, 1w format)                                    | No       | `@architect-effort-actual 3d`                                                |
| `@architect-team`              | value        | Responsible team assignment                                                | No       | `@architect-team platform`                                                   |
| `@architect-workflow`          | enum         | Workflow discipline for process tracking                                   | No       | `@architect-workflow implementation`                                         |
| `@architect-risk`              | enum         | Risk level for planning                                                    | No       | `@architect-risk medium`                                                     |
| `@architect-priority`          | enum         | Priority level for roadmap ordering                                        | No       | `@architect-priority high`                                                   |
| `@architect-product-area`      | value        | Product area for PRD grouping                                              | No       | `@architect-product-area PlatformCore`                                       |
| `@architect-user-role`         | value        | Target user persona for this feature                                       | No       | `@architect-user-role Developer`                                             |
| `@architect-business-value`    | value        | Business value statement (hyphenated for tag format)                       | No       | `@architect-business-value eliminates-event-replay-complexity`               |
| `@architect-constraint`        | value        | Technical constraint affecting feature implementation                      | No       | `@architect-constraint requires-convex-backend`                              |
| `@architect-adr`               | value        | ADR/PDR number for decision tracking                                       | No       | `@architect-adr 015`                                                         |
| `@architect-adr-status`        | enum         | ADR/PDR decision status                                                    | No       | `@architect-adr-status accepted`                                             |
| `@architect-adr-category`      | value        | ADR/PDR category (architecture, process, tooling)                          | No       | `@architect-adr-category architecture`                                       |
| `@architect-adr-supersedes`    | value        | ADR/PDR number this decision supersedes                                    | No       | `@architect-adr-supersedes 012`                                              |
| `@architect-adr-superseded-by` | value        | ADR/PDR number that supersedes this decision                               | No       | `@architect-adr-superseded-by 020`                                           |
| `@architect-adr-theme`         | enum         | Theme grouping for related decisions (from synthesis)                      | No       | `@architect-adr-theme persistence`                                           |
| `@architect-adr-layer`         | enum         | Evolutionary layer of the decision                                         | No       | `@architect-adr-layer foundation`                                            |
| `@architect-level`             | enum         | Hierarchy level for epic->phase->task breakdown                            | No       | `@architect-level epic`                                                      |
| `@architect-parent`            | value        | Parent pattern name in hierarchy (links tasks to phases, phases to epics)  | No       | `@architect-parent AggregateArchitecture`                                    |
| `@architect-executable-specs`  | csv          | Links roadmap spec to package executable spec locations (PDR-007)          | No       | `@architect-executable-specs platform-decider/tests/features/behavior`       |
| `@architect-roadmap-spec`      | value        | Links package spec back to roadmap pattern for traceability (PDR-007)      | No       | `@architect-roadmap-spec DeciderPattern`                                     |
| `@architect-see-also`          | csv          | Related patterns for cross-reference without dependency implication        | No       | `@architect-see-also AgentAsBoundedContext, CrossContextIntegration`         |
| `@architect-api-ref`           | csv          | File paths to implementation APIs (replaces 'See:' Markdown text in Rules) | No       | `@architect-api-ref @libar-dev/platform-core/src/durability/outbox.ts`       |
| `@architect-extract-shapes`    | csv          | TypeScript type names to extract from this file for documentation          | No       | `@architect-extract-shapes DeciderInput, ValidationResult, ProcessViolation` |
| `@architect-arch-role`         | enum         | Architectural role for diagram generation (component type)                 | No       | `@architect-arch-role projection`                                            |
| `@architect-arch-context`      | value        | Bounded context this component belongs to (for subgraph grouping)          | No       | `@architect-arch-context orders`                                             |
| `@architect-arch-layer`        | enum         | Architectural layer for layered diagrams                                   | No       | `@architect-arch-layer application`                                          |
| `@architect-target`            | value        | Target implementation path for stub files                                  | No       | `@architect-target src/api/stub-resolver.ts`                                 |
| `@architect-since`             | value        | Design session that created this pattern                                   | No       | `@architect-since DS-A`                                                      |
| `@architect-convention`        | csv          | Convention domains for reference document generation from decision records | No       | `@architect-convention fsm-rules, testing-policy`                            |

## Aggregation Tags

| Tag                   | Target Document             | Purpose                                     |
| --------------------- | --------------------------- | ------------------------------------------- |
| `@architect-overview` | OVERVIEW.md                 | Architecture overview patterns              |
| `@architect-decision` | DECISIONS.md                | ADR-style decisions (auto-numbered)         |
| `@architect-intro`    | (template placeholder only) | Package introduction (template placeholder) |

## Format Options

Used in template placeholders: `{{@architect-core format=X}}`

- `full`
- `list`
- `summary`
