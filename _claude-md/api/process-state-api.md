For Claude Code sessions, use ProcessStateAPI instead of reading generated documentation:

```typescript
import {
  generators,
  api as apiModule,
  createDefaultTagRegistry,
} from '@libar-dev/delivery-process';

// Build dataset from extracted patterns
const tagRegistry = createDefaultTagRegistry();
const dataset = generators.transformToMasterDataset({
  patterns: extractedPatterns, // From scanPatterns + extractPatterns
  tagRegistry,
});
const api = apiModule.createProcessStateAPI(dataset);

// Common queries
api.getCurrentWork(); // Active patterns
api.getRoadmapItems(); // Available to start
api.getPatternsByPhase(19); // All Phase 19 patterns
api.isValidTransition('roadmap', 'active'); // Can we start?
api.getPattern('BddTestingInfrastructure'); // Full pattern details
api.getPhaseProgress(19); // Phase completion metrics
```

**Benefits over generated docs:**

- Low context cost — typed queries vs. reading markdown
- Real-time accuracy — direct from source, not snapshot
- Instant queries — no regeneration required

### Using Generated Documentation as Context

When adding features, consult generated documentation for current state:

```bash
pnpm docs:patterns    # Creates PATTERNS.md with all patterns
pnpm docs:all         # Creates roadmap, remaining work, changelog
```

Generated files are in `docs-generated/`:

- `PATTERNS.md` - Pattern registry with completion status
- `ROADMAP.md` - Development roadmap by phase
- `REMAINING-WORK.md` - Incomplete work summary
- `CURRENT-WORK.md` - Active work summary
