import { describe, expect, it } from "vitest";
import { offers, resolve } from "./rules";
import { type Card, type Dir, type Level, type Tile, isRamp, tileAt } from "./types";

// `jump` arcs over whatever lies between and lands exactly N tiles away,
// ignoring height in both directions. Ramps are the ordinary way up, so what
// `jump` is *for* is ground no ramp serves, and getting over what is in the
// way.

const jump = (value: number): Card => ({ kind: "jump", value });
const G = (height = 0): Tile => ({ terrain: "ground", height });

/** A 1xN lane. `null` is a gap in the board. */
function board(tiles: (Tile | null)[], ball: number, card: Card): Level {
  return { id: 1, grid: [tiles], ball: { r: 0, c: ball }, hand: [card] };
}

const roll = (level: Level, dir: Dir = "se"): ReturnType<typeof resolve> =>
  resolve(level, level.ball, level.hand[0], dir);

describe("jump", () => {
  it("lands exactly N tiles away", () => {
    const level = board([G(), G(), G(), G()], 0, jump(3));
    expect(roll(level).landing).toEqual({ r: 0, c: 3 });
  });

  it("ignores everything in between, including ground it could never climb", () => {
    const level = board([G(0), G(4), G(0)], 0, jump(2));
    expect(roll(level).landing).toEqual({ r: 0, c: 2 });
  });

  it("clears a gap in the board that a rolling ball would stop at", () => {
    const level = board([G(), null, G()], 0, jump(2));
    expect(roll(level).landing).toEqual({ r: 0, c: 2 });
  });

  it("goes up onto ground no ramp serves", () => {
    const level = board([G(0), G(2)], 0, jump(1));
    expect(roll(level).landing).toEqual({ r: 0, c: 1 });
  });

  it("goes down just as readily, without rolling on", () => {
    // Unlike a roll, a jump does not keep going after it lands.
    const level = board([G(3), G(0), G(0)], 0, jump(1));
    expect(roll(level).landing).toEqual({ r: 0, c: 1 });
  });

  it("reports only the two ends, because nothing happens in between", () => {
    const level = board([G(), G(), G()], 0, jump(2));
    expect(roll(level).path).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 2 },
    ]);
  });

  it("holes out when it lands in the hole", () => {
    const level = board([G(), G(), { terrain: "hole", height: 0 }], 0, jump(2));
    expect(roll(level).outcome).toBe("holed");
  });

  it("is not offered when it would land off the board", () => {
    const level = board([G(), G()], 0, jump(3));
    expect(offers(level, level.ball, level.hand[0])).toEqual([]);
  });

  it("is not offered when it would land in a gap", () => {
    const level = board([G(), G(), null], 0, jump(2));
    expect(offers(level, level.ball, level.hand[0]).map((o) => o.dir)).toEqual([]);
  });

  it("never comes to rest on a ramp either --- it lands and rolls to the foot", () => {
    // ground(1) | ramp dropping to 0 | ground(0). A jump onto the slope keeps
    // going down it, the same as a roll that runs out of steps on one.
    const tiles: (Tile | null)[] = [
      G(1),
      { terrain: "ground", height: 0, ramp: "nw" },
      G(0),
    ];
    const level = board(tiles, 0, jump(1));
    const result = roll(level);
    expect(isRamp(tileAt(level, result.landing)!)).toBe(false);
    expect(result.landing).toEqual({ r: 0, c: 2 });
  });

  it("jumps in all four directions", () => {
    const grid = Array.from({ length: 3 }, () => [G(), G(), G()]);
    const level: Level = {
      id: 1,
      grid,
      ball: { r: 1, c: 1 },
      hand: [jump(1)],
    };
    grid[0][0] = { terrain: "hole", height: 0 };
    const dirs = offers(level, level.ball, level.hand[0]).map((o) => o.dir);
    expect(dirs.sort()).toEqual(["ne", "nw", "se", "sw"]);
  });
});
