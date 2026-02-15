# ✅ Lint Engine Testing

**Purpose:** Detailed requirements for the Lint Engine Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Validation |

## Description

The lint engine orchestrates rule execution, aggregates violations,
and formats output for human and machine consumption.

The engine provides:

- Single directive linting
- Multi-file batch linting
- Failure detection (with strict mode)
- Violation sorting
- Pretty and JSON output formats

## Acceptance Criteria

**Return empty array when all rules pass**

- Given a directive with all required fields:
- When I lint the directive with default rules
- Then the violation count should be 0

| field       | value                                 |
| ----------- | ------------------------------------- |
| patternName | TestPattern                           |
| status      | completed                             |
| whenToUse   | When testing                          |
| uses        | OtherPattern                          |
| description | A meaningful description for testing. |

**Return violations for failing rules**

- Given a directive with no fields set
- When I lint the directive with default rules
- Then the violation count should be greater than 0
- And the violations should include rule "missing-pattern-name"

**Run all provided rules**

- Given a directive with no fields set
- And custom rules:
- When I lint the directive with custom rules
- Then the violation count should be 3
- And the violations should have rules:

| id    | severity |
| ----- | -------- |
| rule1 | error    |
| rule2 | warning  |
| rule3 | info     |

| ruleId |
| ------ |
| rule1  |
| rule2  |
| rule3  |

**Include correct file and line in violations**

- Given a directive with no fields set
- And a custom rule "test-rule" with severity "error"
- And the directive location is "/path/to/file.ts" at line 42
- When I lint the directive with custom rules
- Then the first violation should have file "/path/to/file.ts"
- And the first violation should have line 42

**Return empty results for clean files**

- Given clean directives in files:
- When I lint all files with default rules
- Then the result count should be 0
- And the error count should be 0
- And the warning count should be 0
- And the info count should be 0
- And the files scanned should be 2
- And the directives checked should be 2

| file      |
| --------- |
| /file1.ts |
| /file2.ts |

**Collect violations by file**

- Given dirty directives in files:
- When I lint all files with default rules
- Then the result count should be 2
- And results should include files:

| file      | line |
| --------- | ---- |
| /file1.ts | 1    |
| /file2.ts | 5    |

| file      |
| --------- |
| /file1.ts |
| /file2.ts |

**Count violations by severity**

- Given a directive with no fields set
- And custom rules:
- And the directive is in file "/file.ts"
- When I lint all files with custom rules
- Then the error count should be 2
- And the warning count should be 1
- And the info count should be 1

| id  | severity |
| --- | -------- |
| e1  | error    |
| e2  | error    |
| w1  | warning  |
| i1  | info     |

**Handle multiple directives per file**

- Given multiple directives in "/file.ts":
- When I lint all files with default rules
- Then the directives checked should be 2
- And the result count should be 1
- And the first result should have more than 1 violation

| patternName | status      | line |
| ----------- | ----------- | ---- |
| A           |             | 1    |
| B           | implemented | 50   |

**Return true when there are errors**

- Given a lint summary with:
- Then hasFailures should return true in normal mode
- And hasFailures should return true in strict mode

| errorCount | warningCount | infoCount |
| ---------- | ------------ | --------- |
| 1          | 0            | 0         |

**Return false for warnings only in non-strict mode**

- Given a lint summary with:
- Then hasFailures should return false in normal mode

| errorCount | warningCount | infoCount |
| ---------- | ------------ | --------- |
| 0          | 5            | 0         |

**Return true for warnings in strict mode**

- Given a lint summary with:
- Then hasFailures should return true in strict mode

| errorCount | warningCount | infoCount |
| ---------- | ------------ | --------- |
| 0          | 1            | 0         |

**Return false for info only**

- Given a lint summary with:
- Then hasFailures should return false in normal mode
- And hasFailures should return false in strict mode

| errorCount | warningCount | infoCount |
| ---------- | ------------ | --------- |
| 0          | 0            | 10        |

**Return false when no violations**

- Given a lint summary with:
- Then hasFailures should return false in normal mode
- And hasFailures should return false in strict mode

| errorCount | warningCount | infoCount | filesScanned | directivesChecked |
| ---------- | ------------ | --------- | ------------ | ----------------- |
| 0          | 0            | 0         | 10           | 50                |

**Sort errors first then warnings then info**

- Given violations:
- When I sort violations by severity
- Then the severity order should be:

| rule  | severity | line |
| ----- | -------- | ---- |
| info1 | info     | 1    |
| warn1 | warning  | 2    |
| err1  | error    | 3    |
| warn2 | warning  | 4    |
| err2  | error    | 5    |

| severity |
| -------- |
| error    |
| error    |
| warning  |
| warning  |
| info     |

**Sort by line number within same severity**

- Given violations:
- When I sort violations by severity
- Then the line order should be:

| rule | severity | line |
| ---- | -------- | ---- |
| e1   | error    | 50   |
| e2   | error    | 10   |
| e3   | error    | 30   |

| line |
| ---- |
| 10   |
| 30   |
| 50   |

**Not mutate original array**

- Given violations:
- When I sort violations by severity
- Then the original first violation should have severity "info"
- And the sorted first violation should have severity "error"

| rule | severity | line |
| ---- | -------- | ---- |
| info | info     | 1    |
| err  | error    | 2    |

