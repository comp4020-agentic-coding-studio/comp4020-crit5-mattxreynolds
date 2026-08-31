import { LEVELS } from "../game/levels";
import { screenHTML } from "../game/render";
import { resolve } from "../game/rules";
import { type Run, arm, currentLevel, playCard, restart, startRun } from "../game/state";
import type { Dir, Pos } from "../game/types";

// Wiring: events in, render out. Everything it decides, it asks the engine.

const STEP_MS = 140;
const HOLED_PAUSE_MS = 320;

const mount = document.getElementById("game");
if (mount) start(mount);

/** Narrowing `root` once, here, rather than inside a conditional block: the
 *  handlers below are closures and TypeScript won't carry the narrowing into
 *  them. */
function start(root: HTMLElement): void {
  let run: Run = startRun(LEVELS);
  let busy = false;

  const paint = (): void => {
    root.innerHTML = screenHTML(run);
  };

  root.addEventListener("click", (event) => {
    if (busy) return;
    const target = event.target as Element | null;
    if (!target) return;

    const restartButton = target.closest("[data-act='restart']");
    if (restartButton) {
      run = restart(run);
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
  async function roll(path: Pos[]): Promise<{ dx: number; dy: number; w: number } | null> {
    const ball = root.querySelector<HTMLElement>(".ball");
    const shadow = root.querySelector<HTMLElement>(".shdw");
    const tile = ball?.closest<HTMLElement>(".t");
    if (!ball || !tile || path.length < 2) return null;

    // One tile's width is the board's only size knob, and it is responsive, so
    // it is measured rather than assumed.
    const w = tile.getBoundingClientRect().width;
    if (!w) return null;
    const level = currentLevel(run);
    const centre = (p: Pos): { x: number; y: number } => ({
      x: (p.c - p.r) * (w / 2),
      y: (p.c + p.r) * (w / 4) - heightAt(p) * (w * 0.3),
    });
    const heightAt = (p: Pos): number => level.grid[p.r]?.[p.c]?.height ?? 0;

    const from = centre(path[0]);
    const offsets = path.map((p) => {
      const at = centre(p);
      return { dx: at.x - from.x, dy: at.y - from.y };
    });

    // Above every tile for the duration: a ball rolling behind the terrain it
    // is rolling across reads as a rendering fault.
    const restoreZ = tile.style.zIndex;
    tile.style.zIndex = "900";

    const frames = (base: string): Keyframe[] =>
      offsets.map(({ dx, dy }) => ({ transform: `translate(${dx}px, ${dy}px) ${base}` }));
    const timing: KeyframeAnimationOptions = {
      duration: STEP_MS * (path.length - 1),
      easing: "linear",
      fill: "forwards",
    };

    const animations = [ball.animate(frames("translate(-50%, -72%)"), timing)];
    if (shadow) animations.push(shadow.animate(frames("translate(-50%, -30%)"), timing));

    await Promise.all(animations.map((a) => a.finished.catch(() => undefined)));
    tile.style.zIndex = restoreZ;
    return { ...offsets[offsets.length - 1], w };
  }

  /** The ball drops in. Without this the roll just stops on the green next to
   *  the flag and nothing says the level was won --- found by playing it, not
   *  by reading it. */
  async function sink(settled: { dx: number; dy: number; w: number } | null): Promise<void> {
    const ball = root.querySelector<HTMLElement>(".ball");
    const shadow = root.querySelector<HTMLElement>(".shdw");
    if (!ball || !settled) return;
    const { dx, dy, w } = settled;

    // Behind the cup's rim, so it reads as going in rather than over.
    ball.style.zIndex = "0";
    shadow?.style.setProperty("opacity", "0");

    const at = (extra: string): string => `translate(${dx}px, ${dy}px) translate(-50%, -72%) ${extra}`;
    await ball
      .animate(
        [
          { transform: at("scale(1)"), offset: 0 },
          { transform: at(`translateY(${w * 0.14}px) scale(0.55)`), offset: 1 },
        ],
        { duration: 260, easing: "ease-in", fill: "forwards" },
      )
      .finished.catch(() => undefined);
  }

  const wait = (ms: number): Promise<void> =>
    new Promise((done) => {
      setTimeout(done, ms);
    });

  // The server already rendered the opening board, so the first paint only
  // happens when something changes --- the page is playable-looking with no
  // JavaScript, and identical once it loads.
}
