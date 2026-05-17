# 04 — Tag Registry

> **Architect Spec v0.2.0** — Complete reference of all standard `@architect-*` tags.

---

## About This Registry

This document defines the **standard tag set** — tags that any conforming implementation
MUST recognize. Projects MAY add custom tags beyond this set (see §03 — Extension Points).

Tags are organized by functional group. Within each group, tags are listed alphabetically.

> **v0.2.0 canonical scope.** Several tag groups in this registry — Planning,
> Product & Business, Discovery — describe authoring vocabulary that earlier drafts of
> this spec considered canonical but that has been **removed from the v0.2.0 standard
> taxonomy**. They are retained in this registry as informative reference and are
> explicitly flagged where they appear. The CHANGELOG entries `0.2.1 (Draft)` and
> `0.2.0 (Draft)` in the README describe the migration. Projects MAY use these tags as
> custom extensions; the reference implementation does not recognise them.

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

| Tag                          | Format | Purpose                                      | Required              | Values / Example                                                                           |
| ---------------------------- | ------ | -------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `@architect-product-area`    | value  | Product area grouping (project-defined enum) | MUST (Level 2)        | `Annotation`, `Configuration`, `Process`, `Projection`, `Validation`                       |
| `@architect-bounded-context` | value  | Architecture domain grouping                 | MUST (specs, Level 2) | `identity`, `billing`, `delivery-reporting`                                                |
| `@architect-arch-layer`      | enum   | Architecture layer                           | MUST (specs, Level 2) | `application`, `domain`, `infrastructure`                                                  |
| `@architect-role`            | enum   | Canonical role tag                           | MUST (specs, Level 2) | `barrel`, `codec`, `contract`, `decider`, `projection`, `read-model`, `service`, `utility` |

> **Historical note:** `@architect-arch-role` appears only in older migration notes and preserved reference docs.

### Architecture Layer Values

| Value            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `application`    | Use cases, orchestration, application services             |
| `domain`         | Business logic, aggregates, domain services, value objects |
| `infrastructure` | External integrations, databases, messaging, configuration |

> _Informative:_ Earlier drafts also listed `presentation`. The reference implementation
> exposes only the three values above (`packages/architect-core/src/taxonomy/arch-layer-values.ts`).
> Projects that need a UI/presentation layer typically express that via a custom role or
> bounded context rather than the `arch-layer` enum.

### Role Values

The canonical role set used by the reference implementation
(`packages/architect-core/src/taxonomy/`):

| Value        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `barrel`     | Re-export surfaces and curated entrypoints                         |
| `codec`      | Serialization, parsing, and rendering codec surfaces               |
| `contract`   | Published schemas and contract-bearing surfaces                    |
| `decider`    | FSM and rule deciders enforcing process integrity                  |
| `projection` | Fragment projection functions deriving outputs from `PatternGraph` |
| `read-model` | Query-oriented read views over the graph                           |
| `service`    | Application and domain services                                    |
| `utility`    | Shared helpers and narrowly focused utilities                      |

> _Informative:_ Earlier drafts of this registry listed DDD-style values for `role`
> (`aggregate`, `repository`, `factory`, `value-object`, `event`, `command`, `query`,
> `saga`, …). Projects MAY define those as a custom role set
> (see §11 — Project Configuration); they are not part of the v0.2.0 default taxonomy.

---

## Group 3: Planning (Not in v0.2.0 Canonical Taxonomy)

> **v0.2.0 status:** The Planning group is **NOT part of the v0.2.0 standard authored
> taxonomy.** The tags below are retained as informative reference for projects
> migrating from earlier drafts. The reference implementation does not recognize
> `@architect-phase`, `@architect-effort`, `@architect-priority`, `@architect-release`,
> `@architect-quarter`, `@architect-team`, or `@architect-risk`. Roadmap ordering today
> is conveyed via `@architect-uses` (a pattern is blocked by what it uses),
> `@architect-status` (FSM state), and the hierarchy tags `@architect-level` /
> `@architect-parent`. Projects MAY add custom planning tags as extensions.

| Tag                   | Format | Purpose                | Status in v0.2.0     | Values / Example                    |
| --------------------- | ------ | ---------------------- | -------------------- | ----------------------------------- |
| `@architect-phase`    | number | Roadmap phase number   | **Removed** — custom | `1`, `2`, `3`, `25b`                |
| `@architect-effort`   | value  | Estimated effort       | **Removed** — custom | `3d`, `5d`, `1w`, `4h`              |
| `@architect-priority` | enum   | Priority level         | **Removed** — custom | `critical`, `high`, `medium`, `low` |
| `@architect-release`  | value  | Target release version | **Removed** — custom | `vNEXT`, `v1.0.0`                   |
| `@architect-quarter`  | value  | Target quarter         | **Removed** — custom | `Q1-2026`, `Q2-2026`                |
| `@architect-team`     | value  | Responsible team       | **Removed** — custom | `platform`, `frontend`              |
| `@architect-risk`     | enum   | Risk level             | **Removed** — custom | `high`, `medium`, `low`             |

