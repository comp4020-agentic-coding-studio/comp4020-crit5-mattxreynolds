import { LEVELS } from "../game/levels";
import { screenHTML } from "../game/render";
import { resolve } from "../game/rules";
import { type Run, arm, currentLevel, playCard, restart, startRun } from "../game/state";
import { STEP, type Dir, type Pos, isRamp } from "../game/types";
import { GameAudio } from "./audio";

// Wiring: events in, render out. Everything it decides, it asks the engine.

const STEP_MS = 140;
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motion = (ms: number): number => (REDUCED_MOTION ? Math.min(ms, 45) : ms);

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
  let keyboardMode = false;
  const audio = new GameAudio();

  const syncAudioControls = (): void => {
    for (const button of root.querySelectorAll<HTMLButtonElement>("[data-audio]")) {
      const kind = button.dataset.audio as "music" | "effects";
      const enabled = kind === "music" ? audio.music : audio.effects;
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", `Turn ${kind === "music" ? "music" : "sound effects"} ${enabled ? "off" : "on"}`);
    }
  };

  const placeHand = (): void => {
    const screen = root.querySelector<HTMLElement>(".screen");
    const stage = root.querySelector<HTMLElement>(".stage");
    const board = root.querySelector<HTMLElement>(".board");
    const hand = root.querySelector<HTMLElement>(".screen > .hand, .endcard");
    if (!screen || !stage || !board || !hand) return;

    // offsetTop/offsetHeight describe the settled layout even while an entry
    // transform is running. The hand belongs halfway through the free field
    // below the platform, whatever shape this level happens to be.
    const stageShift = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const boardBottom =
      stage.offsetTop + stageShift + board.offsetTop + board.offsetHeight;
    const screenBottom = screen.clientHeight;
    const halfHand = hand.offsetHeight / 2;
    const wanted = boardBottom + (screenBottom - boardBottom) / 2;
    const clearOfBoard = boardBottom + halfHand + 12;
    const clearOfEdge = screenBottom - halfHand - 12;
    screen.style.setProperty(
      "--hand-y",
      `${Math.min(Math.max(wanted, clearOfBoard), clearOfEdge)}px`,
    );
  };

  const paint = (): void => {
    root.innerHTML = screenHTML(run);
    syncAudioControls();
    placeHand();
  };

  const enter = (kind = "entering"): void => {
    root.classList.add(kind);
    window.setTimeout(() => root.classList.remove(kind), motion(620));
  };

  // The server already rendered level 1, so the only reason to paint on load
  // is having been asked for a different one.
  if (opened > 0) paint();
  else {
    syncAudioControls();
    placeHand();
  }
  enter("booting");
  window.addEventListener("resize", placeHand);
  root.addEventListener("pointerdown", () => { keyboardMode = false; });

  const focusAfterPaint = (selector: string): void => {
    if (!keyboardMode) return;
    window.requestAnimationFrame(() =>
      root.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }),
    );
  };

  window.addEventListener("keydown", (event) => {
    keyboardMode = true;
    if (busy) return;

    if (event.key === "Escape" && run.armed !== null) {
      const card = run.armed;
      event.preventDefault();
      run = arm(run, card);
      paint();
      focusAfterPaint(`[data-card='${card}']`);
      return;
    }

    if (run.armed === null) return;
    const direction: Partial<Record<string, Dir>> = {
      ArrowUp: "ne",
      ArrowRight: "se",
      ArrowDown: "sw",
      ArrowLeft: "nw",
      w: "ne",
      d: "se",
      s: "sw",
      a: "nw",
    };
    const dir = direction[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (!dir) return;
    event.preventDefault();
    // Keyboard direction input is deliberately two-step: first move the
    // visible focus/highlight, then let Enter activate the real button. This
    // makes an accidental direction key reversible before a card is spent.
    root.querySelector<HTMLElement>(`[data-dir='${dir}']`)?.focus({ preventScroll: true });
    audio.play("select");
  });

  root.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (!target) return;
    void audio.unlock();

    const audioButton = target.closest<HTMLButtonElement>("[data-audio]");
    if (audioButton) {
      const kind = audioButton.dataset.audio as "music" | "effects";
      audio.toggle(kind);
      syncAudioControls();
      if (kind === "effects" && audio.effects) audio.play("select");
      return;
    }

    if (busy) return;

    const restartButton = target.closest("[data-act='restart']");
    if (restartButton) {
      void restartLevel();
      return;
    }

    const card = target.closest<HTMLElement>("[data-card]");
    if (card) {
      run = arm(run, Number(card.dataset.card));
      audio.play("select");
      paint();
      if (run.armed !== null) focusAfterPaint("[data-dir='ne']");
      return;
    }

    const hit = target.closest<HTMLElement>("[data-dir]");
    if (hit && run.armed !== null) void take(hit.dataset.dir as Dir);
  });

  async function restartLevel(): Promise<void> {
    busy = true;
    audio.play("restart");
    await leaveScreen(180);
    // Once the run is over this starts a new one from the top; otherwise the
    // tally ticks up while the same level resets beneath stationary chrome.
    const wholeRun = run.phase === "finished";
    run = wholeRun ? startRun(LEVELS) : restart(run);
    root.classList.add("entering", wholeRun ? "run-started" : "tally-changed");
    paint();
    window.setTimeout(
      () => root.classList.remove("entering", "run-started", "tally-changed"),
      motion(620),
    );
    busy = false;
  }

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

    // Every direction is offered now, and some of them are walls. A card is
    // spent when the ball *moves* --- rolling up a ramp and back down counts,
    // because it moved and it showed you why it failed. Nothing at all does
    // not: the ball leans that way, finds it cannot, and settles back, and the
    // hand is untouched.
    if (move.path.length < 2) {
      audio.play("blocked");
      await nudge(dir);
      busy = false;
      return;
    }
    audio.play("roll");
    const settled = await roll(
      move.path,
      level.hand[index].kind === "jump",
      move.outcome !== "fell",
    );
    if (move.blocked) {
      audio.play("blocked");
      await bump(dir, settled);
    }
    if (move.stoppedBy === "sand") {
      audio.play("sand");
      await sandStop(settled);
    }
    const spent = spendCard(index);
    if (move.outcome === "holed") {
      audio.play(run.index === run.levels.length - 1 ? "finish" : "hole");
      await Promise.all([sink(settled), spent, completeProgress()]);
      await wait(motion(80));
      await leaveScreen(160);
    } else if (move.outcome === "fell") {
      audio.play("fall");
      await Promise.all([fallAway(settled), spent]);
    } else {
      await spent;
    }
    run = playCard(run, index, move);
    if (run.phase === "lost") audio.play("fail");
    if (move.outcome === "holed") root.classList.add("entering");
    paint();
    if (run.phase === "play") focusAfterPaint("button.c:not(.spent)");
    else if (run.phase === "lost") focusAfterPaint(".loss-restart");
    else focusAfterPaint(".start-over");
    if (move.outcome === "holed") {
      window.setTimeout(() => root.classList.remove("entering"), motion(620));
    }
    busy = false;
  }

  async function spendCard(index: number): Promise<void> {
    const card = root.querySelector<HTMLElement>(`[data-card='${index}']`);
    if (!card) return;
    const pose = getComputedStyle(card).transform;
    await card
      .animate(
        [
          { opacity: 1, filter: "grayscale(0)", transform: pose },
          {
            opacity: 0.58,
            filter: "grayscale(0.72)",
            transform: `${pose} translateY(4px) scale(0.96)`,
          },
        ],
        { duration: motion(190), easing: "ease-out", fill: "forwards" },
      )
      .finished.catch(() => undefined);
  }

  async function completeProgress(): Promise<void> {
    const current = root.querySelector<HTMLElement>(".progress-step.current");
    const next = current?.nextElementSibling as HTMLElement | null;
    const animations: Animation[] = [];
    if (current) {
      animations.push(
        current.animate(
          [
            { transform: "scale(1)", background: "var(--card)" },
            { transform: "scale(1.35)", background: "#728b68", offset: 0.55 },
            { transform: "scale(0.72)", background: "#728b68" },
          ],
          { duration: motion(260), easing: "ease-out", fill: "forwards" },
        ),
      );
    }
    if (next) {
      animations.push(
        next.animate(
          [{ transform: "scale(0.7)" }, { transform: "scale(1.45)" }, { transform: "scale(1)" }],
          { duration: motion(300), delay: motion(120), easing: "ease-out" },
        ),
      );
    }
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  }

  async function leaveScreen(ms: number): Promise<void> {
    const pieces = root.querySelectorAll<HTMLElement>(".stage, .hand, .result");
    const animations = [...pieces].map((piece) =>
      piece.animate(
        [
          { opacity: 1, transform: "translateY(0) scale(1)" },
          { opacity: 0, transform: "translateY(10px) scale(0.97)" },
        ],
        { duration: motion(ms), easing: "ease-in", fill: "forwards" },
      ),
    );
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  }

  /** Animate the ball tile by tile along the path it actually took, and report
   *  where it came to rest so a holing ball can carry on into the cup. */
  async function roll(path: Pos[], arcs: boolean, lands: boolean): Promise<Settled | null> {
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
    const rolled = (base: string): Keyframe[] =>
      offsets.map(({ dx, dy }, i) => {
        const frame: Keyframe = { transform: `translate(${dx}px, ${dy}px) ${base}` };
        if (i < heights.length - 1) {
          const rise = heights[i + 1] - heights[i];
          frame.easing = rise > 0 ? "ease-out" : rise < 0 ? "ease-in" : "linear";
        }
        return frame;
      });

    /** A jump is one throw, not a series of steps: the ball leaves the ground,
     *  crosses whatever is under it and comes down. The height is a plain
     *  parabola sampled often enough to read as a curve, scaled to how far the
     *  throw is --- and the shadow stays on the ground and shrinks, which is
     *  what actually says the ball is in the air rather than sliding. */
    // A slope landing adds a downhill tail to the engine path. Only the first
    // leg is airborne: arc onto path[1], then visibly roll through the rest.
    const end = offsets[1];
    const tiles = Math.max(
      1,
      Math.abs(path[1].c - path[0].c) + Math.abs(path[1].r - path[0].r),
    );
    const hop = w * (0.34 + 0.1 * tiles);
    const SAMPLES = 16;
    const jumpDuration = Math.max(340, STEP_MS * tiles);
    const landingDuration = lands ? 100 : 0;
    const tailDuration = STEP_MS * Math.max(0, path.length - 2);
    const totalDuration = jumpDuration + landingDuration + tailDuration;
    const jumpShare = jumpDuration / totalDuration;
    const landingShare = (jumpDuration + landingDuration) / totalDuration;

    const thrown = (base: string, ground: boolean): Keyframe[] =>
      Array.from({ length: SAMPLES + 1 }, (_, i) => {
        const t = i / SAMPLES;
        const lift = 4 * t * (1 - t);
        const dx = end.dx * t;
        const dy = end.dy * t - (ground ? 0 : hop * lift);
        const scale = ground ? `scale(${(1 - 0.4 * lift).toFixed(3)})` : "";
        return { transform: `translate(${dx}px, ${dy}px) ${base} ${scale}`, easing: "linear" };
      });

    const jumpedThenRolled = (base: string, ground = false): Keyframe[] => {
      const jump = thrown(base, ground).map((frame, i) => ({
        ...frame,
        offset: (i / SAMPLES) * jumpShare,
      }));
      const touchdown: Keyframe[] = lands
        ? [
            {
              transform: `translate(${end.dx}px, ${end.dy}px) ${base} ${ground ? "scale(1.16)" : "scale(0.9, 1.08)"}`,
              offset: jumpShare,
              easing: "ease-out",
            },
            {
              transform: `translate(${end.dx}px, ${end.dy}px) ${base}`,
              offset: landingShare,
              easing: "ease-in",
            },
          ]
        : [];
      if (path.length === 2) return [...jump, ...touchdown];

      const ontoTail = touchdown[touchdown.length - 1] ?? jump[jump.length - 1];
      const firstDrop = heights[2] - heights[1];
      ontoTail.easing = firstDrop > 0 ? "ease-out" : firstDrop < 0 ? "ease-in" : "linear";

      const tail = offsets.slice(2).map(({ dx, dy }, i) => ({
        transform: `translate(${dx}px, ${dy}px) ${base}`,
        offset: landingShare + ((i + 1) / (path.length - 2)) * (1 - landingShare),
        easing: "linear",
      }));
      return [...jump, ...tail];
    };

    const frames = arcs
      ? (base: string, ground = false): Keyframe[] => jumpedThenRolled(base, ground)
      : (base: string): Keyframe[] => rolled(base);

    const timing: KeyframeAnimationOptions = {
      duration: motion(arcs ? totalDuration : STEP_MS * (path.length - 1)),
      fill: "forwards",
    };

    const animations = [ball.animate(frames(BALL_BASE), timing)];
    if (shadow) animations.push(shadow.animate(frames(SHADOW_BASE, true), timing));

    await Promise.all(animations.map((a) => a.finished.catch(() => undefined)));
    return { ...offsets[offsets.length - 1], w };
  }

  /** A direction the ball simply cannot take. It leans into it and settles
   *  back --- enough to say "not that way" without spending anything, and the
   *  same shape of answer the ramp gives when a climb is too steep. */
  async function nudge(dir: Dir): Promise<void> {
    const ball = root.querySelector<HTMLElement>(".ball");
    const shadow = root.querySelector<HTMLElement>(".shdw");
    const tile = ball?.closest<HTMLElement>(".t");
    if (!ball || !tile) return;

    const w = tile.getBoundingClientRect().width;
    const { dr, dc } = STEP[dir];
    const dx = (dc - dr) * (w / 2) * 0.17;
    const dy = (dc + dr) * (w / 4) * 0.17;

    const lean = (base: string): Keyframe[] => [
      { transform: `translate(0, 0) ${base}` },
      { transform: `translate(${dx}px, ${dy}px) ${base}`, offset: 0.4 },
      { transform: `translate(0, 0) ${base}` },
    ];
    const timing: KeyframeAnimationOptions = { duration: motion(260), easing: "ease-in-out" };

    const leaning = [ball.animate(lean(BALL_BASE), timing)];
    if (shadow) leaning.push(shadow.animate(lean(SHADOW_BASE), timing));
    await Promise.all(leaning.map((a) => a.finished.catch(() => undefined)));
  }

  /** Finish an interrupted roll with a small impact. Unlike nudge(), the ball
   *  has already been lifted onto the board and travelled some distance, so
   *  this starts at the settled offset and rebounds there. */
  async function bump(dir: Dir, settled: Settled | null): Promise<void> {
    const ball = root.querySelector<HTMLElement>(".ball");
    const shadow = root.querySelector<HTMLElement>(".shdw");
    if (!ball || !settled) return;

    const { dx, dy, w } = settled;
    const { dr, dc } = STEP[dir];
    const bx = (dc - dr) * (w / 2) * 0.13;
    const by = (dc + dr) * (w / 4) * 0.13;
    const at = (base: string, x = 0, y = 0, shape = ""): string =>
      `translate(${dx + x}px, ${dy + y}px) ${base} ${shape}`;
    const frames = (base: string): Keyframe[] => [
      { transform: at(base), offset: 0 },
      { transform: at(base, bx, by, "scale(0.9, 1.08)"), offset: 0.38 },
      { transform: at(base, -bx * 0.28, -by * 0.28), offset: 0.68 },
      { transform: at(base), offset: 1 },
    ];
    const timing: KeyframeAnimationOptions = { duration: motion(260), easing: "ease-out", fill: "forwards" };
    const bounced = [ball.animate(frames(BALL_BASE), timing)];
    if (shadow) bounced.push(shadow.animate(frames(SHADOW_BASE), timing));
    await Promise.all(bounced.map((a) => a.finished.catch(() => undefined)));
  }

  /** Sand consumes the remaining distance. A small burst at the landing tile
   *  and a shallow settle make the terrain, rather than an invisible rule,
   *  visibly responsible for the stop. */
  async function sandStop(settled: Settled | null): Promise<void> {
    const board = root.querySelector<HTMLElement>(".board");
    const ball = root.querySelector<HTMLElement>(".ball");
    if (!board || !ball || !settled) return;
    const { dx, dy, w } = settled;
    const burst = document.createElement("div");
    burst.className = "sand-burst";
    burst.style.left = `${Number.parseFloat(ball.style.left) + dx}px`;
    burst.style.top = `${Number.parseFloat(ball.style.top) + dy}px`;
    burst.style.setProperty("--burst", `${w}px`);
    burst.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i>";
    board.appendChild(burst);

    const at = (extra = ""): string => `translate(${dx}px, ${dy}px) ${BALL_BASE} ${extra}`;
    await Promise.all([
      ball
        .animate(
          [
            { transform: at() },
            { transform: at(`translateY(${w * 0.035}px) scale(0.97)`), offset: 0.55 },
            { transform: at() },
          ],
          { duration: motion(260), easing: "ease-out", fill: "forwards" },
        )
        .finished.catch(() => undefined),
      wait(motion(260)),
    ]);
    burst.remove();
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
        { duration: motion(300), easing: "ease-in", fill: "forwards" },
      )
      .finished.catch(() => undefined);
  }

  /** The ball goes with the edge. It keeps drifting the way it was already
   *  travelling, drops further than a hole would take it, and fades all the
   *  way out --- longer and further than sink(), because this is gone, not
   *  in. */
  async function fallAway(settled: Settled | null): Promise<void> {
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
          { transform: at(`translateY(${w * 0.35}px) scale(0.8)`), opacity: 0.5, offset: 0.6 },
          { transform: at(`translateY(${w * 0.7}px) scale(0.5)`), opacity: 0, offset: 1 },
        ],
        { duration: motion(480), easing: "ease-in", fill: "forwards" },
      )
      .finished.catch(() => undefined);
  }

  const wait = (ms: number): Promise<void> =>
    new Promise((done) => {
      setTimeout(done, ms);
    });

}
