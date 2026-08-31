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

/** L4: the first sheer step. The ball rolls up to ground one level above it
 *  and stops dead against it, which is the whole of what `wall` used to mean.
 *
 *  The ball approaches from the front --- from a tile with a *higher* r+c than
 *  the raised one. Isometric painting order is r+c, so a raised slab covers
 *  what is behind it: a ball stopping on the far side of this step would be
 *  half-hidden by the thing that stopped it. Approaching from the front, the
 *  ball is on top of the pile and always fully visible.
 */
function level4(): Level {
  const grid = field(3, 5);
  grid[1][2] = G(1);
  grid[1][0] = HOLE();
  return {
    id: 4,
    grid,
    ball: { r: 1, c: 4 },
    hand: [
      { kind: "move", value: 1 },
      { kind: "move", value: 4 },
      { kind: "move", value: 1 },
    ],
  };
}

/** L5: the ramp, and the run-up it needs. The hole is on the high ground and a
 *  ramp is the way up --- but a card that would leave the ball standing on the
 *  ramp doesn't set off up it at all. Play the 3 first and it stops at the
 *  ramp's foot with only a 1 left, which cannot clear it: the level is lost,
 *  and the rule has taught itself. */
function level5(): Level {
  const grid = field(3, 5);
  for (let r = 0; r < 3; r++) {
    grid[r][3] = { terrain: "ground", height: 0, ramp: "se" };
    grid[r][4] = G(1);
  }
  grid[1][4] = { terrain: "hole", height: 1 };
  return {
    id: 5,
    grid,
    ball: { r: 1, c: 0 },
    hand: [
      { kind: "move", value: 1 },
      { kind: "move", value: 3 },
    ],
  };
}

export const LEVELS: Level[] = [level1(), level2(), level3(), level4(), level5()];

export { field, G, HOLE };
