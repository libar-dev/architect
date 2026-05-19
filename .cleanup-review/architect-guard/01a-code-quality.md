# Code Quality Review — `@libar-dev/architect-guard`

Focus: FSM correctness, git-helper safety, lint-engine reliability, anti-pattern
detector discipline, step-linter robustness, concurrency, error surfacing.

Read-only review. Findings ordered by severity. Each finding cites
`<file>:<line>` against the working tree at the start of this session.

---

## Critical

### C1. `@architect-unlock-reason` enforcement is two layers of permissive heuristics — the ≥10-char + non-placeholder rule documented in `decider.ts` is effectively unenforced

- **Severity**: Critical
- **File:line**: `packages/architect-guard/src/lint/process-guard/decider.ts:42-48,290-298`;
  `packages/architect-guard/src/lint/process-guard/derive-state.ts:128-138`;
  `packages/architect-guard/src/lint/process-guard/detect-changes.ts:407-410`
- **Impact**: The doctrine in CLAUDE.md and the ADR docstring on `decider.ts`
  lines 42-48 promises:
  > The unlock reason must be at least 10 characters and cannot be a placeholder.

  The actual gate in `decider.ts:290-298` bypasses **all** FSM validation when
  any transition ends at `completed` AND both:
  1. `state.files.get(file).hasUnlockReason === true`, set in
     `derive-state.ts:137` from `pattern.unlockReason?.trim().length > 0`.
  2. `transition.hasUnlockReason === true`, set in `detect-changes.ts:408` by
     `line.includes('unlock-reason')` — a raw substring match on **any added
     line**, including comments, prose, and quoted examples.

  `architect-core/src/extractor/gherkin-extractor.ts:74-93` does validate the
  ≥10-char + placeholder rule, but emits only a `'warning'` diagnostic
  (`extraction-diagnostics.ts:55`). The `unlockReason` field is still populated
  on the pattern even when the value is `'todo'`, `'temp'`, or 1 character.
  Process-guard therefore treats `@architect-unlock-reason:fix` as a valid
  bypass of `roadmap → completed`, `deferred → completed`, and any other invalid
  transition that lands on `completed`.

  Worse, the substring check on `detect-changes.ts:408` matches the string
  `unlock-reason` anywhere — `# TODO: handle unlock-reason` in a docstring
  flips `transition.hasUnlockReason = true`. The two `&&`-joined checks
  collapse to "any 1-character unlockReason on the pattern, plus any line
  mentioning the phrase." This is the keystone of the FSM and it doesn't hold.
- **Remediation**:
  1. In `architect-core` extractor, promote `'invalid-unlock-reason'` from
     `warning` to `error` and **do not populate** `pattern.unlockReason` when
     validation fails — the field must reflect a usable reason or be absent.
  2. In `derive-state.ts:137`, gate `hasUnlockReason` on the same predicate
     (`length >= MIN_UNLOCK_REASON_LENGTH && !INVALID_UNLOCK_REASON_PLACEHOLDERS.test(...)`)
     rather than `length > 0`.
  3. In `detect-changes.ts:408`, replace the substring check with the same
     prefix-aware regex used for status (`${escapedPrefix}unlock-reason:(\S+)`),
     extract the value, and only set `hasUnlockReason: true` when the captured
     value passes the ≥10-char + non-placeholder predicate.
  4. The bypass in `decider.ts:290-298` should additionally require the
     transition's `from` state to be a state where this exception is
     legitimate (the documented "retroactive completion" path) rather than
     any `*  → completed`.
- **Verification**:
  - Add scenarios under `packages/architect-guard/tests/features/`:
    - `roadmap → completed` with `@architect-unlock-reason:test` → BLOCKED.
    - `roadmap → completed` with `@architect-unlock-reason:Backfill-from-shipped-code` → PASS.
    - `roadmap → completed` with no `@architect-unlock-reason:` but the diff
      contains the literal string `# unlock-reason` in a comment → BLOCKED.
  - `pnpm architect:query query isValidTransition roadmap completed` should
    return `false` and the guard must agree.

