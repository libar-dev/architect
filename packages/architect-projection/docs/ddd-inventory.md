# DDD Fragment Inventory

## Domain Classification

Every fragment in `packages/architect-projection/src/fragments/`, organized by
subdomain. Classification: **Composite** (contains arrays of other fragments),
**Primitive** (leaf data), **Technical** (infrastructure/supporting).

### delivery-reporting

| Fragment                                       | Subdomain          | Classification | Notes                                                            |
| ---------------------------------------------- | ------------------ | -------------- | ---------------------------------------------------------------- |
| `phase-progress.ts` (PhaseProgress)            | delivery-reporting | Primitive      | Per-phase completion stats                                       |
| `release-notes-digest.ts` (ReleaseNotesDigest) | delivery-reporting | Composite      | Aggregates release entries with deliverables and patterns        |
| `roadmap-timeline.ts` (RoadmapTimeline)        | delivery-reporting | Composite      | Contains QuarterEntry array with nested PatternSummary-like rows |
| `status-distribution.ts` (StatusDistribution)  | delivery-reporting | Primitive      | Counts by status                                                 |
| `traceability-matrix.ts` (TraceabilityMatrix)  | delivery-reporting | Composite      | Array of TraceRow (pattern + tests + specs + deliverables)       |
| `supporting.ts`                                | delivery-reporting | Technical      | Shared Zod schemas: QuarterEntrySchema, TraceRowSchema, etc.     |

### documentation-composition

| Fragment                                             | Subdomain                 | Classification | Notes                                                                          |
| ---------------------------------------------------- | ------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `architecture-diagram.ts` (ArchitectureDiagram)      | documentation-composition | Primitive      | Mermaid diagram block + legend + pattern list                                  |
| `documentation-bundle.ts` (Documentation bundle)     | documentation-composition | Technical      | Registry-driven dispatcher returning domain `ProjectionBundle` output directly |
| `pr-change-review.ts` (PrChangeReview)               | documentation-composition | Primitive      | PR diff review content                                                         |
| `project-config-snapshot.ts` (ProjectConfigSnapshot) | documentation-composition | Primitive      | Base dir, config path, source globs, build stats                               |
| `supporting.ts`                                      | documentation-composition | Technical      | DocumentationSectionSchema                                                     |

### execution-context

| Fragment                                           | Subdomain         | Classification | Notes                                                                         |
| -------------------------------------------------- | ----------------- | -------------- | ----------------------------------------------------------------------------- |
| `deliverable.ts` (Deliverable)                     | execution-context | Primitive      | Single deliverable entry (name, status, location, tests)                      |
| `deliverable-manifest.ts` (DeliverableManifest)    | execution-context | Composite      | Array of Deliverable for a pattern                                            |
| `file-reading-list.ts` (FileReadingList)           | execution-context | Primitive      | Ordered file paths: primary, completedDeps, roadmapDeps, neighbors            |
| `handoff-record.ts` (HandoffRecord)                | execution-context | Primitive      | Session-end handoff: completed, in-progress, blockers, next                   |
| `scope-readiness-check.ts` (ScopeReadinessCheck)   | execution-context | Primitive      | Single check result (label, passed, severity, details)                        |
| `scope-readiness-report.ts` (ScopeReadinessReport) | execution-context | Composite      | Array of ScopeReadinessCheck + verdict                                        |
| `session-context-bundle.ts` (SessionContextBundle) | execution-context | Composite      | Full session context: metadata, deps, consumers, neighbors, deliverables, FSM |
| `supporting.ts`                                    | execution-context | Technical      | DepEntrySchema, FsmContextSchema, NeighborEntrySchema, etc.                   |

### governance

| Fragment                                           | Subdomain  | Classification | Notes                                                                                |
| -------------------------------------------------- | ---------- | -------------- | ------------------------------------------------------------------------------------ |
| `business-rule.ts` (BusinessRule)                  | governance | Primitive      | Single rule: feature, invariant, rationale, verifiedBy                               |
| `business-rule-set.ts` (BusinessRuleSet)           | governance | Composite      | Discriminated union by scope (all/product-area/phase/feature); array of BusinessRule |
| `decision-catalog.ts` (DecisionCatalog)            | governance | Composite      | Array of DecisionRecord                                                              |
| `decision-record.ts` (DecisionRecord)              | governance | Primitive      | Single ADR: id, title, status, context, decision, consequences                       |
| `taxonomy-digest.ts` (TaxonomyDigest)              | governance | Composite      | Tag groups with entries + format types                                               |
| `validation-rule-digest.ts` (ValidationRuleDigest) | governance | Composite      | Validation rules + FSM states/transitions + protection levels                        |
| `supporting.ts`                                    | governance | Technical      | BusinessRuleGroupingSchema, etc.                                                     |

