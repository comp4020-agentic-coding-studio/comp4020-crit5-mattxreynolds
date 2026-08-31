import {
  DIRS,
  type Card,
  type Dir,
  type Level,
  type Pos,
  type Move,
  type Tile,
  isRamp,
  opposite,
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
 *  early for a reason: the board runs out, the ball goes in, sand takes it, or
 *  a step up blocks it. */
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
    if (!canEnter(here, tile, dir)) break;

    at = next;
    path.push(at);

    if (isHole(tile)) return { path, landing: at, outcome: "holed" };

    // Sand stops the ball dead on entry and the rest of the movement is
    // discarded, not banked.
    if (tile.terrain === "sand") break;
  }

  return settle(level, path, dir);
}

/** A ball never comes to rest on a ramp. Where the steps ran out decides which
 *  way that gets enforced:
 *
 *  - **rolling down**, gravity finishes the move for free and the ball carries
 *    on to the foot of the ramp;
 *  - **climbing**, the move needed enough steps to leave the ramp at the top.
 *    It didn't have them, so the ball never set off up it and stops at the
 *    foot instead --- exactly as a sheer step blocks it. The card is spent
 *    either way, which is what makes a failed climb a real wrong move. */
function settle(level: Level, path: Pos[], dir: Dir): Move {
  let at = path[path.length - 1];
  let tile = tileAt(level, at);
  if (!tile || !isRamp(tile)) return { path, landing: at, outcome: "stopped" };

  if (tile.ramp === opposite(dir)) {
    // Rolling down: keep going until the ball is off the ramp.
    for (;;) {
      const next = step(at, dir);
      const onto = tileAt(level, next);
      if (!onto || !canEnter(tile, onto, dir)) break;

      at = next;
      path.push(at);
      tile = onto;

      if (isHole(onto)) return { path, landing: at, outcome: "holed" };
      if (onto.terrain === "sand" || !isRamp(onto)) break;
    }
    return { path, landing: at, outcome: "stopped" };
  }

  // Climbing: unwind the whole run of ramp tiles it had started up.
  while (path.length > 1) {
    const last = tileAt(level, path[path.length - 1]);
    if (!last || !isRamp(last)) break;
    path.pop();
  }
  return { path, landing: path[path.length - 1], outcome: "stopped" };
}

/** Can a ball travelling in `dir` step from `here` onto `next`?
 *
 *  Heights are compared at the edge the ball actually crosses, which is what
 *  makes a ramp work at all: its two ends are a level apart, so which end you
 *  meet depends on which way you are going. */
function canEnter(here: Tile, next: Tile, dir: Dir): boolean {
  const leaving = exitHeight(here, dir);
  const arriving = entryHeight(next, dir);
  if (leaving === null || arriving === null) return false;
  // Equal continues, lower drops, higher is the climb rule.
  return arriving <= leaving;
}

/** The height of the edge a ball leaves `tile` by, travelling in `dir`. */
function exitHeight(tile: Tile, dir: Dir): number | null {
  if (!isRamp(tile)) return tile.height;
  if (tile.ramp === dir) return tile.height + 1;
  if (tile.ramp === opposite(dir)) return tile.height;
  return null;
}

/** The height of the edge a ball meets entering `tile`, travelling in `dir`.
 *  `null` for a ramp met side-on: a ball cannot roll across a slope, and
 *  treating that as blocked keeps the rule to one sentence. */
function entryHeight(tile: Tile, dir: Dir): number | null {
  if (!isRamp(tile)) return tile.height;
  if (tile.ramp === dir) return tile.height;
  if (tile.ramp === opposite(dir)) return tile.height + 1;
  return null;
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
