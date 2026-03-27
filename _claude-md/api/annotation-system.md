### Annotation System

Files must opt-in with a marker to be scanned:

```typescript
/** @architect */

/**
 * @architect-pattern PatternName
 * @architect-status completed
 * @architect-core
 * @architect-uses OtherPattern
 *
 * ## Description in markdown
 */
export class MyClass { ... }
```

**Note:** Both TypeScript files and Gherkin feature files require the `@architect` opt-in marker. For TypeScript, use a JSDoc comment `/** @architect */`. For Gherkin, add the `@architect` tag at the feature level.

#### Key Tags

| Tag                | Format | Description                                                                                                                                                          |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pattern`          | value  | Pattern identifier (required for named patterns)                                                                                                                     |
| `status`           | enum   | FSM state: `roadmap`, `active`, `completed`, `deferred`                                                                                                              |
| `phase`            | number | Roadmap phase number                                                                                                                                                 |
| `release`          | value  | Version tag: `v0.1.0` or `vNEXT`                                                                                                                                     |
| `uses`             | csv    | Runtime dependencies (TypeScript only)                                                                                                                               |
| `used-by`          | csv    | Reverse dependencies                                                                                                                                                 |
| `depends-on`       | csv    | Planning dependencies (Gherkin only)                                                                                                                                 |
| `quarter`          | value  | Timeline: `Q1-2025` (Gherkin only)                                                                                                                                   |
| `implements`       | csv    | Links behavior tests to tier 1 specs                                                                                                                                 |
| `extends`          | value  | Pattern inheritance                                                                                                                                                  |
| `executable-specs` | value  | Location of behavior tests                                                                                                                                           |
| `arch-role`        | enum   | Architecture role: `bounded-context`, `command-handler`, `projection`, `saga`, `process-manager`, `infrastructure`, `repository`, `decider`, `read-model`, `service` |
| `arch-context`     | value  | Bounded context grouping (free-form): e.g. `orders`, `inventory`, `agent` — omit for cross-cutting                                                                   |
| `arch-layer`       | enum   | Architecture layer: `domain`, `application`, `infrastructure`                                                                                                        |

**Category tags** are flags (no value): `@architect-core`, `@architect-api`, `@architect-infra`, `@architect-domain`, etc.

#### CLI Commands

| Command                   | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `architect-generate`      | Generate documentation from annotated sources              |
| `architect-lint-patterns` | Validate annotation quality (missing tags, invalid status) |
| `architect-guard`         | FSM validation for architect process                       |
| `architect-validate`      | Cross-source validation with DoD checks                    |
| `architect-taxonomy`      | Generate tag reference from TypeScript                     |
