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

**Code Stub Pattern:**

```typescript
/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-uses Workpool, EventStore
 *
 * ## My Pattern - Description
 */
export function myFunction(args: MyArgs): Promise<MyResult> {
  throw new Error('MyPattern not yet implemented - roadmap pattern');
}
```

### Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

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
