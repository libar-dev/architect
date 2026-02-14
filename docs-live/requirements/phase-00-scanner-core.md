# ✅ Scanner Core

**Purpose:** Detailed requirements for the Scanner Core feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | Scanner   |

## Description

The scanPatterns function orchestrates file discovery, directive detection,
and AST parsing to extract documentation directives from TypeScript files.

**Problem:**

- Need to scan entire codebases for documentation directives efficiently
- Files without @libar-docs opt-in should be skipped to save processing time
- Parse errors in one file shouldn't prevent scanning of other files
- Must support exclusion patterns for node_modules, tests, and custom paths

**Solution:**

- scanPatterns uses glob patterns for flexible file discovery
- Two-phase filtering: quick regex check, then file opt-in validation
- Result monad pattern captures errors without failing entire scan
- Configurable exclude patterns with sensible defaults
- Extracts complete directive information (tags, description, examples, exports)

## Acceptance Criteria

**Scan files and extract directives**

- Given a file "src/auth.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 1 file
- And the scan should have 0 errors
- And file "auth.ts" should have 1 directive
- And the directive should have tag "@libar-docs-core"
- And the directive should have 1 export

```markdown
/\*\*

- @libar-docs
  \*/

/\*\*

- @libar-docs-core @libar-docs-security
- Authentication utilities
  \*/
  export function authenticate(username: string, password: string): boolean {
  return true;
  }
```

**Skip files without directives**

- Given a file "src/no-directive.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 0 files
- And the scan should have 0 errors

```markdown
export function regular() {
return 'no directive here';
}
```

**Collect errors for files that fail to parse**

- Given a file "src/valid.ts" with content:
- And a file "src/invalid.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 1 file
- And file "valid.ts" should be in the results
- And the scan should have 1 error
- And the error should reference file "invalid.ts"

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Valid file
  \*/
  export function valid() {
  return true;
  }
```

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- This will fail
  \*/
  export function broken(
  // Missing closing
```

**Always return Ok result even with broken files**

- Given a file "src/broken1.ts" with content:
- And a file "src/broken2.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 0 files
- And the scan should have 0 errors

```markdown
export function broken(
```

```markdown
export function broken(
```

**Handle multiple files with multiple directives each**

- Given a file "src/file1.ts" with content:
- And a file "src/file2.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 2 files
- And the scan should have 0 errors
- And file "file1.ts" should have 2 directives
- And file "file2.ts" should have 1 directive

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- First directive
  \*/
  export function first() {}

/\*\*

- @libar-docs-domain
- Second directive
  \*/
  export function second() {}
```

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-validation
- Third directive
  \*/
  export function third() {}
```

**Return empty results when no patterns match**

- When scanning with pattern "nonexistent/\*_/_.ts"
- Then the scan should succeed with 0 files
- And the scan should have 0 errors

**Respect exclusion patterns**

- Given a file "src/public.ts" with content:
- And a file "src/internal/secret.ts" with content:
- When scanning with pattern "src/**/\*.ts" excluding "**/internal/\*\*"
- Then the scan should succeed with 1 file
- And file "public.ts" should be in the results
- And file "internal" should not be in the results

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Public API
  \*/
  export function publicApi() {}
```

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Internal implementation
  \*/
  export function internalImpl() {}
```

**Extract complete directive information**

- Given a file "src/complete.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 1 file
- And the scan should have 0 errors
- And the directive should have tags "@libar-docs-core" and "@libar-docs-validation"
- And the directive description should contain "Validates user input"
- And the directive description should also contain "comprehensive validation"
- And the directive should have 1 example
- And the directive example should contain "validate({ name"
- And the directive code should contain "export function validate"
- And the directive code should also contain "Object.keys(input)"
- And the directive should have 1 export named "validate" of type "function"

````markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core @libar-docs-validation
- Validates user input
-
- This function performs comprehensive validation
- of user-provided data.
-
- @example
- ```typescript

  ```
- const isValid = validate({ name: 'John' });
- ```
   */
  export function validate(input: Record<string, unknown>): boolean {
    return Object.keys(input).length > 0;
  }
  ```
````

**Handle files with quick directive check optimization**

- Given a file "src/no-docs.ts" with content:
- And a file "src/with-docs.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 1 file
- And file "with-docs.ts" should be in the results

```markdown
export function regular() {
return 'no docs';
}
```

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Documented
  \*/
  export function documented() {
  return 'documented';
  }
```

**Skip files without @libar-docs file-level opt-in**

- Given a file "src/no-optin.ts" with content:
- And a file "src/with-optin.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 1 file
- And file "with-optin.ts" should be in the results
- And the scan should have 0 errors

```markdown
/\*\*

- @libar-docs-core
- This file has section tags but no file-level opt-in
  \*/
  export function noOptIn() {}
```

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- This file has proper opt-in
  \*/
  export function withOptIn() {}
```

**Not confuse @libar-docs-\* with @libar-docs opt-in**

- Given a file "src/section-only.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 0 files
- And the scan should have 0 errors

```markdown
/\*\*

- @libar-docs-core @libar-docs-event-sourcing
- Multiple section tags but no opt-in
  \*/
  export function sectionOnly() {}
```

**Detect @libar-docs opt-in combined with section tags**

- Given a file "src/combined.ts" with content:
- When scanning with pattern "src/\*_/_.ts"
- Then the scan should succeed with 1 file
- And file "combined.ts" should have 1 directive
- And the directive should have tag "@libar-docs-core"
- And the scan should have 0 errors

```markdown
/\*\*

- @libar-docs @libar-docs-core
- Combined opt-in and section tag
  \*/
  export function combined() {}
```

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
