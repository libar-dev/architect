### FSM Protection Quick Reference

| State       | Protection   | Can Add Deliverables | Needs Unlock |
| ----------- | ------------ | -------------------- | ------------ |
| `roadmap`   | None         | Yes                  | No           |
| `active`    | Scope-locked | No                   | No           |
| `completed` | Hard-locked  | No                   | Yes          |
| `deferred`  | None         | Yes                  | No           |

**Live query:** `pnpm process:query -- query getProtectionInfo <status>` and `query getValidTransitionsFrom <status>` return current FSM rules from code.

**Valid FSM Transitions:**

```
roadmap ──→ active ──→ completed (terminal)
    │          │
    │          ↓
    │       roadmap (blocked/regressed)
    ↓
deferred ──→ roadmap
```

### FSM Error Messages and Fixes

| Error                       | Cause                                         | Fix                                       |
| --------------------------- | --------------------------------------------- | ----------------------------------------- |
| `completed-protection`      | File has `completed` status but no unlock tag | Add `@libar-docs-unlock-reason:'reason'`  |
| `invalid-status-transition` | Skipped FSM state (e.g., `roadmap→completed`) | Follow path: `roadmap→active→completed`   |
| `scope-creep`               | Added deliverable to `active` spec            | Remove deliverable OR revert to `roadmap` |
| `session-scope` (warning)   | Modified file outside session scope           | Add to scope OR use `--ignore-session`    |
| `session-excluded`          | Modified excluded pattern during session      | Remove from exclusion OR override         |

### Escape Hatches

| Situation                    | Solution              | Example                                  |
| ---------------------------- | --------------------- | ---------------------------------------- |
| Fix bug in completed spec    | Add unlock reason tag | `@libar-docs-unlock-reason:'Fix-typo'`   |
| Modify outside session scope | Use ignore flag       | `lint-process --staged --ignore-session` |
| CI treats warnings as errors | Use strict flag       | `lint-process --all --strict`            |

### Handoff Documentation

For multi-session work, generate handoff state from the API:

```bash
pnpm process:query -- handoff --pattern <PatternName>
# Options: --git (include recent commits), --session <id>
```

Generates: deliverable statuses, blockers, modification date, and next steps — always reflects actual annotation state.
