# ✅ Generator Types

**Purpose:** Detailed documentation for the Generator Types pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Generator |

## Description

## GeneratorTypes - Pluggable Document Generation Interface

Minimal interface for pluggable generators that produce documentation from patterns.
Both JSON-configured built-in generators and TypeScript custom generators implement this.

### When to Use

- Creating a new document format (ADRs, planning docs, API specs)
- Building custom generators in TypeScript
- Integrating with the unified CLI

### Key Concepts

- **Generator:** Transforms patterns → document files
- **Context:** Runtime environment (base paths, registries, scenarios)
- **Output:** Map of file paths → content

---

[← Back to Pattern Registry](../PATTERNS.md)
