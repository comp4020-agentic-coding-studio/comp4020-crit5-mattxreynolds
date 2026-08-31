import {
  type Level,
  cornerHeights,
  holeOf,
  isRamp,
  tileAt,
} from "./types";

/** Everything wrong with a level, as sentences an author can act on. An empty
 *  array means the level is shippable.
 *
 *  The rule worth the file is the last one: height belongs to grid vertices,
 *  so every tile touching a vertex has to agree about how high it is. PLAN.md
 *  found that by rendering an invalid level --- a ramp whose raised corner
 *  disagrees with its neighbour tears a visible hole in the terrain, and no
 *  amount of reading the level data shows it. */
export function validateLevel(level: Level): string[] {
  const problems: string[] = [];
  const say = (msg: string): void => {
    problems.push(`level ${level.id}: ${msg}`);
  };

  const rows = level.grid.length;
  if (rows === 0) {
    say("the grid has no rows");
    return problems;
  }

  const cols = level.grid[0].length;
  if (cols === 0) say("the grid has no columns");
  for (const [r, row] of level.grid.entries()) {
    if (row.length !== cols) {
      say(`row ${r} is ${row.length} tiles wide, but row 0 is ${cols} --- the grid is ragged`);
    }
  }

  // --- the ball ---------------------------------------------------------
  const ball = tileAt(level, level.ball);
  if (!ball) {
    say(`the ball at (${level.ball.r},${level.ball.c}) is not standing on a tile`);
  } else if (isRamp(ball)) {
    say(
      `the ball starts on the ramp at (${level.ball.r},${level.ball.c}); a ball never comes to rest on a ramp`,
    );
  } else if (ball.terrain === "hole") {
    say("the ball starts in the hole, so the level is already over");
  }

  // --- the hole ---------------------------------------------------------
  const holes = level.grid.flatMap((row, r) =>
    row.flatMap((tile, c) => (tile?.terrain === "hole" ? [{ r, c }] : [])),
  );
  if (holes.length !== 1) {
    say(
      holes.length === 0
        ? "there is no hole, so the level cannot be won"
        : `there are ${holes.length} holes; a level has exactly one`,
    );
  }
  if (holeOf(level) === undefined && holes.length > 0) {
    say("the hole is unreachable by holeOf --- the grid is inconsistent");
  }

  // --- the hand ---------------------------------------------------------
  if (level.hand.length === 0) {
    say("the hand is empty, so no move can be made");
  }
  for (const [i, card] of level.hand.entries()) {
    if (!Number.isInteger(card.value) || card.value < 1) {
      say(`card ${i} is worth ${card.value}; a card moves the ball at least one tile`);
    }
  }

  // --- tiles ------------------------------------------------------------
  for (const [r, row] of level.grid.entries()) {
    for (const [c, tile] of row.entries()) {
      if (!tile) continue;
      if (!Number.isInteger(tile.height) || tile.height < 0) {
        say(`the tile at (${r},${c}) sits at height ${tile.height}`);
      }
      if (isRamp(tile) && tile.terrain !== "ground") {
        say(`the tile at (${r},${c}) is both a ramp and ${tile.terrain}`);
      }
    }
  }

  problems.push(...tornVertices(level));
  return problems;
}

/** Vertices where the tiles meeting them disagree about the height.
 *
 *  A cliff is not a tear: two flat tiles at different heights are allowed to
 *  meet, and the climb rule is what stops the ball. What is not allowed is a
 *  ramp claiming to bridge a boundary its neighbour doesn't agree with, since
 *  that is exactly what renders as torn ground. So a vertex is only checked
 *  where at least one tile touching it is a ramp. */
function tornVertices(level: Level): string[] {
  const claims = new Map<string, Array<{ r: number; c: number; height: number; ramp: boolean }>>();

  for (const [r, row] of level.grid.entries()) {
    for (const [c, tile] of row.entries()) {
      if (!tile) continue;
      for (const [vertex, height] of cornerHeights(tile, r, c)) {
        const key = `${vertex.i},${vertex.j}`;
        const at = claims.get(key) ?? [];
        at.push({ r, c, height, ramp: isRamp(tile) });
        claims.set(key, at);
      }
    }
  }

  const problems: string[] = [];
  for (const [key, at] of claims) {
    if (!at.some((claim) => claim.ramp)) continue;
    const heights = new Set(at.map((claim) => claim.height));
    if (heights.size === 1) continue;
    const disagreement = at
      .map((claim) => `(${claim.r},${claim.c}) says ${claim.height}`)
      .join(", ");
    problems.push(
      `level ${level.id}: vertex (${key}) is torn --- ${disagreement}. A ramp's raised corner must agree with every tile sharing it.`,
    );
  }
  return problems.sort();
}

/** Throwing form, for the places that should never see an invalid level. */
export function assertValid(level: Level): Level {
  const problems = validateLevel(level);
  if (problems.length > 0) throw new Error(problems.join("\n"));
  return level;
}
