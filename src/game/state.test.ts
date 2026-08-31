import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { resolve } from "./rules";
import type { Level, Tile } from "./types";
import { arm, currentLevel, playCard, restart, startRun } from "./state";

const G = (height = 0): Tile => ({ terrain: "ground", height });

/** A 1x5 lane: ball at one end, hole at the other, two cards. */
function lane(hand = [{ kind: "move" as const, value: 1 }]): Level {
  const grid = [[G(), G(), G(), G(), G()]];
  grid[0][4] = { terrain: "hole", height: 0 };
  return { id: 1, grid, ball: { r: 0, c: 0 }, hand };
}

describe("a run", () => {
  it("starts on the first level with a full hand and nothing armed", () => {
    const run = startRun(LEVELS);
    expect(currentLevel(run).id).toBe(LEVELS[0].id);
    expect(run.spent).toEqual(LEVELS[0].hand.map(() => false));
    expect(run.armed).toBe(null);
    expect(run.restarts).toBe(0);
    expect(run.phase).toBe("play");
  });

  it("puts the ball where the level says", () => {
    const run = startRun(LEVELS);
    expect(run.ball).toEqual(LEVELS[0].ball);
  });
});

describe("opening a level directly", () => {
  it("starts on the level asked for, still knowing about the rest", () => {
    const run = startRun(LEVELS, 2);
    expect(currentLevel(run).id).toBe(LEVELS[2].id);
    expect(run.levels.length).toBe(LEVELS.length);
    expect(run.ball).toEqual(LEVELS[2].ball);
  });

  it("clamps anything the URL might hand it", () => {
    expect(startRun(LEVELS, -4).index).toBe(0);
    expect(startRun(LEVELS, 999).index).toBe(LEVELS.length - 1);
    expect(startRun(LEVELS, Number.NaN).index).toBe(0);
  });
});

describe("arming a card", () => {
  const run = startRun([lane([{ kind: "move", value: 2 }, { kind: "move", value: 1 }])]);

  it("arms by index", () => {
    expect(arm(run, 1).armed).toBe(1);
  });

  it("disarms when the armed card is tapped again", () => {
    expect(arm(arm(run, 1), 1).armed).toBe(null);
  });

  it("refuses to arm a spent card", () => {
    const level = currentLevel(run);
    const spent = playCard(arm(run, 0), 0, resolve(level, run.ball, level.hand[0], "se"));
    expect(spent.spent[0]).toBe(true);
    expect(arm(spent, 0).armed).toBe(null);
  });
});

describe("playing a card", () => {
  const level = lane([{ kind: "move", value: 2 }, { kind: "move", value: 2 }]);

  it("spends the card and moves the ball to the landing tile", () => {
    const run = startRun([level]);
    const move = resolve(level, run.ball, level.hand[0], "se");
    const after = playCard(run, 0, move);
    expect(after.ball).toEqual({ r: 0, c: 2 });
    expect(after.spent).toEqual([true, false]);
    expect(after.armed).toBe(null);
    expect(after.phase).toBe("play");
  });

  it("is lost when the hand runs out without holing the ball", () => {
    let run = startRun([level]);
    run = playCard(run, 0, resolve(level, run.ball, level.hand[0], "se"));
    // Second card takes it to the board edge, not the hole.
    run = playCard(run, 1, resolve(level, run.ball, level.hand[1], "ne"));
    expect(run.phase).toBe("lost");
  });

  it("finishes the run when the last level is holed", () => {
    const run = startRun([level]);
    const move = resolve(level, { r: 0, c: 2 }, level.hand[0], "se");
    const holed = playCard({ ...run, ball: { r: 0, c: 2 } }, 0, move);
    expect(holed.phase).toBe("finished");
  });

  it("advances to the next level when one is left, with a fresh hand", () => {
    const second = { ...lane(), id: 2 };
    const run = startRun([level, second]);
    const move = resolve(level, { r: 0, c: 2 }, level.hand[0], "se");
    const after = playCard({ ...run, ball: { r: 0, c: 2 } }, 0, move);
    expect(after.phase).toBe("play");
    expect(currentLevel(after).id).toBe(2);
    expect(after.spent).toEqual([false]);
    expect(after.ball).toEqual(second.ball);
  });
});

describe("restarting", () => {
  const level = lane([{ kind: "move", value: 2 }, { kind: "move", value: 2 }]);

  it("returns the level and counts the restart", () => {
    let run = startRun([level]);
    run = playCard(run, 0, resolve(level, run.ball, level.hand[0], "se"));
    const again = restart(run);
    expect(again.ball).toEqual(level.ball);
    expect(again.spent).toEqual([false, false]);
    expect(again.phase).toBe("play");
    expect(again.restarts).toBe(1);
  });

  it("keeps counting restarts across levels, because the run is what is scored", () => {
    let run = startRun([level]);
    run = restart(restart(run));
    expect(run.restarts).toBe(2);
  });
});