### C2. Hunk-boundary reset of `insideDocstring` makes the docstring-aware status detector unreliable

- **Severity**: Critical
- **File:line**: `packages/architect-guard/src/lint/process-guard/detect-changes.ts:386-392`
- **Impact**: The hunk-header handler resets `state.insideDocstring = false`
  at every `@@ ... @@` boundary. Git diff hunks are not aligned to
  Gherkin docstring boundaries — when a `"""` opens on line 30 and an edit
  inside the docstring shows up on line 80 in a second hunk, the parser
  enters the second hunk believing it is outside the docstring. Any
  `@architect-status:` value inside that docstring will be captured as a
  real status tag and produce a phantom "invalid transition" error, OR a
  real status change outside the docstring will be missed.

  Conversely, when a `"""` close is in a hunk and a real status tag follows
  outside docstrings in the same hunk, the toggle may flip incorrectly.
- **Remediation**: Either (a) request unlimited context with `git diff -U`
  on a sufficient size (e.g. `-U99999`) and run the parser on the post-image
  rather than the diff; or (b) read the full post-image file (already
  available via `fs.readFile` for added files) and run the docstring
  state-machine against it, using the diff only to filter which lines
  were touched.
- **Verification**: A regression scenario where a docstring spans two hunks
  and contains a tag-shaped string must not produce a `StatusTransition`;
  a real status flip after a docstring close in the same hunk must produce one.

### C3. `LintProcessCLI` discards the configured `TagRegistry` when invoking the decider

- **Severity**: Critical (for consumers with a custom prefix)
- **File:line**: `packages/architect-guard/src/cli/lint-process.ts:367-374`;
  cf. `packages/architect-guard/src/lint/process-guard/decider.ts:178-179,246-275`
- **Impact**: `lint-process.ts` loads `projectConfig.instance.registry` and
  forwards it to `detectStagedChanges` / `detectBranchChanges` /
  `detectFileChanges`, but the `validateChanges({ options: {...} })` call only
  passes `strict` and `ignoreSession`. The decider falls back to
  `DEFAULT_TAG_PREFIX = '@architect-'`. Any consumer that customizes
  `registry.tagPrefix` (e.g. `@acme-`) gets error messages saying
  `Add @architect-unlock-reason:'your reason' to proceed` — referring to a tag
  that does not exist in their taxonomy. This is misleading at minimum and
  breaks copy/paste fixes for downstream consumers.

  Same shape applies to `checkProtectionLevel` and any future rule that
  reads `options.registry`.
- **Remediation**: Pass `registry: projectConfig.instance.registry` into the
  decider options object alongside `strict` and `ignoreSession`. The decider's
  `DeciderOptions` type already accepts it (`types.ts:276`).
- **Verification**: Run the CLI against a fixture project whose
  `architect.config.ts` sets `tagPrefix: '@acme-'` and assert that the
  `completed-protection` error message contains `@acme-unlock-reason`.

---

## High

### H1. The ADR-006 stage-1 carve-out is honored, but `detectRemovedTags` re-reads each feature from disk after the scanner already parsed it

- **Severity**: High (correctness + perf, not boundary discipline)
- **File:line**: `packages/architect-guard/src/validation/anti-patterns.ts:148-192`
- **Impact**: The stage-1 carve-out (ADR-006) allows `AntiPatternDetector` to
  consume raw scanner/extractor output for file-level layout checks. The
  carve-out is disciplined here: file-text checks (magic comments, mega
  feature, removed tags) consume `feature.filePath`, not the PatternGraph.

  However, `detectRemovedTags` opens each feature file with
  `readFileSync(feature.filePath, 'utf-8')` and re-tokenizes lines, which:
  1. Duplicates work the Gherkin scanner already did (the scanned file carries
     `tags` for the Feature and its scenarios).
  2. Silently swallows read failures in a bare `catch {}` (line 186-188) —
     a permission-denied or symlink loop fails closed (no violation) without
     a single diagnostic event, despite the rule's purpose being to detect
     **silent data loss**. The detector itself can silently fail.
