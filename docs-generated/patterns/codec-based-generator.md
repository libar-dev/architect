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

Architecture:
```
GeneratorContext.masterDataset → Codec.decode() → RenderableDocument → renderDocumentWithFiles() → OutputFile[]
```

---

[← Back to Pattern Registry](../PATTERNS.md)
