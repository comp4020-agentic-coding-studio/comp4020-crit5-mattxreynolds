import { type Run, currentLevel } from "./state";
import {
  DIRS,
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

  // All four directions, always. An arrow goes on the square beside the ball
  // whatever the card would do from there --- and whether or not there is a
  // square there at all. Which of them actually moves the ball is the
  // engine's business, and the player finds out by tapping one.
  const marked = armed === null ? [] : DIRS.map((dir) => ({ dir, cell: step(run.ball, dir) }));

  const classes = ["screen", armed !== null ? "armed" : ""].filter(Boolean).join(" ");

  if (run.phase === "finished") return finishHTML(run);

  return [
    `<section class="${classes}" data-phase="${run.phase}">`,
    gutter(run, true, "Restart level"),
    `<div class="stage">${boardHTML(level, run, marked)}</div>`,
    run.phase === "play" ? handHTML(run, level) : endHTML(level),
    `</section>`,
  ].join("");
}

/** Level number left, restart right --- one restart, one place, every state.
 *  On the ending screen there is no current level to number, and the restart
 *  starts the whole run again rather than the last level of it. */
function gutter(run: Run, level: boolean, label: string): string {
  return [
    `<div class="top-bar">`,
    level ? `<div class="lvl">${run.index + 1}</div>` : `<div></div>`,
    `<button class="redo sm" type="button" data-act="restart" aria-label="${label}">${RESTART_ICON}</button>`,
    `</div>`,
  ].join("");
}

/** The run is over. Not the board dimmed but the goal itself, and the score:
 *  how many restarts it took, which is the thing to beat on the next run.
 *
 *  The counted glyph and the button are the same restart mark on purpose ---
 *  it is the thing being counted --- and they are told apart by the contract's
 *  own rule: orange is what you can act on, so the score is ink on the field
 *  and only the gutter disc is a control. */
function finishHTML(run: Run): string {
  return [
    `<section class="screen finished" data-phase="finished">`,
    gutter(run, false, "Play again"),
    `<div class="stage"><div class="finish"><div class="cup"></div><div class="flag"></div></div></div>`,
    `<div class="score"><span class="score-mark" aria-hidden="true">${RESTART_ICON}</span>`,
    `<span class="score-num">${run.restarts}</span></div>`,
    `</section>`,
  ].join("");
}

// --- the board ------------------------------------------------------------

function boardHTML(level: Level, run: Run, marked: Marker[]): string {
  const rows = level.grid.length;
  const cols = level.grid[0].length;

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

  const tiles = level.grid
    .flatMap((row, r) => row.map((tile, c) => (tile ? tileHTML(tile, r, c, run) : "")))
    .join("");

  const dim = run.phase === "lost" ? " dim" : "";
  const shape = `--cols:${cols};--rows:${rows};--peak:${peak};--fx:${fx.toFixed(5)};--fy:${fy.toFixed(5)}`;
  return `<div class="board${dim}" style="${shape}">${tiles}${markerLayer(level, run, marked)}</div>`;
}

interface Marker {
  dir: Dir;
  cell: Pos;
}

/** Arrows live on the board, not inside tiles.
 *
 *  They have to: an arrow's square may be a gap in the board or past its edge,
 *  and a thing that only exists inside a tile cannot be drawn where there
 *  isn't one. Positioned by the same formula the tiles use, so an arrow over
 *  nothing still lines up with the row it belongs to. */
function markerLayer(level: Level, run: Run, marked: Marker[]): string {
  const standing = tileAt(level, run.ball);

  return marked
    .map(({ dir, cell }) => {
      const tile = tileAt(level, cell);
      // Over a gap there is no ground to sit on, so the arrow keeps the height
      // the ball is at. On a ramp it sits halfway up, as the ball does.
      const height = tile
        ? tile.height + (isRamp(tile) ? 0.5 : 0)
        : (standing?.height ?? 0);
      const slope = tile && isRamp(tile) ? ` sl sl-${tile.ramp}` : "";
      const place = `--r:${cell.r};--c:${cell.c};--lv:${height}`;

      return [
        `<div class="mk${slope}" style="${place}">`,
        `<div class="pl ar" style="--rot:${STEP[dir].rot}deg"><i class="tri"></i></div>`,
        `<button class="hit" type="button" data-dir="${dir}" aria-label="Roll ${dir}"></button>`,
        `</div>`,
      ].join("");
    })
    .join("");
}

function tileHTML(tile: Tile, r: number, c: number, run: Run): string {
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
    `</div>`,
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
