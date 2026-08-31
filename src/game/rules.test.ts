import { describe, expect, it } from "vitest";
import type { Card, Dir, Level, Pos, Tile } from "./types";
import { offers, resolve } from "./rules";

// The resolver is the whole engine and it is pure: no DOM, no state, no
// randomness. T4 covers flat ground only --- height, ramps and sand arrive in
// T7 and T8 with their own cases.

const G = (height = 0): Tile => ({ terrain: "ground", height });

/** A flat board of the given size with the hole wherever you put it. */
function board(rows: number, cols: number, hole: Pos, ball: Pos, hand: Card[]): Level {
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => G()));
  grid[hole.r][hole.c] = { terrain: "hole", height: 0 };
  return { id: 1, grid, ball, hand };
}

const move = (value: number): Card => ({ kind: "move", value });

function play(level: Level, dir: Dir, card = level.hand[0]) {
  return resolve(level, level.ball, card, dir);
}

describe("move on flat ground", () => {
  it("travels exactly as far as the card says", () => {
    const level = board(1, 5, { r: 0, c: 4 }, { r: 0, c: 0 }, [move(2)]);
    const result = play(level, "se");
    expect(result.landing).toEqual({ r: 0, c: 2 });
    expect(result.outcome).toBe("stopped");
  });

  it("returns every tile stepped through, not just where it stopped", () => {
    // The animation and the marker placement both read the path.
    const level = board(1, 5, { r: 0, c: 4 }, { r: 0, c: 0 }, [move(3)]);
    expect(play(level, "se").path).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 0, c: 3 },
    ]);
  });

  it("moves in all four directions", () => {
    const level = board(3, 3, { r: 0, c: 0 }, { r: 1, c: 1 }, [move(1)]);
    expect(play(level, "se").landing).toEqual({ r: 1, c: 2 });
    expect(play(level, "nw").landing).toEqual({ r: 1, c: 0 });
    expect(play(level, "sw").landing).toEqual({ r: 2, c: 1 });
    expect(play(level, "ne").landing).toEqual({ r: 0, c: 1 });
  });

  it("falls off the board edge rather than stopping at it", () => {
    const level = board(1, 3, { r: 0, c: 0 }, { r: 0, c: 1 }, [move(5)]);
    const result = play(level, "se");
    expect(result.landing).toEqual({ r: 0, c: 3 });
    expect(result.outcome).toBe("fell");
  });

  it("falls into a gap in the board, treating it the same as the edge", () => {
    const level = board(1, 4, { r: 0, c: 0 }, { r: 0, c: 1 }, [move(3)]);
    level.grid[0][3] = null;
    const result = play(level, "se");
    expect(result.landing).toEqual({ r: 0, c: 3 });
    expect(result.outcome).toBe("fell");
  });

  it("wins when the ball reaches the hole", () => {
    const level = board(1, 3, { r: 0, c: 2 }, { r: 0, c: 0 }, [move(2)]);
    const result = play(level, "se");
    expect(result.outcome).toBe("holed");
    expect(result.landing).toEqual({ r: 0, c: 2 });
  });

  it("wins on the way past, without spending the rest of the card", () => {
    // A ball that rolls over the hole is in the hole.
    const level = board(1, 5, { r: 0, c: 2 }, { r: 0, c: 0 }, [move(4)]);
    const result = play(level, "se");
    expect(result.outcome).toBe("holed");
    expect(result.landing).toEqual({ r: 0, c: 2 });
  });

  it("leaves the level untouched --- the resolver decides, it does not mutate", () => {
    const level = board(1, 4, { r: 0, c: 3 }, { r: 0, c: 0 }, [move(2)]);
    const before = JSON.stringify(level);
    play(level, "se");
    expect(JSON.stringify(level)).toBe(before);
  });
});

describe("a direction that moves nothing", () => {
  it("reports the start tile as the landing, so the caller can decline to offer it", () => {
    // PLAN.md: a direction whose resolved landing equals the start is not
    // shown. A stranger tapping an arrow and seeing nothing reads it as broken.
    const level = board(1, 3, { r: 0, c: 2 }, { r: 0, c: 0 }, [move(2)]);
    const result = play(level, "nw");
    expect(result.landing).toEqual(level.ball);
    expect(result.path).toEqual([level.ball]);
  });
});

describe("height", () => {
  /** A 1xN lane whose tiles sit at the given heights, hole at the far end. */
  function slope(heights: number[], ball: number, value: number): Level {
    const grid = [heights.map((height) => ({ terrain: "ground", height }) as Tile)];
    return {
      id: 1,
      grid,
      ball: { r: 0, c: ball },
      hand: [move(value)],
    };
  }

  it("continues across level ground", () => {
    const level = slope([1, 1, 1, 1], 0, 3);
    expect(play(level, "se").landing).toEqual({ r: 0, c: 3 });
  });

  it("is blocked by a step up, and stops at the tile before it", () => {
    // A wall is not a tile type: it is a tile one level up, and this is the
    // rule that stops the ball at it.
    const level = slope([0, 0, 1, 0], 0, 3);
    const result = play(level, "se");
    expect(result.landing).toEqual({ r: 0, c: 1 });
    expect(result.outcome).toBe("stopped");
  });

  it("is blocked by a step up of any size", () => {
    const level = slope([0, 4], 0, 3);
    expect(play(level, "se").landing).toEqual({ r: 0, c: 0 });
  });

  it("drops off a ledge and keeps the steps it has left", () => {
    // The drop is free: gravity is not charged to the card.
    const level = slope([2, 0, 0, 0], 0, 3);
    expect(play(level, "se").landing).toEqual({ r: 0, c: 3 });
  });

  it("drops more than one level at a time", () => {
    const level = slope([3, 0], 0, 1);
    expect(play(level, "se").landing).toEqual({ r: 0, c: 1 });
  });

  it("drops repeatedly down a staircase", () => {
    const level = slope([3, 2, 1, 0], 0, 3);
    expect(play(level, "se").path).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 0, c: 3 },
    ]);
  });

  it("climbs nothing, even one step, so a staircase is one-way", () => {
    const level = slope([0, 1, 2, 3], 0, 3);
    expect(play(level, "se").landing).toEqual({ r: 0, c: 0 });
  });

  it("holes out on a tile below the one it left", () => {
    const grid = [[{ terrain: "ground", height: 2 } as Tile, { terrain: "hole", height: 0 } as Tile]];
    const level: Level = { id: 1, grid, ball: { r: 0, c: 0 }, hand: [move(2)] };
    expect(play(level, "se").outcome).toBe("holed");
  });

  it("does not offer a direction blocked by a climb", () => {
    // Nothing happens when you tap it, so it is not shown --- the same rule
    // that hides a direction running straight off the board.
    const level = slope([0, 0, 2], 1, 2);
    const dirs = offers(level, level.ball, level.hand[0]).map((o) => o.dir);
    expect(dirs).toEqual(["nw"]);
  });
});
