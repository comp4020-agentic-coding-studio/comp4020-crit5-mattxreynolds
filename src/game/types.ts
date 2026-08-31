/** The whole vocabulary of the game. Pure data --- nothing here knows about
 *  the DOM, and nothing in `render.ts` decides anything. */

/** A position on the grid. `r` runs down-left on screen, `c` runs down-right. */
export interface Pos {
  r: number;
  c: number;
}

/** The four directions of travel, named for where they go **on screen** ---
 *  which is what the player sees and what the marker rotation encodes. In an
 *  isometric projection a step in +c leaves the tile by its lower-right edge,
 *  so it is "se". */
export type Dir = "ne" | "se" | "sw" | "nw";

export const DIRS = ["ne", "se", "sw", "nw"] as const;

/** Grid delta and marker rotation for each direction. The rotations are the
 *  slice's, measured: 0deg is +c. */
export const STEP: Record<Dir, { dr: number; dc: number; rot: number }> = {
  se: { dr: 0, dc: 1, rot: 0 },
  sw: { dr: 1, dc: 0, rot: 90 },
  nw: { dr: 0, dc: -1, rot: 180 },
  ne: { dr: -1, dc: 0, rot: 270 },
};

/** The direction a ball would be travelling if it turned round. */
export function opposite(d: Dir): Dir {
  return { se: "nw", nw: "se", sw: "ne", ne: "sw" }[d] as Dir;
}

export function step(p: Pos, d: Dir): Pos {
  return { r: p.r + STEP[d].dr, c: p.c + STEP[d].dc };
}

export function samePos(a: Pos, b: Pos): boolean {
  return a.r === b.r && a.c === b.c;
}

/** `wall` is deliberately absent: a wall is a tile one or more levels up, and
 *  the climb rule is what stops the ball. One fewer thing to teach. */
export type Terrain = "ground" | "sand" | "hole";

export interface Tile {
  terrain: Terrain;
  /** The level of the tile's **low** edge. A flat tile is at this level all
   *  over; a ramp rises one level from it. */
  height: number;
  /** Set only on a ramp: the direction the ramp rises. The two vertices on
   *  that edge sit one level above `height`. */
  ramp?: Dir;
}

export function isRamp(tile: Tile): boolean {
  return tile.ramp !== undefined;
}

/** The level of a tile's high side --- the same as `height` unless it ramps. */
export function topHeight(tile: Tile): number {
  return isRamp(tile) ? tile.height + 1 : tile.height;
}

export type CardKind = "move" | "jump";

export interface Card {
  kind: CardKind;
  value: number;
}

/** A grid cell may be empty: levels are not required to be rectangular solids,
 *  and a gap in the board is a real part of the puzzle. */
export type Grid = (Tile | null)[][];

export interface Level {
  id: number;
  /** Indexed `[r][c]`. Every row is the same length; `null` is a gap. */
  grid: Grid;
  ball: Pos;
  hand: Card[];
}

export type Outcome = "stopped" | "holed" | "fell";

/** What `resolve` returns: every tile stepped through, where the ball came to
 *  rest, and whether the level was won. The whole path, not just the landing,
 *  because the animation and the marker placement both need it. */
export interface Move {
  path: Pos[];
  landing: Pos;
  outcome: Outcome;
  /** The card still had distance left, but the next edge could not be
   *  crossed. The browser uses this to show the impact after the roll. */
  blocked?: boolean;
}

export function tileAt(level: Level, p: Pos): Tile | null {
  return level.grid[p.r]?.[p.c] ?? null;
}

/** The hole, found from the terrain rather than stored twice --- two records
 *  of the same fact can disagree. */
export function holeOf(level: Level): Pos | undefined {
  for (let r = 0; r < level.grid.length; r++) {
    for (let c = 0; c < level.grid[r].length; c++) {
      if (level.grid[r][c]?.terrain === "hole") return { r, c };
    }
  }
  return undefined;
}

/** A vertex of the grid, `(rows+1) x (cols+1)` of them. Height belongs here,
 *  not to tiles: this is the constraint the renderer imposes, found by
 *  rendering an invalid level. */
export interface Vertex {
  i: number;
  j: number;
}

/** The four corners of tile (r,c) in vertex coordinates, by their **screen**
 *  compass position. Derived from the projection: N is up, E right, S down,
 *  W left. */
export function corners(r: number, c: number): Record<"n" | "e" | "s" | "w", Vertex> {
  return {
    n: { i: r, j: c },
    e: { i: r, j: c + 1 },
    s: { i: r + 1, j: c + 1 },
    w: { i: r + 1, j: c },
  };
}

/** The two corners a step in direction `d` leaves the tile by --- the pair a
 *  ramp rising that way lifts. */
const RAMP_EDGE: Record<Dir, ["n" | "e" | "s" | "w", "n" | "e" | "s" | "w"]> = {
  se: ["e", "s"],
  nw: ["n", "w"],
  sw: ["w", "s"],
  ne: ["n", "e"],
};

/** Every corner of a tile with the height it sits at. A flat tile is level all
 *  over; a ramp lifts the two corners on the edge it rises toward. */
export function cornerHeights(tile: Tile, r: number, c: number): Array<[Vertex, number]> {
  const corner = corners(r, c);
  const lifted = new Set(tile.ramp ? RAMP_EDGE[tile.ramp] : []);
  return (["n", "e", "s", "w"] as const).map((name) => [
    corner[name],
    tile.height + (lifted.has(name) ? 1 : 0),
  ]);
}