- **Remediation**:
  1. Iterate `feature.tags` / `feature.scenarios[].tags` from the scanner
     output instead of re-reading files. Line numbers are still derivable
     because scanner output carries `position.startLine`. Drop `readFileSync`.
  2. If re-reading is unavoidable, log the failure to a diagnostics channel
     rather than swallowing it.
- **Verification**: Replace fixture with `chmod 000` on a feature file and
  assert a diagnostic is emitted rather than silent omission.

### H2. `detectFileChanges` returns false-positive "modified" entries for files passed via `--file`

- **Severity**: High
- **File:line**: `packages/architect-guard/src/lint/process-guard/detect-changes.ts:196-248`
- **Impact**: In `--files` mode, every tracked file is unconditionally pushed
  into `modified` (line 214), regardless of whether `git diff HEAD --` against
  it produces any output. `hasChanges(detection)` then returns `true`,
  `validateChanges` runs against the pattern's current state, and a clean
  file can produce a "completed-protection" violation if its committed state
  is `completed`. This makes `--file path/to/completed-spec.feature` always
  fail, even when the user is just asking the guard to dry-run.

  More subtly, `statusTransitions` and `deliverableChanges` will be empty
  (no diff content), so the only rules that fire are protection-level and
  session-scope — exactly the rules where false positives hurt most.
- **Remediation**: Only push to `modified` if the captured diff for that
  file is non-empty after the `git diff` call returns. Move the diff call
  before classification so unchanged files end up in neither bucket, and
  let `hasChanges` short-circuit honestly.
- **Verification**: `architect-guard --file <unchanged-completed-spec>` must
  exit 0 with "No changes detected".

### H3. Symbolic git operations against `merge-base <branch> HEAD` can throw when the branch is missing locally

- **Severity**: High
- **File:line**: `packages/architect-guard/src/lint/process-guard/detect-changes.ts:159-160`;
  `packages/architect-guard/src/git/branch-diff.ts:50-58`
- **Impact**: `sanitizeBranchName` correctly rejects shell metacharacters and
  leading hyphens. Once sanitized, `execGitSafe('merge-base', [safeBranch, 'HEAD'], baseDir)`
  is invoked unconditionally. In CI environments that did not fetch `main`
  (e.g., `actions/checkout@v4` with default `fetch-depth: 1`), this throws
  `fatal: Not a valid object name`, gets caught at the outer `try/catch`,
  and returned as `R.err(Error)`. The CLI in `lint-process.ts:348-350` then
  throws — exiting with code 1 — without explaining that the issue is a
  missing remote ref, not a validation failure.

  Git helpers should distinguish "validation found violations" from
  "git environment is misconfigured" — both currently exit 1 with similar
  stderr framing.
- **Remediation**: Wrap `merge-base` errors and remap them to a distinct
  error class (`MissingBaseRefError`) with an actionable message:
  `'<branch>' not found locally. Run 'git fetch origin <branch>' or pass --base-dir to a repo that has it.`
  The CLI can then exit with a different code (e.g. 2 — already used for
  warnings) or print a structured hint before exit.
- **Verification**: In a shallow clone with no `main`, `architect-guard --all`
  must exit with a clear "fetch main first" message, not a raw git error.

### H4. `validateChanges` swallows unknown ProcessGuardRule paths silently — there is no fallthrough check

- **Severity**: High
- **File:line**: `packages/architect-guard/src/lint/process-guard/decider.ts:177-209`
- **Impact**: `ProcessGuardRule` is a closed string union of six values
  (`types.ts:210-216`). The rule loop in `decider.ts:177-195` covers five —
  `deliverable-removed` is emitted by `checkScopeCreep` as a side-effect.
  There is no compile-time exhaustiveness check binding the union to the
  loop. If a new rule is added to the union (`session-expiry`, for instance)
  and the rule loop is not updated, it will silently never fire and CI
  will pass. This is the same class of error that ADR-007 forbids for
  `ProcessStatusValue`.

  Beyond that, the implicit emission of `deliverable-removed` from
  `checkScopeCreep` (lines 364-374) is invisible from the rules array — a
  reviewer reading the loop would conclude the rule is unimplemented.
