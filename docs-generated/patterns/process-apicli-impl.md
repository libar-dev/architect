# 🚧 Process API CLI Impl

**Purpose:** Detailed documentation for the Process API CLI Impl pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Exposes ProcessStateAPI methods as CLI subcommands with JSON output.
Runs pipeline steps 1-8 (config → scan → extract → transform),
then routes subcommands to API methods.

### When to Use

- When Claude Code needs real-time delivery state queries
- When AI agents need structured JSON instead of regenerating markdown
- When scripting delivery process queries in CI/CD

### Key Concepts

- **Subcommand Routing**: CLI subcommands map to ProcessStateAPI methods
- **JSON Output**: All output is JSON to stdout, errors to stderr
- **Pipeline Reuse**: Steps 1-8 match generate-docs exactly

## Use Cases

- When querying delivery process state from CLI
- When Claude Code needs real-time delivery state queries

---

[← Back to Pattern Registry](../PATTERNS.md)
