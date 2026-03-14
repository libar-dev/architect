@architect
@architect-pattern:ConfigSchemaValidation
@architect-status:completed
@architect-product-area:Validation
@validation @config @security
Feature: Configuration Schema Validation
  Configuration schemas validate scanner and generator inputs with security
  constraints to prevent path traversal attacks and ensure safe file operations.

  **Security focus:**
  - Parent directory traversal (..) is blocked in glob patterns
  - Output directories must be within project bounds
  - Registry files must be .json format
  - Symlink bypass attempts are prevented

  Background:
    Given a config schema test context

  Rule: ScannerConfigSchema validates scanner configuration

    **Invariant:** Scanner configuration must contain at least one valid glob pattern with no parent directory traversal, and baseDir must resolve to an absolute path.

    **Rationale:** Malformed or malicious glob patterns could scan outside project boundaries, exposing sensitive files.

    **Verified by:** ScannerConfigSchema validates correct configuration, ScannerConfigSchema accepts multiple patterns, ScannerConfigSchema rejects empty patterns array, ScannerConfigSchema rejects parent traversal in patterns, ScannerConfigSchema rejects hidden parent traversal, ScannerConfigSchema normalizes baseDir to absolute path, ScannerConfigSchema accepts optional exclude patterns

    @schema:ScannerConfigSchema @happy-path
    Scenario: ScannerConfigSchema validates correct configuration
      When I validate a scanner config with:
        | patterns        | baseDir        |
        | src/**/*.ts     | /project       |
      Then the scanner config should be valid
      And the validated patterns should include "src/**/*.ts"

    @schema:ScannerConfigSchema
    Scenario: ScannerConfigSchema accepts multiple patterns
      When I validate a scanner config with patterns:
        | pattern          |
        | src/**/*.ts      |
        | lib/**/*.ts      |
        | tests/**/*.ts    |
      Then the scanner config should be valid
      And the validated patterns should have 3 items

    @schema:ScannerConfigSchema
    Scenario: ScannerConfigSchema rejects empty patterns array
      When I validate a scanner config with empty patterns
      Then the scanner config should be invalid
      And the validation error should mention "At least one glob pattern"

    @schema:ScannerConfigSchema @security
    Scenario: ScannerConfigSchema rejects parent traversal in patterns
      When I validate a scanner config with pattern "../secret/*.ts"
      Then the scanner config should be invalid
      And the validation error should mention "parent directory traversal"

    @schema:ScannerConfigSchema @security
    Scenario: ScannerConfigSchema rejects hidden parent traversal
      When I validate a scanner config with pattern "src/../../etc/passwd"
      Then the scanner config should be invalid
      And the validation error should mention "parent directory traversal"

    @schema:ScannerConfigSchema
    Scenario: ScannerConfigSchema normalizes baseDir to absolute path
      When I validate a scanner config with baseDir "relative/path"
      Then the scanner config should be valid
      And the validated baseDir should be an absolute path

    @schema:ScannerConfigSchema
    Scenario: ScannerConfigSchema accepts optional exclude patterns
      When I validate a scanner config with exclude patterns:
        | pattern          |
        | **/node_modules  |
        | **/.git          |
      Then the scanner config should be valid
      And the validated exclude should have 2 items

  Rule: GeneratorConfigSchema validates generator configuration

    **Invariant:** Generator configuration must use a .json registry file and an output directory that does not escape the project root via parent traversal.

    **Rationale:** Non-JSON registry files could introduce parsing vulnerabilities, and unrestricted output paths could overwrite files outside the project.

    **Verified by:** GeneratorConfigSchema validates correct configuration, GeneratorConfigSchema requires .json registry file, GeneratorConfigSchema rejects outputDir with parent traversal, GeneratorConfigSchema accepts relative output directory, GeneratorConfigSchema defaults overwrite to false, GeneratorConfigSchema defaults readmeOnly to false

    @schema:GeneratorConfigSchema @happy-path
    Scenario: GeneratorConfigSchema validates correct configuration
      Given the current working directory as base
      When I validate a generator config with:
        | outputDir    | registryPath    |
        | docs         | registry.json   |
      Then the generator config should be valid

    @schema:GeneratorConfigSchema
    Scenario: GeneratorConfigSchema requires .json registry file
      Given the current working directory as base
      When I validate a generator config with registryPath "registry.yaml"
      Then the generator config should be invalid
      And the validation error should mention ".json"

    @schema:GeneratorConfigSchema @security
    Scenario: GeneratorConfigSchema rejects outputDir with parent traversal
      Given the current working directory as base
      When I validate a generator config with outputDir "../outside"
      Then the generator config should be invalid
      And the validation error should mention "parent traversal"

    @schema:GeneratorConfigSchema
    Scenario: GeneratorConfigSchema accepts relative output directory
      Given the current working directory as base
      When I validate a generator config with outputDir "docs/generated"
      Then the generator config should be valid

    @schema:GeneratorConfigSchema
    Scenario: GeneratorConfigSchema defaults overwrite to false
      Given the current working directory as base
      When I validate a generator config without overwrite
      Then the generator config should be valid
      And the validated overwrite should be false

    @schema:GeneratorConfigSchema
    Scenario: GeneratorConfigSchema defaults readmeOnly to false
      Given the current working directory as base
      When I validate a generator config without readmeOnly
      Then the generator config should be valid
      And the validated readmeOnly should be false

  Rule: isScannerConfig type guard narrows unknown values

    **Invariant:** isScannerConfig returns true only for objects that have a non-empty patterns array and a string baseDir.

    **Rationale:** Without a reliable type guard, callers cannot safely narrow unknown config objects and risk accessing properties on incompatible types at runtime.

    **Verified by:** isScannerConfig returns true for valid config, isScannerConfig returns false for invalid config, isScannerConfig returns false for null, isScannerConfig returns false for non-object

    @function:isScannerConfig @happy-path
    Scenario: isScannerConfig returns true for valid config
      Given a valid scanner config object
      When I check if it is a scanner config
      Then isScannerConfig should return true

    @function:isScannerConfig
    Scenario: isScannerConfig returns false for invalid config
      Given an object with missing patterns
      When I check if it is a scanner config
      Then isScannerConfig should return false

    @function:isScannerConfig
    Scenario: isScannerConfig returns false for null
      Given a null value
      When I check if it is a scanner config
      Then isScannerConfig should return false

    @function:isScannerConfig
    Scenario: isScannerConfig returns false for non-object
      Given a string value "not a config"
      When I check if it is a scanner config
      Then isScannerConfig should return false

  Rule: isGeneratorConfig type guard narrows unknown values

    **Invariant:** isGeneratorConfig returns true only for objects that have a string outputDir and a .json registryPath.

    **Rationale:** Without a reliable type guard, callers cannot safely narrow unknown config objects and risk passing malformed generator configs that bypass schema validation.

    **Verified by:** isGeneratorConfig returns true for valid config, isGeneratorConfig returns false for invalid config, isGeneratorConfig returns false for non-json registry

    @function:isGeneratorConfig @happy-path
    Scenario: isGeneratorConfig returns true for valid config
      Given a valid generator config object
      When I check if it is a generator config
      Then isGeneratorConfig should return true

    @function:isGeneratorConfig
    Scenario: isGeneratorConfig returns false for invalid config
      Given an object with missing outputDir
      When I check if it is a generator config
      Then isGeneratorConfig should return false

    @function:isGeneratorConfig
    Scenario: isGeneratorConfig returns false for non-json registry
      Given a generator config with registryPath "data.xml"
      When I check if it is a generator config
      Then isGeneratorConfig should return false
