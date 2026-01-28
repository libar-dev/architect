@libar-docs
@libar-docs-pdr:001
@libar-docs-adr-status:accepted
@libar-docs-adr-category:process
@libar-docs-pattern:PDR001SelfDocumentation
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-relationship-workflow-and-architecture-decisions
@libar-docs-product-area:DeliveryProcess
Feature: PDR-001 - Self-Documentation Process

  Rule: Context - Package needs its own delivery process configuration

    The `@libar-dev/delivery-process` package generates documentation for other
    projects but also needs to document its own development. Without a defined
    process, the package's roadmap and releases would be undocumented.

  Rule: Decision - Dog-food the delivery process for self-documentation

    The package uses its own tooling for documentation:

    | Artifact | Location | Generator |
    |----------|----------|-----------|
    | Roadmap specs | `delivery-process/specs/` | roadmap |
    | Releases | `delivery-process/releases/` | changelog |
    | Decisions | `delivery-process/decisions/` | adrs |
    | Generated docs | `docs-generated/` | all |

    **Key Commands:**
    - `pnpm docs:all` - Generate all documentation
    - `pnpm validate:all` - Validate patterns, DoD, and anti-patterns
    - `pnpm docs:tag-taxonomy` - Generate TAG_TAXONOMY.md

  Rule: Decision - Relationship tags in use (libar-generic preset)

    The following relationship tags from PatternRelationshipModel are effective in this repo:

    **Currently Used:**
    | Tag | Purpose | Example |
    |-----|---------|---------|
    | `implements` | Behavior test → Tier 1 spec traceability | `@libar-docs-implements:ProcessGuardLinter` |
    | `uses` | Technical dependency (code→code) | `@libar-docs-uses:ConfigLoader,TagRegistry` |
    | `used-by` | Reverse dependency annotation | `@libar-docs-used-by:CLI` |
    | `executable-specs` | Tier 1 → behavior test location | `@libar-docs-executable-specs:tests/features/validation` |
    | `release` | Version association | `@libar-docs-release:v1.0.0` |
    | `arch-role` | Component type for architecture diagrams | `@libar-docs-arch-role:infrastructure` |
    | `arch-context` | Bounded context grouping | `@libar-docs-arch-context:scanner` |
    | `arch-layer` | Layer for layered diagrams | `@libar-docs-arch-layer:application` |

    **Available but not yet used:**
    | Tag | Future Use Case |
    |-----|-----------------|
    | `extends` | Pattern inheritance (e.g., specialized codecs) |
    | `depends-on` | Roadmap sequencing between tier 1 specs |
    | `enables` | Inverse of depends-on |
    | `roadmap-spec` | Back-link from behavior to tier 1 spec |
    | `parent`/`level` | Epic→phase→task breakdown |

    **Note:** Full relationship taxonomy documented in `delivery-process/specs/pattern-relationship-model.feature`

  Rule: Decision - Relationship requirements by workflow

    Different workflows require different relationship annotations:

    | Workflow | Required | Recommended | Optional |
    |----------|----------|-------------|----------|
    | **Planning** | `status`, `phase` | `depends-on`, `enables` | `priority`, `effort`, `quarter` |
    | **Design** | `status`, `uses` | `arch-*` tags, `extends` | `see-also` |
    | **Implementation** | `implements` (behavior tests) | `uses`, `used-by` | `api-ref` |

    **Planning Session:** Create roadmap spec with `status:roadmap`, `phase` number. Add `depends-on`
    to declare sequencing constraints. Optional `priority`, `effort`, `quarter` for timeline planning.

    **Design Session:** Source code stubs use `uses` for runtime dependencies. Architecture tags
    (`arch-role`, `arch-context`, `arch-layer`) recommended for files appearing in architecture diagrams.
    Use `extends` for pattern inheritance hierarchies.

    **Implementation Session:** Behavior tests MUST have `@libar-docs-implements:PatternName` linking
    to the tier 1 spec they validate. Source code should have `uses`/`used-by` for dependency graphs.

  Rule: Decision - Executable specs linkage patterns

    Behavior tests in `tests/features/` follow two valid patterns:

    | Pattern | When to Use | Tag Required | Example |
    |---------|-------------|--------------|---------|
    | **Linked** | Tests validate a tier 1 spec | `@libar-docs-implements:PatternName` | `fsm-validator.feature` → `PhaseStateMachineValidation` |
    | **Standalone** | Utility/infrastructure tests | None | `result-monad.feature`, `string-utils.feature` |

    **Linked tests** trace to tier 1 specs for:
    - Completeness tracking (DoD validation)
    - Traceability matrix generation
    - Impact analysis

    **Standalone tests** are appropriate when:
    - Testing pure utility functions (no business logic)
    - Testing infrastructure plumbing
    - POC/exploration tests
    - Tests for code patterns without explicit tier 1 specs

    **Note:** Tests that define their OWN `@libar-docs-pattern` tag ARE tier 1 specs themselves
    and should NOT also have `implements` (they are the specification, not an implementation).

  Rule: Decision - Architecture tags for diagram generation

    Architecture diagram generation uses three tags to create Mermaid component diagrams:

    | Tag | Purpose | Values | Example |
    |-----|---------|--------|---------|
    | `arch-role` | Component type | `infrastructure`, `service`, `repository`, `handler` | `@libar-docs-arch-role infrastructure` |
    | `arch-context` | Bounded context grouping | Free text | `@libar-docs-arch-context scanner` |
    | `arch-layer` | Layer for layered diagrams | `domain`, `application`, `infrastructure` | `@libar-docs-arch-layer application` |

    **When to add arch tags:**
    - Core patterns that should appear in architecture overview
    - Entry points and orchestration components
    - Key infrastructure like scanners, extractors, generators

    **When NOT needed:**
    - Internal utility functions
    - Type definition files
    - Test support code

    **Command:** `pnpm docs:architecture` generates `docs-generated/ARCHITECTURE.md`

  Rule: Consequences - Benefits and trade-offs

    **Benefits:**
    - (+) Validates the tooling works by using it
    - (+) Provides real-world examples for consumers
    - (+) Keeps package roadmap visible and tracked

    **Trade-offs:**
    - (-) Requires maintaining process discipline for a tooling package
    - (-) Generated docs add to package size

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Roadmap specs directory | Complete | delivery-process/specs/ |
      | Releases directory | Complete | delivery-process/releases/ |
      | Decisions directory | Complete | delivery-process/decisions/ |
      | docs:* scripts | Complete | package.json |
      | docs-generated output | Complete | docs-generated/ |

  @acceptance-criteria
  Scenario: Package can generate its own documentation
    Given the delivery-process package source code
    When running pnpm docs:all
    Then PATTERNS.md is generated in docs-generated/
    And ROADMAP.md is generated in docs-generated/
    And REMAINING-WORK.md is generated in docs-generated/
    And ARCHITECTURE.md is generated in docs-generated/

  @acceptance-criteria
  Scenario: Architecture diagram shows component relationships
    Given source files with arch-role, arch-context, and arch-layer tags
    When running pnpm docs:architecture
    Then ARCHITECTURE.md contains a Mermaid component diagram
    And components are grouped by arch-context as subgraphs
    And uses relationships are rendered as arrows between components
