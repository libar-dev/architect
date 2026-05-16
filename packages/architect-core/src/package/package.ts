import { z } from 'zod';

export const PackageSchema = z.strictObject({
  id: z
    .string()
    .min(1, 'Package id cannot be empty')
    .regex(/^[a-z0-9][a-z0-9-]*$/u, 'Package id must be a kebab-case slug'),
  displayName: z.string().min(1, 'Package displayName cannot be empty'),
});

export type Package = z.infer<typeof PackageSchema>;
