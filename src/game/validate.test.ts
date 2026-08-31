import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import type { Level, Tile } from "./types";
import { validateLevel } from "./validate";

// The vertex-height rule is the one PLAN.md found by rendering an invalid
// level rather than by reasoning: height belongs to grid *vertices*, so a
// ramp's raised corner is shared with three other tiles and they all have to
// agree about it, or the terrain visibly tears.

const g = (height = 0): Tile => ({ terrain: "ground", height });
const grid = (rows: number, cols: number, height = 0): (Tile | null)[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => g(height)));

/** A 3x3 flat board, hole at (1,2), ball at (1,0), one card. */
function flat(): Level {
  const tiles = grid(3, 3);
  tiles[1][2] = { terrain: "hole", height: 0 };
  return { id: 1, grid: tiles, ball: { r: 1, c: 0 }, hand: [{ kind: "move", value: 2 }] };
}

describe("every shipped level", () => {
  it("ships at least one level", () => {
    expect(LEVELS.length).toBeGreaterThan(0);
  });

  for (const level of LEVELS) {
    it(`level ${level.id} is valid`, () => {
      expect(validateLevel(level)).toEqual([]);
    });
  }
});

describe("the vertex-height rule", () => {
  it("accepts a ramp whose raised edge agrees with the ground above it", () => {
    // A row of: ground(0) | ramp rising toward +c | raised ground(1).
    const tiles = grid(1, 3);
    tiles[0][1] = { terrain: "ground", height: 0, ramp: "se" };
    tiles[0][2] = { terrain: "ground", height: 1 };
    tiles[0][0] = { terrain: "hole", height: 0 };
    const level: Level = {
      id: 99,
      grid: tiles,
      ball: { r: 0, c: 2 },
      hand: [{ kind: "move", value: 1 }],
    };
    expect(validateLevel(level)).toEqual([]);
  });

  it("rejects a ramp whose raised edge meets ground at the wrong level, naming the vertex", () => {
    // Same board, but the tile the ramp climbs to is still at height 0: the
    // ramp's raised corners and that tile's corners disagree.
    const tiles = grid(1, 3);
    tiles[0][1] = { terrain: "ground", height: 0, ramp: "se" };
    tiles[0][2] = { terrain: "ground", height: 0 };
    tiles[0][0] = { terrain: "hole", height: 0 };
    const level: Level = {
      id: 99,
      grid: tiles,
      ball: { r: 0, c: 2 },
      hand: [{ kind: "move", value: 1 }],
    };
    const problems = validateLevel(level);
    expect(problems.length).toBeGreaterThan(0);
    expect(
      problems.some((p) => /vertex \(0,\s*2\)/.test(p)),
      `no problem named the torn vertex: ${problems.join(" | ")}`,
    ).toBe(true);
  });

  it("rejects a sheer step dressed up as a ramp on only one side of a boundary", () => {
    // Two tiles side by side, both ramps rising +c, disagreeing bases.
    const tiles = grid(1, 3);
    tiles[0][0] = { terrain: "hole", height: 0 };
    tiles[0][1] = { terrain: "ground", height: 0, ramp: "se" };
    tiles[0][2] = { terrain: "ground", height: 2, ramp: "se" };
    const level: Level = {
      id: 99,
      grid: tiles,
      ball: { r: 0, c: 0 },
      hand: [{ kind: "move", value: 1 }],
    };
    expect(validateLevel(level).length).toBeGreaterThan(0);
  });

  it("lets a sheer step stand where no ramp claims to bridge it", () => {
    // Flat tiles at different heights share vertices at different heights and
    // that is fine --- it is a cliff, and the climb rule is what blocks it.
    const tiles = grid(1, 2);
    tiles[0][0] = { terrain: "hole", height: 0 };
    tiles[0][1] = { terrain: "ground", height: 3 };
    const level: Level = {
      id: 99,
      grid: tiles,
      ball: { r: 0, c: 1 },
      hand: [{ kind: "move", value: 1 }],
    };
    expect(validateLevel(level)).toEqual([]);
  });
});

describe("level integrity", () => {
  it("requires the ball to sit on a real tile", () => {
    const level = flat();
    level.ball = { r: 5, c: 5 };
    expect(validateLevel(level).some((p) => /ball/i.test(p))).toBe(true);
  });

  it("rejects a ball standing on a gap in the board", () => {
    const level = flat();
    level.grid[1][0] = null;
    expect(validateLevel(level).some((p) => /ball/i.test(p))).toBe(true);
  });

  it("requires exactly one hole", () => {
    const none = flat();
    none.grid[1][2] = { terrain: "ground", height: 0 };
    expect(validateLevel(none).some((p) => /hole/i.test(p))).toBe(true);

    const two = flat();
    two.grid[0][0] = { terrain: "hole", height: 0 };
    expect(validateLevel(two).some((p) => /hole/i.test(p))).toBe(true);
  });

  it("refuses to start the ball on a ramp, because a ball never rests on one", () => {
    const tiles = grid(1, 3);
    tiles[0][0] = { terrain: "hole", height: 0 };
    tiles[0][1] = { terrain: "ground", height: 0, ramp: "se" };
    tiles[0][2] = { terrain: "ground", height: 1 };
    const level: Level = {
      id: 99,
      grid: tiles,
      ball: { r: 0, c: 1 },
      hand: [{ kind: "move", value: 1 }],
    };
    expect(validateLevel(level).some((p) => /ramp/i.test(p))).toBe(true);
  });

  it("requires a hand with at least one card, and no card worth nothing", () => {
    const empty = flat();
    empty.hand = [];
    expect(validateLevel(empty).some((p) => /hand|card/i.test(p))).toBe(true);

    const zero = flat();
    zero.hand = [{ kind: "move", value: 0 }];
    expect(validateLevel(zero).some((p) => /card/i.test(p))).toBe(true);
  });

  it("rejects a level whose rows are ragged", () => {
    const level = flat();
    level.grid[0] = [g(), g()];
    expect(validateLevel(level).length).toBeGreaterThan(0);
  });
});
