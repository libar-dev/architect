# ✅ Config Schema Validation

**Purpose:** Detailed requirements for the Config Schema Validation feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
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
- And the validated patterns should include "src/\*_/_.ts"

| patterns     | baseDir  |
| ------------ | -------- |
| src/\*_/_.ts | /project |

**ScannerConfigSchema accepts multiple patterns**

- When I validate a scanner config with patterns:
- Then the scanner config should be valid
- And the validated patterns should have 3 items

| pattern        |
| -------------- |
| src/\*_/_.ts   |
| lib/\*_/_.ts   |
| tests/\*_/_.ts |

**ScannerConfigSchema rejects empty patterns array**

- When I validate a scanner config with empty patterns
- Then the scanner config should be invalid
- And the validation error should mention "At least one glob pattern"

**ScannerConfigSchema rejects parent traversal in patterns**

- When I validate a scanner config with pattern "../secret/\*.ts"
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

| pattern           |
| ----------------- |
| \*\*/node_modules |
| \*\*/.git         |

**GeneratorConfigSchema validates correct configuration**

- Given the current working directory as base
- When I validate a generator config with:
- Then the generator config should be valid

| outputDir | registryPath  |
| --------- | ------------- |
| docs      | registry.json |

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

## Business Rules

**ScannerConfigSchema validates scanner configuration**

**Invariant:** Scanner configuration must contain at least one valid glob pattern with no parent directory traversal, and baseDir must resolve to an absolute path.

    **Rationale:** Malformed or malicious glob patterns could scan outside project boundaries, exposing sensitive files.

    **Verified by:** ScannerConfigSchema validates correct configuration, ScannerConfigSchema accepts multiple patterns, ScannerConfigSchema rejects empty patterns array, ScannerConfigSchema rejects parent traversal in patterns, ScannerConfigSchema rejects hidden parent traversal, ScannerConfigSchema normalizes baseDir to absolute path, ScannerConfigSchema accepts optional exclude patterns

_Verified by: ScannerConfigSchema validates correct configuration, ScannerConfigSchema accepts multiple patterns, ScannerConfigSchema rejects empty patterns array, ScannerConfigSchema rejects parent traversal in patterns, ScannerConfigSchema rejects hidden parent traversal, ScannerConfigSchema normalizes baseDir to absolute path, ScannerConfigSchema accepts optional exclude patterns_

**GeneratorConfigSchema validates generator configuration**

**Invariant:** Generator configuration must use a .json registry file and an output directory that does not escape the project root via parent traversal.

    **Rationale:** Non-JSON registry files could introduce parsing vulnerabilities, and unrestricted output paths could overwrite files outside the project.

    **Verified by:** GeneratorConfigSchema validates correct configuration, GeneratorConfigSchema requires .json registry file, GeneratorConfigSchema rejects outputDir with parent traversal, GeneratorConfigSchema accepts relative output directory, GeneratorConfigSchema defaults overwrite to false, GeneratorConfigSchema defaults readmeOnly to false

_Verified by: GeneratorConfigSchema validates correct configuration, GeneratorConfigSchema requires .json registry file, GeneratorConfigSchema rejects outputDir with parent traversal, GeneratorConfigSchema accepts relative output directory, GeneratorConfigSchema defaults overwrite to false, GeneratorConfigSchema defaults readmeOnly to false_

**isScannerConfig type guard narrows unknown values**

**Invariant:** isScannerConfig returns true only for objects that have a non-empty patterns array and a string baseDir.

    **Verified by:** isScannerConfig returns true for valid config, isScannerConfig returns false for invalid config, isScannerConfig returns false for null, isScannerConfig returns false for non-object

_Verified by: isScannerConfig returns true for valid config, isScannerConfig returns false for invalid config, isScannerConfig returns false for null, isScannerConfig returns false for non-object_

**isGeneratorConfig type guard narrows unknown values**

**Invariant:** isGeneratorConfig returns true only for objects that have a string outputDir and a .json registryPath.

    **Verified by:** isGeneratorConfig returns true for valid config, isGeneratorConfig returns false for invalid config, isGeneratorConfig returns false for non-json registry

_Verified by: isGeneratorConfig returns true for valid config, isGeneratorConfig returns false for invalid config, isGeneratorConfig returns false for non-json registry_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
