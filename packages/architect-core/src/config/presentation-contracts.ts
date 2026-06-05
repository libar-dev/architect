import type { Block } from './block.js';

export const DIAGRAM_SOURCE_VALUES = [
  'fsm-lifecycle',
  'generation-pipeline',
  'pattern-graph-views',
] as const;

export type DiagramSource = (typeof DIAGRAM_SOURCE_VALUES)[number];

export type ShapeSelector =
  | { readonly group: string }
  | { readonly source: string; readonly names: readonly string[] }
  | { readonly source: string };

export interface DiagramScope {
  readonly archContext?: readonly string[];
  readonly patterns?: readonly string[];
  readonly include?: readonly string[];
  readonly archLayer?: readonly string[];
  readonly direction?: 'TB' | 'LR';
  readonly title?: string;
  readonly diagramType?:
    | 'graph'
    | 'sequenceDiagram'
    | 'stateDiagram-v2'
    | 'C4Context'
    | 'classDiagram';
  readonly showEdgeLabels?: boolean;
  readonly source?: DiagramSource;
}

export interface ReferenceDocConfig {
  readonly title: string;
  readonly conventionTags?: readonly string[];
  readonly behaviorCategories?: readonly string[];
  readonly diagramScopes?: readonly DiagramScope[];
  readonly docsFilename: string;
  readonly shapeSelectors?: readonly ShapeSelector[];
  readonly includeTags?: readonly string[];
  readonly productArea?: string;
  readonly excludeSourcePaths?: readonly string[];
  readonly preamble?: readonly Block[];
  readonly shapesFirst?: boolean;
}

export interface DocumentEntry {
  readonly title: string;
  readonly path: string;
  readonly description: string;
  readonly audience: string;
  readonly topic: string;
}

export interface IndexCodecOptionsContract {
  readonly [key: string]: unknown;
  readonly preamble?: readonly Block[];
  readonly includePackageMetadata?: boolean;
  readonly documentEntries?: readonly DocumentEntry[];
  readonly includeProductAreaStats?: boolean;
  readonly includeDocumentInventory?: boolean;
  readonly purposeText?: string;
  readonly epilogue?: readonly Block[];
  readonly packageMetadataOverrides?: Partial<Record<'name' | 'purpose' | 'license', string>>;
}

export type CodecOptions = Readonly<Record<string, Readonly<Record<string, unknown>>>> & {
  readonly index?: IndexCodecOptionsContract;
};
