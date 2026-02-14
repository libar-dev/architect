# ✅ Codec Based Generator

**Purpose:** Detailed documentation for the Codec Based Generator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Adapts the new RenderableDocument Model (RDM) codec system to the
existing DocumentGenerator interface. This allows codec-based document
generation to work seamlessly with the existing orchestrator.

### When to Use

- When creating a new document type generator using the RDM codec pattern
- When adapting a Zod codec to the DocumentGenerator interface
- When understanding how codec-based generation integrates with the orchestrator

Architecture:
```
GeneratorContext.masterDataset → Codec.decode() → RenderableDocument → renderDocumentWithFiles() → OutputFile[]
```

## Implementations

Files that implement this pattern:

- [`codec-based.feature`](../../tests/features/generators/codec-based.feature) - Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)

---

[← Back to Pattern Registry](../PATTERNS.md)
