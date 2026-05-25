import { describe, expect, it } from 'vitest';

import {
  getValidTransitionsFrom,
  isValidStatusValue,
  validateTransition,
} from '../../src/validation/fsm/index.js';

describe('FSM contract seam', () => {
  it('accepts the legal lifecycle transitions', () => {
    expect(validateTransition('roadmap', 'active')).toEqual({
      valid: true,
      from: 'roadmap',
      to: 'active',
    });
    expect(validateTransition('roadmap', 'deferred')).toEqual({
      valid: true,
      from: 'roadmap',
      to: 'deferred',
    });
    expect(validateTransition('active', 'completed')).toEqual({
      valid: true,
      from: 'active',
      to: 'completed',
    });
    expect(validateTransition('active', 'roadmap')).toEqual({
      valid: true,
      from: 'active',
      to: 'roadmap',
    });
    expect(validateTransition('deferred', 'roadmap')).toEqual({
      valid: true,
      from: 'deferred',
      to: 'roadmap',
    });
  });

  it('preserves raw invalid values instead of casting them to fake FSM states', () => {
    expect(validateTransition('candidate', 'active')).toMatchObject({
      valid: false,
      from: 'candidate',
      to: 'active',
      error:
        "Invalid source status 'candidate'. Valid values: roadmap, active, completed, deferred.",
    });

    expect(validateTransition('roadmap', 'candidate')).toMatchObject({
      valid: false,
      from: 'roadmap',
      to: 'candidate',
      error:
        "Invalid target status 'candidate'. Valid values: roadmap, active, completed, deferred.",
    });
  });

  it('surfaces valid alternatives for illegal but well-typed transitions', () => {
    expect(validateTransition('roadmap', 'completed')).toEqual({
      valid: false,
      from: 'roadmap',
      to: 'completed',
      error: "Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first.",
      validAlternatives: getValidTransitionsFrom('roadmap'),
    });
    expect(isValidStatusValue('active')).toBe(true);
    expect(isValidStatusValue('candidate')).toBe(false);
  });
});
