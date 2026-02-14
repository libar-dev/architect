# ✅ Gherkin Ast Parser

**Purpose:** Detailed documentation for the Gherkin Ast Parser pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Scanner |

## Description

The Gherkin AST parser extracts feature metadata, scenarios, and steps
  from .feature files for timeline generation and process documentation.

## Acceptance Criteria

**Parse valid feature file with pattern metadata**

- Given a Gherkin feature file with content:
- When the feature file is parsed
- Then parsing should succeed
- And the feature should have properties:
- And the feature tags should be:
- And 1 scenario should be parsed
- And scenario 1 should have properties:
- And scenario 1 should have tags:
- And scenario 1 should have 3 steps
- And scenario 1 step 1 should be:

```markdown
@libar-docs-pattern:ProjectionCategories @libar-docs-phase:15 @libar-docs-status:roadmap
Feature: Projection Categories
  A taxonomy that categorizes projections by purpose.

  @acceptance-criteria @happy-path
  Scenario: Define a View projection
    Given a projection definition
    When category is set to "view"
    Then projection is client-exposed
```

| field | value |
| --- | --- |
| name | Projection Categories |
| description | A taxonomy that categorizes projections by purpose. |
| language | en |

| tag |
| --- |
| pattern:ProjectionCategories |
| phase:15 |
| status:roadmap |

| field | value |
| --- | --- |
| name | Define a View projection |

| tag |
| --- |
| acceptance-criteria |
| happy-path |

| field | value |
| --- | --- |
| keyword | Given |
| text | a projection definition |

**Parse multiple scenarios**

- Given a Gherkin feature file with content:
- When the feature file is parsed
- Then parsing should succeed
- And 2 scenarios should be parsed
- And the scenarios should have names:

```markdown
@libar-docs-pattern:MyPattern
Feature: My Pattern
  Description

  Scenario: First scenario
    Given setup
    When action
    Then result

  Scenario: Second scenario
    Given other setup
    When other action
    Then other result
```

| name |
| --- |
| First scenario |
| Second scenario |

**Handle feature without tags**

- Given a Gherkin feature file with content:
- When the feature file is parsed
- Then parsing should succeed
- And the feature should have no tags

```markdown
Feature: Simple Feature
  A feature without tags

  Scenario: Simple scenario
    Given setup
```

**Return error for malformed Gherkin**

- Given a Gherkin feature file with content:
- When the feature file is parsed
- Then parsing should fail
- And the error should reference file "test.feature"

```markdown
This is not valid Gherkin
@libar-docs-pattern:Invalid
```

**Return error for file without feature**

- Given a Gherkin feature file with content:
- When the feature file is parsed
- Then parsing should fail
- And the error should reference file "test.feature"

```markdown
@libar-docs-pattern:Invalid
# Just a comment
```

---

[← Back to Pattern Registry](../PATTERNS.md)
