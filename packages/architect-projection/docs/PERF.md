# Performance Gate

The projection package has a CI gate for the `BusinessRuleSet` hot path plus
the synthetic projection regressions that previously escaped the perf harness.
It measures `parseAndProjectBusinessRuleSet`, `renderJson(bundle)`,
`renderJson(bundle, { pretty: true })`, direct `isBundle(largeBundle)` checks,
`projectAnnotationCoverage()` as the public path that exercises
`patternSatisfiesTag`, and `projectBoundedContext()` as the public path that
exercises `buildBoundedContext`, all against a deterministic 36-pattern /
108-rule fixture with fixed tag and architecture metadata.

Run the gate locally from the monorepo root:

```bash
pnpm --filter @libar-dev/architect-projection exec vitest --config vitest.perf-report.config.mjs run
node packages/architect-projection/tests/perf/compare-baseline.mjs
```

The Vitest run writes `.sisyphus/evidence/task-3-business-rule-set-perf-report.json`.
The comparer reads that report and
`packages/architect-projection/tests/perf/baselines/business-rule-set.baseline.json`.

## Budgets

| Metric                                         | Hard budget |
| ---------------------------------------------- | ----------: |
| `project.avgMs`                                |    `1.5 ms` |
| `renderObject.avgMs`                           |    `1.0 ms` |
| `renderPretty.avgMs`                           |    `5.0 ms` |
| `isBundleP50Micros`                            |     `50 us` |
| `projectionHotPaths.patternSatisfiesTag.avgMs` |    `8.0 ms` |
| `projectionHotPaths.buildBoundedContext.avgMs` |    `8.0 ms` |

Average metrics also fail when they exceed the committed baseline by more than
50%. The hard budget remains authoritative even when the baseline is slower.

## Refresh Protocol

Intentional regression or CI recalibration requires its own PR. The baseline
refresh commit must be titled `refresh-perf-baseline:` and update only
`tests/perf/baselines/business-rule-set.baseline.json` plus any directly related
evidence in the PR description.
