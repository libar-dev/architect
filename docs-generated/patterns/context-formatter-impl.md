# 🚧 Context Formatter Impl

**Purpose:** Detailed documentation for the Context Formatter Impl pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Pattern |

## Description

First plain-text formatter in the codebase. All other rendering goes
through the Codec/RenderableDocument/UniversalRenderer markdown pipeline.
Context bundles are rendered as compact structured text with === section
markers for easy AI parsing (see ADR-008).

---

[← Back to Pattern Registry](../PATTERNS.md)
