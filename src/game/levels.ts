import type { Grid, Level, Tile } from "./types";

/** The shipped level set, as data. Grows along the teaching curve; every entry
 *  is checked by `validate.ts` in a test, so a level that would render torn
 *  never reaches the page. */

const G = (height = 0): Tile => ({ terrain: "ground", height });
const HOLE = (height = 0): Tile => ({ terrain: "hole", height });

/** A rectangle of flat ground to overwrite. */
function field(rows: number, cols: number, height = 0): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => G(height)));
}

/** L1: a ball, a hole two tiles away, and one card reading 2. There is no
 *  version of this a stranger fails to read, and it spends no words. */
function level1(): Level {
  const grid = field(3, 3);
  grid[1][2] = HOLE();
  return { id: 1, grid, ball: { r: 1, c: 0 }, hand: [{ kind: "move", value: 2 }] };
}

export const LEVELS: Level[] = [level1()];

export { field, G, HOLE };
