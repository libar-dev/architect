# 📋 ContextAssembler — Session-Oriented Context Bundle Builder

**Purpose:** Detailed documentation for the ContextAssembler — Session-Oriented Context Bundle Builder pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

Pure function composition over MasterDataset. Reads from 5 pre-computed
views (patterns, relationshipIndex, archIndex, deliverables, FSM) and
assembles them into a ContextBundle tailored to the session type.

The assembler does NOT format output. It produces structured data that
the ContextFormatter renders as plain text (see ADR-008).

### Assembly Algorithm

1. Resolve focal pattern(s) via getPattern()
2. For each pattern: resolve spec file, stubs, deps, consumers, arch neighbors
3. Merge multi-pattern results with dedup (union-then-tag for shared deps)
4. Populate/omit sections based on SessionType

### Session Type Inclusion Matrix

| Section | planning | design | implement |
|---------|----------|--------|-----------|
| Metadata | yes | yes | yes |
| Spec path | no | yes | yes |
| Stubs | no | yes | no |
| Dependencies | name+status | full | name+status |
| Consumers | no | yes | no |
| Architecture | no | yes | no |
| Deliverables | no | no | yes |
| FSM state | no | no | yes |
| Test files | no | no | yes |

Target: src/api/context-assembler.ts
See: DataAPIContextAssembly spec, Rules 1-5
Since: DS-C

---

[← Back to Pattern Registry](../PATTERNS.md)
