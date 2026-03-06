### Common Test Implementation Issues

Issues discovered during step definition implementation:

| Issue                             | Description                                                  | Fix                                                                                               |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Pattern not in `bySource.gherkin` | TraceabilityCodec shows "No Timeline Patterns"               | Set `filePath: '...feature'` in `createTestPattern()` - source categorization uses file extension |
| Business value not found          | REMAINING-WORK.md business value is in `additionalFiles`     | Check detail files via `doc.additionalFiles` not main document sections                           |
| Codec output mismatch             | Spec says "Next Actionable table" but codec uses list format | Debug actual output with `console.log(JSON.stringify(doc.sections))` then align test expectations |
| `behaviorFileVerified` undefined  | Patterns created without explicit verification status        | Add `behaviorFileVerified: true/false` to `createTestPattern()` when testing traceability         |
| Discovery tags missing            | SessionFindingsCodec shows "No Findings"                     | Pass `discoveredGaps`, `discoveredImprovements`, `discoveredLearnings` to factory                 |

### Coding & Linting Standards

The project has strict linting rules. Save time by coding defensively.

| Issue                                                                            | Fix                                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Unused variables: `(_ctx, count, text)` throws lint errors if `count` isn't used | Prefix **immediately**: `(_ctx, _count, text)`                                    |
| Type safety: `ListItem` is an object, not a string. `item + '\n'` throws errors  | Check types before concatenation: `(typeof item === 'string' ? item : item.text)` |

**Deliverable statuses:** 6 values enforced by `z.enum()`: `complete`, `in-progress`, `pending`, `deferred`, `superseded`, `n/a`. Terminal: `complete`, `n/a`, `superseded` (NOT `deferred`). NEVER use freeform strings.

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
