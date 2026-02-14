@libar-docs
@lint @libar-docs-pattern:LintEngineTesting
@libar-docs-implements:LintEngine
@libar-docs-status:completed
@libar-docs-product-area:Lint
Feature: Lint Engine
  The lint engine orchestrates rule execution, aggregates violations,
  and formats output for human and machine consumption.

  The engine provides:
  - Single directive linting
  - Multi-file batch linting
  - Failure detection (with strict mode)
  - Violation sorting
  - Pretty and JSON output formats

  Background:
    Given a lint engine context

  # ============================================================================
  # lintDirective - Single Directive Linting
  # ============================================================================

  @function:lintDirective @happy-path
  Scenario: Return empty array when all rules pass
    Given a directive with all required fields:
      | field       | value                                      |
      | patternName | TestPattern                                |
      | status      | completed                                  |
      | whenToUse   | When testing                               |
      | uses        | OtherPattern                               |
      | description | A meaningful description for testing.      |
    When I lint the directive with default rules
    Then the violation count should be 0

  @function:lintDirective
  Scenario: Return violations for failing rules
    Given a directive with no fields set
    When I lint the directive with default rules
    Then the violation count should be greater than 0
    And the violations should include rule "missing-pattern-name"

  @function:lintDirective
  Scenario: Run all provided rules
    Given a directive with no fields set
    And custom rules:
      | id    | severity |
      | rule1 | error    |
      | rule2 | warning  |
      | rule3 | info     |
    When I lint the directive with custom rules
    Then the violation count should be 3
    And the violations should have rules:
      | ruleId |
      | rule1  |
      | rule2  |
      | rule3  |

  @function:lintDirective
  Scenario: Include correct file and line in violations
    Given a directive with no fields set
    And a custom rule "test-rule" with severity "error"
    And the directive location is "/path/to/file.ts" at line 42
    When I lint the directive with custom rules
    Then the first violation should have file "/path/to/file.ts"
    And the first violation should have line 42

  # ============================================================================
  # lintFiles - Multi-File Batch Linting
  # ============================================================================

  @function:lintFiles @happy-path
  Scenario: Return empty results for clean files
    Given clean directives in files:
      | file       |
      | /file1.ts  |
      | /file2.ts  |
    When I lint all files with default rules
    Then the result count should be 0
    And the error count should be 0
    And the warning count should be 0
    And the info count should be 0
    And the files scanned should be 2
    And the directives checked should be 2

  @function:lintFiles
  Scenario: Collect violations by file
    Given dirty directives in files:
      | file       | line |
      | /file1.ts  | 1    |
      | /file2.ts  | 5    |
    When I lint all files with default rules
    Then the result count should be 2
    And results should include files:
      | file      |
      | /file1.ts |
      | /file2.ts |

  @function:lintFiles
  Scenario: Count violations by severity
    Given a directive with no fields set
    And custom rules:
      | id | severity |
      | e1 | error    |
      | e2 | error    |
      | w1 | warning  |
      | i1 | info     |
    And the directive is in file "/file.ts"
    When I lint all files with custom rules
    Then the error count should be 2
    And the warning count should be 1
    And the info count should be 1

  @function:lintFiles
  Scenario: Handle multiple directives per file
    Given multiple directives in "/file.ts":
      | patternName | status      | line |
      | A           |             | 1    |
      | B           | implemented | 50   |
    When I lint all files with default rules
    Then the directives checked should be 2
    And the result count should be 1
    And the first result should have more than 1 violation

  # ============================================================================
  # hasFailures - Failure Detection
  # ============================================================================

  @function:hasFailures
  Scenario: Return true when there are errors
    Given a lint summary with:
      | errorCount | warningCount | infoCount |
      | 1          | 0            | 0         |
    Then hasFailures should return true in normal mode
    And hasFailures should return true in strict mode

  @function:hasFailures
  Scenario: Return false for warnings only in non-strict mode
    Given a lint summary with:
      | errorCount | warningCount | infoCount |
      | 0          | 5            | 0         |
    Then hasFailures should return false in normal mode

  @function:hasFailures
  Scenario: Return true for warnings in strict mode
    Given a lint summary with:
      | errorCount | warningCount | infoCount |
      | 0          | 1            | 0         |
    Then hasFailures should return true in strict mode

  @function:hasFailures
  Scenario: Return false for info only
    Given a lint summary with:
      | errorCount | warningCount | infoCount |
      | 0          | 0            | 10        |
    Then hasFailures should return false in normal mode
    And hasFailures should return false in strict mode

  @function:hasFailures @happy-path
  Scenario: Return false when no violations
    Given a lint summary with:
      | errorCount | warningCount | infoCount | filesScanned | directivesChecked |
      | 0          | 0            | 0         | 10           | 50                |
    Then hasFailures should return false in normal mode
    And hasFailures should return false in strict mode

  # ============================================================================
  # sortViolationsBySeverity
  # ============================================================================

  @function:sortViolationsBySeverity
  Scenario: Sort errors first then warnings then info
    Given violations:
      | rule  | severity | line |
      | info1 | info     | 1    |
      | warn1 | warning  | 2    |
      | err1  | error    | 3    |
      | warn2 | warning  | 4    |
      | err2  | error    | 5    |
    When I sort violations by severity
    Then the severity order should be:
      | severity |
      | error    |
      | error    |
      | warning  |
      | warning  |
      | info     |

  @function:sortViolationsBySeverity
  Scenario: Sort by line number within same severity
    Given violations:
      | rule | severity | line |
      | e1   | error    | 50   |
      | e2   | error    | 10   |
      | e3   | error    | 30   |
    When I sort violations by severity
    Then the line order should be:
      | line |
      | 10   |
      | 30   |
      | 50   |

  @function:sortViolationsBySeverity
  Scenario: Not mutate original array
    Given violations:
      | rule | severity | line |
      | info | info     | 1    |
      | err  | error    | 2    |
    When I sort violations by severity
    Then the original first violation should have severity "info"
    And the sorted first violation should have severity "error"

  # ============================================================================
  # formatPretty - Human Readable Output
  # ============================================================================

  @function:formatPretty @happy-path
  Scenario: Show success message when no violations
    Given a lint summary with:
      | errorCount | warningCount | infoCount | filesScanned | directivesChecked |
      | 0          | 0            | 0         | 10           | 25                |
    When I format the summary as pretty
    Then the output should contain:
      | text                  |
      | No issues found       |
      | 25 directives checked |

  @function:formatPretty
  Scenario: Format violations with file line severity and message
    Given a lint summary with violations:
      | file              | line | severity | rule      | message            |
      | /path/to/file.ts  | 42   | error    | test-rule | Test error message |
    When I format the summary as pretty
    Then the output should contain:
      | text               |
      | /path/to/file.ts   |
      | 42:1               |
      | error              |
      | test-rule          |
      | Test error message |

  @function:formatPretty
  Scenario: Show summary line with counts
    Given a lint summary with violations:
      | file   | line | severity | rule | message |
      | /f.ts  | 1    | error    | e    |         |
      | /f.ts  | 2    | warning  | w    |         |
    When I format the summary as pretty
    Then the output should contain:
      | text      |
      | 1 error   |
      | 1 warning |

  @function:formatPretty
  Scenario: Filter out warnings and info in quiet mode
    Given a lint summary with violations:
      | file   | line | severity | rule | message |
      | /f.ts  | 1    | error    | e    | Error   |
      | /f.ts  | 2    | warning  | w    | Warning |
      | /f.ts  | 3    | info     | i    | Info    |
    When I format the summary as pretty with quiet mode
    Then the output should contain "Error"
    And the output should not contain:
      | text    |
      | Warning |
      | Info    |

  # ============================================================================
  # formatJson - Machine Readable Output
  # ============================================================================

  @function:formatJson
  Scenario: Return valid JSON
    Given a lint summary with violations:
      | file     | line | severity | rule | message |
      | /test.ts | 1    | error    | test | msg     |
    When I format the summary as JSON
    Then the JSON should be valid
    And the JSON results count should be 1
    And the JSON summary errors should be 1

  @function:formatJson
  Scenario: Include all summary fields
    Given a lint summary with:
      | errorCount | warningCount | infoCount | filesScanned | directivesChecked |
      | 2          | 3            | 5         | 10           | 25                |
    When I format the summary as JSON
    Then the JSON summary should match:
      | field             | value |
      | errors            | 2     |
      | warnings          | 3     |
      | info              | 5     |
      | filesScanned      | 10    |
      | directivesChecked | 25    |

  @function:formatJson
  Scenario: Include violation details
    Given a lint summary with violations:
      | file           | line | severity | rule    | message          |
      | /path/file.ts  | 42   | warning  | rule-id | Detailed message |
    When I format the summary as JSON
    Then the first JSON violation should have:
      | field    | value            |
      | rule     | rule-id          |
      | severity | warning          |
      | message  | Detailed message |
      | line     | 42               |
