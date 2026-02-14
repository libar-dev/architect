# 🚧 Pattern Helpers Tests

**Purpose:** Detailed documentation for the Pattern Helpers Tests pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | DDD |
| Phase | 25 |

## Acceptance Criteria

**Returns patternName when set**

- Given a pattern with name "FooImpl" and patternName "Foo"
- When I get the pattern name
- Then the result is "Foo"

**Falls back to name when patternName is absent**

- Given a pattern with name "BarImpl" and no patternName
- When I get the pattern name
- Then the result is "BarImpl"

**Exact case match**

- Given patterns "Alpha" and "Beta"
- When I find pattern by name "Alpha"
- Then the found pattern name is "Alpha"

**Case-insensitive match**

- Given patterns "Alpha" and "Beta"
- When I find pattern by name "alpha"
- Then the found pattern name is "Alpha"

**No match returns undefined**

- Given patterns "Alpha" and "Beta"
- When I find pattern by name "Gamma"
- Then no pattern is found

**Exact key match in relationship index**

- Given a dataset with relationship entry for "OrderSaga"
- When I get relationships for "OrderSaga"
- Then relationships are found

**Case-insensitive fallback match**

- Given a dataset with relationship entry for "OrderSaga"
- When I get relationships for "ordersaga"
- Then relationships are found

**Missing relationship index returns undefined**

- Given a dataset without relationship index
- When I get relationships for "OrderSaga"
- Then no relationships are found

**Suggests close match**

- Given candidate names "AgentCommandInfra" and "EventStore"
- When I suggest a pattern for "AgentCommand"
- Then the suggestion contains "AgentCommandInfra"

**No close match returns empty**

- Given candidate names "AgentCommandInfra" and "EventStore"
- When I suggest a pattern for "zzNonexistent"
- Then the suggestion is empty

## Business Rules

**getPatternName uses patternName tag when available**

_Verified by: Returns patternName when set, Falls back to name when patternName is absent_

**findPatternByName performs case-insensitive matching**

_Verified by: Exact case match, Case-insensitive match, No match returns undefined_

**getRelationships looks up with case-insensitive fallback**

_Verified by: Exact key match in relationship index, Case-insensitive fallback match, Missing relationship index returns undefined_

**suggestPattern provides fuzzy suggestions**

_Verified by: Suggests close match, No close match returns empty_

---

[← Back to Pattern Registry](../PATTERNS.md)
