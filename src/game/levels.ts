import type { Dir, Grid, Level, Tile } from "./types";

/** The approved twelve-level course. See docs/level-design.md for the design
 * contract, intended solutions, alternatives, and failure cases. */
const G = (height = 0): Tile => ({ terrain: "ground", height });
const HOLE = (height = 0): Tile => ({ terrain: "hole", height });
const SAND = (height = 0): Tile => ({ terrain: "sand", height });
const SLOPE = (ramp: Dir, height = 0): Tile => ({ terrain: "ground", height, ramp });

function field(rows: number, cols: number, height = 0): Grid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => G(height)));
}

function level1(): Level {
  const grid = field(3, 3);
  grid[1][2] = HOLE();
  return { id: 1, grid, ball: { r: 1, c: 0 }, hand: [{ kind: "move", value: 2 }] };
}

function level2(): Level {
  const grid = field(4, 4);
  grid[3][0] = null;
  grid[3][1] = HOLE();
  return { id: 2, grid, ball: { r: 1, c: 0 }, hand: [{ kind: "move", value: 2 }, { kind: "move", value: 1 }] };
}

function level3(): Level {
  const grid = field(4, 5);
  grid[1][2] = G(1);
  grid[1][0] = HOLE();
  return { id: 3, grid, ball: { r: 1, c: 4 }, hand: [{ kind: "move", value: 4 }, { kind: "move", value: 2 }, { kind: "move", value: 2 }] };
}

function level4(): Level {
  const grid = field(4, 6);
  for (let r = 0; r < 4; r++) { grid[r][0] = G(1); grid[r][1] = G(1); }
  grid[1][4] = null;
  grid[2][0] = null;
  grid[3][0] = null;
  grid[3][5] = HOLE();
  return { id: 4, grid, ball: { r: 1, c: 0 }, hand: [{ kind: "move", value: 2 }, { kind: "move", value: 3 }, { kind: "move", value: 2 }] };
}

function level5(): Level {
  const grid = field(4, 7);
  for (let r = 0; r < 4; r++) {
    grid[r][2] = SLOPE("se");
    for (let c = 3; c < 7; c++) grid[r][c] = G(1);
  }
  grid[3][6] = HOLE(1);
  return { id: 5, grid, ball: { r: 1, c: 0 }, hand: [{ kind: "move", value: 2 }, { kind: "move", value: 3 }, { kind: "move", value: 3 }] };
}

function level6(): Level {
  const grid = field(4, 3);
  for (let r = 0; r < 4; r++) { grid[r][1] = r === 3 ? null : SLOPE("se"); grid[r][2] = G(1); }
  grid[3][0] = HOLE();
  return { id: 6, grid, ball: { r: 0, c: 2 }, hand: [{ kind: "move", value: 3 }, { kind: "move", value: 1 }] };
}

function level7(): Level {
  const grid = field(4, 5);
  for (let r = 0; r < 4; r++) grid[r][2] = SAND();
  grid[1][4] = null;
  grid[2][0] = null;
  grid[2][4] = HOLE();
  return { id: 7, grid, ball: { r: 1, c: 0 }, hand: [{ kind: "move", value: 1 }, { kind: "move", value: 4 }, { kind: "move", value: 2 }] };
}

function level8(): Level {
  const grid = field(4, 6);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) grid[r][c] = G(1);
  grid[3][0] = HOLE(1);
  return { id: 8, grid, ball: { r: 1, c: 5 }, hand: [{ kind: "move", value: 3 }, { kind: "move", value: 2 }, { kind: "jump", value: 2 }] };
}

function level9(): Level {
  const grid = field(5, 5);
  for (let r = 0; r < 5; r++) {
    grid[r][1] = r < 2 ? G() : null;
    grid[r][2] = SLOPE("se");
    grid[r][3] = G(1);
    grid[r][4] = G(1);
  }
  grid[4][0] = HOLE();
  return { id: 9, grid, ball: { r: 2, c: 4 }, hand: [{ kind: "move", value: 3 }, { kind: "move", value: 1 }, { kind: "move", value: 2 }, { kind: "move", value: 1 }] };
}

function level10(): Level {
  const grid = field(4, 9);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) grid[r][c] = G(1);
    grid[r][2] = SAND(1);
    grid[r][6] = null;
  }
  grid[3][0] = HOLE(1);
  return { id: 10, grid, ball: { r: 1, c: 8 }, hand: [{ kind: "move", value: 2 }, { kind: "move", value: 4 }, { kind: "move", value: 2 }, { kind: "jump", value: 3 }] };
}

function level11(): Level {
  const grid = field(6, 8);
  for (let r = 0; r < 6; r++) {
    grid[r][0] = G(2);
    grid[r][1] = null;
    grid[r][2] = SLOPE("se");
    grid[r][3] = SAND(1);
    grid[r][4] = G(1);
    grid[r][5] = SLOPE("nw");
  }
  grid[5][0] = HOLE(2);
  return { id: 11, grid, ball: { r: 0, c: 7 }, hand: [{ kind: "jump", value: 3 }, { kind: "move", value: 2 }, { kind: "move", value: 5 }, { kind: "move", value: 3 }] };
}

function level12(): Level {
  const grid: Grid = Array.from({ length: 5 }, () => Array<Tile | null>(11).fill(null));
  for (let r = 0; r < 5; r++) {
    grid[r][0] = G();
    grid[r][1] = r === 1 ? G() : null;
    grid[r][2] = SLOPE("se");
    grid[r][3] = G(1);
    grid[r][4] = SAND(1);
    grid[r][5] = SLOPE("nw");
  }
  for (let c = 7; c < 11; c++) grid[3][c] = G(2);
  grid[3][10] = HOLE(2);
  return { id: 12, grid, ball: { r: 3, c: 0 }, hand: [{ kind: "move", value: 4 }, { kind: "move", value: 2 }, { kind: "jump", value: 3 }, { kind: "move", value: 3 }, { kind: "move", value: 2 }, { kind: "move", value: 3 }] };
}

export const LEVELS: Level[] = [level1(), level2(), level3(), level4(), level5(), level6(), level7(), level8(), level9(), level10(), level11(), level12()];

export { field, G, HOLE };