**Show success message when no violations**

- Given a lint summary with:
- When I format the summary as pretty
- Then the output should contain:

| errorCount | warningCount | infoCount | filesScanned | directivesChecked |
| ---------- | ------------ | --------- | ------------ | ----------------- |
| 0          | 0            | 0         | 10           | 25                |

| text                  |
| --------------------- |
| No issues found       |
| 25 directives checked |

**Format violations with file line severity and message**

- Given a lint summary with violations:
- When I format the summary as pretty
- Then the output should contain:

| file             | line | severity | rule      | message            |
| ---------------- | ---- | -------- | --------- | ------------------ |
| /path/to/file.ts | 42   | error    | test-rule | Test error message |

| text               |
| ------------------ |
| /path/to/file.ts   |
| 42:1               |
| error              |
| test-rule          |
| Test error message |

**Show summary line with counts**

- Given a lint summary with violations:
- When I format the summary as pretty
- Then the output should contain:

| file  | line | severity | rule | message |
| ----- | ---- | -------- | ---- | ------- |
| /f.ts | 1    | error    | e    |         |
| /f.ts | 2    | warning  | w    |         |

| text      |
| --------- |
| 1 error   |
| 1 warning |

**Filter out warnings and info in quiet mode**

- Given a lint summary with violations:
- When I format the summary as pretty with quiet mode
- Then the output should contain "Error"
- And the output should not contain:

| file  | line | severity | rule | message |
| ----- | ---- | -------- | ---- | ------- |
| /f.ts | 1    | error    | e    | Error   |
| /f.ts | 2    | warning  | w    | Warning |
| /f.ts | 3    | info     | i    | Info    |

| text    |
| ------- |
| Warning |
| Info    |

**Return valid JSON**

- Given a lint summary with violations:
- When I format the summary as JSON
- Then the JSON should be valid
- And the JSON results count should be 1
- And the JSON summary errors should be 1

| file     | line | severity | rule | message |
| -------- | ---- | -------- | ---- | ------- |
| /test.ts | 1    | error    | test | msg     |

**Include all summary fields**

- Given a lint summary with:
- When I format the summary as JSON
- Then the JSON summary should match:

| errorCount | warningCount | infoCount | filesScanned | directivesChecked |
| ---------- | ------------ | --------- | ------------ | ----------------- |
| 2          | 3            | 5         | 10           | 25                |

| field             | value |
| ----------------- | ----- |
| errors            | 2     |
| warnings          | 3     |
| info              | 5     |
| filesScanned      | 10    |
| directivesChecked | 25    |

**Include violation details**

- Given a lint summary with violations:
- When I format the summary as JSON
- Then the first JSON violation should have:

| file          | line | severity | rule    | message          |
| ------------- | ---- | -------- | ------- | ---------------- |
| /path/file.ts | 42   | warning  | rule-id | Detailed message |

| field    | value            |
| -------- | ---------------- |
| rule     | rule-id          |
| severity | warning          |
| message  | Detailed message |
| line     | 42               |

## Business Rules

**Single directive linting validates annotations against rules**

**Invariant:** Every directive is checked against all provided rules and violations include source location.
**Verified by:** Return empty array when all rules pass, Return violations for failing rules, Run all provided rules, Include correct file and line in violations

_Verified by: Return empty array when all rules pass, Return violations for failing rules, Run all provided rules, Include correct file and line in violations_

**Multi-file batch linting aggregates results across files**

**Invariant:** All files and directives are scanned, violations are collected per file, and severity counts are accurate.
**Verified by:** Return empty results for clean files, Collect violations by file, Count violations by severity, Handle multiple directives per file

_Verified by: Return empty results for clean files, Collect violations by file, Count violations by severity, Handle multiple directives per file_

**Failure detection respects strict mode for severity escalation**

**Invariant:** Errors always indicate failure. Warnings only indicate failure in strict mode. Info never indicates failure.
**Verified by:** Return true when there are errors, Return false for warnings only in non-strict mode, Return true for warnings in strict mode, Return false for info only, Return false when no violations

_Verified by: Return true when there are errors, Return false for warnings only in non-strict mode, Return true for warnings in strict mode, Return false for info only, Return false when no violations_

**Violation sorting orders by severity then by line number**

**Invariant:** Sorted output places errors first, then warnings, then info, with stable line-number ordering within each severity. Sorting does not mutate the original array.
**Verified by:** Sort errors first then warnings then info, Sort by line number within same severity, Not mutate original array

_Verified by: Sort errors first then warnings then info, Sort by line number within same severity, Not mutate original array_

**Pretty formatting produces human-readable output with severity counts**

**Invariant:** Pretty output includes file paths, line numbers, severity labels, rule IDs, and summary counts. Quiet mode suppresses non-error violations.
**Verified by:** Show success message when no violations, Format violations with file line severity and message, Show summary line with counts, Filter out warnings and info in quiet mode

_Verified by: Show success message when no violations, Format violations with file line severity and message, Show summary line with counts, Filter out warnings and info in quiet mode_

**JSON formatting produces machine-readable output with full details**

**Invariant:** JSON output is valid, includes all summary fields, and preserves violation details including file, line, severity, rule, and message.
**Verified by:** Return valid JSON, Include all summary fields, Include violation details

_Verified by: Return valid JSON, Include all summary fields, Include violation details_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
