# ✅ Config Schema Validation

**Purpose:** Detailed requirements for the Config Schema Validation feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Validation |

## Description

Configuration schemas validate scanner and generator inputs with security
  constraints to prevent path traversal attacks and ensure safe file operations.

  **Security focus:**
  - Parent directory traversal (..) is blocked in glob patterns
  - Output directories must be within project bounds
  - Registry files must be .json format
  - Symlink bypass attempts are prevented

## Acceptance Criteria

**ScannerConfigSchema validates correct configuration**

- When I validate a scanner config with:
- Then the scanner config should be valid
- And the validated patterns should include "src/**/*.ts"

| patterns | baseDir |
| --- | --- |
| src/**/*.ts | /project |

**ScannerConfigSchema accepts multiple patterns**

- When I validate a scanner config with patterns:
- Then the scanner config should be valid
- And the validated patterns should have 3 items

| pattern |
| --- |
| src/**/*.ts |
| lib/**/*.ts |
| tests/**/*.ts |

**ScannerConfigSchema rejects empty patterns array**

- When I validate a scanner config with empty patterns
- Then the scanner config should be invalid
- And the validation error should mention "At least one glob pattern"

**ScannerConfigSchema rejects parent traversal in patterns**

- When I validate a scanner config with pattern "../secret/*.ts"
- Then the scanner config should be invalid
- And the validation error should mention "parent directory traversal"

**ScannerConfigSchema rejects hidden parent traversal**

- When I validate a scanner config with pattern "src/../../etc/passwd"
- Then the scanner config should be invalid
- And the validation error should mention "parent directory traversal"

**ScannerConfigSchema normalizes baseDir to absolute path**

- When I validate a scanner config with baseDir "relative/path"
- Then the scanner config should be valid
- And the validated baseDir should be an absolute path

**ScannerConfigSchema accepts optional exclude patterns**

- When I validate a scanner config with exclude patterns:
- Then the scanner config should be valid
- And the validated exclude should have 2 items

| pattern |
| --- |
| **/node_modules |
| **/.git |

**GeneratorConfigSchema validates correct configuration**

- Given the current working directory as base
- When I validate a generator config with:
- Then the generator config should be valid

| outputDir | registryPath |
| --- | --- |
| docs | registry.json |

**GeneratorConfigSchema requires .json registry file**

- Given the current working directory as base
- When I validate a generator config with registryPath "registry.yaml"
- Then the generator config should be invalid
- And the validation error should mention ".json"

**GeneratorConfigSchema rejects outputDir with parent traversal**

- Given the current working directory as base
- When I validate a generator config with outputDir "../outside"
- Then the generator config should be invalid
- And the validation error should mention "parent traversal"

**GeneratorConfigSchema accepts relative output directory**

- Given the current working directory as base
- When I validate a generator config with outputDir "docs/generated"
- Then the generator config should be valid

**GeneratorConfigSchema defaults overwrite to false**

- Given the current working directory as base
- When I validate a generator config without overwrite
- Then the generator config should be valid
- And the validated overwrite should be false

**GeneratorConfigSchema defaults readmeOnly to false**

- Given the current working directory as base
- When I validate a generator config without readmeOnly
- Then the generator config should be valid
- And the validated readmeOnly should be false

**isScannerConfig returns true for valid config**

- Given a valid scanner config object
- When I check if it is a scanner config
- Then isScannerConfig should return true

**isScannerConfig returns false for invalid config**

- Given an object with missing patterns
- When I check if it is a scanner config
- Then isScannerConfig should return false

**isScannerConfig returns false for null**

- Given a null value
- When I check if it is a scanner config
- Then isScannerConfig should return false

**isScannerConfig returns false for non-object**

- Given a string value "not a config"
- When I check if it is a scanner config
- Then isScannerConfig should return false

**isGeneratorConfig returns true for valid config**

- Given a valid generator config object
- When I check if it is a generator config
- Then isGeneratorConfig should return true

**isGeneratorConfig returns false for invalid config**

- Given an object with missing outputDir
- When I check if it is a generator config
- Then isGeneratorConfig should return false

**isGeneratorConfig returns false for non-json registry**

- Given a generator config with registryPath "data.xml"
- When I check if it is a generator config
- Then isGeneratorConfig should return false

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
