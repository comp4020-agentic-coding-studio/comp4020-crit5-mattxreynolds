import type { Level, Move, Pos } from "./types";

/** Run state: which level, where the ball is, which cards are gone, and the
 *  restart count that is the run's score. No persistence --- reloading starts
 *  a fresh run, which is the intended way to try for a better one.
 *
 *  Every function here returns a new Run rather than mutating, so the wiring
 *  can't half-apply a move. */

export type Phase = "play" | "lost" | "finished";

export interface Run {
  levels: Level[];
  index: number;
  ball: Pos;
  /** One flag per card in the current level's hand. */
  spent: boolean[];
  /** Index of the armed card, or null. */
  armed: number | null;
  /** Restarts across the whole run --- the score, so it never resets. */
  restarts: number;
  phase: Phase;
}

export function currentLevel(run: Run): Level {
  return run.levels[run.index];
}

/** Start a run. `at` is a zero-based level index --- it exists so a level can
 *  be opened directly while working on it, and is clamped rather than trusted,
 *  since it comes from the URL. A run started partway through is still a whole
 *  run: it plays on to the end and scores its restarts the same way. */
export function startRun(levels: Level[], at = 0): Run {
  const index = Math.min(Math.max(Math.trunc(at) || 0, 0), levels.length - 1);
  return enter(
    { levels, index, ball: levels[0].ball, spent: [], armed: null, restarts: 0, phase: "play" },
    index,
  );
}

/** Put the run at the top of level `index` with a fresh hand. */
function enter(run: Run, index: number): Run {
  const level = run.levels[index];
  return {
    ...run,
    index,
    ball: level.ball,
    spent: level.hand.map(() => false),
    armed: null,
    phase: "play",
  };
}

export function arm(run: Run, card: number): Run {
  if (run.phase !== "play") return run;
  if (run.spent[card]) return { ...run, armed: null };
  return { ...run, armed: run.armed === card ? null : card };
}

/** Spend a card and take the move it resolved to. Holing out advances the run;
 *  running the hand out without holing loses the level. */
export function playCard(run: Run, card: number, move: Move): Run {
  if (run.phase !== "play" || run.spent[card]) return run;

  const spent = run.spent.map((was, i) => was || i === card);
  const after: Run = { ...run, ball: move.landing, spent, armed: null };

  if (move.outcome === "holed") {
    const next = run.index + 1;
    return next < run.levels.length ? enter(after, next) : { ...after, phase: "finished" };
  }

  // A fall ends the level on the spot, whatever is left in the hand.
  if (move.outcome === "fell") return { ...after, phase: "lost" };

  return spent.every(Boolean) ? { ...after, phase: "lost" } : after;
}

/** Back to the top of this level. The restart count is run-wide and is the
 *  thing being scored, so it survives everything except a page reload. */
export function restart(run: Run): Run {
  return { ...enter(run, run.index), restarts: run.restarts + 1 };
}
