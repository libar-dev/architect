# 📋 Kebab Case Slugs

**Purpose:** Detailed requirements for the Kebab Case Slugs feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | planned   |
| Product Area | CoreTypes |
| Phase        | 44        |

## Description

As a documentation generator
I need to generate readable, URL-safe slugs from pattern names
So that generated file names are discoverable and human-friendly

The slug generation must handle:

- CamelCase patterns like "DeciderPattern" → "decider-pattern"
- Consecutive uppercase like "APIEndpoint" → "api-endpoint"
- Numbers in names like "OAuth2Flow" → "o-auth-2-flow"
- Special characters removal
- Proper phase prefixing for requirements

## Acceptance Criteria

**Convert pattern names to readable slugs**

- Given pattern name "<input>"
- When converting to kebab-case slug
- Then the slug is "<expected>"

**Handle edge cases in slug generation**

- Given pattern name "<input>"
- When converting to kebab-case slug
- Then the slug is "<expected>"

**Requirement slugs include phase number**

- Given pattern "<pattern>" with phase "<phase>"
- When generating requirement slug
- Then the slug is "<expected>"

**Requirement without phase uses phase 00**

- Given pattern "SomeUnassigned" without a phase
- When generating requirement slug
- Then the slug is "phase-00-some-unassigned"

**Phase slugs combine number and kebab-case name**

- Given phase number "<number>" with name "<name>"
- When generating phase slug
- Then the slug is "<expected>"

**Phase without name uses "unnamed"**

- Given phase number "5" without a name
- When generating phase slug
- Then the slug is "phase-05-unnamed"

## Business Rules

**CamelCase names convert to kebab-case**

**Invariant:** CamelCase pattern names must be split at word boundaries and joined with hyphens in lowercase.
**Verified by:** Convert pattern names to readable slugs

_Verified by: Convert pattern names to readable slugs_

**Edge cases are handled correctly**

**Invariant:** Slug generation must handle special characters, consecutive separators, and leading/trailing hyphens without producing invalid slugs.
**Verified by:** Handle edge cases in slug generation

_Verified by: Handle edge cases in slug generation_

**Requirements include phase prefix**

**Invariant:** Requirement slugs must be prefixed with "phase-NN-" where NN is the zero-padded phase number, defaulting to "00" when no phase is assigned.
**Verified by:** Requirement slugs include phase number, Requirement without phase uses phase 00

_Verified by: Requirement slugs include phase number, Requirement without phase uses phase 00_

**Phase slugs use kebab-case for names**

**Invariant:** Phase slugs must combine a zero-padded phase number with the kebab-case name in the format "phase-NN-name", defaulting to "unnamed" when no name is provided.
**Verified by:** Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"

_Verified by: Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
