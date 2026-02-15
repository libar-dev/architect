# CoreTypes Business Rules

**Purpose:** Business rules for the CoreTypes product area

---

**4 rules** from 1 features. 0 rules have explicit invariants.

---

## Phase 44

### Kebab Case Slugs

*As a documentation generator*

#### CamelCase names convert to kebab-case

_Verified by: Convert pattern names to readable slugs_

#### Edge cases are handled correctly

_Verified by: Handle edge cases in slug generation_

#### Requirements include phase prefix

_Verified by: Requirement slugs include phase number, Requirement without phase uses phase 00_

#### Phase slugs use kebab-case for names

_Verified by: Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"_

*kebab-case-slugs.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
