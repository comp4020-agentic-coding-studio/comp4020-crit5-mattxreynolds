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

/** L2: still a corner start, so every direction offered leads somewhere
 *  useful --- but the hand now has to be spent along two axes, and the cards
 *  add up to exactly the distance. Rolling the 3 the wrong way wastes a step
 *  on the board's edge and the level is gone. */
function level2(): Level {
  const grid = field(3, 4);
  grid[2][3] = HOLE();
  return {
    id: 2,
    grid,
    ball: { r: 0, c: 0 },
    hand: [
      { kind: "move", value: 3 },
      { kind: "move", value: 2 },
    ],
  };
}

/** L3: the ball starts away from the edges, so for the first time two of the
 *  four directions lead away from the hole. Cards add up to the distance
 *  exactly, so a single wasted step strands the ball --- this is the level
 *  that makes "a wrong move is possible" true rather than theoretical. */
function level3(): Level {
  const grid = field(4, 5);
  grid[3][4] = HOLE();
  return {
    id: 3,
    grid,
    ball: { r: 1, c: 1 },
    hand: [
      { kind: "move", value: 3 },
      { kind: "move", value: 1 },
      { kind: "move", value: 1 },
    ],
  };
}

export const LEVELS: Level[] = [level1(), level2(), level3()];

export { field, G, HOLE };