<!-- lifecycle-management subdomain pruned in Action 5 (see CHANGELOG Unreleased).
Re-introduce when spec-lifecycle work actually begins. -->

### operational-insights

| Fragment                                           | Subdomain            | Classification | Notes                                                               |
| -------------------------------------------------- | -------------------- | -------------- | ------------------------------------------------------------------- |
| `annotation-coverage.ts` (AnnotationCoverage)      | operational-insights | Primitive      | Coverage stats for source annotations                               |
| `overview-digest.ts` (OverviewDigest)              | operational-insights | Composite      | Progress + ActivePhaseEntry array + BlockingEntry array             |
| `requirement-digest.ts` (RequirementDigest)        | operational-insights | Composite      | Array of requirement entries with descriptions                      |
| `role-profile.ts` (RoleProfile)                    | operational-insights | Primitive      | Single role definition and usage                                    |
| `source-inventory-entry.ts` (SourceInventoryEntry) | operational-insights | Primitive      | Single source file inventory entry                                  |
| `tag-usage-entry.ts` (TagUsageEntry)               | operational-insights | Primitive      | Single tag usage stat                                               |
| `tag-usage-matrix.ts` (TagUsageMatrix)             | operational-insights | Composite      | Array of TagUsageEntry + pattern count                              |
| `supporting.ts`                                    | operational-insights | Technical      | ActivePhaseEntrySchema, BlockingEntrySchema, OverviewProgressSchema |

### pattern-relations

| Fragment                                                  | Subdomain         | Classification | Notes                                                                    |
| --------------------------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------ |
| `architecture-neighborhood.ts` (ArchitectureNeighborhood) | pattern-relations | Primitive      | Uses, usedBy, dependsOn, enables, sameContext, implements, implementedBy |
| `dependency-edge.ts` (DependencyEdge)                     | pattern-relations | Primitive      | Single edge in a dependency graph                                        |
| `dependency-tree.ts` (DependencyTree)                     | pattern-relations | Composite      | Recursive DependencyTreeNode array                                       |
| `pattern-detail.ts` (PatternDetail)                       | pattern-relations | Composite      | Full pattern: deliverables, relationships, rules, stubs, manifest        |
| `pattern-summary.ts` (PatternSummary)                     | pattern-relations | Primitive      | Lightweight pattern listing entry                                        |
| `supporting.ts`                                           | pattern-relations | Technical      | DependencyTreeNodeSchema, PatternRelationshipsSchema, etc.               |

### Cross-cutting

| Fragment  | Subdomain | Classification | Notes                                                                  |
| --------- | --------- | -------------- | ---------------------------------------------------------------------- |
| `base.ts` | (root)    | Technical      | FragmentBase, ProjectionBundle, BundleRouting, isBundle, projectSingle |

---

## Composition Map

Composite fragments and the sub-fragments or supporting schemas they compose.
Maximum two levels of nesting shown.

### SessionContextBundle (execution-context)

- `metadata`: PatternContextMetaSchema (supporting)
- `stubs`: StubRefSchema (supporting)
- `dependencies`: DepEntrySchema (supporting)
- `sharedDependencies`: DepEntrySchema (supporting)
- `consumers`: DepEntrySchema (supporting)
- `architectureNeighbors`: NeighborEntrySchema (supporting)
- `deliverables`: **Deliverable** (execution-context)
- `fsmByPattern`: PatternFsmEntrySchema -> FsmContextSchema (supporting)

### OverviewDigest (operational-insights)

- `progress`: OverviewProgressSchema (supporting)
- `activePhases`: ActivePhaseEntrySchema (supporting)
- `blocking`: BlockingEntrySchema (supporting)

### BusinessRuleSet (governance)

- `rules`: **BusinessRule** (governance)

### RoadmapTimeline (delivery-reporting)

- `quarters`: QuarterEntrySchema (supporting)
  - Each quarter contains PatternSummary-like row data

### PatternDetail (pattern-relations)

