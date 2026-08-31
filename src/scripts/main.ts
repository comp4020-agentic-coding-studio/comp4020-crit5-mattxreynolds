import { LEVELS } from "../game/levels";
import { screenHTML } from "../game/render";
import { resolve } from "../game/rules";
import { type Run, arm, currentLevel, playCard, restart, startRun } from "../game/state";
import { type Dir, type Pos, isRamp } from "../game/types";

// Wiring: events in, render out. Everything it decides, it asks the engine.

const STEP_MS = 140;
const HOLED_PAUSE_MS = 260;

/** The offsets .ball and .shdw carry in CSS, which every animated transform
 *  has to keep or the ball jumps as the animation starts. */
const BALL_BASE = "translate(-50%, -72%)";
const SHADOW_BASE = "translate(-50%, -30%)";

interface Settled {
  dx: number;
  dy: number;
  w: number;
}

/** `?level=3` opens that level directly. A working affordance, not a feature:
 *  it is how a level gets looked at after a change without playing up to it.
 *  Nothing on screen mentions it, so a cold player never meets it. */
function requestedLevel(): number {
  const asked = Number(new URLSearchParams(window.location.search).get("level"));
  return Number.isFinite(asked) && asked > 0 ? asked - 1 : 0;
}

const mount = document.getElementById("game");
if (mount) start(mount);

/** Narrowing `root` once, here, rather than inside a conditional block: the
 *  handlers below are closures and TypeScript won't carry the narrowing into
 *  them. */
