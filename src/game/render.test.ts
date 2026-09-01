import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { offers } from "./rules";
import { arm, startRun } from "./state";
import type { Level } from "./types";
import { screenHTML } from "./render";

// render.ts is the only file that knows tiles are HTML, and it is a pure
// string function --- which is what lets the Astro build and the browser share
// one renderer, and what lets this test run without a browser.

const dom = (html: string) => new JSDOM(`<body>${html}</body>`).window.document;

describe("the board", () => {
  const doc = dom(screenHTML(startRun(LEVELS)));

  it("renders one tile per cell, each with three faces and a ground plane", () => {
    const tiles = doc.querySelectorAll(".t");
    expect(tiles.length).toBe(9);
    for (const tile of tiles) {
      for (const face of [".top", ".fl", ".fr", ".fx"]) {
        expect(tile.querySelector(face)).toBeTruthy();
      }
    }
  });

  it("carries the ball, the cup and the flag", () => {
    expect(doc.querySelectorAll(".ball").length).toBe(1);
    expect(doc.querySelectorAll(".cup").length).toBe(1);
    expect(doc.querySelectorAll(".flag").length).toBe(1);
  });

  it("shows no direction markers until a card is armed", () => {
    expect(doc.querySelectorAll(".ar").length).toBe(0);
    expect(doc.querySelectorAll(".hit").length).toBe(0);
    expect(doc.querySelectorAll(".mk").length).toBe(0);
    expect(doc.querySelector(".screen")?.classList.contains("armed")).toBe(false);
  });
});

