import { offers } from "./rules";
import { type Run, currentLevel } from "./state";
import {
  STEP,
  type Dir,
  type Level,
  type Pos,
  type Tile,
  isRamp,
  samePos,
  step,
  tileAt,
  topHeight,
} from "./types";

/** State to HTML. The only file that knows a tile is three clip-path faces.
 *
 *  It is a pure string function rather than a DOM builder so the Astro build
 *  and the browser can share one renderer: the page ships a real board in its
 *  HTML instead of an empty div waiting on JavaScript, and every rule about
 *  what appears on screen is testable without a browser. */

const RESTART_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v6h-6"></path></svg>`;

export function screenHTML(run: Run): string {
  const level = currentLevel(run);
  const armed = run.phase === "play" && run.armed !== null ? run.armed : null;
  const marks = armed === null ? [] : offers(level, run.ball, level.hand[armed]);

  const classes = ["screen", armed !== null ? "armed" : ""].filter(Boolean).join(" ");

  return [
    `<section class="${classes}" data-phase="${run.phase}">`,
    gutter(run),
    `<div class="stage">${boardHTML(level, run, marks)}</div>`,
    run.phase === "play" ? handHTML(run, level) : endHTML(level),
    `</section>`,
  ].join("");
}

/** Level number left, restart right --- one restart, one place, every state. */
function gutter(run: Run): string {
  return [
    `<div class="top-bar">`,
    `<div class="lvl">${run.index + 1}</div>`,
    `<button class="redo sm" type="button" data-act="restart" aria-label="Restart level">${RESTART_ICON}</button>`,
    `</div>`,
  ].join("");
}

// --- the board ------------------------------------------------------------

function boardHTML(level: Level, run: Run, marks: Array<{ dir: Dir; move: unknown }>): string {
  const rows = level.grid.length;
  const cols = level.grid[0].length;

  // --fx and --fy are the reciprocals styles.css multiplies by; see the note
  // there. Reciprocals so calc() only ever has to multiply by a number.
  // Raised ground is drawn *above* the flat board's box, so the box has to
  // make room for the tallest thing on the level or it centres by the wrong
  // rectangle and the back row rides up under the gutter bar. A ramp counts as
  // its high edge.
  const peak = Math.max(
    0,
    ...level.grid.flatMap((row) => row.flatMap((tile) => (tile ? [topHeight(tile)] : []))),
  );

  const fx = 2 / (cols + rows);
  const fy = 1 / ((cols + rows - 2) / 4 + 0.8 + peak * 0.3);

  // Markers sit on the tile *next to* the ball, not on the tile it would land
  // on. They read as a direction chooser --- four arrows around the ball ---
  // rather than as four destinations scattered at different distances.
  const marked = new Map<string, Dir>();
  for (const mark of marks as Array<{ dir: Dir; move: { landing: Pos } }>) {
    const next = step(run.ball, mark.dir);
    // A jump can clear a gap, in which case there is no tile beside the ball
    // to draw on; fall back to where it lands.
    marked.set(key(tileAt(level, next) ? next : mark.move.landing), mark.dir);
  }

  const tiles = level.grid
    .flatMap((row, r) => row.map((tile, c) => (tile ? tileHTML(tile, r, c, run, marked) : "")))
    .join("");

  // Desaturating the board is the *lost* treatment --- it exists so the
  // position you lost from stays readable while the restart is the only
  // saturated thing left. A finished run is not that, and gets its own
  // treatment in T11.
  const dim = run.phase === "lost" ? " dim" : "";
  const shape = `--cols:${cols};--rows:${rows};--peak:${peak};--fx:${fx.toFixed(5)};--fy:${fy.toFixed(5)}`;
  return `<div class="board${dim}" style="${shape}">${tiles}</div>`;
}

const key = (p: Pos): string => `${p.r},${p.c}`;

function tileHTML(
  tile: Tile,
  r: number,
  c: number,
  run: Run,
  marked: Map<string, Dir>,
): string {
  const dir = marked.get(key({ r, c }));
  const parts = [
    `<div class="fl"></div>`,
    `<div class="fr"></div>`,
    `<div class="top"></div>`,
    `<div class="fx">`,
    tile.terrain === "hole" ? `<div class="cup"></div><div class="flag"></div>` : "",
    // A ball standing on the hole would hide the cup it just went into, so a
    // holed ball simply isn't drawn --- the cup and flag say where it is.
    samePos(run.ball, { r, c }) && tile.terrain !== "hole"
      ? `<div class="shdw"></div><div class="ball"></div>`
      : "",
    dir ? `<div class="pl ar" style="--rot:${STEP[dir].rot}deg"><i class="tri"></i></div>` : "",
    `</div>`,
    // The hit target is its own diamond rather than the tile's box, which
    // overlaps its neighbours', or the marker's, which is sheared to twice the
    // tile's width and would steal taps from the tiles either side.
    dir
      ? `<button class="hit" type="button" data-dir="${dir}" aria-label="Roll ${dir}"></button>`
      : "",
  ];

  return `<div class="t ${terrainClasses(tile)}" style="--r:${r};--c:${c};--lv:${tile.height}">${parts.join("")}</div>`;
}

/** Higher ground is darker --- one convention, every tile. Three steps of it:
 *  above the second, further levels stop being tellable apart by value alone
 *  and the slab's own depth face is what reads. */
function terrainClasses(tile: Tile): string {
  const ground = tile.height === 0 ? "gr" : tile.height === 1 ? "up" : "up2";
  // Sand keeps the ground class as well as its own: `sd` repaints the surface,
  // and the class underneath is what carries the height.
  const classes = tile.terrain === "sand" ? [ground, "sd"] : [ground];
  if (isRamp(tile)) classes.push("sl", `sl-${tile.ramp}`);
  return classes.join(" ");
}

// --- the hand -------------------------------------------------------------

function handHTML(run: Run, level: Level): string {
  const cards = level.hand
    .map((card, i) => cardHTML(card.kind, card.value, run.spent[i], run.armed === i, i))
    .join("");
  return `<div class="hand">${cards}</div>`;
}

/** The end of a level, and for now the end of a run: the spent hand sitting
 *  where the hand sat, so the position you lost from stays readable. Not a
 *  dialog, and carrying no words. */
function endHTML(level: Level): string {
  const cards = level.hand.map((card) => cardHTML(card.kind, card.value, true, false)).join("");
  return `<div class="endcard"><div class="hand">${cards}</div></div>`;
}

function cardHTML(
  kind: "move" | "jump",
  value: number,
  spent: boolean,
  armed: boolean,
  index?: number,
): string {
  const classes = ["c", spent ? "spent" : "", armed ? "sel" : ""].filter(Boolean).join(" ");
  const mark = `<div class="gl${kind === "jump" ? " arc" : ""}"></div>`;
  const face = `<div class="num">${value}</div>${mark}`;

  if (spent || index === undefined) return `<div class="${classes}">${face}</div>`;
  return `<button class="${classes}" type="button" data-card="${index}" aria-label="Play card ${value}">${face}</button>`;
}
