# 04 — Tag Registry

> **Architect Spec v0.2.0** — Complete reference of all standard `@architect-*` tags.

---

## About This Registry

This document defines the **standard tag set** — tags that any conforming implementation
MUST recognize. Projects MAY add custom tags beyond this set (see §03 — Extension Points).

Tags are organized by functional group. Within each group, tags are listed alphabetically.

---

## Group 1: Core Identity

Tags that establish a pattern's identity within the project.

| Tag                   | Format | Purpose                                                                                                                                                         | Required                            | Values / Example                                          |
| --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| `@architect`          | flag   | Gates extraction — file must have this tag to be processed                                                                                                      | MUST (all)                          | (no value)                                                |
| `@architect-pattern`  | value  | Unique pattern name in PascalCase                                                                                                                               | MUST (specs, ADRs, stubs)           | `UserRegistration`, `ADR004Lifecycle`                     |
| `@architect-status`   | enum   | Current FSM delivery state                                                                                                                                      | MUST (all)                          | `candidate`, `roadmap`, `active`, `completed`, `deferred` |
| `@architect-maturity` | enum   | Spec refinement level (idea → plan → design → executable). Discriminates idea-tier specs (`idea`) from plan-tier (`plan`) within `@architect-status:candidate`. | OPTIONAL (auto-defaults via status) | `idea`, `plan`, `design`, `executable`                    |

### Pattern Naming Rules

- Pattern names MUST be PascalCase: `UserRegistration`, `McpServerIntegration`
- Pattern names MUST be unique across the entire project
- ADR patterns SHOULD use the prefix `ADR` + zero-padded number: `ADR004LifecycleArchitecture`
- PDR patterns SHOULD use the prefix `PDR` + zero-padded number: `PDR001SessionWorkflow`

### Maturity Auto-Default

When `@architect-maturity` is absent on a spec, it is inferred from `@architect-status` via this mapping:

| Status      | Default maturity |
| ----------- | ---------------- |
| `candidate` | `idea`           |
| `roadmap`   | `plan`           |
| `active`    | `design`         |
| `completed` | `executable`     |
| `deferred`  | `plan`           |

Explicit `@architect-maturity` always wins over the default. See §08 for tier shape rules per maturity value.

---

## Group 2: Classification

Tags that classify a pattern within the project's organizational structure.

| Tag                          | Format | Purpose                             | Required              | Values / Example                                                                                                   |
| ---------------------------- | ------ | ----------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `@architect-product-area`    | value  | Product area grouping               | MUST (Level 2)        | `Desktop`, `Cloud`, `Infrastructure`                                                                               |
| `@architect-bounded-context` | value  | Architecture domain grouping        | MUST (specs, Level 2) | `identity`, `billing`, `desktop`                                                                                   |
| `@architect-arch-layer`      | enum   | Architecture layer                  | MUST (specs, Level 2) | `presentation`, `application`, `domain`, `infrastructure`                                                          |
| `@architect-role`            | enum   | Canonical role tag within the layer | MUST (specs, Level 2) | `aggregate`, `service`, `repository`, `factory`, `value-object`, `event`, `command`, `query`, `projection`, `saga` |

> **Historical note:** `@architect-arch-role` appears only in older migration notes and preserved reference docs.

### Architecture Layer Values

| Value            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `presentation`   | UI components, views, routes, user interaction             |
| `application`    | Use cases, orchestration, application services             |
| `domain`         | Business logic, aggregates, domain services, value objects |
| `infrastructure` | External integrations, databases, messaging, configuration |

---

## Group 3: Planning

Tags that describe a pattern's position in the delivery roadmap.

**Lifecycle note:** Planning tags are split into two categories:

- **Surviving tags** — transferred to executable specs during value transfer (§08)
- **Planning-only tags** — dropped during value transfer (historical data, no ongoing value)

| Tag                   | Format | Purpose                | Required              | Survives? | Values / Example                    |
| --------------------- | ------ | ---------------------- | --------------------- | --------- | ----------------------------------- |
| `@architect-phase`    | number | Roadmap phase number   | MUST (specs, Level 2) | **Yes**   | `1`, `2`, `3`, `25b`                |
| `@architect-effort`   | value  | Estimated effort       | MUST (specs, Level 2) | No        | `3d`, `5d`, `1w`, `4h`              |
| `@architect-priority` | enum   | Priority level         | MUST (specs, Level 2) | No        | `critical`, `high`, `medium`, `low` |
| `@architect-release`  | value  | Target release version | MUST (specs, Level 2) | No        | `vNEXT`, `v1.0.0`                   |
| `@architect-quarter`  | value  | Target quarter         | OPTIONAL              | No        | `Q1-2026`, `Q2-2026`                |
| `@architect-team`     | value  | Responsible team       | OPTIONAL              | No        | `platform`, `frontend`              |
| `@architect-risk`     | enum   | Risk level             | OPTIONAL              | No        | `high`, `medium`, `low`             |

