# ✅ Artefact Set Schema

**Purpose:** Detailed documentation for the Artefact Set Schema pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Validation |

## Description

## ArtefactSetSchema - Predefined Generator Groupings

Defines the schema for artefact sets - predefined groupings of generators
that match common use cases. Enables quick setup without manual generator selection.

### When to Use

- Use when defining a new artefact set (full, minimal, planning, etc.)
- Use when validating artefact set JSON files from catalogue
- Use when loading artefact sets in the CLI

### Key Concepts

- **Artefact Set**: Named collection of generators to run together
- **Generators Array**: List of generator names (must be registered)
- **Metadata**: Optional author, lastUpdated, and tags for organization

## Use Cases

- When validating artefact set configurations
- When loading predefined generator groupings

---

[← Back to Pattern Registry](../PATTERNS.md)