- `deliverables`: **Deliverable** (execution-context, re-used via supporting)
- `relationships`: PatternRelationshipsSchema (supporting)
  - `implementedBy`: ImplementationRefSchema
- `rules`: **BusinessRule** (governance, re-used via supporting)
- `stubs`: StubRefSchema (supporting)
- `deliverableManifest`: **DeliverableManifest** (execution-context, optional)
  - `items`: **Deliverable**

### ScopeReadinessReport (execution-context)

- `checks`: **ScopeReadinessCheck** (execution-context)

### DeliverableManifest (execution-context)

- `items`: **Deliverable** (execution-context)

### Documentation bundles (documentation-composition)

- `documentation-bundle.ts`: registry-driven dispatcher for supported documentation types
- Returns the underlying domain **ProjectionBundle** directly; child documents stay in each domain bundle's `children` map with logical `BundleRouting`

### DecisionCatalog (governance)

- `decisions`: **DecisionRecord** (governance)

### TraceabilityMatrix (delivery-reporting)

- `rows`: TraceRowSchema (supporting)

### TagUsageMatrix (operational-insights)

- `tags`: **TagUsageEntry** (operational-insights)

---

## Subdomain Summary

### delivery-reporting

Fragments that project delivery progress and release tracking. PhaseProgress
and StatusDistribution provide aggregate counts. RoadmapTimeline organizes
patterns into quarterly views (roadmap, current work, milestones).
ReleaseNotesDigest aggregates deliverables and patterns into a changelog
structure. TraceabilityMatrix connects patterns to their tests, specs, and
deliverables for audit visibility.

### documentation-composition

Fragments for generating structured documentation artifacts. Documentation
composition now dispatches to the retained domain projections and returns their
`ProjectionBundle` output directly, preserving renderer-neutral logical route
IDs instead of wrapping every document in a universal section container.
ArchitectureDiagram produces Mermaid diagrams scoped to a context, layer, or
product area. PrChangeReview captures PR-level change analysis.
ProjectConfigSnapshot exposes runtime configuration for diagnostic and rebuild
confirmation output.

### execution-context

Fragments that support active work sessions. SessionContextBundle is the
richest composite, assembling pattern metadata, dependencies, consumers,
architecture neighbors, deliverables, stubs, and FSM state into a single
context payload for AI consumption. FileReadingList provides an ordered set
of files for a pattern. ScopeReadinessReport runs pre-flight checks before
a session. HandoffRecord captures session-end state for continuity.
Deliverable and DeliverableManifest track implementation artifacts.

### governance

Fragments for domain rules, decisions, taxonomy, and validation. BusinessRule
and BusinessRuleSet capture invariants and constraints extracted from Gherkin
features. DecisionRecord and DecisionCatalog manage architecture decision
records (ADRs). TaxonomyDigest describes the tag taxonomy configuration
(roles, metadata tags, aggregation tags, format types). ValidationRuleDigest
documents the process guard rules, FSM state machine, and protection levels.

<!-- lifecycle-management subdomain pruned in Action 5 (see CHANGELOG Unreleased).
Zero consumers in CLI/MCP/desktop/docs-gen. Re-introduce when spec-lifecycle
work actually begins. -->

### operational-insights

Fragments for project health and observability. OverviewDigest is the
entry-point projection: progress percentages, active phases, and blocking
dependencies. AnnotationCoverage measures how well source files are annotated.
RequirementDigest aggregates product requirements by area. RoleProfile
describes individual annotation roles. SourceInventoryEntry and TagUsageEntry/
TagUsageMatrix track per-file and per-tag usage statistics.

### pattern-relations

Fragments describing pattern structure and inter-pattern relationships.
PatternSummary provides lightweight listing data. PatternDetail is the full
pattern view including deliverables, relationships (dependsOn, uses, enables,
usedBy, implements, implementedBy, extends, seeAlso, apiRef), business rules,
and stubs. DependencyTree renders recursive dependency chains.
ArchitectureNeighborhood shows a pattern's structural neighborhood
(same-context peers, uses/usedBy, dependency edges, implementations).
DependencyEdge is a single edge primitive.

---

## Spec Lifecycle Alignment

The lifecycle-management subdomain was pruned in Action 5 after a grep audit
found zero consumers in CLI/MCP/desktop/docs-gen. The ideation documents under
`packages/context/ideation/12-handling-spec-lifecycle/` remain the source of
truth for the eventual re-introduction; this file is intentionally silent
until that work begins.
