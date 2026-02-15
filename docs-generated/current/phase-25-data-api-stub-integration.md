# DataAPIStubIntegration

**Purpose:** Active work details for DataAPIStubIntegration

---

## Progress

**Progress:** [██████████░░░░░░░░░░] 5/10 (50%)

| Status | Count |
| --- | --- |
| ✅ Completed | 5 |
| 🚧 Active | 1 |
| 📋 Planned | 4 |
| **Total** | 10 |

---

## 🚧 Active Work

### 🚧 Pattern Helpers Tests

#### Acceptance Criteria

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

#### Business Rules

**getPatternName uses patternName tag when available**

**Invariant:** getPatternName must return the patternName tag value when set, falling back to the pattern's name field when the tag is absent.
    **Rationale:** The patternName tag allows human-friendly display names — without the fallback, patterns missing the tag would display as undefined.
    **Verified by:** Returns patternName when set, Falls back to name when patternName is absent

_Verified by: Returns patternName when set, Falls back to name when patternName is absent_

**findPatternByName performs case-insensitive matching**

**Invariant:** findPatternByName must match pattern names case-insensitively, returning undefined when no match exists.
    **Rationale:** Case-insensitive matching prevents frustrating "not found" errors when developers type "processguard" instead of "ProcessGuard" — both clearly refer to the same pattern.
    **Verified by:** Exact case match, Case-insensitive match, No match returns undefined

_Verified by: Exact case match, Case-insensitive match, No match returns undefined_

**getRelationships looks up with case-insensitive fallback**

**Invariant:** getRelationships must first try exact key lookup in the relationship index, then fall back to case-insensitive matching, returning undefined when no match exists.
    **Rationale:** Exact-first with case-insensitive fallback balances performance (O(1) exact lookup) with usability (tolerates case mismatches in cross-references).
    **Verified by:** Exact key match in relationship index, Case-insensitive fallback match, Missing relationship index returns undefined

_Verified by: Exact key match in relationship index, Case-insensitive fallback match, Missing relationship index returns undefined_

**suggestPattern provides fuzzy suggestions**

**Invariant:** suggestPattern must return fuzzy match suggestions for close pattern names, returning empty results when no close match exists.
    **Rationale:** Fuzzy suggestions power "did you mean?" UX in the CLI — without them, typos produce unhelpful "pattern not found" messages.
    **Verified by:** Suggests close match, No close match returns empty

_Verified by: Suggests close match, No close match returns empty_

---

## ✅ Recently Completed

| Pattern | Description |
| --- | --- |
| ✅ Data API Architecture Queries | The current `arch` subcommand provides basic queries (roles, context, layer, graph) but lacks deeper analysis needed... |
| ✅ Data API Context Assembly | Starting a Claude Code design or implementation session requires assembling 30-100KB of curated, multi-source context... |
| ✅ Data API Design Session Support | Starting a design or implementation session requires manually compiling elaborate context prompts. |
| ✅ Data API Output Shaping | The ProcessStateAPI CLI returns raw `ExtractedPattern` objects via `JSON.stringify`. |
| ✅ Data API Stub Integration | Design sessions produce code stubs in `delivery-process/stubs/` with rich metadata: `@target` (destination file... |

---

<details>
<summary>📋 Upcoming (4)</summary>

| Pattern | Effort |
| --- | --- |
| 📋 Claude Module Generation | 1.5d |
| 📋 Data API CLI Ergonomics | 2d |
| 📋 Data API Platform Integration | 3d |
| 📋 Data API Relationship Graph | 2d |

</details>

---

[← Back to Current Work](../CURRENT-WORK.md)
