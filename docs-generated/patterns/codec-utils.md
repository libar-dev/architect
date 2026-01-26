# ✅ Codec Utils

**Purpose:** Detailed documentation for the Codec Utils pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## CodecUtils - Type-Safe JSON Codec Factories

Provides factory functions for creating type-safe JSON parsing and serialization
pipelines using Zod schemas. Replaces manual JSON.parse/stringify with single-step
validated operations.

### When to Use

- Use when loading JSON configuration files
- Use when writing JSON output files with schema validation
- Use when you want better error messages with file path context

### Key Concepts

- **Input Codec**: Parses JSON string → validates → returns typed object
- **Output Codec**: Validates object → serializes → returns formatted JSON string
- **Error Context**: Adds file path and validation details to error messages

## Use Cases

- When loading JSON config files with type-safe validation
- When serializing typed objects to formatted JSON

---

[← Back to Pattern Registry](../PATTERNS.md)