function start(root: HTMLElement): void {
  const opened = requestedLevel();
  let run: Run = startRun(LEVELS, opened);
  let busy = false;

  const paint = (): void => {
    root.innerHTML = screenHTML(run);
  };

  // The server already rendered level 1, so the only reason to paint on load
  // is having been asked for a different one.
  if (opened > 0) paint();

  root.addEventListener("click", (event) => {
    if (busy) return;
    const target = event.target as Element | null;
    if (!target) return;

    const restartButton = target.closest("[data-act='restart']");
    if (restartButton) {
      // Once the run is over the same control starts a new one, from the top,
      // with the score back to zero --- there is no level left to restart.
      run = run.phase === "finished" ? startRun(LEVELS) : restart(run);
      paint();
      return;
    }

    const card = target.closest<HTMLElement>("[data-card]");
    if (card) {
      run = arm(run, Number(card.dataset.card));
      paint();
      return;
    }

    const hit = target.closest<HTMLElement>("[data-dir]");
    if (hit && run.armed !== null) void take(hit.dataset.dir as Dir);
  });

  /** Roll the ball, then commit. The animation runs on the board as it stands,
   *  so the ball is seen leaving the tile it was on; the state changes when it
   *  arrives. A ball that teleports doesn't show why it stopped, and every
   *  rule in this game is about where it stops. */
  async function take(dir: Dir): Promise<void> {
    const index = run.armed;
    if (index === null) return;
    const level = currentLevel(run);
    const move = resolve(level, run.ball, level.hand[index], dir);

    busy = true;
    const settled = await roll(move.path);
    if (move.outcome === "holed") {
      await sink(settled);
      await wait(HOLED_PAUSE_MS);
    }
    run = playCard(run, index, move);
    paint();
    busy = false;
  }

  /** Animate the ball tile by tile along the path it actually took, and report
   *  where it came to rest so a holing ball can carry on into the cup. */
  async function roll(path: Pos[]): Promise<Settled | null> {
    const board = root.querySelector<HTMLElement>(".board");
    const ball = root.querySelector<HTMLElement>(".ball");
    const shadow = root.querySelector<HTMLElement>(".shdw");
    const tile = ball?.closest<HTMLElement>(".t");
    if (!board || !ball || !tile || path.length < 2) return null;

    // One tile's width is the board's only size knob, and it is responsive, so
    // it is measured rather than assumed.
    const w = tile.getBoundingClientRect().width;
    if (!w) return null;

    // The ball has to leave its tile before it can travel. Raising the tile's
    // z-index instead makes the whole slab jump in front of the terrain that
    // should be occluding it, because a tile is a stacking context and the
    // ball can't escape it from the inside.
    lift(board, ball, 0.72, 901);
    if (shadow) lift(board, shadow, 0.3, 900);

    const level = currentLevel(run);

    /** Where the ball sits, vertically, standing on this tile. A ramp is half
     *  a level: the ball is on the slope, not at either end of it. */
    const heightAt = (p: Pos): number => {
      const tile = level.grid[p.r]?.[p.c];
      if (!tile) return 0;
      return tile.height + (isRamp(tile) ? 0.5 : 0);
    };

    const centre = (p: Pos): { x: number; y: number } => ({
      x: (p.c - p.r) * (w / 2),
      y: (p.c + p.r) * (w / 4) - heightAt(p) * (w * 0.3),
    });

    const from = centre(path[0]);
    const offsets = path.map((p) => {
      const at = centre(p);
      return { dx: at.x - from.x, dy: at.y - from.y };
    });

    // Gravity, in the easing: the ball slows as it climbs and gathers speed as
    // it drops. On a failed climb --- up the ramp and back down again --- that
    // is the whole of what makes it read as running out of momentum rather
    // than changing its mind.
    const heights = path.map(heightAt);
    const frames = (base: string): Keyframe[] =>
      offsets.map(({ dx, dy }, i) => {
        const frame: Keyframe = { transform: `translate(${dx}px, ${dy}px) ${base}` };
        if (i < heights.length - 1) {
          const rise = heights[i + 1] - heights[i];
          frame.easing = rise > 0 ? "ease-out" : rise < 0 ? "ease-in" : "linear";
        }
        return frame;
      });

    const timing: KeyframeAnimationOptions = {
      duration: STEP_MS * (path.length - 1),
      fill: "forwards",
    };

    const animations = [ball.animate(frames(BALL_BASE), timing)];
    if (shadow) animations.push(shadow.animate(frames(SHADOW_BASE), timing));

    await Promise.all(animations.map((a) => a.finished.catch(() => undefined)));
    return { ...offsets[offsets.length - 1], w };
  }

  /** Re-parent an element onto the board, keeping it exactly where it looks
   *  like it already is. `anchor` is the fraction of its own height its CSS
   *  transform pulls it up by. */
  function lift(board: HTMLElement, el: HTMLElement, anchor: number, z: number): void {
    const box = el.getBoundingClientRect();
    const on = board.getBoundingClientRect();
    el.style.left = `${box.left + box.width / 2 - on.left}px`;
    el.style.top = `${box.top + anchor * box.height - on.top}px`;
    el.style.zIndex = String(z);
    board.appendChild(el);
  }

  /** The ball drops in. Without this the roll just stops on the green next to
   *  the flag and nothing says the level was won --- found by playing it, not
   *  by reading it. */
  async function sink(settled: Settled | null): Promise<void> {
    const ball = root.querySelector<HTMLElement>(".ball");
    const shadow = root.querySelector<HTMLElement>(".shdw");
    if (!ball || !settled) return;
    const { dx, dy, w } = settled;

    shadow?.style.setProperty("opacity", "0");

    const at = (extra: string): string => `translate(${dx}px, ${dy}px) ${BALL_BASE} ${extra}`;
    await ball
      .animate(
        [
          { transform: at("scale(1)"), opacity: 1, offset: 0 },
          { transform: at(`translateY(${w * 0.1}px) scale(0.62)`), opacity: 1, offset: 0.55 },
          { transform: at(`translateY(${w * 0.16}px) scale(0.45)`), opacity: 0, offset: 1 },
        ],
        { duration: 300, easing: "ease-in", fill: "forwards" },
      )
      .finished.catch(() => undefined);
  }

  const wait = (ms: number): Promise<void> =>
    new Promise((done) => {
      setTimeout(done, ms);
    });

}
