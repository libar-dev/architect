# 🚧 Fuzzy Match Tests

**Purpose:** Detailed documentation for the Fuzzy Match Tests pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | DDD |

## Description

Validates tiered fuzzy matching: exact > prefix > substring > Levenshtein.

## Acceptance Criteria

**Exact match scores 1.0**

- Given pattern names "OrderSaga", "EventStore", "ProcessGuard"
- When I fuzzy match "OrderSaga"
- Then the top result is "OrderSaga" with score "1.0" and matchType "exact"

**Exact match is case-insensitive**

- Given pattern names "OrderSaga", "EventStore"
- When I fuzzy match "ordersaga"
- Then the top result is "OrderSaga" with score "1.0" and matchType "exact"

**Prefix match scores 0.9**

- Given pattern names "AgentCommandInfrastructure", "EventStore"
- When I fuzzy match "AgentCommand"
- Then the top result is "AgentCommandInfrastructure" with score "0.9" and matchType "prefix"

**Substring match scores 0.7**

- Given pattern names "AgentCommandInfrastructure", "EventStore"
- When I fuzzy match "Command"
- Then the top result is "AgentCommandInfrastructure" with score "0.7" and matchType "substring"

**Levenshtein match for close typos**

- Given pattern names "OrderSaga", "EventStore"
- When I fuzzy match "OrdrSaga"
- Then the top result is "OrderSaga" with matchType "fuzzy"
- And the top result score is above "0.3"

**Results are sorted by score descending**

- Given pattern names "Command", "AgentCommandInfrastructure", "CommandHandler"
- When I fuzzy match "Command"
- Then the first result has score "1.0"
- And the second result has score at least "0.7"

**Empty query matches all patterns as prefix**

- Given pattern names "OrderSaga", "EventStore"
- When I fuzzy match with query ""
- Then all 2 patterns are returned with matchType "prefix"

**No candidate patterns returns no results**

- Given no pattern names exist
- When I fuzzy match with query "OrderSaga"
- Then no matches are returned

**Best match returns suggestion above threshold**

- Given pattern names "OrderSaga", "EventStore", "ProcessGuard"
- When I find the best match for "OrderSag"
- Then the suggestion is "OrderSaga"

**No match returns undefined when below threshold**

- Given pattern names "OrderSaga", "EventStore"
- When I find the best match for "zzCompletelyDifferent"
- Then no suggestion is returned

**Identical strings have distance 0**

- Given strings "hello" and "hello"
- When I compute the Levenshtein distance
- Then the distance is 0

**Single character difference**

- Given strings "kitten" and "sitten"
- When I compute the Levenshtein distance
- Then the distance is 1

## Business Rules

**Fuzzy matching uses tiered scoring**

_Verified by: Exact match scores 1.0, Exact match is case-insensitive, Prefix match scores 0.9, Substring match scores 0.7, Levenshtein match for close typos, Results are sorted by score descending, Empty query matches all patterns as prefix, No candidate patterns returns no results_

**findBestMatch returns single suggestion**

_Verified by: Best match returns suggestion above threshold, No match returns undefined when below threshold_

**Levenshtein distance computation**

_Verified by: Identical strings have distance 0, Single character difference_

---

[← Back to Pattern Registry](../PATTERNS.md)
