### Planning Session

**Goal:** Create a roadmap spec. Do NOT write implementation code.

| Do                                                        | Do NOT                      |
| --------------------------------------------------------- | --------------------------- |
| Extract metadata from pattern brief                       | Create `.ts` implementation |
| Create spec file with proper tags                         | Transition to `active`      |
| Add deliverables table in Background                      | Ask "Ready to implement?"   |
| Convert constraints to `Rule:` blocks                     | Write full implementations  |
| Add scenarios: 1 `@happy-path` + 1 `@validation` per Rule |                             |

### Design Session

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

| Use Design Session         | Skip Design Session |
| -------------------------- | ------------------- |
| Multiple valid approaches  | Single obvious path |
| New patterns/capabilities  | Bug fix             |
| Cross-context coordination | Clear requirements  |

**Context Gathering (BEFORE explore agents):**

```bash
pnpm process:query -- context <SpecName> --session design
pnpm process:query -- dep-tree <SpecName>
pnpm process:query -- stubs <SpecName>
pnpm process:query -- overview
```

Only use explore agents for comprehension questions (implementation patterns, formatting conventions) that the API doesn't cover.

**Code Stub Pattern** — stubs go in `delivery-process/stubs/{pattern-name}/`:

```typescript
// delivery-process/stubs/{pattern-name}/my-function.ts
/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements MyPattern
 * @libar-docs-uses Workpool, EventStore
 *
 * ## My Pattern - Description
 *
 * Target: src/path/to/final/location.ts
 * See: PDR-001 (Design Decision)
 * Since: DS-1
 */
export function myFunction(args: MyArgs): Promise<MyResult> {
  throw new Error('MyPattern not yet implemented - roadmap pattern');
}
```

Stubs live outside `src/` to avoid TypeScript compilation and ESLint issues.

### Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

**Context Gathering (BEFORE writing code):**

```bash
pnpm process:query -- context <SpecName> --session implement
pnpm process:query -- dep-tree <SpecName>
pnpm process:query -- stubs <SpecName>
```

**Execution Order (CRITICAL):**

1. **Transition to `active` FIRST** — before any code changes
2. **Create executable spec stubs** — if `@libar-docs-executable-specs` present
3. **For each deliverable:** implement, test, update status to `completed`
4. **Transition to `completed`** — only when ALL deliverables done
5. **Regenerate docs:** `pnpm docs:all`

| Do NOT                                | Why                                     |
| ------------------------------------- | --------------------------------------- |
| Add new deliverables to `active` spec | Scope-locked state prevents scope creep |
| Mark `completed` with incomplete work | Hard-locked state cannot be undone      |
| Skip FSM transitions                  | Process Guard will reject               |
| Edit generated docs directly          | Regenerate from source                  |
