@libar-docs
@scanner @libar-docs-pattern:FileDiscovery @unit
@libar-docs-status:completed
@libar-docs-product-area:Annotation
Feature: File Discovery
  The file discovery system uses glob patterns to find TypeScript files
  for documentation extraction. It applies sensible defaults to exclude
  common non-source directories like node_modules, dist, and test files.

  Background:
    Given a file discovery context with temp directory

  Rule: Glob patterns match TypeScript source files

    **Invariant:** findFilesToScan must return absolute paths for all files matching the configured glob patterns.
    **Rationale:** Downstream pipeline stages (AST parser, extractor) require absolute paths to read file contents; relative paths would break when baseDir differs from cwd.
    **Verified by:** Find TypeScript files matching glob patterns, Return absolute paths, Support multiple glob patterns

    @function:findFilesToScan @happy-path
    Scenario: Find TypeScript files matching glob patterns
      Given a directory structure:
        | path          | content  |
        | src/file1.ts  | // test  |
        | src/file2.ts  | // test  |
      And scanner config with patterns:
        | pattern       |
        | src/**/*.ts   |
      When files are scanned
      Then 2 files should be found
      And files ending with should be found:
        | ending    |
        | file1.ts  |
        | file2.ts  |

    @function:findFilesToScan @paths
    Scenario: Return absolute paths
      Given a directory structure:
        | path        | content  |
        | src/app.ts  | // test  |
      And scanner config with patterns:
        | pattern       |
        | src/**/*.ts   |
      When files are scanned
      Then 1 file should be found
      And all found paths should be absolute

    @function:findFilesToScan @paths
    Scenario: Support multiple glob patterns
      Given a directory structure:
        | path          | content  |
        | src/app.ts    | // src   |
        | lib/utils.ts  | // lib   |
      And scanner config with patterns:
        | pattern       |
        | src/**/*.ts   |
        | lib/**/*.ts   |
      When files are scanned
      Then 2 files should be found
      And files containing should be found:
        | substring |
        | src       |
        | lib       |

  Rule: Default exclusions filter non-source files

    **Invariant:** node_modules, dist, .test.ts, .spec.ts, and .d.ts files must be excluded by default without explicit configuration.
    **Rationale:** Scanning generated output (dist), third-party code (node_modules), or test files would produce false positives in the pattern registry and waste processing time.
    **Verified by:** Exclude node_modules by default, Exclude dist directory by default, Exclude test files by default, Exclude .d.ts declaration files

    @function:findFilesToScan @exclusions
    Scenario: Exclude node_modules by default
      Given a directory structure:
        | path                      | content  |
        | node_modules/package.ts   | // test  |
        | src/app.ts                | // test  |
      And scanner config with patterns:
        | pattern     |
        | **/*.ts     |
      When files are scanned
      Then no files containing "node_modules" should be found
      And a file ending with "app.ts" should be found

    @function:findFilesToScan @exclusions
    Scenario: Exclude dist directory by default
      Given a directory structure:
        | path              | content  |
        | dist/compiled.ts  | // test  |
        | src/source.ts     | // test  |
      And scanner config with patterns:
        | pattern     |
        | **/*.ts     |
      When files are scanned
      Then no files containing "dist" should be found
      And a file ending with "source.ts" should be found

    @function:findFilesToScan @exclusions
    Scenario: Exclude test files by default
      Given a directory structure:
        | path             | content  |
        | src/app.test.ts  | // test  |
        | src/app.spec.ts  | // test  |
        | src/app.ts       | // test  |
      And scanner config with patterns:
        | pattern       |
        | src/**/*.ts   |
      When files are scanned
      Then files ending with should NOT be found:
        | ending    |
        | .test.ts  |
        | .spec.ts  |
      And a file ending with "app.ts" should be found

    @function:findFilesToScan @exclusions
    Scenario: Exclude .d.ts declaration files
      Given a directory structure:
        | path            | content         |
        | src/types.d.ts  | // declarations |
        | src/app.ts      | // source       |
      And scanner config with patterns:
        | pattern       |
        | src/**/*.ts   |
      When files are scanned
      Then no files ending with ".d.ts" should be found
      And a file ending with "app.ts" should be found

  Rule: Custom configuration extends discovery behavior

    **Invariant:** User-provided exclude patterns must be applied in addition to (not replacing) the default exclusions.
    **Rationale:** Replacing defaults with custom patterns would silently re-include node_modules and dist, causing false positives in the pattern registry.
    **Verified by:** Respect custom exclude patterns, Return empty array when no files match, Handle nested directory structures

    @function:findFilesToScan @exclusions
    Scenario: Respect custom exclude patterns
      Given a directory structure:
        | path                   | content     |
        | src/internal/secret.ts | // internal |
        | src/public/api.ts      | // public   |
      And scanner config with patterns:
        | pattern       |
        | src/**/*.ts   |
      And exclude patterns:
        | pattern          |
        | **/internal/**   |
      When files are scanned
      Then no files containing "internal" should be found
      And a file containing "public" should be found

    @function:findFilesToScan @edge-case
    Scenario: Return empty array when no files match
      Given scanner config with patterns:
        | pattern              |
        | nonexistent/**/*.ts  |
      When files are scanned
      Then 0 files should be found

    @function:findFilesToScan @edge-case
    Scenario: Handle nested directory structures
      Given a directory structure:
        | path                           | content   |
        | src/components/auth/login.ts   | // login  |
      And scanner config with patterns:
        | pattern       |
        | src/**/*.ts   |
      When files are scanned
      Then 1 file should be found
      And a file containing "components/auth/login.ts" should be found
