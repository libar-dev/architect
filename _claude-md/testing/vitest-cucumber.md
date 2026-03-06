### The Two-Pattern Problem (CRITICAL)

vitest-cucumber uses **TWO COMPLETELY DIFFERENT patterns** depending on scenario type:

| Scenario Type     | Step Pattern                               | Parameter Access                         |
| ----------------- | ------------------------------------------ | ---------------------------------------- |
| `Scenario`        | `{string}`, `{int}` (Cucumber expressions) | Function params: `(_ctx, value: string)` |
| `ScenarioOutline` | `<columnName>` (literal placeholders)      | Variables object: `variables.columnName` |

**Scenario (uses {string}):**

```typescript
Scenario('Create order', ({ Given }) => {
  Given('a customer {string}', async (_ctx: unknown, customerId: string) => {
    state!.customerId = customerId; // customerId captured from {string}
  });
});
```

**ScenarioOutline (uses variables object):**

```typescript
ScenarioOutline(
  'Validate quantity',
  ({ When, Then }, variables: { quantity: string; valid: string }) => {
    When('I set quantity to <quantity>', () => {
      state!.qty = parseInt(variables.quantity); // Access via variables object
    });
    Then('validation returns <valid>', () => {
      expect(state!.isValid).toBe(variables.valid === 'true');
    });
  }
);
```

**Common Mistake (WRONG):**

```typescript
// WRONG - {string} does NOT work in ScenarioOutline
ScenarioOutline('...', ({ When }) => {
  When('I set quantity to {string}', (_ctx, qty: string) => {
    /* FAILS! */
  });
});
```

### vitest-cucumber Rules (CRITICAL)

| Rule                              | Why                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| String patterns only — NO RegExp  | Use `"value {int}"` NOT `/value (\d+)/`. Cucumber expressions: `{int}`, `{string}` |
| Rule: keyword requires Rule()     | Feature with `Rule:` blocks needs `Rule()` + `RuleScenario()` in step defs         |
| DataTable first row = headers     | `\| title \| type \|` then `\| Doc \| guide \|` → `[{title:"Doc", type:"guide"}]`  |
| `\|` escaping is broken           | Use docstrings `"""..."""` for content with pipes                                  |
| `$` in patterns fails             | Avoid `$` character in step text — causes matching issues                          |
| ScenarioOutline needs variables   | `({ Given }, variables: { col: string })` — NOT `{string}` params                  |
| Steps are per-Scenario            | Each `Scenario()` block defines its own steps                                      |
| Multiple `And` same pattern fails | Consolidate into single step with DataTable/docstring                              |

### Quick Reference

| Context           | Pattern       | Access                     | Example                    |
| ----------------- | ------------- | -------------------------- | -------------------------- |
| `Scenario`        | `{string}`    | Function param             | `(_ctx, id: string)`       |
| `Scenario`        | `{int}`       | Function param             | `(_ctx, count: number)`    |
| `ScenarioOutline` | `<column>`    | `variables.column`         | `variables.orderId`        |
| `Rule:` block     | Same as above | Wrap with `RuleScenario()` | See pattern below          |
| DataTable         | N/A           | `(_ctx, table: Row[])`     | First row = headers        |
| Docstring         | N/A           | `(_ctx, doc: string)`      | Use for content with pipes |

**Rule keyword pattern:**

```typescript
// When feature has Rule: blocks, use this pattern:
describeFeature(feature, ({ Background, Rule }) => {
  Rule('Rule name from feature', ({ RuleScenario, RuleScenarioOutline }) => {
    RuleScenario('Scenario name', ({ Given, When, Then }) => {
      // steps with {string}, {int}
    });
    RuleScenarioOutline('Outline name', ({ When }, variables: { col: string }) => {
      // steps with <col>, access via variables.col
    });
  });
});
```

### vitest-cucumber Quirks & Constraints

The library behaves differently than standard Cucumber.js.

| Issue                  | Description                                                                            | Fix                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Docstring stripping    | Markdown headers (`## Header`) inside docstrings may be stripped or parsed incorrectly | Hardcode complex multi-line strings in step definition TS file            |
| Feature descriptions   | Starting a description line with `Given`, `When`, or `Then` breaks the parser          | Ensure free-text descriptions do not start with reserved Gherkin keywords |
| Multiple And same text | Multiple `And` steps with identical text (different values) fail                       | Consolidate into single step with DataTable                               |
| No regex step patterns | `Then(/pattern/, ...)` throws `StepAbleStepExpressionError`                            | Use only string patterns with `{string}`, `{int}` placeholders            |

### Gherkin Parser: Hash Comments in Descriptions (CRITICAL)

**Root Cause:** The @cucumber/gherkin parser interprets `#` at the start of a line as a Gherkin comment, even inside Feature/Rule descriptions. This terminates the description context and causes subsequent lines to fail parsing.

**Symptom:** Parse error like:

```
expected: #EOF, #Comment, #BackgroundLine, #TagLine, #ScenarioLine, #RuleLine, #Empty
got 'generate-docs --decisions ...'
```

**The Problem:**

When you embed code examples in Rule descriptions using `"""` (which becomes literal text, NOT a DocString), any `#` comment inside will break parsing:

```gherkin
Rule: My Rule

    """bash
    # This comment breaks parsing!
    generate-docs --output docs
    """
```

The parser sees:

1. `"""bash` → literal text in description
2. `# This comment...` → Gherkin comment (TERMINATES description)
3. `generate-docs...` → unexpected content (PARSE ERROR)

**Why This Happens:**

- `"""` in descriptions is NOT parsed as DocString delimiters (those only work as step arguments)
- The content becomes plain description text
- `#` at line start is ALWAYS a Gherkin comment in description context

**Workarounds:**

| Option                 | Example                                   | When to Use                        |
| ---------------------- | ----------------------------------------- | ---------------------------------- |
| Remove hash comments   | `generate-docs --output docs`             | Simple cases                       |
| Use `//` instead       | `// Generate docs`                        | When comment syntax doesn't matter |
| Move to step DocString | `Given the script: """bash...`            | When you need executable examples  |
| Manual parsing         | Regex extraction bypassing Gherkin parser | When file must contain `#`         |

**Note:** The `parseDescriptionWithDocStrings()` helper extracts `"""` blocks from description text AFTER parsing succeeds. The issue is the Gherkin parser itself failing before that helper runs.
