# ✅ Artefact Set Loader

**Purpose:** Detailed documentation for the Artefact Set Loader pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Config |

## Description

## ArtefactSetLoader - Load Predefined Generator Groupings

Loads and validates artefact set configurations from the catalogue directory.
Supports loading by name and listing all available sets.

### When to Use

- Use when implementing --artefact-set CLI option
- Use when listing available artefact sets for user discovery
- Use when programmatically selecting generator groups

### Key Concepts

- **Catalogue Location**: catalogue/artefact-sets/ in the package root
- **Naming Convention**: {name}.json (e.g., full-set.json, minimal-set.json)
- **Result Monad**: Returns Result<T, Error> for explicit error handling

## Use Cases

- When loading predefined artefact sets from catalogue
- When listing available artefact sets for CLI help

---

[← Back to Pattern Registry](../PATTERNS.md)
