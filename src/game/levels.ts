import type { Grid, Level, Tile } from "./types";

/** The shipped level set, as data. Grows along the teaching curve; every entry
 *  is checked by `validate.ts` in a test, so a level that would render torn
 *  never reaches the page. */

const G = (height = 0): Tile => ({ terrain: "ground", height });
const HOLE = (height = 0): Tile => ({ terrain: "hole", height });
const SAND = (height = 0): Tile => ({ terrain: "sand", height });

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

/** L6: the ramp, and the run-up it needs. The hole is on the high ground and a
 *  ramp is the way up --- but a card that would leave the ball standing on the
 *  ramp doesn't set off up it at all. Play the 3 first and it stops at the
 *  ramp's foot with only a 1 left, which cannot clear it: the level is lost,
 *  and the rule has taught itself. */
function level6(): Level {
  const grid = field(3, 5);
  for (let r = 0; r < 3; r++) {
    grid[r][3] = { terrain: "ground", height: 0, ramp: "se" };
    grid[r][4] = G(1);
  }
  grid[1][4] = { terrain: "hole", height: 1 };
  return {
    id: 6,
    grid,
    ball: { r: 1, c: 0 },
    hand: [
      { kind: "move", value: 1 },
      { kind: "move", value: 3 },
    ],
  };
}

/** L5: the other half of height. A step up stops the ball dead; a step down
 *  doesn't, and costs nothing to take --- the ball rolls off the plateau and
 *  keeps whatever movement it had left. Once it is down it cannot get back up,
 *  which the missing arrow says without a word. */
function level5(): Level {
  const grid = field(3, 4);
  for (let r = 0; r < 3; r++) {
    grid[r][0] = G(1);
    grid[r][1] = G(1);
  }
  grid[1][3] = HOLE();
  return {
    id: 5,
    grid,
    ball: { r: 1, c: 0 },
    hand: [
      { kind: "move", value: 2 },
      { kind: "move", value: 1 },
    ],
  };
}

/** L7: sand, learned by rolling through it rather than by being punished for
 *  touching it.
 *
 *  The band crosses the whole board, so there is no way round and the ball
 *  *will* meet it. The first card is a 4 with only two tiles of run before the
 *  sand, so the sand visibly eats the rest of it --- the ball stops halfway
 *  through a move it should have finished, on the one tile that looks
 *  different. Cause and effect, in one roll. Then the hand still has enough
 *  left to finish, so the lesson costs a card and not the level. */
function level7(): Level {
  const grid = field(3, 5);
  for (let r = 0; r < 3; r++) grid[r][2] = SAND();
  grid[2][4] = HOLE();
  return {
    id: 7,
    grid,
    ball: { r: 1, c: 0 },
    hand: [
      { kind: "move", value: 4 },
      { kind: "move", value: 2 },
      { kind: "move", value: 1 },
    ],
  };
}

/** L8: the chasm, and what `jump` is for.
 *
 *  A missing column instead of a wall. The two cards state their difference
 *  by doing, one after the other: roll first and the ball runs to the brink
 *  and stops, in plain view, because there is no ground to carry it on. Then
 *  the arc card goes over the same gap. Nobody has to notice an arrow that
 *  isn't there --- which is how the old version of this level taught it, and
 *  the reason it didn't.
 *
 *  A gap says "not this way" more plainly than a raised slab does, and it has
 *  the side benefit of hiding nothing behind it. */
function level8(): Level {
  const grid = field(3, 5);
  for (let r = 0; r < 3; r++) grid[r][2] = null;
  grid[1][4] = HOLE();
  return {
    id: 8,
    grid,
    ball: { r: 1, c: 0 },
    hand: [
      { kind: "move", value: 3 },
      { kind: "jump", value: 2 },
      { kind: "move", value: 1 },
    ],
  };
}

/** The curve: move, then distance, then four directions with a wrong one among
 *  them, then a step that blocks, a step that doesn't, the ramp between them,
 *  then the card that ignores all of it, and last a level that wants two of
 *  those ideas together. One new idea per level, and every teaching level is
 *  also a puzzle that can be lost. */
export const LEVELS: Level[] = [
  level1(),
  level2(),
  level3(),
  level4(),
  level5(),
  level6(),
  level7(),
  level8(),
];

export { field, G, HOLE };
