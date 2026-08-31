import { describe, expect, it } from "vitest";
import type { Card, Dir, Level, Pos, Tile } from "./types";
import { resolve } from "./rules";

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

  it("stops at the board edge rather than running off it", () => {
    const level = board(1, 3, { r: 0, c: 0 }, { r: 0, c: 1 }, [move(5)]);
    const result = play(level, "se");
    expect(result.landing).toEqual({ r: 0, c: 2 });
    expect(result.outcome).toBe("stopped");
  });

  it("stops at the edge of a gap in the board, treating it as an edge", () => {
    const level = board(1, 4, { r: 0, c: 0 }, { r: 0, c: 1 }, [move(3)]);
    level.grid[0][3] = null;
    expect(play(level, "se").landing).toEqual({ r: 0, c: 2 });
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
