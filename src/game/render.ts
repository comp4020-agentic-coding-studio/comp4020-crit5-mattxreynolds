import { type Run, currentLevel } from "./state";
import {
  DIRS,
  STEP,
  type Dir,
  type Level,
  type Pos,
  type Tile,
  isRamp,
  opposite,
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
const MUSIC_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l10-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="16" cy="16" r="3"></circle></svg>`;
const SOUND_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9H2v6h3l5 4V5L5 9Z"></path><path d="M14 9a4 4 0 0 1 0 6M16.5 6.5a7.5 7.5 0 0 1 0 11"></path></svg>`;

export function screenHTML(run: Run): string {
  const level = currentLevel(run);
  const armed = run.phase === "play" && run.armed !== null ? run.armed : null;

  // All four directions, always. An arrow goes on the square beside the ball
  // whatever the card would do from there --- and whether or not there is a
  // square there at all. Which of them actually moves the ball is the
  // engine's business, and the player finds out by tapping one.
  const marked = armed === null ? [] : DIRS.map((dir) => ({ dir, cell: step(run.ball, dir) }));

  const classes = ["screen", armed !== null ? "armed" : "", run.phase === "lost" ? "lost" : ""]
    .filter(Boolean)
    .join(" ");

  if (run.phase === "finished") return finishHTML(run);

  return [
    `<section class="${classes}" data-phase="${run.phase}">`,
    gutter(run, true, true),
    `<div class="stage">${boardHTML(level, run, marked)}</div>`,
    run.phase === "play" ? handHTML(run, level) : endHTML(level),
    `</section>`,
  ].join("");
}

/** A symmetrical toolbar: level left, progress centred, restart right. The
 *  running tally sits directly below rather than pulling the left side wider.
 *  The ending keeps only the completed course because its action belongs with
 *  the result, not in a distant corner. */
function gutter(run: Run, level: boolean, action: boolean): string {
  const left = level
    ? `<div class="lvl">${run.index + 1}</div>`
    : "";
  const bar = [
    `<div class="top-bar">`,
    `<div class="left">${left}</div>`,
    progressHTML(run),
    action
      ? `<button class="redo sm" type="button" data-act="restart" aria-label="Restart level">${RESTART_ICON}</button>`
      : `<span class="bar-end" aria-hidden="true"></span>`,
    `</div>`,
  ].join("");
  const tally = level
    ? `<span class="tally run-tally"><span class="tally-mark" aria-hidden="true">${RESTART_ICON}</span><span class="tally-num">${run.restarts}</span></span>`
    : "";
  return `${bar}${tally}${audioControlsHTML()}`;
}

function audioControlsHTML(): string {
  return [
    `<div class="audio-controls" aria-label="Audio controls">`,
    `<button class="audio-toggle" type="button" data-audio="music" aria-label="Turn music on" aria-pressed="false">${MUSIC_ICON}</button>`,
    `<button class="audio-toggle" type="button" data-audio="effects" aria-label="Turn sound effects off" aria-pressed="true">${SOUND_ICON}</button>`,
    `</div>`,
  ].join("");
}

/** The run's shape, always visible: twelve positions rather than a percentage
 *  or a sentence. The same strip follows the player from the opening screen
 *  to the score, so the ending reads as completion rather than another level. */
function progressHTML(run: Run): string {
  const steps = run.levels
    .map((_, i) => {
      const state =
        run.phase === "finished" || i < run.index
          ? "done"
          : i === run.index
            ? run.phase === "lost"
              ? "failed"
              : "current"
            : "ahead";
      return `<i class="progress-step ${state}" aria-hidden="true"></i>`;
    })
    .join("");
  const at = run.phase === "finished" ? run.levels.length : run.index + 1;
  return `<div class="progress" role="img" aria-label="Level ${at} of ${run.levels.length}">${steps}</div>`;
}

/** The run is over. The goal gives way to an explicit result sentence and a
 *  named full-run action; unlike the teaching screens, there is nothing left
 *  for prose to spoil here. */
function finishHTML(run: Run): string {
  const noun = run.restarts === 1 ? "reset" : "resets";
  return [
    `<section class="screen finished" data-phase="finished">`,
    gutter(run, false, false),
    `<div class="result">`,
    `<div class="finish"><div class="cup"></div><div class="flag"></div></div>`,
    `<div class="finish-message"><h2>Congratulations!</h2><p>You finished with <strong>${run.restarts}</strong> ${noun}.</p></div>`,
    `<button class="start-over" type="button" data-act="restart">${RESTART_ICON}<span>Start over</span></button>`,
    `</div>`,
    `</section>`,
  ].join("");
}

// --- the board ------------------------------------------------------------

function boardHTML(level: Level, run: Run, marked: Marker[]): string {
  const rows = level.grid.length;
  const cols = level.grid[0].length;
  const occupied = level.grid.flatMap((row, r) =>
    row.flatMap((tile, c) => (tile ? [c - r] : [])),
  );
  const minQ = Math.min(...occupied);
  const maxQ = Math.max(...occupied);
  // One tile is two half-widths wide, hence +2 around the occupied centre
  // range. This trims only empty rectangular corners; level geometry is
  // untouched and sparse boards use the full horizontal stage.
  const spanX = maxQ - minQ + 2;

  // Raised ground is drawn *above* the flat board's box, so the box has to
  // make room for the tallest thing on the level or it centres by the wrong
  // rectangle and the back row rides up under the gutter bar. A ramp counts as
  // its high edge.
  const peak = Math.max(
    0,
    ...level.grid.flatMap((row) => row.flatMap((tile) => (tile ? [topHeight(tile)] : []))),
  );

  const fx = 2 / spanX;
  const fy = 1 / ((cols + rows - 2) / 4 + 0.8 + peak * 0.3);

  const tiles = level.grid
    .flatMap((row, r) => row.map((tile, c) => (tile ? tileHTML(tile, r, c, run) : "")))
    .join("");

  const dim = run.phase === "lost" ? " dim" : "";
  const shape = `--cols:${cols};--rows:${rows};--min-q:${minQ};--span-x:${spanX};--peak:${peak};--fx:${fx.toFixed(5)};--fy:${fy.toFixed(5)}`;
  return `<div class="board${dim}" style="${shape}">${tiles}${markerLayer(level, run, marked)}</div>`;
}

interface Marker {
  dir: Dir;
  cell: Pos;
}

const DIRECTION_NAME: Record<Dir, string> = {
  ne: "northeast",
  se: "southeast",
  sw: "southwest",
  nw: "northwest",
};

/** Arrows live on the board, not inside tiles.
 *
 *  They have to: an arrow's square may be a gap in the board or past its edge,
 *  and a thing that only exists inside a tile cannot be drawn where there
 *  isn't one. Positioned by the same formula the tiles use, so an arrow over
 *  nothing still lines up with the row it belongs to. */
function markerLayer(level: Level, run: Run, marked: Marker[]): string {
  const standing = tileAt(level, run.ball);
  const standingHeight = standing
    ? standing.height + (isRamp(standing) ? 0.5 : 0)
    : 0;

  return marked
    .map(({ dir, cell }) => {
      const tile = tileAt(level, cell);
      // Over a gap there is no ground to sit on, so the arrow keeps the height
      // the ball is at. On a ramp it sits halfway up, as the ball does.
      const neighbourHeight = tile
        ? tile.height + (isRamp(tile) ? 0.5 : 0)
        : standingHeight;
      // A direction leaving high ground stays flat at the ball's elevation,
      // whether the lower neighbour is flat or a slope descending away from
      // it. Uphill arrows still belong to the slope plane itself.
      const descendsRamp =
        tile &&
        isRamp(tile) &&
        dir === opposite(tile.ramp) &&
        standingHeight === topHeight(tile);
      const height = descendsRamp
        ? standingHeight
        : Math.max(standingHeight, neighbourHeight);
      const slope = tile && isRamp(tile) && !descendsRamp ? ` sl sl-${tile.ramp}` : "";
      const place = `--r:${cell.r};--c:${cell.c};--lv:${height}`;

      return [
        `<div class="mk dir-${dir}${slope}" style="${place}">`,
        `<div class="pl direction-pad" aria-hidden="true"><i></i></div>`,
        `<div class="pl ar" style="--rot:${STEP[dir].rot}deg"><i class="tri"></i></div>`,
        `<button class="hit" type="button" data-dir="${dir}" aria-label="Roll ${DIRECTION_NAME[dir]}"></button>`,
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
  return `<div class="hand cards-${level.hand.length}">${cards}</div>`;
}

/** The end of a level, and for now the end of a run: the spent hand sitting
 *  where the hand sat, so the position you lost from stays readable. Not a
 *  dialog, and carrying no words. */
function endHTML(level: Level): string {
  const cards = level.hand.map((card) => cardHTML(card.kind, card.value, true, false)).join("");
  return [
    `<div class="endcard">`,
    `<button class="redo loss-restart" type="button" data-act="restart" aria-label="Restart level">${RESTART_ICON}</button>`,
    `<div class="hand cards-${level.hand.length}">${cards}</div>`,
    `</div>`,
  ].join("");
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
  return `<button class="${classes}" type="button" data-card="${index}" aria-label="Play ${kind} card ${value}">${face}</button>`;
}
