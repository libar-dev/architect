# ✅ Source Merging

**Purpose:** Detailed requirements for the Source Merging feature

---

## Overview

| Property     | Value         |
| ------------ | ------------- |
| Status       | completed     |
| Product Area | Configuration |

## Description

mergeSourcesForGenerator computes effective sources for a specific
generator by applying per-generator overrides to base resolved sources.

**Problem:**

- Different generators may need different feature or input sources
- Override semantics must be predictable and well-defined
- Base exclude patterns must always be inherited

**Solution:**

- replaceFeatures (non-empty) replaces base features entirely
- additionalFeatures appends to base features
- additionalInput appends to base typescript sources
- exclude is always inherited from base (no override mechanism)

## Acceptance Criteria

**No override returns base sources**

- Given base sources with one typescript and one features glob
- And no overrides defined
- When merging sources for the patterns generator
- Then merged sources should equal base sources

**additionalFeatures appended to base features**

- Given base sources with one typescript and one features glob
- And an override for changelog with additionalFeatures
- When merging sources for the changelog generator
- Then merged features should have 2 entries

**replaceFeatures replaces base features entirely**

- Given base sources with one typescript and one features glob
- And an override for changelog with replaceFeatures
- When merging sources for the changelog generator
- Then merged features should have 1 entry from the override

**Empty replaceFeatures does NOT replace**

- Given base sources with one typescript and one features glob
- And an override for changelog with empty replaceFeatures and additionalFeatures
- When merging sources for the changelog generator
- Then merged features should have 2 entries

**additionalInput appended to typescript sources**

- Given base sources with one typescript and one features glob
- And an override for patterns with additionalInput
- When merging sources for the patterns generator
- Then merged typescript should have 2 entries

**additionalFeatures and additionalInput combined**

- Given base sources with one typescript and one features glob
- And an override for changelog with additionalFeatures and additionalInput
- When merging sources for the changelog generator
- Then merged features should have 2 entries
- And merged typescript should have 2 entries

**Exclude always inherited**

- Given base sources with one typescript and one features glob and an exclude pattern
- And an override for patterns with additionalInput
- When merging sources for the patterns generator
- Then merged exclude should equal the base exclude

## Business Rules

**No override returns base unchanged**

_Verified by: No override returns base sources_

**Feature overrides control feature source selection**

_Verified by: additionalFeatures appended to base features, replaceFeatures replaces base features entirely, Empty replaceFeatures does NOT replace_

**TypeScript source overrides append additional input**

_Verified by: additionalInput appended to typescript sources_

**Combined overrides apply together**

_Verified by: additionalFeatures and additionalInput combined_

**Exclude is always inherited from base**

_Verified by: Exclude always inherited_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
