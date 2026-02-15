# ✅ Session Codec Testing

**Purpose:** Detailed documentation for the Session Codec Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

The session codecs (SessionContextCodec, RemainingWorkCodec)
  transform MasterDataset into RenderableDocuments for AI session context
  and incomplete work aggregation views.

  **Problem:**
  - Need to generate session context and remaining work documents from patterns
  - Each view requires different filtering, grouping, and prioritization logic

  **Solution:**
  - Two specialized codecs for session planning perspectives
  - SessionContextCodec focuses on current work and phase navigation
  - RemainingWorkCodec aggregates incomplete work with priority sorting

## Acceptance Criteria

**Decode empty dataset produces minimal session context**

- Given an empty MasterDataset
- When decoding with SessionContextCodec
- Then the document title is "Session Context"
- And the document has a purpose
- And the session status shows 0 active patterns

**Decode dataset with timeline patterns**

- Given a MasterDataset with timeline patterns
- When decoding with SessionContextCodec
- Then the document title is "Session Context"
- And the document contains sections:

| heading |
| --- |
| Session Status |
| Active Work |

**Session status shows current focus**

- Given a MasterDataset with status distribution:
- When decoding with SessionContextCodec
- Then the session status section shows:
- And the session status shows current focus

| status | count |
| --- | --- |
| completed | 3 |
| active | 2 |
| planned | 5 |

| metric | value |
| --- | --- |
| Active Patterns | 2 |
| Completed | 3 |
| Remaining | 7 |

**Phase navigation for incomplete phases**

- Given a MasterDataset with timeline patterns
- When decoding with SessionContextCodec
- Then the document contains a "Phase Navigation" section
- And the phase navigation table has columns:
- And the phase navigation shows only incomplete phases

| column |
| --- |
| Phase |
| Remaining |
| Complete |

**Active work grouped by phase**

- Given a MasterDataset with timeline patterns
- When decoding with SessionContextCodec
- Then the document contains an "Active Work" section
- And the active work shows patterns grouped by phase

**Blocked items section with dependencies**

- Given a MasterDataset with blocked patterns
- When decoding with includeDependencies enabled for session
- Then the document contains a "Blocked Items" section
- And the blocked items table shows pattern and blocker

**No blocked items section when disabled**

- Given a MasterDataset with blocked patterns
- When decoding with includeDependencies disabled for session
- Then the document does not contain "Blocked Items"

**Recent completions collapsible**

- Given a MasterDataset with timeline patterns
- When decoding with SessionContextCodec
- Then the document contains a collapsible "Recent Completions"
- And the recent completions shows completed patterns

**Generate session phase detail files when enabled**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles enabled for session
- Then the document has session detail files:

| path |
| --- |
| sessions/phase-03-event-store-enhancement.md |
| sessions/phase-04-advanced-projections.md |

**No detail files when disabled**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles disabled for session
- Then the document has no additional files

**All work complete produces celebration message**

- Given a MasterDataset with only completed patterns
- When decoding with RemainingWorkCodec
- Then the document title is "Remaining Work"
- And the document contains "All Work Complete"

**Summary shows remaining counts**

- Given a MasterDataset with status distribution:
- When decoding with RemainingWorkCodec
- Then the document title is "Remaining Work"
- And the summary table shows:

| status | count |
| --- | --- |
| completed | 3 |
| active | 2 |
| planned | 5 |

| status | count |
| --- | --- |
| Active | 2 |
| Planned | 5 |
| Total Remaining | 7 |

**Phase navigation with remaining count**

- Given a MasterDataset with timeline patterns
- When decoding with RemainingWorkCodec
- Then the document contains a "By Phase" section
- And the by phase table has columns:

| column |
| --- |
| Phase |
| Remaining |
| Active |
| Complete |

**By priority shows ready vs blocked**

- Given a MasterDataset with blocked patterns
- When decoding with RemainingWorkCodec
- Then the document contains a "By Priority" section
- And the by priority table shows:

| priority | present |
| --- | --- |
| In Progress | yes |
| Ready to Start | yes |
| Blocked | yes |

**Next actionable items section**

- Given a MasterDataset with actionable patterns
- When decoding with RemainingWorkCodec
- Then the document contains a "Next Actionable Items" section
- And the next actionable items are not blocked

**Next actionable respects maxNextActionable limit**

- Given a MasterDataset with many planned patterns
- When decoding with maxNextActionable set to 3
- Then the next actionable items shows at most 3 items

**Sort by phase option**

- Given a MasterDataset with timeline patterns
- When decoding with sortBy set to "phase"
- Then the remaining work is ordered by phase number

**Sort by priority option**

- Given a MasterDataset with prioritized patterns
- When decoding with sortBy set to "priority"
- Then the remaining work shows priority groupings

**Generate remaining work detail files when enabled**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles enabled for remaining
- Then the document has remaining detail files:

| path |
| --- |
| remaining/phase-03-event-store-enhancement.md |
| remaining/phase-04-advanced-projections.md |

**No detail files when disabled for remaining**

- Given a MasterDataset with timeline patterns
- When decoding with generateDetailFiles disabled for remaining
- Then the document has no additional files

## Business Rules

**SessionContextCodec provides working context for AI sessions**

**Invariant:** Session context must include session status with active/completed/remaining counts, phase navigation for incomplete phases, and active work grouped by phase.
    **Rationale:** AI agents need a compact, navigable view of current project state to make informed implementation decisions.
    **Verified by:** Decode empty dataset produces minimal session context, Decode dataset with timeline patterns, Session status shows current focus, Phase navigation for incomplete phases, Active work grouped by phase, Blocked items section with dependencies, No blocked items section when disabled, Recent completions collapsible, Generate session phase detail files when enabled, No detail files when disabled

_Verified by: Decode empty dataset produces minimal session context, Decode dataset with timeline patterns, Session status shows current focus, Phase navigation for incomplete phases, Active work grouped by phase, Blocked items section with dependencies, No blocked items section when disabled, Recent completions collapsible, Generate session phase detail files when enabled, No detail files when disabled_

**RemainingWorkCodec aggregates incomplete work by phase**

**Invariant:** Remaining work must show status counts, phase-grouped navigation, priority classification (in-progress/ready/blocked), and next actionable items.
    **Rationale:** Remaining work visibility prevents scope blindness — knowing what's left, what's blocked, and what's ready drives efficient session planning.
    **Verified by:** All work complete produces celebration message, Summary shows remaining counts, Phase navigation with remaining count, By priority shows ready vs blocked, Next actionable items section, Next actionable respects maxNextActionable limit, Sort by phase option, Sort by priority option, Generate remaining work detail files when enabled, No detail files when disabled for remaining

_Verified by: All work complete produces celebration message, Summary shows remaining counts, Phase navigation with remaining count, By priority shows ready vs blocked, Next actionable items section, Next actionable respects maxNextActionable limit, Sort by phase option, Sort by priority option, Generate remaining work detail files when enabled, No detail files when disabled for remaining_

---

[← Back to Pattern Registry](../PATTERNS.md)
