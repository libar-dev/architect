# ✅ Documentation Generation Orchestrator

**Purpose:** Detailed documentation for the Documentation Generation Orchestrator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## Documentation Generation Orchestrator - Full Pipeline Coordination

Orchestrates the complete documentation generation pipeline:
Scanner → Extractor → Generators → File Writer

Extracts business logic from CLI for programmatic use and testing.

### When to Use

- Running complete documentation generation programmatically
- Integrating doc generation into build scripts
- Testing the full pipeline without CLI overhead

### Key Concepts

- **Dual-Source Merging**: Combines TypeScript and Gherkin patterns
- **Generator Registry**: Looks up registered generators by name
- **Result Monad**: Returns detailed errors for partial failures

## Use Cases

- When running full documentation generation pipeline
- When merging TypeScript and Gherkin patterns

---

[← Back to Pattern Registry](../PATTERNS.md)
