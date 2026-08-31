import {
  DIRS,
  type Card,
  type Dir,
  type Level,
  type Move,
  type Pos,
  type Tile,
  samePos,
  step,
  tileAt,
} from "./types";

/** The whole engine, and it is pure: same level in, same move out, nothing
 *  mutated and no DOM anywhere near it.
 *
 *  T4 covers flat ground. Height, ramps and sand join the step loop in T7 and
 *  T8; `jump` in T9. */
export function resolve(level: Level, from: Pos, card: Card, dir: Dir): Move {
  switch (card.kind) {
    case "move":
      return resolveMove(level, from, card.value, dir);
    case "jump":
      throw new Error("jump is not implemented yet (T9)");
  }
}

/** A `move` card of value N takes up to N steps in one direction, and stops
 *  early for a reason: the board runs out, or the ball goes in. */
function resolveMove(level: Level, from: Pos, value: number, dir: Dir): Move {
  const path: Pos[] = [from];
  let at = from;

  for (let taken = 0; taken < value; taken++) {
    const here = tileAt(level, at);
    const next = step(at, dir);
    const tile = tileAt(level, next);

    // Off the board, or over a gap in it: the ball stops where it is. The
    // card is still spent --- a wasted card is a real wrong move.
    if (!tile || !here) break;

    // The climb rule, and the only thing `wall` used to mean: a ball cannot
    // roll up a step. It stops at the tile before it, card spent.
    if (tile.height > here.height) break;

    // Lower ground it simply drops onto, keeping the steps it has left ---
    // gravity is not charged to the card. Level ground continues. Both fall
    // out of carrying on with the loop.
    at = next;
    path.push(at);

    if (isHole(tile)) return { path, landing: at, outcome: "holed" };
  }

  return { path, landing: at, outcome: "stopped" };
}

function isHole(tile: Tile): boolean {
  return tile.terrain === "hole";
}

/** The moves worth offering from `from` with `card` --- one per direction that
 *  actually takes the ball somewhere.
 *
 *  A direction whose landing is the start tile is left out on purpose: a
 *  stranger who taps an arrow and sees nothing happen reads the game as
 *  broken. Wrong moves stay possible --- plenty of legal moves waste a card
 *  --- so this doesn't soften the fact that a level can be lost. */
export function offers(level: Level, from: Pos, card: Card): Array<{ dir: Dir; move: Move }> {
  return DIRS.flatMap((dir) => {
    const move = resolve(level, from, card, dir);
    return samePos(move.landing, from) ? [] : [{ dir, move }];
  });
}
