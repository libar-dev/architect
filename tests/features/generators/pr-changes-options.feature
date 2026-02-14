@libar-docs
@libar-docs-pattern:PrChangesOptions
@libar-docs-status:completed
@libar-docs-product-area:Generation
@libar-docs-implements:GeneratorInfrastructureTesting
Feature: PR Changes Options

  Tests the PrChangesCodec filtering capabilities for generating PR-scoped
  documentation. The codec filters patterns by changed files and/or release
  version, supporting combined OR logic when both filters are provided.

  Background: PR changes options test context
    Given a PR changes options test context

  # ===========================================================================
  # Rule 1: Orchestrator supports PR changes generation options
  # ===========================================================================

  Rule: Orchestrator supports PR changes generation options

    @acceptance-criteria @happy-path
    Scenario: PR changes filters to explicit file list
      Given patterns from multiple files:
        | name           | status    | filePath             |
        | Core Types     | completed | src/core/types.ts    |
        | Core Utils     | active    | src/core/utils.ts    |
        | Api Endpoint   | completed | src/api/endpoint.ts  |
        | Other Pattern  | completed | src/other/file.ts    |
      And changedFiles lists specific files:
        | file                 |
        | src/core/types.ts    |
        | src/api/endpoint.ts  |
      When generating pr-changes document
      Then only patterns from the changed files are included:
        | name           |
        | Core Types     |
        | Api Endpoint   |

    @acceptance-criteria @happy-path
    Scenario: PR changes filters by release version
      Given patterns with deliverables tagged with different releases:
        | name           | status    | release |
        | Feature A      | completed | v0.1.0  |
        | Feature B      | completed | v0.2.0  |
        | Feature C      | active    | v0.2.0  |
        | Feature D      | completed | v0.3.0  |
      And releaseFilter is "v0.2.0"
      When generating pr-changes document
      Then only release filtered patterns are included:
        | name           |
        | Feature B      |
        | Feature C      |

    @acceptance-criteria @happy-path
    Scenario: Combined filters use OR logic
      Given patterns with various files and releases:
        | name           | status    | filePath             | release |
        | Pattern A      | completed | src/core/types.ts    | v0.1.0  |
        | Pattern B      | completed | src/api/endpoint.ts  | v0.2.0  |
        | Pattern C      | active    | src/other/file.ts    | v0.2.0  |
        | Pattern D      | completed | src/util/helper.ts   | v0.3.0  |
      And changedFiles includes some files:
        | file                 |
        | src/core/types.ts    |
      And releaseFilter is set to "v0.2.0"
      When generating pr-changes document
      Then patterns matching EITHER file OR release are included:
        | name           |
        | Pattern A      |
        | Pattern B      |
        | Pattern C      |