### Effort Format (legacy)

Effort values, if used as a custom tag, use a number + unit suffix:

- `h` = hours (e.g., `4h`)
- `d` = days (e.g., `3d`, `5d`)
- `w` = weeks (e.g., `1w`, `2w`)

---

## Group 4: Relationships

Tags that express connections between patterns. The v0.2.0 canonical authored set
collapses to four tags — `@architect-uses`, `@architect-implements`,
`@architect-extends`, `@architect-see-also` — and the reverse edges are derived, not
authored.

| Tag                     | Format | Purpose                                                   | Required               | Values / Example           |
| ----------------------- | ------ | --------------------------------------------------------- | ---------------------- | -------------------------- |
| `@architect-uses`       | csv    | Patterns this pattern depends on / uses                   | SHOULD (if deps exist) | `UserService,TokenService` |
| `@architect-implements` | csv    | Patterns this code or stub realizes                       | MUST (stubs)           | `McpServerIntegration`     |
| `@architect-extends`    | value  | Pattern this extends or specializes                       | OPTIONAL               | `BaseRepository`           |
| `@architect-see-also`   | csv    | Related patterns, informational only and not a dependency | OPTIONAL               | `UserProfile,AuditLog`     |

### Relationship Semantics

| Relationship    | Direction          | Semantics                           | Authored?    | Blocks?                                    |
| --------------- | ------------------ | ----------------------------------- | ------------ | ------------------------------------------ |
| `uses`          | A uses B           | A calls / depends on B              | Yes          | Yes — A is blocked if B is not `completed` |
| `usedBy`        | B used by A        | Reverse of `uses`                   | No (derived) | n/a                                        |
| `implements`    | A implements B     | A is the code realization of spec B | Yes          | No                                         |
| `implementedBy` | B implemented by A | Reverse of `implements`             | No (derived) | n/a                                        |
| `extends`       | A extends B        | A specializes B                     | Yes          | No                                         |
| `see-also`      | A related to B     | Informational cross-reference       | Yes          | No                                         |

> _Informative:_ Earlier drafts of this registry listed separate authored tags
> `@architect-depends-on`, `@architect-enables`, `@architect-used-by`, and
> `@architect-api-ref`. In v0.2.0 the authored vocabulary collapses to
> `@architect-uses`; reverse edges (`usedBy`, `implementedBy`) are derived. The
> `@architect-api-ref` tag is no longer part of the canonical taxonomy.

### Cross-Process References

Cross-process relationships are documented through the surviving relationship vocabulary.
Reference implementations that span multiple delivery processes may derive soft links from
their canonical relationship data, but they should not require separate authored tags just
for cross-process routing.

---

## Group 5: Product & Business (Not in v0.2.0 Canonical Taxonomy)

> **v0.2.0 status:** This group is **NOT part of the v0.2.0 standard authored taxonomy.**
> The tags below are retained as informative reference; the reference implementation
> does not recognise them. The single product-classification tag in v0.2.0 is
> `@architect-product-area` (Group 2 — Classification).

| Tag                         | Format | Purpose                           | Status in v0.2.0     | Values / Example                                       |
| --------------------------- | ------ | --------------------------------- | -------------------- | ------------------------------------------------------ |
| `@architect-business-value` | value  | Hyphenated business value slug    | **Removed** — custom | `eliminate-context-loss`, `enforce-delivery-standards` |
| `@architect-user-role`      | value  | Primary user role served          | **Removed** — custom | `developer`, `tech-lead`, `architect`                  |
| `@architect-constraints`    | csv    | Business or technical constraints | **Removed** — custom | `offline-capable,sub-100ms-latency`                    |

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

| Tag                 | Format | Purpose             | Required                                                                        | Values / Example                 |
| ------------------- | ------ | ------------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| `@architect-level`  | enum   | Hierarchy level     | OPTIONAL                                                                        | `epic`, `phase`, `task`, `slice` |
| `@architect-parent` | value  | Parent pattern name | MUST (idea/candidate; except @architect-level:epic\|slice). OPTIONAL otherwise. | `IdentityModule`                 |

> _Informative:_ Earlier drafts listed `@architect-include` for aggregation. That tag
> is not part of the v0.2.0 canonical taxonomy.

### Hierarchy Level Values

| Value   | Description                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| `epic`  | Top-level grouping of related patterns delivered together                                                     |
| `phase` | A roadmap phase grouping for related delivery work                                                            |
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