describe("audio controls", () => {
  const doc = dom(screenHTML(startRun(LEVELS)));

  it("offers separate music and sound-effect toggles", () => {
    expect(doc.querySelectorAll("[data-audio]").length).toBe(2);
    expect(doc.querySelector("[data-audio='music']")?.getAttribute("aria-pressed")).toBe("false");
    expect(doc.querySelector("[data-audio='effects']")?.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("direction markers", () => {
  // Markers are a direction chooser: four arrows on the tiles around the ball,
  // not four destinations scattered at whatever distance each card reaches.
  const doc = dom(screenHTML(arm(startRun(LEVELS), 0)));

  const markedTiles = (): Array<{ r: number; c: number }> =>
    [...doc.querySelectorAll(".mk")].map((m) => {
      const style = m.getAttribute("style") ?? "";
      return {
        r: Number(/--r:(-?\d+)/.exec(style)?.[1]),
        c: Number(/--c:(-?\d+)/.exec(style)?.[1]),
      };
    });

  it("sit on the tiles immediately beside the ball", () => {
    // L1: ball at (1,0) on a 3x3 board. South-east, north-east and south-west
    // all move it; north-west runs straight off the board and is not offered.
    const at = markedTiles();
    expect(at).toContainEqual({ r: 1, c: 1 });
    for (const marker of at) {
      const distance = Math.abs(marker.r - 1) + Math.abs(marker.c - 0);
      expect(distance, `a marker sits ${distance} tiles from the ball`).toBe(1);
    }
  });

  it("draws all four, including the one that leaves the board", () => {
    // L1's ball is on the left edge, so north-west is off the board entirely.
    // Its arrow is still drawn, on the square that would be there --- what
    // happens when it is tapped is the engine's answer, not the renderer's.
    const at = markedTiles();
    expect(at.length).toBe(4);
    expect(at).toContainEqual({ r: 1, c: -1 });
    expect(at).not.toContainEqual({ r: 1, c: 0 });
  });

  it("leaves the engine to know which of them actually move the ball", () => {
    // The renderer shows four; `offers` is still the engine's own account of
    // which are real moves, and the level tests search over that. On L1, all
    // four now are: north-west runs straight off this board, which used to be
    // silently refused but is a fall now --- a real, visible move.
    const level = LEVELS[0];
    const real = offers(level, level.ball, level.hand[0]).map((o) => o.dir);
    expect(real).toContain("nw");
    expect(real.length).toBe(4);
  });

  it("gives every arrow a hit target that is a real button", () => {
    for (const marker of doc.querySelectorAll(".mk")) {
      expect(marker.querySelector(".ar")).toBeTruthy();
      expect(marker.querySelector("button.hit")).toBeTruthy();
    }
    expect(doc.querySelectorAll("button.hit").length).toBe(4);
    expect(doc.querySelectorAll(".ar").length).toBe(4);
  });

  it("marks the screen armed so the CSS can reveal them", () => {
    expect(doc.querySelector(".screen")?.classList.contains("armed")).toBe(true);
  });
});

describe("the end of a run", () => {
  const finished = { ...startRun(LEVELS), phase: "finished" as const, restarts: 3 };
  const doc = dom(screenHTML(finished));

  it("is a different screen from a lost level, not the same one undimmed", () => {
    // A win and a loss looking alike is the whole reason this state exists.
    const lost = dom(screenHTML({ ...startRun(LEVELS), phase: "lost" as const }));
    expect(doc.querySelector(".finish")).toBeTruthy();
    expect(lost.querySelector(".finish")).toBe(null);
    expect(doc.querySelector(".board")).toBe(null);
    expect(lost.querySelector(".board")).toBeTruthy();
  });

  it("shows the run's restart count, which is the score", () => {
    expect(doc.querySelector(".finish-message")?.textContent).toContain(
      "You finished with 3 resets.",
    );
  });

  it("shows a clean run as a zero rather than hiding it", () => {
    const perfect = dom(screenHTML({ ...startRun(LEVELS), phase: "finished" as const }));
    expect(perfect.querySelector(".finish-message")?.textContent).toContain(
      "You finished with 0 resets.",
    );
  });

  it("names the full-run action beside the result rather than stranding it in the gutter", () => {
    expect(doc.querySelectorAll("[data-act='restart']").length).toBe(1);
    expect(doc.querySelector(".result .start-over")?.textContent).toContain("Start over");
    expect(doc.querySelector(".top-bar .redo")).toBe(null);
  });

  it("completes the same twelve-step course shown during play", () => {
    expect(doc.querySelectorAll(".progress-step").length).toBe(LEVELS.length);
    expect(doc.querySelectorAll(".progress-step.done").length).toBe(LEVELS.length);
    expect(doc.querySelectorAll(".progress-step.current, .progress-step.failed").length).toBe(0);
  });

  it("states plainly that the whole run is complete", () => {
    expect(doc.querySelector("h2")?.textContent).toBe("Congratulations!");
    expect(doc.body.textContent).toContain("You finished with 3 resets.");
  });

  it("is not a dialog, and carries nothing the no-tutorial rule would fail", () => {
    // spec/crit-5.test.ts fails a <dialog>, a role=dialog, and "modal" in any
    // class or id. Checked here too, at the source, so it fails fast.
    expect(doc.querySelector("dialog, [role='dialog']")).toBe(null);
    expect(/modal|how-to/i.test(screenHTML(finished))).toBe(false);
  });
});

describe("the two card types", () => {
  // The contract allows three glyphs in the whole game: numerals, the card's
  // move/jump mark, and the restart arrow. A move and a jump have to be
  // tellable apart on sight, with no word to say which is which.
  const level: Level = {
    id: 1,
    grid: [[{ terrain: "ground", height: 0 }, { terrain: "hole", height: 0 }]],
    ball: { r: 0, c: 0 },
    hand: [
      { kind: "move", value: 1 },
      { kind: "jump", value: 1 },
    ],
  };
  const doc = dom(screenHTML(startRun([level])));
  const marks = [...doc.querySelectorAll(".hand .c .gl")];

  it("gives a move card the shaft mark and a jump card the arc", () => {
    expect(marks.length).toBe(2);
    expect(marks[0].classList.contains("arc")).toBe(false);
    expect(marks[1].classList.contains("arc")).toBe(true);
  });

  it("tells them apart by the mark alone, not by any word", () => {
    const text = doc.querySelector(".hand")?.textContent?.replace(/\s+/g, "") ?? "";
    expect(text).toBe("11");
  });

  it("names each card type for assistive technology", () => {
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>("button.c")];
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Play move card 1",
      "Play jump card 1",
    ]);
  });
});

describe("the hand and the gutter", () => {
  it("renders one card per card in the hand, with its value", () => {
    const doc = dom(screenHTML(startRun(LEVELS)));
    const cards = doc.querySelectorAll(".hand .c");
    expect(cards.length).toBe(LEVELS[0].hand.length);
    expect(cards[0].querySelector(".num")?.textContent).toBe("2");
    expect(doc.querySelector(".hand")?.classList.contains("cards-1")).toBe(true);
  });

  it("exposes the hand size so every count can form a deliberate fan", () => {
    const doc = dom(screenHTML(startRun(LEVELS, 11)));
    expect(doc.querySelector(".hand")?.classList.contains("cards-6")).toBe(true);
  });

  it("keeps the level and progress symmetrical in the toolbar, with the tally below", () => {
    const doc = dom(screenHTML(startRun(LEVELS)));
    expect(doc.querySelector(".top-bar .lvl")?.textContent).toBe("1");
    expect(doc.querySelector(".top-bar .progress")).toBeTruthy();
    expect(doc.querySelector(".top-bar .redo")).toBeTruthy();
    expect(doc.querySelector(".top-bar .tally")).toBe(null);
    expect(doc.querySelector(".run-tally")?.textContent).toBe("0");
  });

  it("shows all twelve levels and distinguishes progress without words", () => {
    const run = { ...startRun(LEVELS, 4), restarts: 2 };
    const doc = dom(screenHTML(run));
    expect(doc.querySelectorAll(".progress-step").length).toBe(12);
    expect(doc.querySelectorAll(".progress-step.done").length).toBe(4);
    expect(doc.querySelectorAll(".progress-step.current").length).toBe(1);
    expect(doc.querySelectorAll(".progress-step.ahead").length).toBe(7);
    expect(doc.querySelector(".progress")?.getAttribute("aria-label")).toBe("Level 5 of 12");
  });

  it("makes a loss distinct while preserving the board and spent hand", () => {
    const doc = dom(screenHTML({ ...startRun(LEVELS), phase: "lost", spent: [true] }));
    expect(doc.querySelector(".screen")?.classList.contains("lost")).toBe(true);
    expect(doc.querySelector(".board")?.classList.contains("dim")).toBe(true);
    expect(doc.querySelector(".fail-mark")).toBe(null);
    expect(doc.querySelector(".loss-restart")).toBeTruthy();
    expect(doc.querySelector(".top-bar .redo")).toBeTruthy();
    expect(doc.querySelectorAll("[data-act='restart']").length).toBe(2);
    expect(doc.querySelectorAll(".progress-step.failed").length).toBe(1);
    expect(doc.querySelectorAll(".progress-step.current").length).toBe(0);
    expect(doc.querySelector(".endcard")).toBeTruthy();
    expect(doc.querySelectorAll(".endcard .c.spent").length).toBe(1);
  });

  it("carries no words anywhere in the screen it renders", () => {
    // The no-tutorial rule, checked at the source rather than only in dist.
    for (const run of [startRun(LEVELS), arm(startRun(LEVELS), 0)]) {
      const doc = dom(screenHTML(run));
      const text = doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
      expect(text).toMatch(/^[\d\s]*$/);
    }
  });
});
