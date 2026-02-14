# ✅ File Discovery

**Purpose:** Detailed documentation for the File Discovery pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Scanner |

## Description

The file discovery system uses glob patterns to find TypeScript files
  for documentation extraction. It applies sensible defaults to exclude
  common non-source directories like node_modules, dist, and test files.

## Acceptance Criteria

**Find TypeScript files matching glob patterns**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then 2 files should be found
- And files ending with should be found:

| path | content |
| --- | --- |
| src/file1.ts | // test |
| src/file2.ts | // test |

| pattern |
| --- |
| src/**/*.ts |

| ending |
| --- |
| file1.ts |
| file2.ts |

**Exclude node_modules by default**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then no files containing "node_modules" should be found
- And a file ending with "app.ts" should be found

| path | content |
| --- | --- |
| node_modules/package.ts | // test |
| src/app.ts | // test |

| pattern |
| --- |
| **/*.ts |

**Exclude dist directory by default**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then no files containing "dist" should be found
- And a file ending with "source.ts" should be found

| path | content |
| --- | --- |
| dist/compiled.ts | // test |
| src/source.ts | // test |

| pattern |
| --- |
| **/*.ts |

**Exclude test files by default**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then files ending with should NOT be found:
- And a file ending with "app.ts" should be found

| path | content |
| --- | --- |
| src/app.test.ts | // test |
| src/app.spec.ts | // test |
| src/app.ts | // test |

| pattern |
| --- |
| src/**/*.ts |

| ending |
| --- |
| .test.ts |
| .spec.ts |

**Exclude .d.ts declaration files**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then no files ending with ".d.ts" should be found
- And a file ending with "app.ts" should be found

| path | content |
| --- | --- |
| src/types.d.ts | // declarations |
| src/app.ts | // source |

| pattern |
| --- |
| src/**/*.ts |

**Respect custom exclude patterns**

- Given a directory structure:
- And scanner config with patterns:
- And exclude patterns:
- When files are scanned
- Then no files containing "internal" should be found
- And a file containing "public" should be found

| path | content |
| --- | --- |
| src/internal/secret.ts | // internal |
| src/public/api.ts | // public |

| pattern |
| --- |
| src/**/*.ts |

| pattern |
| --- |
| **/internal/** |

**Return absolute paths**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then 1 file should be found
- And all found paths should be absolute

| path | content |
| --- | --- |
| src/app.ts | // test |

| pattern |
| --- |
| src/**/*.ts |

**Support multiple glob patterns**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then 2 files should be found
- And files containing should be found:

| path | content |
| --- | --- |
| src/app.ts | // src |
| lib/utils.ts | // lib |

| pattern |
| --- |
| src/**/*.ts |
| lib/**/*.ts |

| substring |
| --- |
| src |
| lib |

**Return empty array when no files match**

- Given scanner config with patterns:
- When files are scanned
- Then 0 files should be found

| pattern |
| --- |
| nonexistent/**/*.ts |

**Handle nested directory structures**

- Given a directory structure:
- And scanner config with patterns:
- When files are scanned
- Then 1 file should be found
- And a file containing "components/auth/login.ts" should be found

| path | content |
| --- | --- |
| src/components/auth/login.ts | // login |

| pattern |
| --- |
| src/**/*.ts |

---

[← Back to Pattern Registry](../PATTERNS.md)