> _Informative:_ Earlier drafts listed `@architect-since` for design session identifiers.
> That tag is not part of the v0.2.0 canonical taxonomy. Stub-owned types and exports
> remain part of the design contract, but this draft no longer reserves a dedicated
> authored tag for shape extraction. If a toolchain needs export-level shape data, it
> should derive that view from the TypeScript surface itself.

---

## Group 10: Release (Not in v0.2.0 Canonical Taxonomy)

> **v0.2.0 status:** `@architect-release` is **NOT part of the v0.2.0 standard authored
> taxonomy.** Release manifests today take their version identifier from the file name
> (`vNEXT.feature`, `vX.Y.Z.feature`) and may carry only the core gate + status +
> product-area tags. The table below is retained as informative reference for projects
> migrating from earlier drafts.

| Tag                  | Format | Purpose                    | Status in v0.2.0     | Values / Example            |
| -------------------- | ------ | -------------------------- | -------------------- | --------------------------- |
| `@architect-release` | value  | Release version identifier | **Removed** — custom | `vNEXT`, `v1.0.0`, `v2.3.1` |

---

## Group 11: Process Enforcement

Tags used by ProcessGuard (§09) for lifecycle management.

| Tag                        | Format | Purpose                                         | Required                        | Values / Example           |
| -------------------------- | ------ | ----------------------------------------------- | ------------------------------- | -------------------------- |
| `@architect-unlock-reason` | value  | Justification for modifying a completed pattern | MUST (when modifying completed) | `Bug-fix-for-token-expiry` |

> _Informative:_ Earlier drafts listed `@architect-workflow` for active workflow
> identifiers. That tag is not part of the v0.2.0 canonical taxonomy.

---

## Group 12: Discovery (Not in v0.2.0 Canonical Taxonomy)

> **v0.2.0 status:** This group is **NOT part of the v0.2.0 standard authored taxonomy.**
> Discovery findings today live in design-review notes
> (`architect/design-reviews/`) and in `**Open Questions:**` blocks within candidate-tier
> specs rather than dedicated tags. The reference implementation does not recognise the
> tags below; projects MAY add them as custom extensions.

| Tag                                  | Format | Purpose                   | Status in v0.2.0     | Values / Example                           |
| ------------------------------------ | ------ | ------------------------- | -------------------- | ------------------------------------------ |
| `@architect-discovered-gaps`         | csv    | Gaps found during review  | **Removed** — custom | `missing-error-handling,no-retry-logic`    |
| `@architect-discovered-improvements` | csv    | Improvement opportunities | **Removed** — custom | `cache-optimization,batch-queries`         |
| `@architect-discovered-risks`        | csv    | Risks identified          | **Removed** — custom | `rate-limit-bypass,data-loss-on-crash`     |
| `@architect-discovered-learnings`    | csv    | Lessons learned           | **Removed** — custom | `prefer-pull-over-push,avoid-deep-nesting` |

---

## Summary: Tag Count by Group

The v0.2.0 canonical authored tag count is **~22 tags + the `@architect` gate + 3
aggregation tags ≈ 26 total** (the exact count depends on whether `@architect-maturity`
is treated as authored — it is auto-defaulted from `@architect-status`).

| Group               | v0.2.0 Canonical | v0.2.0 Tags                                                                            |
| ------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| Core Identity       | 4                | gate, pattern, status, maturity (auto-defaulted)                                       |
| Classification      | 4                | product-area, bounded-context, arch-layer, role                                        |
| Relationships       | 4                | uses, implements, extends, see-also                                                    |
| ADR                 | 7                | adr, adr-status, adr-category, adr-theme, adr-layer, adr-supersedes, adr-superseded-by |
| Hierarchy           | 2                | level, parent                                                                          |
| Stub-Specific       | 1                | target                                                                                 |
| Process Enforcement | 1                | unlock-reason                                                                          |
| Timeline            | 1                | completed                                                                              |
| Core / Use-case     | 1                | usecase                                                                                |
| Aggregation         | 3                | overview, decision, intro                                                              |

| Group               | v0.2.0 Status | Earlier-Draft Tags (informative)                                                 |
| ------------------- | ------------- | -------------------------------------------------------------------------------- |
| Planning            | **Removed**   | phase, effort, priority, release, quarter, team, risk                            |
| Product & Business  | **Removed**   | business-value, user-role, constraints                                           |
| Sequence            | **Removed**   | orchestrator, step, module, error                                                |
| Discovery           | **Removed**   | discovered-gaps, discovered-improvements, discovered-risks, discovered-learnings |
| Extra hierarchy     | **Removed**   | include                                                                          |
| Extra stub          | **Removed**   | since, shapes                                                                    |
| Extra process       | **Removed**   | workflow                                                                         |
| Extra relationships | **Removed**   | depends-on, enables, used-by, api-ref, depends-on-external, parent-external      |

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