- **Remediation**: Replace the inline literal array with a
  `RULES: Record<ProcessGuardRule, (state, changes, opts) => ProcessViolation[]>`
  table, then iterate `Object.keys` casted as `ProcessGuardRule`. Add a
  TypeScript `never` exhaustiveness sentinel for the union to fail builds
  when a new rule is added without a handler. Move `deliverable-removed`
  to its own handler.
- **Verification**: Add a temporary `'fake-rule'` to the union and confirm
  `pnpm typecheck` fails until the table is updated.

### H5. Hash-in-step-text and dollar-in-step-text checks rely on a naive `stripQuotedContent` that breaks on escaped quotes

- **Severity**: High
- **File:line**: `packages/architect-guard/src/lint/steps/utils.ts:14-20`;
  `packages/architect-guard/src/lint/steps/feature-checks.ts:154-178,198-222`
- **Impact**: `stripQuotedContent` replaces `"..."` and `'...'` with empty
  quote pairs using a non-anchored, non-escape-aware regex. Step text
  containing an escaped quote inside another quoted value — e.g.
  `'JSON {"key": "value with \\"quote\\""}'` — is mis-parsed: the inner
  `\\"` closes the outer single-quote-bounded match early, leaving the
  rest of the line "unquoted." A subsequent `#` or `$` then triggers a
  false-positive lint error.

  Gherkin step text does occasionally embed escaped quotes (especially
  in `@architect-pattern` examples in features that document themselves),
  and these will misfire.
- **Remediation**: Either (a) match quoted regions with a proper escape-aware
  parser that consumes `\\.` inside the string body, or (b) drop the
  regex approach and walk the string character-by-character mirroring
  `countBraceBalance`'s state machine (already in the same file). Reusing
  that machine for "strip quoted content" is the lowest-risk fix.
- **Verification**: Fixture step text
  `Given a doc '{"x": "y\\"z"}'` must not emit `dollar-in-step-text` or
  `hash-in-step-text` when the `#`/`$` is only inside the inner string.

---

## Medium

### M1. `compareDanglingBaseline` computes `removedEntries` but never surfaces them; baseline gradually accumulates dead entries

- **Severity**: Medium
- **File:line**: `packages/architect-guard/src/lint/dangling-baseline.ts:120-139`;
  `packages/architect-guard/src/cli/validate-patterns.ts:686-713`
- **Impact**: `compareDanglingBaseline` returns both `newEntries` (CI fails
  on these) and `removedEntries` (entries in the committed baseline that
  no longer appear in current output). `enforceDanglingBaseline` reads
  `comparison.newEntries` and emits an error, but `removedEntries` is
  computed and dropped. Over time the baseline accumulates stale entries
  that no longer correspond to real dangling references — the gate weakens
  silently because the floor never moves.

  A baseline file is only a useful gate if it ratchets in both directions:
  new entries fail, removed entries either auto-prune or warn the developer
  to refresh.
- **Remediation**: Emit a `warning`-severity issue when `removedEntries`
  is non-empty: `"N stale baseline entries — run --update-baseline"`. Add
  a `--strict` mode that promotes this to an error so CI can require the
  baseline stay in sync.
- **Verification**: Add a no-longer-dangling reference to the baseline by
  hand, run `architect-validate --strict`, expect non-zero exit.

### M2. The terminal-state-completion bypass in `checkProtectionLevel` allows undocumented modifications when `transition.to` is `completed`

