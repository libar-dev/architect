# ✅ Generate Tag Taxonomy Cli

**Purpose:** Detailed requirements for the Generate Tag Taxonomy Cli feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | DataAPI   |

## Description

Command-line interface for generating TAG_TAXONOMY.md from tag registry configuration.

## Acceptance Criteria

**Display help with --help flag**

- When running "generate-tag-taxonomy --help"
- Then exit code is 0
- And stdout contains "Usage:"

**Display help with -h flag**

- When running "generate-tag-taxonomy -h"
- Then exit code is 0
- And stdout contains "--output"

**Display version with --version flag**

- When running "generate-tag-taxonomy --version"
- Then exit code is 0
- And stdout contains "generate-tag-taxonomy"

**Display version with -v flag**

- When running "generate-tag-taxonomy -v"
- Then exit code is 0

**Generate taxonomy at default path**

- When running "generate-tag-taxonomy"
- Then exit code is 0
- And stdout contains "Generated:"
- And file "docs/architecture/TAG_TAXONOMY.md" exists in working directory

**Generate taxonomy at custom output path**

- When running "generate-tag-taxonomy -o taxonomy.md"
- Then exit code is 0
- And stdout contains "Generated:"
- And file "taxonomy.md" exists in working directory

**Create output directory if missing**

- When running "generate-tag-taxonomy -o nested/path/taxonomy.md"
- Then exit code is 0
- And file "nested/path/taxonomy.md" exists in working directory

**Fail when output file exists without --overwrite**

- Given file "taxonomy.md" exists with content "existing content"
- When running "generate-tag-taxonomy -o taxonomy.md"
- Then exit code is 1
- And stderr contains "already exists"

**Overwrite existing file with -f flag**

- Given file "taxonomy.md" exists with content "existing content"
- When running "generate-tag-taxonomy -o taxonomy.md -f"
- Then exit code is 0
- And stdout contains "Generated:"
- And file "taxonomy.md" does not contain "existing content"

**Overwrite existing file with --overwrite flag**

- Given file "docs/TAG_TAXONOMY.md" exists with content "ORIGINAL_PLACEHOLDER_CONTENT"
- When running "generate-tag-taxonomy -o docs/TAG_TAXONOMY.md --overwrite"
- Then exit code is 0
- And file "docs/TAG_TAXONOMY.md" does not contain "ORIGINAL_PLACEHOLDER_CONTENT"

**Generated file contains category documentation**

- When running "generate-tag-taxonomy -o taxonomy.md"
- Then exit code is 0
- And file "taxonomy.md" contains "Categories"

**Generated file reports statistics**

- When running "generate-tag-taxonomy -o taxonomy.md"
- Then exit code is 0
- And stdout contains "Categories:"

**Warn on unknown flag but continue**

- When running "generate-tag-taxonomy --unknown-flag -o taxonomy.md"
- Then exit code is 0
- And stderr contains "Warning"
- And file "taxonomy.md" exists in working directory

## Business Rules

**CLI displays help and version information**

_Verified by: Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag_

**CLI generates taxonomy at specified output path**

_Verified by: Generate taxonomy at default path, Generate taxonomy at custom output path, Create output directory if missing_

**CLI respects overwrite flag for existing files**

_Verified by: Fail when output file exists without --overwrite, Overwrite existing file with -f flag, Overwrite existing file with --overwrite flag_

**Generated taxonomy contains expected sections**

_Verified by: Generated file contains category documentation, Generated file reports statistics_

**CLI warns about unknown flags**

_Verified by: Warn on unknown flag but continue_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
