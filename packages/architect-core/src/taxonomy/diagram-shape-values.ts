export const DIAGRAM_SHAPE_VALUES = [
  'rectangle',
  'stadium',
  'hexagon',
  'cylinder',
  'diamond',
] as const;

export type DiagramShapeValue = (typeof DIAGRAM_SHAPE_VALUES)[number];
