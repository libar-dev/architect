# ✅ Output Schemas

**Purpose:** Detailed documentation for the Output Schemas pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## OutputSchemas - JSON Output Format Schemas

Zod schemas for JSON output formats used by CLI tools.
These schemas document the contract for JSON consumers (CI tools, IDE integrations)
and provide pre-serialization validation for type safety.

### When to Use

- Use with createJsonOutputCodec() for type-safe JSON serialization
- Reference as documentation for tooling that consumes CLI JSON output

### Key Concepts

- **Output Schemas**: Define the shape of JSON output for external consumers
- **Codec Pattern**: Validate before serialize, not just after parse

## Use Cases

- When serializing lint results to JSON
- When serializing validation results to JSON
- When writing registry metadata to JSON

---

[← Back to Pattern Registry](../PATTERNS.md)
