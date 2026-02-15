# Process Business Rules

**Purpose:** Business rules for the Process product area

---

**7 rules** from 2 features. 7 rules have explicit invariants.

---

## Uncategorized

### Session File Lifecycle

*- Session files for completed phases become orphaned and show stale data*

---

#### Orphaned session files are removed during generation

> **Invariant:** Only session files for active phases are preserved; all other phase files must be deleted during cleanup and replaced with fresh content.

**Verified by:**
- Orphaned session files are deleted during generation
- Active phase session files are preserved and regenerated

---

#### Cleanup handles edge cases without errors

> **Invariant:** Cleanup must be idempotent, tolerate missing directories, and produce empty results when no phases are active.
>
> **Rationale:** Generator runs are not guarded by precondition checks for directory existence. Cleanup must never crash regardless of filesystem state.

**Verified by:**
- No active phases results in empty sessions directory
- Cleanup is idempotent
- Missing sessions directory is handled gracefully

---

#### Deleted files are tracked in cleanup results

> **Invariant:** The cleanup result must include the relative paths of all deleted session files for transparency and debugging.

**Verified by:**
- Deleted files are tracked in generator output

*session-file-lifecycle.feature*

### Session Handoffs

*- Context is lost when work pauses mid-phase (LLM sessions have no memory)*

---

#### Handoff context generation captures session state

> **Invariant:** Active phases with handoff context enabled must include session handoff sections with template and checklist links.

**Verified by:**
- SESSION-CONTEXT.md includes handoff section for active phases
- Discovery tags appear in handoff context section
- Paused phase shows status indicator

---

#### Handoff templates and checklists contain required sections

> **Invariant:** Session handoff template and retrospective checklist must exist and contain all required sections for structured knowledge transfer.

**Verified by:**
- Handoff template exists and contains required sections
- Retrospective checklist exists and contains required sections

---

#### PROCESS_SETUP.md documents handoff and coordination protocols

> **Invariant:** PROCESS_SETUP.md must document both session handoff protocol and multi-developer coordination patterns.

**Verified by:**
- PROCESS_SETUP.md documents handoff protocol
- PROCESS_SETUP.md documents multi-developer coordination

---

#### Edge cases and acceptance criteria ensure robustness

> **Invariant:** Handoff context must degrade gracefully when no discoveries exist and must be disableable. Mid-phase handoffs, multi-developer coordination, and retrospective capture must all preserve context.

**Verified by:**
- Fresh phase shows no previous context message
- Handoff context can be disabled
- Mid-phase handoff preserves context
- Multiple developers can coordinate
- Session retrospective captures learnings

*session-handoffs.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
