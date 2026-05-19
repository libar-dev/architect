# Taxonomy Reference

**Purpose:** Tag taxonomy configuration for code-first documentation
**Detail Level:** Overview with links to details

---

## Overview

\*\*8 roles\*\* | \*\*19 metadata tags\*\* | \*\*3 aggregation tags\*\* | \*\*30 total\*\*

| Component        | Count |
| ---------------- | ----- |
| Roles            | 8     |
| Metadata Tags    | 19    |
| Aggregation Tags | 3     |
| Total            | 30    |

## Roles

| Tag            | Domain     | Priority | Description                                                      | Aliases |
| -------------- | ---------- | -------- | ---------------------------------------------------------------- | ------- |
| \`projection\` | Projection | 1        | Fragment projection functions deriving outputs from PatternGraph |         |
| \`service\`    | Service    | 2        | Application and domain services                                  |         |
| \`decider\`    | Decider    | 3        | FSM and rule deciders enforcing process integrity                |         |
| \`read-model\` | Read Model | 4        | Query-oriented read views over the graph                         |         |
| \`codec\`      | Codec      | 5        | Serialization, parsing, and rendering codec surfaces             |         |
| \`contract\`   | Contract   | 6        | Published schemas and contract-bearing surfaces                  |         |
| \`barrel\`     | Barrel     | 7        | Re-export surfaces and curated entrypoints                       |         |
| \`utility\`    | Utility    | 8        | Shared helpers and narrowly focused utilities                    |         |

## Metadata Tags

### Core Tags

| Tag         | Format | Purpose                                        | Required | Repeatable | Values                                          | Default Value | Example                                |
| ----------- | ------ | ---------------------------------------------- | -------- | ---------- | ----------------------------------------------- | ------------- | -------------------------------------- |
| \`pattern\` | value  | Explicit pattern name                          | Yes      | No         |                                                 |               | @architect-pattern CommandOrchestrator |
| \`status\`  | enum   | Work item lifecycle status \(per PDR-005 FSM\) | No       | No         | candidate, roadmap, active, completed, deferred | roadmap       | @architect-status roadmap              |

### Relationship Tags

| Tag            | Format | Purpose                                                             | Required | Repeatable | Values | Default Value | Example                                                            |
| -------------- | ------ | ------------------------------------------------------------------- | -------- | ---------- | ------ | ------------- | ------------------------------------------------------------------ |
| \`extends\`    | value  | Base pattern this pattern extends \(generalization relationship\)   | No       | No         |        |               | @architect-extends ProjectionCategories                            |
| \`implements\` | csv    | Patterns this code file realizes \(realization relationship\)       | No       | No         |        |               | @architect-implements EventStoreDurability, IdempotentAppend       |
| \`see-also\`   | csv    | Related patterns for cross-reference without dependency implication | No       | No         |        |               | @architect-see-also AgentAsBoundedContext, CrossContextIntegration |
| \`uses\`       | csv    | Patterns this depends on                                            | No       | No         |        |               | @architect-uses CommandBus, EventStore                             |

### Architecture Tags

| Tag                 | Format | Purpose                                                                 | Required | Repeatable | Values                                                                     | Default Value | Example                                       |
| ------------------- | ------ | ----------------------------------------------------------------------- | -------- | ---------- | -------------------------------------------------------------------------- | ------------- | --------------------------------------------- |
| \`bounded-context\` | value  | Canonical bounded-context grouping for structural and subgraph views    | No       | No         |                                                                            |               | @architect-bounded-context delivery-reporting |
| \`role\`            | value  | Canonical role tag for pattern classification and architecture grouping | No       | No         | barrel, codec, contract, decider, projection, read-model, service, utility |               | @architect-role projection                    |

### Timeline Tags

| Tag           | Format | Purpose                               | Required | Repeatable | Values | Default Value | Example                         |
| ------------- | ------ | ------------------------------------- | -------- | ---------- | ------ | ------------- | ------------------------------- |
| \`completed\` | value  | Completion date \(YYYY-MM-DD format\) | No       | No         |        |               | @architect-completed 2026-01-08 |

### PRD Tags

| Tag              | Format | Purpose                                              | Required | Repeatable | Values                                                                                     | Default Value | Example                            |
| ---------------- | ------ | ---------------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------ | ------------- | ---------------------------------- |
| \`product-area\` | value  | Product area for PRD grouping \(per ADR-001 Rule 1\) | No       | No         | Annotation, Configuration, Generation, Validation, DataAPI, CoreTypes, Process, Projection |               | @architect-product-area Annotation |

### ADR Tags

| Tag                   | Format | Purpose                                                 | Required | Repeatable | Values                                                                         | Default Value | Example                              |
| --------------------- | ------ | ------------------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------ | ------------- | ------------------------------------ |
| \`adr\`               | value  | ADR/PDR number for decision tracking                    | No       | No         |                                                                                |               | @architect-adr 015                   |
| \`adr-category\`      | value  | ADR/PDR category \(per ADR-001 Rule 2\)                 | No       | No         | architecture, process, testing, documentation                                  |               | @architect-adr-category architecture |
| \`adr-layer\`         | enum   | Evolutionary layer of the decision                      | No       | No         | foundation, infrastructure, refinement                                         |               | @architect-adr-layer foundation      |
| \`adr-status\`        | enum   | ADR/PDR decision status                                 | No       | No         | proposed, accepted, deprecated, superseded                                     | proposed      | @architect-adr-status accepted       |
| \`adr-superseded-by\` | value  | ADR/PDR number that supersedes this decision            | No       | No         |                                                                                |               | @architect-adr-superseded-by 020     |
| \`adr-supersedes\`    | value  | ADR/PDR number this decision supersedes                 | No       | No         |                                                                                |               | @architect-adr-supersedes 012        |
| \`adr-theme\`         | enum   | Theme grouping for related decisions \(from synthesis\) | No       | No         | persistence, isolation, commands, projections, coordination, taxonomy, testing |               | @architect-adr-theme persistence     |

### Other Tags

| Tag        | Format | Purpose                                                                                                          | Required | Repeatable | Values                   | Default Value | Example                            |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------------------- | -------- | ---------- | ------------------------ | ------------- | ---------------------------------- |
| \`level\`  | enum   | Hierarchy-axis level \(epic / phase / task / slice\). Independent of lifecycle status \(see @architect-status\). | No       | No         | epic, phase, task, slice |               | @architect-level epic              |
| \`parent\` | value  | Hierarchy-axis parent edge. Target must carry @architect-level at a strictly higher level.                       | No       | No         |                          |               | @architect-parent LifecycleMvpEpic |

## Aggregation Tags

### Aggregation Tags

| Tag          | Target Document | Purpose                                       |
| ------------ | --------------- | --------------------------------------------- |
| \`decision\` | DECISIONS.md    | ADR-style decisions \(auto-numbered\)         |
| \`intro\`    |                 | Package introduction \(template placeholder\) |
| \`overview\` | OVERVIEW.md     | Architecture overview patterns                |

## Format Types

| Format       | Description                           | Example                                                  |
| ------------ | ------------------------------------- | -------------------------------------------------------- |
| value        | Simple string value                   | @architect-pattern MyPattern                             |
| enum         | Constrained to predefined values      | @architect-status roadmap                                |
| quoted-value | String in quotes \(preserves spaces\) | @architect-unlock-reason "Correct post-completion drift" |
| csv          | Comma-separated values                | @architect-uses A, B, C                                  |
| number       | Numeric value                         | @architect-adr 2                                         |
| flag         | Boolean presence \(no value\)         | @architect                                               |