### Effort Format

Effort values use a number + unit suffix:

- `h` = hours (e.g., `4h`)
- `d` = days (e.g., `3d`, `5d`)
- `w` = weeks (e.g., `1w`, `2w`)

---

## Group 4: Relationships

Tags that express connections between patterns.

| Tag                     | Format | Purpose                                                   | Required               | Values / Example           |
| ----------------------- | ------ | --------------------------------------------------------- | ---------------------- | -------------------------- |
| `@architect-depends-on` | csv    | Patterns this pattern requires to function                | SHOULD (if deps exist) | `UserService,TokenService` |
| `@architect-enables`    | csv    | Patterns that this pattern unblocks                       | OPTIONAL               | `Dashboard,PatternBrowser` |
| `@architect-uses`       | csv    | Patterns this pattern calls or consumes                   | OPTIONAL               | `EventStore,Logger`        |
| `@architect-used-by`    | csv    | Patterns that call or consume this pattern                | OPTIONAL               | `APIGateway,WebUI`         |
| `@architect-implements` | csv    | Patterns this code or stub realizes                       | MUST (stubs)           | `McpServerIntegration`     |
| `@architect-extends`    | value  | Pattern this extends or specializes                       | OPTIONAL               | `BaseRepository`           |
| `@architect-see-also`   | csv    | Related patterns, informational only and not a dependency | OPTIONAL               | `UserProfile,AuditLog`     |
| `@architect-api-ref`    | value  | External API reference                                    | OPTIONAL               | `REST:/api/v1/users`       |

### Relationship Semantics

| Relationship | Direction      | Semantics                           | Blocks?                                    |
| ------------ | -------------- | ----------------------------------- | ------------------------------------------ |
| `depends-on` | A depends on B | A cannot function without B         | Yes — A is blocked if B is not `completed` |
| `enables`    | A enables B    | B is unblocked when A completes     | Yes (inverse of depends-on)                |
| `uses`       | A uses B       | A calls B at runtime                | No                                         |
| `used-by`    | A used by B    | B calls A at runtime                | No                                         |
| `implements` | A implements B | A is the code realization of spec B | No                                         |
| `extends`    | A extends B    | A specializes B                     | No                                         |
| `see-also`   | A related to B | Informational cross-reference       | No                                         |

### Cross-Process References

Cross-process relationships are documented through the surviving relationship vocabulary.
Reference implementations that span multiple delivery processes may derive soft links from
their canonical relationship data, but they should not require separate authored tags just
for cross-process routing.

---

## Group 5: Product & Business

Tags that capture business context and value.

| Tag                         | Format | Purpose                           | Required       | Survives?          | Values / Example                                       |
| --------------------------- | ------ | --------------------------------- | -------------- | ------------------ | ------------------------------------------------------ |
| `@architect-business-value` | value  | Hyphenated business value slug    | SHOULD (specs) | No (planning-only) | `eliminate-context-loss`, `enforce-delivery-standards` |
| `@architect-user-role`      | value  | Primary user role served          | OPTIONAL       | No                 | `developer`, `tech-lead`, `architect`                  |
| `@architect-constraints`    | csv    | Business or technical constraints | OPTIONAL       | No                 | `offline-capable,sub-100ms-latency`                    |

---

## Group 6: ADR (Architecture Decision Records)

Tags specific to decision records. See §06 for full ADR format.

| Tag                            | Format | Purpose                         | Required (ADRs) | Values / Example                                      |
| ------------------------------ | ------ | ------------------------------- | --------------- | ----------------------------------------------------- |
| `@architect-adr`               | value  | ADR number (zero-padded)        | MUST            | `001`, `004`, `012`                                   |
| `@architect-adr-status`        | enum   | Decision lifecycle status       | MUST            | `proposed`, `accepted`, `deprecated`, `superseded`    |
| `@architect-adr-category`      | value  | Decision category               | MUST            | `architecture`, `process`, `testing`, `documentation` |
| `@architect-adr-theme`         | value  | Decision theme                  | OPTIONAL        | `performance`, `security`, `scalability`              |
| `@architect-adr-supersedes`    | value  | ADR number this supersedes      | OPTIONAL        | `003`                                                 |
| `@architect-adr-superseded-by` | value  | ADR number that supersedes this | OPTIONAL        | `005`                                                 |

