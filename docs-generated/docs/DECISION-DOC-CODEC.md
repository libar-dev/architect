# DecisionDocCodec

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

## Decision Doc Codec

Parses decision documents (ADR/PDR in .feature format) and extracts content
for documentation generation. Extends patterns from AdrDocumentCodec.

### When to Use

- When extracting content from decision documents for doc generation
- When parsing Rule: blocks for Context/Decision/Consequences sections
- When extracting DocStrings (fenced code blocks) with language tags
- When parsing source mapping tables from decision descriptions

### Source Mapping Table Format

```
| Section | Source File | Extraction Method |
| Intro & Context | THIS DECISION | Decision rule description |
| API Types | src/types.ts | @extract-shapes tag |
```

### Self-Reference Markers

- `THIS DECISION` - Extract from the current decision document
- `THIS DECISION (Rule: X)` - Extract specific Rule: block
- `THIS DECISION (DocString)` - Extract fenced code blocks

---

## Examples

```text
| Section | Source File | Extraction Method |
| Intro & Context | THIS DECISION | Decision rule description |
| API Types | src/types.ts | @extract-shapes tag |
```