- **Severity**: Medium
- **File:line**: `packages/architect-guard/src/lint/process-guard/decider.ts:258-275`
- **Impact**: The carve-out at lines 260-264 skips the "hard protection"
  check whenever the transition lands on a terminal state, with no further
  qualification. Combined with C1 (placeholder unlock reasons accepted),
  this means **any** edit on a previously-`completed` file can be smuggled
  through by also bumping a different file from `roadmap` to `completed`
  in the same commit — the change-set carries a `statusTransitions` entry
  for the latter, and the loop iterates `[...modifiedFiles, ...addedFiles]`
  per file. The lookup `changes.statusTransitions.get(file)` is per-file,
  so this specific cross-file vector doesn't actually fire, but the inverse
  does: a file whose current status is `completed` AND whose diff includes
  any `to: completed` (e.g. a docstring example) bypasses protection.

  Per C2, docstring-aware detection is unreliable, so adversarial or
  accidental docstring contents can synthesize a fake `to: completed`
  transition and clear hard protection.
- **Remediation**: Only bypass `completed-protection` when:
  1. The transition is freshly arriving at `completed` (i.e. `from !== to`
     and `to === 'completed'`), AND
  2. The status tag triggering the transition is unambiguously not inside
     a docstring (post-C2 fix).
- **Verification**: A scenario where a `completed` file is edited with a
  docstring example containing `@architect-status:completed` must trigger
  `completed-protection`.

### M3. `detectStatusTransitions` derives `fromStatus = DEFAULT_STATUS` for new files, which conflicts with the canonical "no transition for new files" semantics

- **Severity**: Medium
- **File:line**: `packages/architect-guard/src/lint/process-guard/detect-changes.ts:462-475`
- **Impact**: For a new file, `state.removedTag === null`, so `fromStatus`
  defaults to `DEFAULT_STATUS` (which is `'roadmap'`). If the new file
  carries `@architect-status:roadmap`, `fromStatus === toStatus` and the
  transition is dropped (line 475). If the new file carries
  `@architect-status:active`, the transition `roadmap → active` is reported
  as if it were a legitimate flip, even though the file is _new_ and the
  developer never transitioned anything. The user-visible error message at
  `decider.ts:311` says "Invalid status transition in '<file>' (new file)" —
  the `(new file)` hint is good, but the underlying gate fires the wrong
  rule.

  The canonical reading is: a new file with status `X` is a declaration,
  not a transition. Validation should be "is `X` a valid initial state for
  this maturity tier?", not "is `roadmap → X` a valid FSM edge?".
- **Remediation**: Either (a) report new files as `isNewFile: true` and
  skip FSM-edge validation; validate the initial status against an
  `INITIAL_STATUS_VALUES` set instead; or (b) document that new files are
  modeled as `DEFAULT_STATUS → declared-status` and ensure the FSM matrix
  intentionally encodes this — currently the matrix is documented as
  flips, not declarations.