### ADR Status Lifecycle

```
proposed → accepted → deprecated
                   → superseded (by newer ADR)
```

---

## Group 7: Hierarchy

Tags that express parent-child relationships between patterns.

| Tag                  | Format | Purpose                        | Required                                                                        | Values / Example                 |
| -------------------- | ------ | ------------------------------ | ------------------------------------------------------------------------------- | -------------------------------- |
| `@architect-level`   | enum   | Hierarchy level                | OPTIONAL                                                                        | `epic`, `phase`, `task`, `slice` |
| `@architect-parent`  | value  | Parent pattern name            | MUST (idea/candidate; except @architect-level:epic\|slice). OPTIONAL otherwise. | `IdentityModule`                 |
| `@architect-include` | csv    | Tags to include in aggregation | OPTIONAL                                                                        | `@architect-core,@architect-api` |

### Hierarchy Level Values

| Value   | Description                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| `epic`  | Top-level grouping of related patterns delivered together                                                     |
| `phase` | A roadmap phase grouping (typically aligns with `@architect-phase`)                                           |
| `task`  | A leaf-level pattern — the unit of delivery                                                                   |
| `slice` | An architectural slice — a named, reusable view that groups N existing patterns for exploration, not delivery |

Slices are not delivery work. They are saved queries expressed as specs that group existing patterns
into a neighborhood for design or review. A slice spec lists members (patterns) and a purpose
(the question the slice answers); it does not introduce new behavior.

**Parent carve-out.** Files carrying `@architect-level:epic` or `@architect-level:slice` are exempt from the `@architect-parent` requirement. Epics are top-of-chain by definition; slices are cross-cutting views, not delivery work — neither has a meaningful parent. All other idea/candidate-tier files MUST declare a parent.

---

## Group 8: Design Rule Narration

Design-level specs may still describe execution order, orchestrators, and alternate paths,
but the ordering belongs in normal rule prose, `Rule:` titles, `**Input:**` / `**Output:**`
blocks, and scenarios. This draft no longer reserves dedicated sequence tags as canonical
authored syntax.

---

## Group 9: Stub-Specific

Tags used exclusively in TypeScript design stubs (§07).

| Tag                 | Format | Purpose                                         | Required (stubs) | Values / Example               |
| ------------------- | ------ | ----------------------------------------------- | ---------------- | ------------------------------ |
| `@architect-target` | value  | Destination file path when stub moves to `src/` | MUST             | `apps/desktop/src/lib/auth.ts` |
| `@architect-since`  | value  | Design session identifier                       | OPTIONAL         | `DS-1`, `DS-2`                 |

Stub-owned types and exports remain part of the design contract, but this draft no longer
reserves a dedicated authored tag for shape extraction. If a toolchain needs export-level
shape data, it should derive that view from the TypeScript surface itself.

---

## Group 10: Release

Tags used in release manifest files (§02).

| Tag                  | Format | Purpose                    | Required (releases) | Values / Example            |
| -------------------- | ------ | -------------------------- | ------------------- | --------------------------- |
| `@architect-release` | value  | Release version identifier | MUST                | `vNEXT`, `v1.0.0`, `v2.3.1` |

---

## Group 11: Process Enforcement

Tags used by ProcessGuard (§09) for lifecycle management.

| Tag                        | Format | Purpose                                         | Required                        | Values / Example           |
| -------------------------- | ------ | ----------------------------------------------- | ------------------------------- | -------------------------- |
| `@architect-unlock-reason` | value  | Justification for modifying a completed pattern | MUST (when modifying completed) | `Bug-fix-for-token-expiry` |
| `@architect-workflow`      | value  | Active workflow identifier                      | OPTIONAL                        | `implementation`, `review` |

---

## Group 12: Discovery

Tags for capturing findings during design and review sessions.

