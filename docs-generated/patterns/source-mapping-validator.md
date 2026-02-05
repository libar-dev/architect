# ✅ Source Mapping Validator

**Purpose:** Detailed documentation for the Source Mapping Validator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |
| Phase | 28 |

## Description

Performs pre-flight checks on source mapping tables before extraction begins.
Validates file existence, extraction method validity, and format correctness
to fail fast with clear errors rather than producing incomplete output.

### When to Use

- Before document generation from source mappings
- When validating decision document source tables
- When checking extraction method compatibility

### Validation Checks

1. **File existence**: Source files must exist and be files (not directories)
2. **Method validity**: Extraction methods must be recognized
3. **Compatibility**: Extraction methods must match file types
4. **Table format**: Required columns must be present

---

[← Back to Pattern Registry](../PATTERNS.md)
