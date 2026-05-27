# architect-guard Business Rules

## Overview

Structured business-rule catalog with 4 rules.

## Rules

| Feature                          | Rule Name          | Invariant                                                                                                                                                                                            |
| -------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProcessGuardRulesExecutableTests | Protection Level   | Hard-protected (completed) files cannot be modified without an \`@architect-unlock-reason\` tag, except when the modification itself is the transition to a terminal status (the act of completing). |
| ProcessGuardRulesExecutableTests | Scope Creep        | Scope-locked (active) specs cannot have new deliverables added; removing deliverables emits a warning, not an error.                                                                                 |
| ProcessGuardRulesExecutableTests | Session Scope      | Files modified outside the configured session scope emit a \`session-scope\` warning.                                                                                                                |
| ProcessGuardRulesExecutableTests | Status Transitions | Status transitions follow the FSM defined in \`phase-state-machine\`. The only sanctioned bypass is a retroactive transition to \`completed\` accompanied by a validated unlock reason.              |

---

[← Back to Business Rules](../BUSINESS-RULES.md)
