# architect-guard Business Rules

## Overview

Structured business-rule catalog with 6 rules.

## Rules

| Feature                          | Rule Name           | Invariant                                                                                                                                                                                            |
| -------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProcessGuardRulesExecutableTests | Deliverable Removal | Removing a deliverable from a scope-locked (active) spec emits a \`deliverable-removed\` warning, never an error.                                                                                    |
| ProcessGuardRulesExecutableTests | Protection Level    | Hard-protected (completed) files cannot be modified without an \`@architect-unlock-reason\` tag, except when the modification itself is the transition to a terminal status (the act of completing). |
| ProcessGuardRulesExecutableTests | Scope Creep         | Scope-locked (active) specs cannot have new deliverables added; removing deliverables emits a warning, not an error.                                                                                 |
| ProcessGuardRulesExecutableTests | Session Exclusion   | Files explicitly excluded from the active session are a hard error (a \`session-excluded\` violation), not a warning, unless the run sets \`--ignore-session\`.                                      |
| ProcessGuardRulesExecutableTests | Session Scope       | Files modified outside the configured session scope emit a \`session-scope\` warning.                                                                                                                |
| ProcessGuardRulesExecutableTests | Status Transitions  | Status transitions follow the FSM defined in \`phase-state-machine\`. The only sanctioned bypass is a retroactive transition to \`completed\` accompanied by a validated unlock reason.              |

---

[← Back to Business Rules](../BUSINESS-RULES.md)
