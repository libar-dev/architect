# ✅ Content Deduplicator

**Purpose:** Detailed documentation for the Content Deduplicator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |
| Phase | 28 |

## Description

Identifies and merges duplicate sections extracted from multiple sources.
Uses content fingerprinting to detect duplicates and merges them based on
configurable priority rules.

### When to Use

- After source mapping extracts content from multiple files
- When multiple sources may contain the same documentation
- Before assembling the final RenderableDocument

### Key Concepts

- **Content Fingerprint**: SHA-256 hash of normalized text for duplicate detection
- **Source Priority**: TypeScript > Decision > Feature file
- **Content Richness**: More lines wins when priorities are equal
- **Header Disambiguation**: Adds source suffix when headers conflict

---

[← Back to Pattern Registry](../PATTERNS.md)
