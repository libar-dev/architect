## Implementation Session: DataAPIDesignSessionSupport

Implement the **DataAPIDesignSessionSupport** spec (Phase 25c, 4 deliverables, 2 subcommands: `scope-validate`, `handoff`).

Design session completed — stubs and PDR-002 decision spec exist. Dependencies done: DataAPIContextAssembly + DataAPIStubIntegration both completed.

### Session rules

- This is an implementation session — write code, transition FSM states.
- The roadmap spec is the source of truth for deliverables and acceptance criteria.
- Design stubs define the approved API surface (types + function signatures).
- PDR-002 contains 7 design decisions (DD-1 through DD-7) — follow them, don't revisit.
- Follow existing CLI patterns: manual arg parsing (for-loop + switch), `handleCliError()`, text output with `=== MARKERS ===` per ADR-008.
- All tests must be `.feature` files (Gherkin-only policy). No `.test.ts` files.

### Context gathering — Process API FIRST

Run these commands BEFORE reading any files. They replace explore agents for navigation:

```bash
# 1. Implementation context bundle (deliverables, FSM state, deps)
pnpm process:query -- context DataAPIDesignSessionSupport --session implement

# 2. Design stubs with target paths and resolution status
pnpm process:query -- stubs DataAPIDesignSessionSupport

# 3. Dependency chain — confirm all deps are completed
pnpm process:query -- dep-tree DataAPIDesignSessionSupport

# 4. Design decisions from stubs (DD-1 through DD-7)
pnpm process:query -- decisions DataAPIDesignSessionSupport

# 5. How the completed context-assembler is wired (reusable helpers)
pnpm process:query -- arch neighborhood DataAPIContextAssembly

# 6. Existing implementation files for scope-validator target path
pnpm process:query -- files DataAPIDesignSessionSupport --related

# 7. Verify no naming conflicts before creating patterns
pnpm process:query -- search ScopeValidator
pnpm process:query -- search HandoffGenerator
```

Only use file reads for comprehension (how existing code works internally) — not for navigation (what exists and how it relates).

### Key files to read (for comprehension only)

After the API commands, read these for implementation patterns:

| File                                                                            | Why                                                        |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Design stubs (2 files in `delivery-process/stubs/DataAPIDesignSessionSupport/`) | Approved types + function signatures                       |
| `delivery-process/decisions/pdr-002-session-workflow-commands.feature`          | DD-1 through DD-7 design decisions                         |
| `delivery-process/specs/data-api-session-support.feature`                       | Spec with deliverables and scenarios                       |
| `src/api/context-assembler.ts`                                                  | Reusable helpers: `requirePattern()`, `resolveFsm()`       |
| `src/api/context-formatter.ts`                                                  | `=== MARKERS ===` text formatting conventions              |
| `src/cli/process-api.ts`                                                        | CLI subcommand wiring pattern (how to add new subcommands) |
| `src/validation/dod-validator.ts`                                               | `isDeliverableComplete()` for handoff completion logic     |

### Execution order (CRITICAL)

1. **Transition spec to `active` FIRST** — change `@libar-docs-status:roadmap` → `@libar-docs-status:active` in the spec file. Commit this change alone before writing any implementation code.

2. **Implement deliverables in dependency order:**
   - Scope validation logic (`src/api/scope-validator.ts`) — core functions, no CLI
   - `scope-validate` subcommand wiring in CLI
   - Handoff document generator (`src/api/handoff-generator.ts`) — core functions, no CLI
   - `handoff` subcommand wiring in CLI

3. **For each deliverable:** implement → write Gherkin test → update deliverable status in spec

4. **Transition to `completed`** — only when ALL 4 deliverables are done

5. **Regenerate docs:** `pnpm docs:all`

6. **Verify:** `pnpm lint && pnpm test`

### Validation checkpoints — use the API throughout

After each deliverable, verify using Process API commands:

```bash
# After implementing scope-validator.ts — verify it's scanned
pnpm process:query -- search ScopeValidator

# After wiring CLI — verify subcommands work
pnpm process:query -- context DataAPIDesignSessionSupport --session implement

# After implementing handoff-generator.ts
pnpm process:query -- stubs DataAPIDesignSessionSupport  # should show targetExists: true

# After transitioning to completed — verify FSM
pnpm process:query -- pattern DataAPIDesignSessionSupport --fields status
pnpm process:query -- status  # completion % should increase

# Final validation — the new commands should work on themselves
pnpm process:query -- overview  # should reflect updated status
```

### Lint rules to remember

- `strict-boolean-expressions`: use `arg?.startsWith('-') === true` (explicit boolean with optional chain)
- `@typescript-eslint/no-non-null-assertion`: use explicit `undefined` checks, never `!`
- `@typescript-eslint/explicit-function-return-type`: required on all exported functions
- `@typescript-eslint/consistent-type-imports`: separate `import type` statements, no inline `import()`

### What NOT to do

- Do NOT add new deliverables to the spec (scope-locked once `active`)
- Do NOT update docs manually — `pnpm docs:all` regenerates them
- Do NOT revisit DD-1 through DD-7 decisions — they're approved
- Do NOT create `.test.ts` files — Gherkin-only testing policy
- Do NOT mark `completed` with incomplete work — hard-locked state cannot be undone
- Do NOT launch explore agents for navigation — the Process API commands above cover it

### Pattern naming

Check `delivery-process/specs/*.feature` before choosing `@libar-docs-pattern` names in TypeScript. Implementation files must use a DIFFERENT pattern name + `@libar-docs-implements DataAPIDesignSessionSupport` to avoid conflicts with the Gherkin spec's pattern name.

---

`★ Insight ─────────────────────────────────────`
**Why this prompt is structured this way:**

1. **API-first context gathering** — The 7 commands in the gathering section replace what would otherwise be 3-5 explore agents. The `context --session implement` command specifically assembles deliverables + FSM state + deps into one bundle, which is exactly what an implementation session needs.

2. **Validation checkpoints use the API as feedback loop** — Instead of manually inspecting files to see if things are wired correctly, the prompt uses `stubs` (to verify `targetExists` flipped), `search` (to verify new patterns are scanned), and `status` (to verify completion % changed). This is the "API as integration test" pattern.

3. **No docs references** — The prompt deliberately avoids referencing `docs/SESSION-GUIDES.md`, `docs/ARCHITECTURE.md`, etc. since you mentioned they may not be current. Instead, the rules are inlined and the API commands serve as the ground truth for project state.
   `─────────────────────────────────────────────────`
