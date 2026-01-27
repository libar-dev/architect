Feature: Path Transformer
  The transformer module adjusts relative paths in module content based on
  the variation's output location. Paths written relative to project root
  must be adjusted with "../" prefixes when output goes to subdirectories.

  Background:
    Given a markdown content containing relative paths

  # Root variation - no transformation needed
  Scenario: Root variation paths unchanged
    Given content with link "[See docs](docs/architecture/README.md)"
    When transforming for variation path "/"
    Then the content should contain "[See docs](docs/architecture/README.md)"

  # Deep paths - add prefixes
  Scenario: Single-level deep variation adds one prefix
    Given content with link "[See docs](docs/architecture/README.md)"
    When transforming for variation path "/packages"
    Then the content should contain "[See docs](../docs/architecture/README.md)"

  Scenario: Two-level deep variation adds two prefixes
    Given content with link "[See docs](docs/architecture/README.md)"
    When transforming for variation path "/packages/@libar-dev"
    Then the content should contain "[See docs](../../docs/architecture/README.md)"

  Scenario: Three-level deep variation adds three prefixes
    Given content with link "[See docs](docs/architecture/README.md)"
    When transforming for variation path "/packages/@libar-dev/core"
    Then the content should contain "[See docs](../../../docs/architecture/README.md)"

  # URL schemes - never transform
  Scenario Outline: URL schemes are never transformed
    Given content with link "[Link](<url>)"
    When transforming for variation path "/deep/path"
    Then the content should contain "[Link](<url>)"

    Examples:
      | url                                    |
      | https://example.com/path               |
      | http://example.com/path                |
      | mailto:user@example.com                |
      | tel:+1234567890                        |
      | data:text/plain;base64,SGVsbG8=        |
      | ftp://files.example.com/doc.pdf        |
      | file:///path/to/local/file.md          |

  # Absolute paths - never transform
  Scenario: Absolute paths are not transformed
    Given content with link "[Root](/absolute/path.md)"
    When transforming for variation path "/packages"
    Then the content should contain "[Root](/absolute/path.md)"

  # Anchor links - never transform
  Scenario: Anchor links are not transformed
    Given content with link "[Section](#my-section)"
    When transforming for variation path "/packages"
    Then the content should contain "[Section](#my-section)"

  # Already-relative paths - never transform again
  Scenario: Already-relative paths are not transformed
    Given content with link "[Parent](../sibling/file.md)"
    When transforming for variation path "/packages"
    Then the content should contain "[Parent](../sibling/file.md)"

  # Multiple links in content
  Scenario: Multiple links - relative paths transformed
    Given content with multiple links:
      """
      See [Architecture](docs/arch.md) and [API](docs/api.md).
      Also check [External](https://example.com) and [Section](#intro).
      """
    When transforming for variation path "/packages"
    Then the content should contain "[Architecture](../docs/arch.md)"

  Scenario: Multiple links - external URLs unchanged
    Given content with multiple links:
      """
      See [Architecture](docs/arch.md) and [API](docs/api.md).
      Also check [External](https://example.com) and [Section](#intro).
      """
    When transforming for variation path "/packages"
    Then the content should contain "[External](https://example.com)"

  Scenario: Multiple links - anchors unchanged
    Given content with multiple links:
      """
      See [Architecture](docs/arch.md) and [API](docs/api.md).
      Also check [External](https://example.com) and [Section](#intro).
      """
    When transforming for variation path "/packages"
    Then the content should contain "[Section](#intro)"

  # Additive layer path transformation
  Scenario: Additive layer paths transform correctly
    Given content with link "[See docs](docs/architecture/README.md)"
    When transforming for additive layer output ".claude-layers/testing"
    Then the content should contain "[See docs](../../docs/architecture/README.md)"
