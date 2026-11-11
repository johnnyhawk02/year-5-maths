// Line drawings of 3-D shapes and their nets, and the facts about them.
import type { DrawingPicture } from './pictures';

type L = [number, number, number, number, boolean?];

export interface Solid {
  name: string;
  faces: number;
  edges: number;
  vertices: number;
  /** Has only flat faces, so faces, edges and vertices can be counted without argument. */
  flat: boolean;
  picture: DrawingPicture;
  net?: DrawingPicture;
}

const draw = (name: string, w: number, h: number, parts: Partial<DrawingPicture>): DrawingPicture => ({ kind: 'drawing', alt: `A drawing of a ${name}`, w, h, ...parts });
const netOf = (name: string, w: number, h: number, polys: [number, number][][]): DrawingPicture => ({ kind: 'drawing', alt: `The net of a ${name}, laid out flat`, w, h, polys });
const rect = (x: number, y: number, w: number, h: number): [number, number][] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

/** A box drawn with its hidden edges dashed. */
function box(name: string, wide: number): DrawingPicture {
  const d = 0.8, top = 0.9, bottom = 2.9;
  const lines: L[] = [
    [0, top, wide, top], [wide, top, wide, bottom], [wide, bottom, 0, bottom], [0, bottom, 0, top],
    [0, top, d, top - d], [d, top - d, wide + d, top - d], [wide + d, top - d, wide, top],
    [wide + d, top - d, wide + d, bottom - d], [wide + d, bottom - d, wide, bottom],
    [d, top - d, d, bottom - d, true], [d, bottom - d, 0, bottom, true], [d, bottom - d, wide + d, bottom - d, true],
  ];
  return draw(name, wide + d, 3, { polys: [[[0, top], [d, top - d], [wide + d, top - d], [wide + d, bottom - d], [wide, bottom], [0, bottom]]], lines });
}

export const SOLIDS: Solid[] = [
  { name: 'cube', faces: 6, edges: 12, vertices: 8, flat: true, picture: box('cube', 2),
    net: netOf('cube', 3, 4, [rect(1, 0, 1, 1), rect(0, 1, 1, 1), rect(1, 1, 1, 1), rect(2, 1, 1, 1), rect(1, 2, 1, 1), rect(1, 3, 1, 1)]) },
  { name: 'cuboid', faces: 6, edges: 12, vertices: 8, flat: true, picture: box('cuboid', 3.4),
    net: netOf('cuboid', 4, 4, [rect(1, 0, 2, 1), rect(1, 1, 2, 1), rect(1, 2, 2, 1), rect(1, 3, 2, 1), rect(0, 1, 1, 1), rect(3, 1, 1, 1)]) },
  { name: 'square-based pyramid', faces: 5, edges: 8, vertices: 5, flat: true,
    picture: draw('square-based pyramid', 3.2, 3, {
      polys: [[[0, 2.9], [2.4, 2.9], [3.2, 2.2], [1.6, 0.1]]],
      lines: [[0, 2.9, 2.4, 2.9], [2.4, 2.9, 3.2, 2.2], [1.6, 0.1, 0, 2.9], [1.6, 0.1, 2.4, 2.9], [1.6, 0.1, 3.2, 2.2], [0, 2.9, 0.8, 2.2, true], [0.8, 2.2, 3.2, 2.2, true], [1.6, 0.1, 0.8, 2.2, true]],
    }),
    net: netOf('square-based pyramid', 3, 3, [rect(1, 1, 1, 1), [[1, 1], [2, 1], [1.5, 0]], [[2, 1], [2, 2], [3, 1.5]], [[1, 2], [2, 2], [1.5, 3]], [[1, 1], [1, 2], [0, 1.5]]]) },
  { name: 'triangular prism', faces: 5, edges: 9, vertices: 6, flat: true,
    picture: draw('triangular prism', 3.6, 3, {
      polys: [[[0, 2.9], [2, 2.9], [3.6, 2.2], [2.6, 0.4], [1, 1.1]]],
      lines: [[0, 2.9, 2, 2.9], [2, 2.9, 1, 1.1], [1, 1.1, 0, 2.9], [1, 1.1, 2.6, 0.4], [2, 2.9, 3.6, 2.2], [2.6, 0.4, 3.6, 2.2], [0, 2.9, 1.6, 2.2, true], [1.6, 2.2, 3.6, 2.2, true], [1.6, 2.2, 2.6, 0.4, true]],
    }),
    net: netOf('triangular prism', 3, 3.6, [rect(0, 0.9, 1, 1.8), rect(1, 0.9, 1, 1.8), rect(2, 0.9, 1, 1.8), [[1, 0.9], [2, 0.9], [1.5, 0.03]], [[1, 2.7], [2, 2.7], [1.5, 3.57]]]) },
  { name: 'triangular-based pyramid', faces: 4, edges: 6, vertices: 4, flat: true,
    picture: draw('triangular-based pyramid', 3, 3, {
      polys: [[[0, 2.9], [2.3, 2.9], [3, 2.1], [1.5, 0.1]]],
      lines: [[0, 2.9, 2.3, 2.9], [2.3, 2.9, 3, 2.1], [1.5, 0.1, 0, 2.9], [1.5, 0.1, 2.3, 2.9], [1.5, 0.1, 3, 2.1], [0, 2.9, 3, 2.1, true]],
    }),
    net: netOf('triangular-based pyramid', 4, 3.5, [[[0, 3.46], [2, 3.46], [1, 1.73]], [[2, 3.46], [4, 3.46], [3, 1.73]], [[1, 1.73], [3, 1.73], [2, 0]], [[1, 1.73], [3, 1.73], [2, 3.46]]]) },
  { name: 'cylinder', faces: 3, edges: 2, vertices: 0, flat: false,
    picture: draw('cylinder', 2.4, 3.4, { polys: [rect(0, 0.5, 2.4, 2.4)], ovals: [[1.2, 2.9, 1.2, 0.45], [1.2, 0.5, 1.2, 0.45]], lines: [[0, 0.5, 0, 2.9], [2.4, 0.5, 2.4, 2.9]] }) },
  { name: 'cone', faces: 2, edges: 1, vertices: 1, flat: false,
    picture: draw('cone', 2.4, 3.4, { polys: [[[0, 2.9], [1.2, 0.1], [2.4, 2.9]]], ovals: [[1.2, 2.9, 1.2, 0.45]], lines: [[0, 2.9, 1.2, 0.1], [2.4, 2.9, 1.2, 0.1]] }) },
  { name: 'sphere', faces: 1, edges: 0, vertices: 0, flat: false,
    picture: draw('sphere', 3, 3, { ovals: [[1.5, 1.5, 1.45, 1.45], [1.5, 1.5, 1.45, 0.45, true]] }) },
];

export const solid = (name: string): Solid => SOLIDS.find((s) => s.name === name)!;
