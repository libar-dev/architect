### Common Test Implementation Issues

Issues discovered during step definition implementation:

| Issue                             | Description                                                  | Fix                                                                                               |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Pattern not in `bySource.gherkin` | TraceabilityCodec shows "No Timeline Patterns"               | Set `filePath: '...feature'` in `createTestPattern()` - source categorization uses file extension |
| Business value not found          | REMAINING-WORK.md business value is in `additionalFiles`     | Check detail files via `doc.additionalFiles` not main document sections                           |
| Codec output mismatch             | Spec says "Next Actionable table" but codec uses list format | Debug actual output with `console.log(JSON.stringify(doc.sections))` then align test expectations |
| `behaviorFileVerified` undefined  | Patterns created without explicit verification status        | Add `behaviorFileVerified: true/false` to `createTestPattern()` when testing traceability         |
| Discovery tags missing            | SessionFindingsCodec shows "No Findings"                     | Pass `discoveredGaps`, `discoveredImprovements`, `discoveredLearnings` to factory                 |

### Codec vs. Spec Reality Gap

Tier 1 specs are often idealistic drafts. The code is the reality.

| Issue                     | Description                                                                                                   | Fix                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Output Structure Mismatch | Spec expects "Phase 1" but Codec outputs derived name, or Spec expects table that Codec suppresses when empty | Run debug script to dump actual `RenderableDocument` JSON structure. Align Feature file to Codec's actual behavior        |
| Data Normalization        | Feature files use plain language (`planned`, `p1`) vs. Schema requirements (`roadmap`, `pattern-00...`)       | Implement helper functions: `normalizeStatus(str)` maps 'planned' → 'roadmap'. `generatePatternId(n)` generates valid IDs |

### Coding & Linting Standards

The project has strict linting rules. Save time by coding defensively.

| Issue                                                                            | Fix                                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Unused variables: `(_ctx, count, text)` throws lint errors if `count` isn't used | Prefix **immediately**: `(_ctx, _count, text)`                                    |
| Type safety: `ListItem` is an object, not a string. `item + '\n'` throws errors  | Check types before concatenation: `(typeof item === 'string' ? item : item.text)` |

### Deliverable Status Taxonomy (CRITICAL)

Deliverable status is enforced by `z.enum()` at schema level. The 6 canonical values are defined in `src/taxonomy/deliverable-status.ts`:

| Value         | Meaning             | Helper                            |
| ------------- | ------------------- | --------------------------------- |
| `complete`    | Work is done        | `isDeliverableStatusComplete()`   |
| `in-progress` | Work is ongoing     | `isDeliverableStatusInProgress()` |
| `pending`     | Work hasn't started | `isDeliverableStatusPending()`    |
| `deferred`    | Work postponed      |                                   |
| `superseded`  | Replaced by another |                                   |
| `n/a`         | Not applicable      |                                   |

**NEVER** use freeform status strings. The Zod schema rejects non-canonical values at parse time.

**Terminal statuses:** `complete`, `n/a`, and `superseded` are terminal per `isDeliverableStatusTerminal()`. Used by DoD validation — `deferred` is NOT terminal.

### Efficient Debugging Strategy

- **Don't** try to debug by running the full test suite repeatedly.
- **Do** create a temporary standalone script (e.g., `debug-codec.ts`) using `npx tsx` to inspect the Codec output:

```typescript
// debug-codec.ts
import { RemainingWorkCodec } from './src/renderable/codecs/session.js';
import { createTestMasterDataset } from './tests/fixtures/dataset-factories.js';

const dataset = createTestMasterDataset({ ... });
const doc = RemainingWorkCodec.decode(dataset);
console.log(JSON.stringify(doc.sections, null, 2));
```

- **Do** use `pnpm test remaining-work` (or specific filename) to run focused tests.

### Implementation Workflow Checklist

1. [ ] **Read Feature File:** identify Scenario counts and data types
2. [ ] **Check Factories:** Ensure `pattern-factories.ts` supports the fields needed (e.g., `phase`, `priority`)
3. [ ] **Prototype:** Run a `tsx` script to see what the Codec actually outputs for given inputs
4. [ ] **Adjust Spec:** Update Feature file to match Codec reality (e.g., quotes for lists, valid status names)
5. [ ] **Write Steps:** Implement steps with `_` prefixes for unused args
6. [ ] **Verify:** Run specific test file → Run related group → Run full suite
