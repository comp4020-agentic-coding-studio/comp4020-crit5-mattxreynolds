import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { offers } from "./rules";
import { type Level, type Pos, holeOf, samePos } from "./types";

/** Search every order of cards and every direction for a way to hole out.
 *  The hand is small, so exhaustive is cheap and there is no reason to be
 *  cleverer than this. Returns the first solution found, as the sequence of
 *  card indices and directions. */
function solve(level: Level): string[] | null {
  const search = (ball: Pos, unspent: number[], taken: string[]): string[] | null => {
    for (const card of unspent) {
      for (const { dir, move } of offers(level, ball, level.hand[card])) {
        const line = [...taken, `${level.hand[card].kind}${level.hand[card].value} ${dir}`];
        if (move.outcome === "holed") return line;
        // A fall ends the level on the spot --- nowhere to search on from.
        if (move.outcome === "fell") continue;
        const rest = unspent.filter((i) => i !== card);
        const found = rest.length > 0 ? search(move.landing, rest, line) : null;
        if (found) return found;
      }
    }
    return null;
  };
  return search(level.ball, level.hand.map((_, i) => i), []);
}

/** Is there a way to lose --- spend the whole hand without holing, run out of
 *  offers, or fall --- rather than win? */
function losable(level: Level): boolean {
  const search = (ball: Pos, unspent: number[]): boolean => {
    if (unspent.length === 0) return true;
    for (const card of unspent) {
      for (const { move } of offers(level, ball, level.hand[card])) {
        if (move.outcome === "holed") continue;
        // A fall is itself a way to lose, whatever is left in the hand.
        if (move.outcome === "fell") return true;
        if (search(move.landing, unspent.filter((i) => i !== card))) return true;
      }
    }
    // Every remaining card either holes out or has no direction to offer; the
    // second case is a dead end too, and counts as losing the level.
    return unspent.every((card) => offers(level, ball, level.hand[card]).length === 0);
  };
  return search(level.ball, level.hand.map((_, i) => i));
}

describe("every shipped level", () => {
  for (const level of LEVELS) {
    it(`level ${level.id} can actually be finished`, () => {
      const solution = solve(level);
      expect(solution, `level ${level.id} has no solution --- it cannot be won`).not.toBe(null);
    });
  }

  it("opens with a level solvable in a single card", () => {
    // The opening curve should be close to insultingly gentle: the first
    // screen has to be readable cold, by a stranger, with no words.
    expect(solve(LEVELS[0])?.length).toBe(1);
    expect(LEVELS[0].hand.length).toBe(1);
  });

  it("can be lost after the opening level", () => {
    // A spec line, and not a theoretical one: there has to be a sequence of
    // legal moves that spends the hand and leaves the ball short. A level
    // whose every offered direction happens to work is not a puzzle.
    for (const level of LEVELS.slice(1)) {
      expect(losable(level), `level ${level.id} cannot be lost`).toBe(true);
    }
  });

  it("keeps the opening level unlosable, so the first screen cannot punish", () => {
    // L1 is one card and a hole two tiles away. Getting it wrong costs a
    // restart and teaches the restart control, which is the point.
    expect(solve(LEVELS[0])).not.toBe(null);
  });

  it("numbers itself in the order it is played", () => {
    expect(LEVELS.map((level) => level.id)).toEqual(LEVELS.map((_, i) => i + 1));
  });

  it("has a level that cannot be done without a jump", () => {
    // The design critic's second open finding: a move card being unable to
    // climb had no on-screen consequence a stranger could see. A level a jump
    // solves, and the same card as a move cannot, is that consequence.
    const withJumps = LEVELS.filter((level) => level.hand.some((c) => c.kind === "jump"));
    expect(withJumps.length).toBeGreaterThan(0);

    for (const level of withJumps) {
      const grounded = {
        ...level,
        hand: level.hand.map((card) => ({ ...card, kind: "move" as const })),
      };
      expect(solve(level)).not.toBe(null);
      expect(
        solve(grounded),
        `level ${level.id} solves just as well with the jumps turned into moves`,
      ).toBe(null);
    }
  });

  it("puts the hole somewhere real on every level", () => {
    for (const level of LEVELS) {
      const hole = holeOf(level);
      expect(hole).toBeTruthy();
      expect(samePos(hole!, level.ball)).toBe(false);
    }
  });
});
