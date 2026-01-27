# ✅ Documentation Generator CLI

**Purpose:** Detailed documentation for the Documentation Generator CLI pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Replaces multiple specialized CLIs with one unified interface that supports
multiple generators in a single run.

### When to Use

- Generating any documentation from annotated TypeScript source
- Running multiple generators in one command
- Using delivery-process.config.ts for reproducible builds

### Key Concepts

- **Multi-Generator**: Run patterns, adrs, overview, custom generators together
- **Explicit Registration**: Generators must be registered before use

## Use Cases

- When generating documentation from command line
- When integrating doc generation into npm scripts

---

[← Back to Pattern Registry](../PATTERNS.md)
