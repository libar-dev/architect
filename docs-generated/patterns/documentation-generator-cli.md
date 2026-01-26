# ✅ Documentation Generator CLI

**Purpose:** Detailed documentation for the Documentation Generator CLI pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## generate-docs - Single Entry Point for All Documentation Generation

Replaces multiple specialized CLIs with one unified interface that supports
multiple generators in a single run.

### When to Use

- Generating any documentation from annotated TypeScript source
- Running multiple generators in one command
- Using JSON config files for reproducible builds
- Using predefined artefact sets (--artefact-set minimal, --artefact-set full)

### Key Concepts

- **Multi-Generator**: Run patterns, adrs, overview, custom generators together
- **Config Files**: JSON configuration for complex setups
- **Explicit Registration**: Generators must be registered before use
- **Artefact Sets**: Predefined generator groupings for common use cases

## Use Cases

- When generating documentation from command line
- When integrating doc generation into npm scripts
- When using JSON config files for reproducible builds
- When using predefined artefact sets for quick setup

---

[← Back to Pattern Registry](../PATTERNS.md)
