import { DEFAULT_STATUS, normalizeStatus, type NormalizedStatus } from '../taxonomy/index.js';
import { SessionTypeSchema, type HandoffSessionType, type SessionType } from '../domain-enums.js';
import { type ZodError } from 'zod';
import { formatZodError } from './errors.js';

export { SessionTypeSchema, type HandoffSessionType, type SessionType };
export type { ZodError };

export function inferHandoffSessionType(status: string | undefined): HandoffSessionType {
  const normalizedStatus: NormalizedStatus = normalizeStatus(status ?? DEFAULT_STATUS);

  switch (normalizedStatus) {
    case 'active':
      return 'implement';
    case 'completed':
      return 'review';
    default:
      return 'design';
  }
}

export function formatUserZodError(error: ZodError, prefix?: string): string {
  return formatZodError(error, prefix).trim();
}

export function extractFirstSentenceRaw(text: string): string {
  if (!text) return '';
  const sentenceEndPattern = /[.!?](?=\s+[A-Z]|\s*$)/;
  const match = sentenceEndPattern.exec(text);
  if (match) {
    return text.slice(0, match.index + 1).trim();
  }
  return text.trim();
}
