# PDR007TwoTierSpecArchitecture

**Purpose:** Detailed patterns for PDR007TwoTierSpecArchitecture

---

## Summary

**Progress:** [████████████████████] 1/1 (100%)

| Status | Count |
| --- | --- |
| ✅ Completed | 1 |
| 🚧 Active | 0 |
| 📋 Planned | 0 |
| **Total** | 1 |

---

## ✅ Completed Patterns

### ✅ PDR 007 Two Tier Spec Architecture

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 2h |
| Quarter | Q1-2026 |

#### Acceptance Criteria

**Roadmap spec structure**

- Given a pattern requiring implementation
- When creating the roadmap spec
- Then it should be in delivery-process/specs/{product-area}/
- And it should have libar-docs-pattern tag
- And it should have Background with deliverables table
- And it should have high-level Rule blocks (not granular scenarios)
- And it should NOT have step definitions

**Package spec structure**

- Given implemented functionality in a package
- When creating executable specs
- Then they should be in packages/libar-dev/{package}/tests/features/
- And they should have libar-docs-pattern tag linking to roadmap
- And they should have step definitions
- And they should cover edge cases and error scenarios
- And they should run via vitest-cucumber

**Linking roadmap to package specs**

- Given a completed roadmap spec "DeciderPattern"
- And package specs exist at platform-decider/tests/features/
- When adding traceability
- Then roadmap spec should have libar-docs-executable-specs tag
- And deliverables table should include "Executable Spec" column
- And package spec should have libar-docs-roadmap-spec:DeciderPattern

**Completed pattern roadmap spec**

- Given roadmap spec with libar-docs-status:completed
- Then detailed scenarios should NOT be in roadmap spec
- And high-level Rule descriptions should remain
- And deliverables table should have all items "complete"
- And libar-docs-executable-specs should point to package tests

**Active pattern with acceptance criteria**

- Given roadmap spec with libar-docs-status:active
- When defining acceptance criteria
- Then high-level scenarios can exist in roadmap spec
- And they guide implementation (not executable)
- And they are replaced with links when complete

#### Business Rules

**Context - Conflated specs created duplication and confusion**

We have two distinct needs for feature files:
    1. Planning and Tracking - What to build, progress, deliverables
    2. Implementation Proof - How it works, unit tests, edge cases

    Initially, both were conflated into single feature files. This led to:
    - Duplication between roadmap specs and package tests
    - Unclear ownership of scenarios
    - Confusion about what is executable vs documentation

**Decision - Two-tier architecture with metadata-based traceability**

Establish a two-tier architecture with clear separation:

    | Tier | Location | Purpose | Executable |
    |------|----------|---------|------------|
    | Roadmap | delivery-process/specs/ | Planning, tracking, deliverables | No |
    | Package | packages/*/tests/features/ | Implementation tests | Yes |

    Traceability via Metadata:

    Instead of duplicating scenarios, use libar-docs-* tags for linking:

    | Spec Type | Tag | Purpose |
    |-----------|-----|---------|
    | Roadmap | libar-docs-executable-specs:path | Points to package tests |
    | Package | libar-docs-roadmap-spec:PatternName | Links back to roadmap |

    Architecture Rules:

    1. Roadmap specs are planning documents, not executable tests
       - Located in delivery-process/specs/{product-area}/
       - Contains deliverables tables and high-level acceptance criteria
       - Has libar-docs-pattern tag for tracking
       - Has high-level Rule blocks (not granular scenarios)
       - Does NOT have step definitions

    2. Package specs are executable implementation tests
       - Located in packages/libar-dev/{package}/tests/features/
       - Has libar-docs-pattern tag linking to roadmap
       - Has step definitions that run via vitest-cucumber
       - Covers edge cases and error scenarios

    3. Traceability is metadata-based, not duplication-based
       - Cross-references via tags eliminate scenario duplication
       - Deliverables table links to specific executable spec files

    4. Completed roadmap specs become minimal tracking records
       - Detailed behavior lives in package specs
       - Roadmap spec becomes lightweight record with links
       - Deliverables table shows all items complete
       - libar-docs-executable-specs points to package tests

    5. Active roadmap specs may have placeholder scenarios
       - During implementation, acceptance criteria guide development
       - These are replaced with links when complete

_Verified by: Roadmap spec structure, Package spec structure, Linking roadmap to package specs, Completed pattern roadmap spec, Active pattern with acceptance criteria_

**Consequences - Trade-offs of two-tier architecture**

Positive outcomes:
    - No duplication, clear ownership, metadata-based traceability
    - Roadmap specs stay lightweight (planning documents)
    - Package specs are authoritative for behavior

    Negative outcomes:
    - Requires discipline to maintain tag relationships
    - Two places to look (mitigated by cross-references)

---

[← Back to Roadmap](../ROADMAP.md)
