# ✅ Anti Pattern Detector

**Purpose:** Detailed documentation for the Anti Pattern Detector pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Validation |

## Description

Detects violations of the dual-source documentation architecture and
process hygiene issues that lead to documentation drift.

### Anti-Patterns Detected

| ID | Severity | Description |
|----|----------|-------------|
| tag-duplication | error | Dependencies in features (should be code-only) |
| process-in-code | error | Process metadata in code (should be features-only) |
| magic-comments | warning | Generator hints in features |
| scenario-bloat | warning | Too many scenarios per feature |
| mega-feature | warning | Feature file too large |

### When to Use

- Pre-commit validation to catch architecture violations early
- CI pipeline to enforce documentation standards
- Code review checklists for documentation quality

---

[← Back to Pattern Registry](../PATTERNS.md)
