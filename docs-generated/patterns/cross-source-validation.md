# 📋 Cross Source Validation

**Purpose:** Detailed documentation for the Cross Source Validation pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |
| Phase | 100 |

## Description

**Problem:**
  The delivery process uses dual sources (TypeScript phase files and Gherkin
  feature files) that must remain consistent. Currently there's no validation
  to detect:
  - Pattern name mismatches
  - Missing spec file references
  - Circular dependency chains
  - Orphaned deliverables (not linked to any phase)

  **Solution:**
  Implement cross-source validation that scans both source types and
  detects inconsistencies, broken references, and logical errors.

## Acceptance Criteria

**Pattern name mismatch detected**

- Given TypeScript phase file with @libar-docs-pattern MyPattern
- And feature file with @libar-docs-pattern:MyPatern (typo)
- When validating pattern names
- Then warning suggests "Did you mean MyPattern? Found MyPatern"

**Pattern names match across sources**

- Given TypeScript phase file with @libar-docs-pattern SessionHandoffs
- And feature file with @libar-docs-pattern:SessionHandoffs
- When validating pattern names
- Then validation passes

**Direct circular dependency**

- Given Phase A with @depends-on:PhaseB
- And Phase B with @depends-on:PhaseA
- When validating dependencies
- Then error indicates "Circular dependency: PhaseA -> PhaseB -> PhaseA"

**Transitive circular dependency**

- Given Phase A with @depends-on:PhaseB
- And Phase B with @depends-on:PhaseC
- And Phase C with @depends-on:PhaseA
- When validating dependencies
- Then error indicates "Circular dependency: PhaseA -> PhaseB -> PhaseC -> PhaseA"

**Dependency references non-existent pattern**

- Given Phase A with @depends-on:NonExistentPattern
- When validating dependencies
- Then error indicates "Unresolved dependency: NonExistentPattern"
- And similar pattern names are suggested if available

**All dependencies resolve**

- Given Phase A with @depends-on:PhaseB
- And PhaseB exists
- When validating dependencies
- Then validation passes

## Business Rules

**Pattern names must be consistent across sources**

_Verified by: Pattern name mismatch detected, Pattern names match across sources_

**Circular dependencies are detected**

_Verified by: Direct circular dependency, Transitive circular dependency_

**Dependency references must resolve**

_Verified by: Dependency references non-existent pattern, All dependencies resolve_

---

[← Back to Pattern Registry](../PATTERNS.md)
