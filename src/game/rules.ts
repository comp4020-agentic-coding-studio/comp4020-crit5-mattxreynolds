import {
  type Card,
  type Dir,
  type Level,
  type Move,
  type Pos,
  type Tile,
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
    const next = step(at, dir);
    const tile = tileAt(level, next);

    // Off the board, or over a gap in it: the ball stops where it is. The
    // card is still spent --- a wasted card is a real wrong move.
    if (!tile) break;

    at = next;
    path.push(at);

    if (isHole(tile)) return { path, landing: at, outcome: "holed" };
  }

  return { path, landing: at, outcome: "stopped" };
}

function isHole(tile: Tile): boolean {
  return tile.terrain === "hole";
}