- **Verification**: A new file with `@architect-status:deferred` is
  currently rejected (no `roadmap → deferred` ... actually that's valid).
  A new file with `@architect-status:completed` is rejected because
  `roadmap → completed` is invalid — but the file has no history; the
  question is whether _initial_ `completed` is allowed, not whether the
  edge is valid.

### M4. `isInSessionScope`'s spec matcher uses `String.includes` for spec entries without a slash, producing surprising matches

- **Severity**: Medium
- **File:line**: `packages/architect-guard/src/lint/process-guard/session-state-reader.ts:231-241`
- **Impact**: `matchesSpec` distinguishes path-like entries (containing a
  `/`) from bare names. For bare names it uses `normalizedPath.includes(spec)` —
  a substring match. A session entry `"api"` matches every file containing
  `api` anywhere in its path: `architect/specs/captain-api/foo.feature`,
  `packages/openapi/spec.feature`, etc. The looseness will produce false
  positives that silently widen session scope and bury intent.

  Combined with the warning-only severity of `session-scope`, this is hard
  to detect — users may set a session scope expecting it to be tight and
  not notice the over-match.
- **Remediation**: Either treat bare names as exact-segment matches
  (`split(path.sep)` then `Array.includes`), or require all scope entries
  to be glob-shaped and reject bare-name entries at session-parse time
  in `session-state-reader.ts:194-205`.
- **Verification**: A session scope `[{spec: 'api'}]` should not match
  `packages/architect-cli/src/cli/api-doc.ts`.

### M5. Anti-pattern detectors swallow `readFileSync` errors with bare `catch {}`

- **Severity**: Medium (defense-in-depth)
- **File:line**: `packages/architect-guard/src/validation/anti-patterns.ts:186-188,237-239,307-309`
- **Impact**: Three detectors (`detectRemovedTags`, `detectMagicComments`,
  `detectMegaFeature`) wrap `readFileSync` in `try { ... } catch {}`. The
  comment says "file may have been deleted." Real-world failure modes
  include EACCES, EISDIR (symlink to a directory), ELOOP — all of which
  fail closed (no violation, no message). The guard package's job is to
  emit verdicts, so silent fail-closed is a regression.

  This pattern repeats for `pair-resolver.ts:56-67` and
  `runner.ts:127-133` (step lint).
- **Remediation**: Route read failures through a diagnostics channel
  (already exists for the validator) and surface as `info`-level violations
  per file. Bare `catch {}` is never the right answer when the catcher's
  whole purpose is reporting.
- **Verification**: `chmod 000` on a feature file then run
  `architect-validate --anti-patterns` and expect a `[INFO] read-failed`
  message rather than a clean exit.

### M6. `checkMissingAndDestructuring` and `checkMissingRuleWrapper` use overly broad regexes that silently accept comment-only mentions

- **Severity**: Medium
- **File:line**: `packages/architect-guard/src/lint/steps/cross-checks.ts:96-188`
- **Impact**: `checkMissingAndDestructuring` accepts the step file as
  conformant if `/\{\s*[^}]*\bAnd\b[^}]*\}/` matches anywhere — including
  block comments like `/* { And, Or } */` or object-literal keys like
  `const x = { And: 1 };` (which the comment at lines 109-111 acknowledges).
  Similarly, `checkMissingRuleWrapper` looks for `Rule` anywhere inside the
  destructuring of `describeFeature(...)` but does not check that
  `RuleScenario` or `Rule(...)` is actually used in the body.

  Result: a file that imports a comment with `{ Given, And }` from a
  template but actually destructures only `{ Given }` from `describeFeature`
  will pass the check yet fail at runtime with `StepAbleUnknowStepError`.
  The check fails open in the direction that matters.
- **Remediation**: Parse `describeFeature(feature, ({ ... }) => { ... })`
  with a brace-tracking scan (the file already has `countBraceBalance`)
  and check the destructured names — not arbitrary substrings.
- **Verification**: A fixture step file with `// And` in a comment and
  no actual `And` destructuring should fail the check.

### M7. `detectIdeaTier` short-circuits on the first `Feature:` line, missing tags placed after the Feature header

- **Severity**: Medium
- **File:line**: `packages/architect-guard/src/lint/idea-tier/idea-tier-checks.ts:39-43`
- **Impact**: The detector breaks the loop the moment it sees a
  `Feature:` line, asserting "the Architect tag block is contiguous and
  ends at the Feature: line." Gherkin allows tags on individual scenarios
  and rules too, and the canonical Architect convention places
  `@architect-status:` either before `Feature:` or in the file's docstring.
  Specs that follow a "tag the scenario, not the feature" pattern (e.g.,
  `@architect-status:active` on a single scenario) are excluded from
  idea-tier detection entirely — `explicitArchitectTagCount` stops growing.

  Worse, the budget check (`checkLineBudget`) then runs on the full
  file's `meaningful` line count regardless of detection — but only if
  `detectIdeaTier.isIdeaTier === true`. So the cumulative effect is:
  scenario-level idea-tier tagging is silently invisible to the linter.
- **Remediation**: Continue parsing past `Feature:` until the file ends.
  Match `@architect-*` lines anywhere in the file but only count them as
  the idea-tier baseline when they occur at the file/feature level (or
  use the scanner output, which already disambiguates this).
- **Verification**: Move `@architect-maturity:idea` to a scenario-level
  tag and confirm the idea-tier checks still fire.

### M8. `runStepLint` `discoverFiles` is single-threaded and synchronous; large repos pay file-read latency in serial

- **Severity**: Medium (perf)
- **File:line**: `packages/architect-guard/src/lint/steps/runner.ts:55-104`;
  `packages/architect-guard/src/lint/idea-tier/runner.ts:24-37`
- **Impact**: Both runners use `globSync` then a `for` loop with
  `readFileSync` per file. For repos with hundreds of features (the
  dogfood repo is approaching this), this is the dominant cost of
  `pnpm validate:all`. The lint engine itself is pure CPU work — file
  reads dominate. There is no perf gate equivalent to the projection
  package's 1.5× baseline.

  The same applies to `anti-patterns.ts` detectors.
- **Remediation**: Convert to `fs.promises.readFile` with
  `Promise.all` (or `p-limit` with a small concurrency cap to avoid
  EMFILE on macOS). Consider memoizing reads when a file is consumed
  by both step-only and cross-checks.
- **Verification**: Benchmark `pnpm test:dogfood` before/after; expect
  meaningful speedup on the step lint pass.

---

## Low

### L1. `parseSessionFile` returns `R.err` for any malformed session file, but the caller silently `continue`s — no diagnostic ever surfaces

- **Severity**: Low
- **File:line**: `packages/architect-guard/src/lint/process-guard/session-state-reader.ts:68-80`
- **Impact**: A malformed session file is silently skipped (line 70-74
  comment is honest: "Skip malformed/non-session files"). For a single
  noisy file this is fine, but it means a typo in the active session file
  causes the guard to silently fall back to "no active session" — which
  in turn disables `session-scope` and `session-excluded` checks. The
  user gets a green CI and a session that doesn't constrain anything.
- **Remediation**: Log a stderr warning per malformed file (e.g.
  `[architect-guard] session-state: skipping malformed file <path>: <reason>`).
  Cheap to add, prevents silent fallback.
- **Verification**: Create `sessions/broken.feature` with garbage content,
  run the guard, expect a warning line on stderr.

### L2. `applyTierABaseline` filters by exact `(path, rule, line, message)` tuple — message-text drift in lint rules silently un-suppresses violations

- **Severity**: Low
- **File:line**: `packages/architect-guard/src/lint/tier-a-baseline.ts:1101-1103`
- **Impact**: The baseline is keyed on the violation's exact message. If
  a rule's error message wording is updated (typo fix, prefix-aware
  formatting per C3), every baseline entry whose message diverges starts
  failing CI. Without an `--update-baseline`-equivalent for tier-A, the
  fix is a manual hand-edit of `tier-a-baseline.ts` (1132 LOC).

  The file already has 1132 lines of inline data; treating wording as
  part of the identity is fragile.
