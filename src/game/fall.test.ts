import { describe, expect, it } from "vitest";
import { arm, playCard, startRun } from "./state";
import { offers, resolve } from "./rules";
import type { Card, Level, Tile } from "./types";

// ---------------------------------------------------------------------------
// Falling off the edge --- the platform's boundary (and any gap in it) is not
// a wall. Overshoot past where there is no tile and the ball goes with it:
// the card is still spent, the level is lost, whatever is left in the hand.
// ---------------------------------------------------------------------------

const G = (height = 0): Tile => ({ terrain: "ground", height });
const move = (value: number): Card => ({ kind: "move", value });

/** A short lane with a real edge, hole out of reach so a fall is the only
 *  thing an overshoot can do. */
function lane(): Level {
  const grid = [[G(), G(), G()]];
  return {
    id: 1,
    grid,
    ball: { r: 0, c: 0 },
    hand: [move(5), move(1)],
  };
}

describe("falling off the edge", () => {
  it("goes with the ball past the last tile, rather than stopping on it", () => {
    const level = lane();
    const result = resolve(level, level.ball, level.hand[0], "se");
    expect(result.outcome).toBe("fell");
    expect(result.landing).toEqual({ r: 0, c: 3 });
  });

  it("is offered, because the ball visibly moves", () => {
    const level = lane();
    const dirs = offers(level, level.ball, level.hand[0]).map((o) => o.dir);
    expect(dirs).toContain("se");
  });

  it("loses the level immediately, even with cards left unspent", () => {
    const level = lane();
    let run = startRun([level]);
    run = arm(run, 0);
    const move0 = resolve(level, run.ball, level.hand[0], "se");
    run = playCard(run, 0, move0);
    expect(run.phase).toBe("lost");
    expect(run.spent).toEqual([true, false]);
  });
});
