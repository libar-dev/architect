# 📋 ScopeValidator — Pre-flight Session Readiness Checker

**Purpose:** Detailed documentation for the ScopeValidator — Pre-flight Session Readiness Checker pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

Pure function composition over ProcessStateAPI and MasterDataset.
Runs a checklist of prerequisite validations before starting a
design or implementation session.

### Algorithm

1. Resolve the focal pattern via api.getPattern(name) — error if not found
2. Select check functions based on scopeType:
   - implement: dependencies, deliverables, FSM, PDR refs, executable specs
   - design: stubs-from-deps
3. Execute each check function (pure, no I/O) → ValidationCheck
4. Aggregate: count BLOCKEDs and WARNs → determine verdict
5. Return ScopeValidationResult

### Check Composition

Each check is an independent pure function returning ValidationCheck.
This enables:
- Individual unit testing per check
- Easy addition of new checks without modifying existing ones
- Selective check execution per scope type

### Reused Building Blocks

- api.getPatternDependencies(name) — dependency status check
- api.getPatternDeliverables(name) — deliverable existence check
- api.isValidTransition(from, to) / api.checkTransition(from, to) — FSM check
- findStubPatterns(dataset) + extractDecisionItems() from stub-resolver.ts — PDR check
- resolveStubs(stubs, baseDir) from stub-resolver.ts — stub existence check

### Severity Model (PDR-002 DD-4)

| Severity | Meaning | Blocks Session |
|----------|---------|----------------|
| PASS | Check passed | No |
| BLOCKED | Hard prerequisite missing | Yes |
| WARN | Recommendation not met | No (unless --strict) |

See: PDR-002 (DD-1 through DD-7), DataAPIDesignSessionSupport spec Rule 1

---

[← Back to Pattern Registry](../PATTERNS.md)