- **Remediation**: Key the baseline on `(path, rule, line)` only; drop
  `message` from the tuple. Document that line numbers can shift and add
  a `lineTolerance` window of ±5 if drift becomes a problem.
- **Verification**: Change a rule message in `rules.ts`, run lint, expect
  the same baseline entries to keep filtering.

### L3. `formatPretty` renders empty severity buckets with trailing blank lines and an empty "Errors:" header is possible

- **Severity**: Low
- **File:line**: `packages/architect-guard/src/cli/lint-process.ts:205-228`
- **Impact**: `formatPretty` unconditionally calls `lines.push('Errors:')`
  whenever `result.violations.length > 0`, but the prior
  `summarizeResult(result)` already includes counts. When all violations
  end up in the warnings bucket (no errors), the function correctly skips
  the "Errors:" header. But the blank line after each bucket accumulates —
  five blank lines for a clean run with three rules in `--show-state` mode.
  Cosmetic only.
- **Remediation**: Join sections with a single blank line and drop the
  per-bucket trailing push.

### L4. `lint-patterns.ts:339-358` rebuilds the `LintSummary` in an inefficient pattern

- **Severity**: Low
- **File:line**: `packages/architect-guard/src/cli/lint-patterns.ts:339-358`
- **Impact**: `mergeLintSummary` copies all existing results into a Map
  keyed by file, then rebuilds an array from the entries, then re-counts
  severities in `summarizeLintResults`. The recount duplicates work
  `lintFiles` already did. For large repos this is O(N) extra passes
  on lint output.