| Tag                                  | Format | Purpose                   | Required | Values / Example                           |
| ------------------------------------ | ------ | ------------------------- | -------- | ------------------------------------------ |
| `@architect-discovered-gaps`         | csv    | Gaps found during review  | OPTIONAL | `missing-error-handling,no-retry-logic`    |
| `@architect-discovered-improvements` | csv    | Improvement opportunities | OPTIONAL | `cache-optimization,batch-queries`         |
| `@architect-discovered-risks`        | csv    | Risks identified          | OPTIONAL | `rate-limit-bypass,data-loss-on-crash`     |
| `@architect-discovered-learnings`    | csv    | Lessons learned           | OPTIONAL | `prefer-pull-over-push,avoid-deep-nesting` |

---

## Summary: Tag Count by Group

| Group               | Tag Count | Purpose                                                                         |
| ------------------- | --------- | ------------------------------------------------------------------------------- |
| Core Identity       | 3         | Pattern name, status, gate                                                      |
| Classification      | 4         | Product area, context, layer, role                                              |
| Planning            | 7         | Phase, effort, priority, release, quarter, team, risk                           |
| Relationships       | 10        | Dependencies, usage, implementation, cross-references, cross-process soft links |
| Product & Business  | 3         | Business value, user role, constraints                                          |
| ADR                 | 6         | ADR number, status, category, theme, supersession                               |
| Hierarchy           | 3         | Level (incl. `slice`), parent, include                                          |
| Sequence            | 4         | Orchestrator, step, module, error                                               |
| Stub-Specific       | 3         | Target, since, shapes                                                           |
| Release             | 1         | Version identifier                                                              |
| Process Enforcement | 2         | Unlock reason, workflow                                                         |
| Discovery           | 4         | Gaps, improvements, risks, learnings                                            |
| **Total**           | **50**    |                                                                                 |

---

## Status → Maturity Defaults

`@architect-maturity` is **optional**: when omitted from a spec, conforming implementations
MUST infer it from `@architect-status` via the canonical mapping below. This contract — the
`DEFAULT_MATURITY_BY_STATUS` table — is the **authoritative source** consulted by:

- the reference implementation's `_gherkin` extraction helpers (e.g.
  `effective_maturity()` in plugin graders),
- the tier-shape validators that gate idea-tier vs candidate-tier vs design-tier checks,
- any tooling that needs to discriminate "≤30 line idea" from "30-80 line candidate"
  from full design specs without requiring an explicit `@architect-maturity` tag on every
  file.

### `DEFAULT_MATURITY_BY_STATUS`

| Status      | Default `@architect-maturity` |
| ----------- | ----------------------------- |
| `candidate` | `idea`                        |
| `roadmap`   | `plan`                        |
| `active`    | `design`                      |
| `completed` | `executable`                  |
| `deferred`  | `plan`                        |

### Resolution rules

1. **Explicit always wins.** If a spec declares `@architect-maturity:<value>`, that value
   is the effective maturity regardless of status.
2. **Fall back to status.** If `@architect-maturity` is absent, look up
   `DEFAULT_MATURITY_BY_STATUS[<status>]`. The result is the effective maturity for tier
   gating.
3. **Unknown status.** If the status is not in the table (custom enum extension, unknown
   value), the effective maturity is undefined — implementations SHOULD treat the spec as
   un-gated (do not auto-promote into a stricter tier check) and SHOULD warn.
4. **Promotion.** When promoting a candidate spec past `idea`, either set
   `@architect-status` to advance past `candidate` (so the default no longer resolves to
   `idea`) or set `@architect-maturity` explicitly. The grader contract for
   candidate-tier specs (e.g. `grade_candidate_tier.py`) accepts either signal —
   "explicit `@architect-maturity:plan|design|executable`" OR "status advanced past
   `candidate` so `DEFAULT_MATURITY_BY_STATUS` no longer auto-defaults to `idea`".

### Conformance

- A conforming extractor MUST expose both `explicit_maturity` and `effective_maturity` for
  every spec, where the effective value is computed via the resolution rules above.
- Tier validators MUST consult effective maturity, not explicit maturity, so that
  un-tagged specs are still gated against the correct tier shape.
- The mapping table is **stable across v0.2.x**. New status values added in future minor
  versions extend the table; existing rows are not renumbered or remapped.

> **v0.2.0-draft addition.** This subsection formalizes a contract that was previously
> implemented in graders and extraction helpers without a spec-level reference. There is
> no Pkg-ADR for this contract yet — the canonical reference is this section. Closes
> 1B-H2.
