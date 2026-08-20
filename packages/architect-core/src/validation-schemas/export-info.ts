/**
 * @architect
 * @architect-pattern ExportInfoContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:validation-schemas
 */
import { z } from 'zod';

const FunctionExportSchema = z.strictObject({
  type: z.literal('function'),
  name: z.string().min(1, 'Export name cannot be empty'),
  signature: z.string().optional(),
});

const TypeExportSchema = z.strictObject({
  type: z.literal('type'),
  name: z.string().min(1, 'Export name cannot be empty'),
});

const ConstExportSchema = z.strictObject({
  type: z.literal('const'),
  name: z.string().min(1, 'Export name cannot be empty'),
  signature: z.string().optional(),
});

const InterfaceExportSchema = z.strictObject({
  type: z.literal('interface'),
  name: z.string().min(1, 'Export name cannot be empty'),
});

const ClassExportSchema = z.strictObject({
  type: z.literal('class'),
  name: z.string().min(1, 'Export name cannot be empty'),
  signature: z.string().optional(),
});

const EnumExportSchema = z.strictObject({
  type: z.literal('enum'),
  name: z.string().min(1, 'Export name cannot be empty'),
});

export const ExportInfoSchema = z.discriminatedUnion('type', [
  FunctionExportSchema,
  TypeExportSchema,
  ConstExportSchema,
  InterfaceExportSchema,
  ClassExportSchema,
  EnumExportSchema,
]);

export type ExportInfo = z.infer<typeof ExportInfoSchema>;

export function isExportInfo(value: unknown): value is ExportInfo {
  return ExportInfoSchema.safeParse(value).success;
}