- **Remediation**: Accumulate counts directly while merging instead of
  delegating to `summarizeLintResults`.

### L5. `parseGitNameStatus` silently drops the source path of a rename/copy

- **Severity**: Low
- **File:line**: `packages/architect-guard/src/git/name-status.ts:50-56`
- **Impact**: For `R`-status (rename) and `C`-status (copy) entries the
  function pushes only `newPath` into `modified` and discards `oldPath`.
  When a `.feature` file is renamed, the old path's deletion is not
  reported, so the FSM machinery never sees that the old spec is gone —
  which matters for `completed → deleted` style flows (out of scope of
  the current FSM but worth flagging).
- **Remediation**: Push `oldPath` into `deleted` for `R`-status entries
  (rename = add-new + delete-old). Decide explicitly whether `C`-status
  (copy) should also report the source — `C` typically leaves the source
  intact, so dropping it is correct.

---

## Cross-cutting themes

1. **Heuristic-based FSM gate**. The `unlock-reason` workflow (C1, C2,
   M2) is built on layered substring matches and weak validation. The FSM
   is the single most load-bearing invariant in this package, and it
   currently rests on `line.includes('unlock-reason')`. A unified "parse
   once at the boundary" pass over the diff that produces a typed
   `DiffEvent[]` (status changes, unlock-reason declarations with values,
   deliverable changes, docstring state) would replace four separate
   line-scanners and eliminate the docstring-boundary class of bugs.

2. **Bare `catch {}` is endemic**. Anti-pattern detectors, idea-tier
   runner, step runner, session-state reader all silently swallow read
   errors. The package's contract is to emit verdicts; fail-closed
   without surfacing is a contract violation. A shared `readFileSafe`
   that returns `Result<string, ReadError>` and routes errors to a
   diagnostics channel would clean every site at once.

3. **No exhaustiveness binding rule unions to handlers**. H4 documents
   the missing `ProcessGuardRule` → handler mapping. The same pattern
   appears for `ViolationSeverity`, `SessionStatus`, and `ValidationMode` —
   each enumerates a closed union and switches on it elsewhere without
   a `never` sentinel. The package would benefit from a single
   `assertNever(x: never): never` import and disciplined use at every
   union switch.

4. **`TagRegistry` plumbing is inconsistent**. The registry is threaded
   into `detect-changes` and `lint-patterns` rule context, but dropped
   in `validateChanges` (C3) and in anti-pattern formatter output. The
   prefix-aware error-message contract is half-honored. A single
   `RuntimeContext { registry, baseDir, diagnostics }` passed into every
   verb would remove the per-call wiring.

5. **Anti-pattern detectors re-read files the scanner has already
   parsed** (H1, M5). The ADR-006 carve-out permits raw scanner output
   consumption, but disk re-reads are a separate concern and they happen
   inside loops that already have `ScannedGherkinFile` in hand. Moving
   to scanner-output-only would simplify the carve-out's surface and
   eliminate three swallow-errors sites.

6. **No perf gate parallels the projection package's 1.5× baseline**.
   `architect-projection` has a documented latency budget enforced in CI;
   `architect-guard` does not. With ~9.1k LOC of CLI-facing code on the
   pre-commit path, latency drift will silently degrade. A small fixture
   (50 features + 100 TS files) with a wall-clock budget would catch
   regressions early.

7. **The 1132-LOC `tier-a-baseline.ts`** is a maintenance hazard (L2)
   and a clear signal that the upstream issues it suppresses should be
   chipped down rather than allowed to grow. The inline array shape also
   makes diffs noisy. Splitting into per-package JSON (already done for
   `dangling-baseline.json`) would let baseline drift be audited per
   directory.
