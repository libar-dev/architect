# ConfigurationReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Presets

- `GENERIC_PRESET` - const
- `LIBAR_GENERIC_PRESET` - const
- `DDD_ES_CQRS_PRESET` - const
- `PresetName` - type
- `PRESETS` - const

### Factory Options

- `CreateDeliveryProcessOptions` - interface
- `createDeliveryProcess` - function

### Types

- `DeliveryProcessConfig` - interface
- `DeliveryProcessInstance` - interface
- `RegexBuilders` - interface

### Config Loader

- `ConfigDiscoveryResult` - interface
- `ConfigLoadError` - interface
- `ConfigLoadResult` - type
- `findConfigFile` - function
- `loadConfig` - function
- `formatConfigError` - function

### RegexBuilders

- `createRegexBuilders` - function
