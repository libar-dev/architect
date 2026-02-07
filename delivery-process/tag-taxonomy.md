# Tag Taxonomy Reference

> ⚠️ **Auto-generated from `delivery-process.config.ts`** - Do not edit manually.

## File Opt-In

All files must have this tag at the top to be included in documentation extraction:

| Tag           | Purpose                                    |
| ------------- | ------------------------------------------ |
| `@libar-docs` | Gates extraction - file must have this tag |

## Category Tags

Sorted by priority (lower number = higher priority):

| Priority | Tag                                                         | Domain         | Description    |
| -------- | ----------------------------------------------------------- | -------------- | -------------- |
| 1        | `@libar-docs-core`                                          | Core           | Core patterns  |
| 2        | `@libar-docs-api`                                           | API            | Public APIs    |
| 3        | `@libar-docs-infra` (aliases: `@libar-docs-infrastructure`) | Infrastructure | Infrastructure |

## Metadata Tags

| Tag                             | Format       | Purpose                                                                    | Required | Example                                                                       |
| ------------------------------- | ------------ | -------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `@libar-docs-pattern`           | value        | Explicit pattern name                                                      | Yes      | `@libar-docs-pattern CommandOrchestrator`                                     |
| `@libar-docs-status`            | enum         | Work item lifecycle status (per PDR-005 FSM)                               | No       | `@libar-docs-status roadmap`                                                  |
| `@libar-docs-core`              | flag         | Marks as essential/must-know pattern                                       | No       | `@libar-docs-core`                                                            |
| `@libar-docs-usecase`           | quoted-value | Use case association                                                       | No       | `@libar-docs-usecase "When handling command failures"`                        |
| `@libar-docs-uses`              | csv          | Patterns this depends on                                                   | No       | `@libar-docs-uses CommandBus, EventStore`                                     |
| `@libar-docs-used-by`           | csv          | Patterns that depend on this                                               | No       | `@libar-docs-used-by SagaOrchestrator`                                        |
| `@libar-docs-phase`             | number       | Roadmap phase number (unified across monorepo)                             | No       | `@libar-docs-phase 14`                                                        |
| `@libar-docs-release`           | value        | Target release version (semver or vNEXT for unreleased work)               | No       | `@libar-docs-release v0.1.0`                                                  |
| `@libar-docs-brief`             | value        | Path to pattern brief markdown                                             | No       | `@libar-docs-brief docs/briefs/decider-pattern.md`                            |
| `@libar-docs-depends-on`        | csv          | Roadmap dependencies (pattern or phase names)                              | No       | `@libar-docs-depends-on EventStore, CommandBus`                               |
| `@libar-docs-enables`           | csv          | Patterns this enables                                                      | No       | `@libar-docs-enables SagaOrchestrator, ProjectionBuilder`                     |
| `@libar-docs-implements`        | csv          | Patterns this code file realizes (realization relationship)                | No       | `@libar-docs-implements EventStoreDurability, IdempotentAppend`               |
| `@libar-docs-extends`           | value        | Base pattern this pattern extends (generalization relationship)            | No       | `@libar-docs-extends ProjectionCategories`                                    |
| `@libar-docs-quarter`           | value        | Delivery quarter for timeline tracking                                     | No       | `@libar-docs-quarter Q1-2026`                                                 |
| `@libar-docs-completed`         | value        | Completion date (YYYY-MM-DD format)                                        | No       | `@libar-docs-completed 2026-01-08`                                            |
| `@libar-docs-effort`            | value        | Estimated effort (4h, 2d, 1w format)                                       | No       | `@libar-docs-effort 2d`                                                       |
| `@libar-docs-effort-actual`     | value        | Actual effort spent (4h, 2d, 1w format)                                    | No       | `@libar-docs-effort-actual 3d`                                                |
| `@libar-docs-team`              | value        | Responsible team assignment                                                | No       | `@libar-docs-team platform`                                                   |
| `@libar-docs-workflow`          | enum         | Workflow discipline for process tracking                                   | No       | `@libar-docs-workflow implementation`                                         |
| `@libar-docs-risk`              | enum         | Risk level for planning                                                    | No       | `@libar-docs-risk medium`                                                     |
| `@libar-docs-priority`          | enum         | Priority level for roadmap ordering                                        | No       | `@libar-docs-priority high`                                                   |
| `@libar-docs-product-area`      | value        | Product area for PRD grouping                                              | No       | `@libar-docs-product-area PlatformCore`                                       |
| `@libar-docs-user-role`         | value        | Target user persona for this feature                                       | No       | `@libar-docs-user-role Developer`                                             |
| `@libar-docs-business-value`    | value        | Business value statement (hyphenated for tag format)                       | No       | `@libar-docs-business-value eliminates-event-replay-complexity`               |
| `@libar-docs-constraint`        | value        | Technical constraint affecting feature implementation                      | No       | `@libar-docs-constraint requires-convex-backend`                              |
| `@libar-docs-adr`               | value        | ADR/PDR number for decision tracking                                       | No       | `@libar-docs-adr 015`                                                         |
| `@libar-docs-adr-status`        | enum         | ADR/PDR decision status                                                    | No       | `@libar-docs-adr-status accepted`                                             |
| `@libar-docs-adr-category`      | value        | ADR/PDR category (architecture, process, tooling)                          | No       | `@libar-docs-adr-category architecture`                                       |
| `@libar-docs-adr-supersedes`    | value        | ADR/PDR number this decision supersedes                                    | No       | `@libar-docs-adr-supersedes 012`                                              |
| `@libar-docs-adr-superseded-by` | value        | ADR/PDR number that supersedes this decision                               | No       | `@libar-docs-adr-superseded-by 020`                                           |
| `@libar-docs-adr-theme`         | enum         | Theme grouping for related decisions (from synthesis)                      | No       | `@libar-docs-adr-theme persistence`                                           |
| `@libar-docs-adr-layer`         | enum         | Evolutionary layer of the decision                                         | No       | `@libar-docs-adr-layer foundation`                                            |
| `@libar-docs-level`             | enum         | Hierarchy level for epic->phase->task breakdown                            | No       | `@libar-docs-level epic`                                                      |
| `@libar-docs-parent`            | value        | Parent pattern name in hierarchy (links tasks to phases, phases to epics)  | No       | `@libar-docs-parent AggregateArchitecture`                                    |
| `@libar-docs-executable-specs`  | csv          | Links roadmap spec to package executable spec locations (PDR-007)          | No       | `@libar-docs-executable-specs platform-decider/tests/features/behavior`       |
| `@libar-docs-roadmap-spec`      | value        | Links package spec back to roadmap pattern for traceability (PDR-007)      | No       | `@libar-docs-roadmap-spec DeciderPattern`                                     |
| `@libar-docs-see-also`          | csv          | Related patterns for cross-reference without dependency implication        | No       | `@libar-docs-see-also AgentAsBoundedContext, CrossContextIntegration`         |
| `@libar-docs-api-ref`           | csv          | File paths to implementation APIs (replaces 'See:' Markdown text in Rules) | No       | `@libar-docs-api-ref @libar-dev/platform-core/src/durability/outbox.ts`       |
| `@libar-docs-extract-shapes`    | csv          | TypeScript type names to extract from this file for documentation          | No       | `@libar-docs-extract-shapes DeciderInput, ValidationResult, ProcessViolation` |
| `@libar-docs-arch-role`         | enum         | Architectural role for diagram generation (component type)                 | No       | `@libar-docs-arch-role projection`                                            |
| `@libar-docs-arch-context`      | value        | Bounded context this component belongs to (for subgraph grouping)          | No       | `@libar-docs-arch-context orders`                                             |
| `@libar-docs-arch-layer`        | enum         | Architectural layer for layered diagrams                                   | No       | `@libar-docs-arch-layer application`                                          |
| `@libar-docs-target`            | value        | Target implementation path for stub files                                  | No       | `@libar-docs-target src/api/stub-resolver.ts`                                 |
| `@libar-docs-since`             | value        | Design session that created this pattern                                   | No       | `@libar-docs-since DS-A`                                                      |

## Aggregation Tags

| Tag                    | Target Document             | Purpose                                     |
| ---------------------- | --------------------------- | ------------------------------------------- |
| `@libar-docs-overview` | OVERVIEW.md                 | Architecture overview patterns              |
| `@libar-docs-decision` | DECISIONS.md                | ADR-style decisions (auto-numbered)         |
| `@libar-docs-intro`    | (template placeholder only) | Package introduction (template placeholder) |

## Format Options

Used in template placeholders: `{{@libar-docs-core format=X}}`

- `full`
- `list`
- `summary`
