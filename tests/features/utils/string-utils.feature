@libar-docs
@libar-docs-pattern:StringUtils
@libar-docs-status:completed
@libar-docs-product-area:CoreTypes
@utils @strings
Feature: String Utility Functions
  String utilities provide consistent text transformations across the codebase.
  These functions handle URL slugification and case conversion with proper
  handling of edge cases like acronyms and special characters.

  **Covered functions:**
  - `slugify` - Convert text to URL-safe slugs (lowercase, alphanumeric, hyphens)
  - `camelCaseToTitleCase` - Convert CamelCase to "Title Case" with spaces

  **Note:** `toKebabCase` is already tested in kebab-case-slugs.feature

  Background:
    Given a string utils test context

  # ============================================================================
  # slugify - URL-safe slug generation
  # ============================================================================

  @function:slugify @happy-path
  Scenario Outline: slugify converts text to URL-safe format
    When I slugify "<input>"
    Then the slug should be "<expected>"

    Examples: Basic text
      | input               | expected            |
      | User Authentication | user-authentication |
      | Hello World         | hello-world         |
      | Simple Test         | simple-test         |

    Examples: Special characters
      | input               | expected       |
      | Create User (v2)    | create-user-v2 |
      | Hello  World!       | hello-world    |
      | Test@#$%Example     | test-example   |
      | multiple   spaces   | multiple-spaces|

    Examples: Case handling
      | input               | expected          |
      | UPPER_CASE_TEXT     | upper-case-text   |
      | MixedCASEtext       | mixedcasetext     |
      | ALL CAPS HERE       | all-caps-here     |

    Examples: Leading/trailing cleanup
      | input               | expected    |
      | ---test---          | test        |
      | --leading           | leading     |
      | trailing--          | trailing    |
      | -both-sides-        | both-sides  |

    Examples: Unicode removal
      | input               | expected    |
      | hello               | hello       |
      | test-word           | test-word   |

  @function:slugify
  Scenario: slugify handles empty-ish input
    When I slugify "---"
    Then the slug should be ""

  @function:slugify
  Scenario: slugify handles single word
    When I slugify "word"
    Then the slug should be "word"

  # ============================================================================
  # camelCaseToTitleCase - Human-readable title generation
  # ============================================================================

  @function:camelCaseToTitleCase @happy-path
  Scenario Outline: camelCaseToTitleCase converts to title case
    When I convert "<input>" to title case
    Then the title should be "<expected>"

    Examples: PascalCase
      | input                      | expected                       |
      | RemainingWorkEnhancement   | Remaining Work Enhancement     |
      | DeciderPattern             | Decider Pattern                |
      | UserAuthentication         | User Authentication            |
      | SimpleTest                 | Simple Test                    |

    Examples: Acronyms preserved
      | input               | expected         |
      | HTTPServer          | HTTP Server      |
      | XMLParser           | XML Parser       |
      | parseJSON           | parse JSON       |
      | APIEndpoint         | API Endpoint     |

    Examples: Known acronyms (DoD, ADR, etc.)
      | input               | expected         |
      | DoDValidator        | DoD Validator    |
      | TypeScriptAST       | TypeScript AST   |
      | GraphQLSchema       | GraphQL Schema   |

    Examples: Numbers
      | input               | expected         |
      | OAuth2Client        | OAuth2 Client    |

    Examples: kebab-case input
      | input               | expected         |
      | remaining-work      | remaining work   |
      | already-kebab       | already kebab    |

    Examples: Mixed patterns
      | input               | expected         |
      | ProcessGuardLinter  | Process Guard Linter |
      | CommandOrchestrator | Command Orchestrator |

  @function:camelCaseToTitleCase
  Scenario: camelCaseToTitleCase handles all-uppercase acronym
    When I convert "DCB" to title case
    Then the title should be "DCB"

  @function:camelCaseToTitleCase
  Scenario: camelCaseToTitleCase handles lowercase word
    When I convert "test" to title case
    Then the title should be "test"
