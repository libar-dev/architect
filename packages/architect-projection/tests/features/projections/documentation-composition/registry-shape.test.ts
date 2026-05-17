import { describe, expect, it } from 'vitest';

import {
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY,
  SupportedDocumentationTypeRegistryEntrySchema,
} from '../../../../src/projections/documentation-composition/documentation-type-registry.js';

describe('Documentation-type registry entries match their schema', () => {
  it.each(SUPPORTED_DOCUMENTATION_TYPE_REGISTRY)(
    '$key parses against SupportedDocumentationTypeRegistryEntrySchema',
    (entry) => {
      expect(() => SupportedDocumentationTypeRegistryEntrySchema.parse(entry)).not.toThrow();
    },
  );
});
