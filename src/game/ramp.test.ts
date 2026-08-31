import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { offers, resolve } from "./rules";
import { type Card, type Dir, type Level, type Tile, isRamp, tileAt } from "./types";

// ---------------------------------------------------------------------------
// THE FOCUSED TEST — the one rule of this game under an automated test.
//
//   A ball never comes to rest on a ramp.
//
// Both halves of that: going up, a ball without the steps to clear the ramp
// stops at its foot and the card is spent anyway, so a failed climb is a real
// wrong move; going down, a ball whose steps run out mid-ramp keeps rolling to
// the bottom, because gravity finishes the move at no extra cost.
//
// It is the game's most interesting rule and the one most easily got wrong: a
// ramp is the only tile whose behaviour depends on which way the ball is
// travelling, and the only one that can move the ball further than its card.
// ---------------------------------------------------------------------------

const move = (value: number): Card => ({ kind: "move", value });

/** A 1xN lane built from a compact description, so a case reads as its shape.
 *
 *   `0` `1` `2`  flat ground at that height
 *   `/`          a ramp climbing one level toward +c, from the running height
 *   `\`          a ramp dropping one level toward +c
 *   `s`          sand at the running height
 *   `h`          the hole at the running height
 *
 *  Heights carry along the lane, so every lane it builds is vertex-consistent
 *  by construction --- which `validate.ts` is what actually checks.
 */
function lane(spec: string): Tile[] {
  let height = 0;
  return [...spec].map((cell) => {
    if (cell === "/") {
      const foot = height;
      height += 1;
      return { terrain: "ground", height: foot, ramp: "se" } as Tile;
    }
    if (cell === "\\") {
      height -= 1;
      return { terrain: "ground", height, ramp: "nw" } as Tile;
    }
    if (cell === "s") return { terrain: "sand", height } as Tile;
    if (cell === "h") return { terrain: "hole", height } as Tile;
    height = Number(cell);
    return { terrain: "ground", height } as Tile;
  });
}

function board(spec: string, ball: number, card: Card): Level {
  return { id: 1, grid: [lane(spec)], ball: { r: 0, c: ball }, hand: [card] };
}

const roll = (level: Level, dir: Dir): ReturnType<typeof resolve> =>
  resolve(level, level.ball, level.hand[0], dir);

describe("a ball never comes to rest on a ramp", () => {
  it("going up: clears the ramp when the card has the steps to", () => {
    // ground, ramp, high ground. Three steps is enough to leave the ramp.
    const level = board("0/1h", 0, move(3));
    expect(roll(level, "se").outcome).toBe("holed");
  });

  it("going up: stops at the foot when the card runs out on the ramp", () => {
    // Two steps would land the ball on the ramp itself, so it never sets off.
    // The card is spent regardless --- a failed climb is a real wrong move.
    const level = board("00/1", 0, move(2));
    const result = roll(level, "se");
    expect(result.landing).toEqual({ r: 0, c: 1 });
    expect(tileAt(level, result.landing)).toMatchObject({ terrain: "ground", height: 0 });
    expect(isRamp(tileAt(level, result.landing)!)).toBe(false);
  });

  it("going down: rolls on to the bottom when the steps run out mid-ramp", () => {
    // One step puts the ball on the ramp; gravity finishes the move for free.
    const level = board("1\\0", 0, move(1));
    const result = roll(level, "se");
    expect(result.landing).toEqual({ r: 0, c: 2 });
    expect(result.path).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
    ]);
  });

  it("going down: a free roll to the bottom can still hole out", () => {
    const level = board("1\\h", 0, move(1));
    expect(roll(level, "se").outcome).toBe("holed");
  });

  it("clears a ramp several tiles long, going up", () => {
    const level = board("0//2h", 0, move(4));
    expect(roll(level, "se").outcome).toBe("holed");
  });

  it("stops at the foot of a ramp several tiles long it cannot clear", () => {
    const level = board("0//2", 0, move(2));
    expect(roll(level, "se").landing).toEqual({ r: 0, c: 0 });
  });

  it("rolls all the way down a ramp several tiles long", () => {
    const level = board("2\\\\0", 0, move(1));
    expect(roll(level, "se").landing).toEqual({ r: 0, c: 3 });
  });

  it("never leaves the ball on a ramp, over every level and every move", () => {
    // The property, asserted over the shipped set rather than over the cases
    // above: whatever a level does, no resolved landing is ever a ramp.
    for (const level of LEVELS) {
      for (const card of level.hand) {
        for (const { move: resolved } of offers(level, level.ball, card)) {
          const tile = tileAt(level, resolved.landing);
          expect(
            tile !== null && isRamp(tile),
            `level ${level.id}: a ${card.kind} ${card.value} lands on a ramp`,
          ).toBe(false);
        }
      }
    }
  });
});

describe("sand", () => {
  it("stops the ball dead the moment it enters", () => {
    const level = board("0s00", 0, move(3));
    expect(roll(level, "se").landing).toEqual({ r: 0, c: 1 });
  });

  it("discards the rest of the movement rather than banking it", () => {
    const level = board("0s0h", 0, move(9));
    expect(roll(level, "se").outcome).toBe("stopped");
  });

  it("can be left again on the next card", () => {
    const level = board("0s0h", 1, move(2));
    expect(roll(level, "se").outcome).toBe("holed");
  });
});
