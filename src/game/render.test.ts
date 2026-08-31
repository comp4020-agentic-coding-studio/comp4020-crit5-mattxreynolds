import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { arm, startRun } from "./state";
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
    expect(doc.querySelector(".screen")?.classList.contains("armed")).toBe(false);
  });
});

describe("direction markers", () => {
  // PLAN.md's landing-tile rule, and the design critic's open finding: a card
  // reading 2 must put its marker two tiles from the ball, or the numeral
  // never teaches itself.
  const doc = dom(screenHTML(arm(startRun(LEVELS), 0)));

  it("appear on the tile the ball would actually land on", () => {
    // Offered tiles, not arrows: the hole is offered without one.
    const marked = [...doc.querySelectorAll(".t")].filter((t) => t.querySelector(".hit"));
    const at = marked.map((t) => {
      const style = t.getAttribute("style") ?? "";
      return {
        r: Number(/--r:(-?\d+)/.exec(style)?.[1]),
        c: Number(/--c:(-?\d+)/.exec(style)?.[1]),
      };
    });
    // L1: ball at (1,0), card 2, on a 3x3 board. Two tiles east is the hole at
    // (1,2); two south-west and two north-east run off the board and stop at
    // the rim; two north-west moves nothing at all.
    expect(at).toContainEqual({ r: 1, c: 2 });
    for (const marker of at) {
      const distance = Math.abs(marker.r - 1) + Math.abs(marker.c - 0);
      expect(distance, `a marker sits ${distance} tiles from the ball`).toBeGreaterThan(0);
    }
  });

  it("never offers a direction that would move the ball nowhere", () => {
    const marked = [...doc.querySelectorAll(".t")].filter((t) => t.querySelector(".hit"));
    for (const tile of marked) {
      const style = tile.getAttribute("style") ?? "";
      const r = Number(/--r:(-?\d+)/.exec(style)?.[1]);
      const c = Number(/--c:(-?\d+)/.exec(style)?.[1]);
      expect({ r, c }).not.toEqual({ r: 1, c: 0 });
    }
  });

  it("gives every offered tile a hit target that is a real button", () => {
    // Every arrow has a hit target; the hole is offered with a hit target and
    // no arrow, because the cup and flag already fill that tile.
    for (const tile of doc.querySelectorAll(".t")) {
      if (tile.querySelector(".ar")) expect(tile.querySelector("button.hit")).toBeTruthy();
    }
    const hits = doc.querySelectorAll("button.hit");
    expect(hits.length).toBe(3);
    expect(doc.querySelectorAll(".ar").length).toBe(2);
  });

  it("marks the screen armed so the CSS can reveal them", () => {
    expect(doc.querySelector(".screen")?.classList.contains("armed")).toBe(true);
  });
});

describe("the hand and the gutter", () => {
  it("renders one card per card in the hand, with its value", () => {
    const doc = dom(screenHTML(startRun(LEVELS)));
    const cards = doc.querySelectorAll(".hand .c");
    expect(cards.length).toBe(LEVELS[0].hand.length);
    expect(cards[0].querySelector(".num")?.textContent).toBe("2");
  });

  it("shows the level number and exactly one restart, in every state", () => {
    for (const run of [startRun(LEVELS), { ...startRun(LEVELS), phase: "lost" as const }]) {
      const doc = dom(screenHTML(run));
      expect(doc.querySelectorAll(".redo").length).toBe(1);
      expect(doc.querySelector(".lvl")?.textContent).toBe("1");
    }
  });

  it("dims the board and shows the spent hand when the level is lost", () => {
    const doc = dom(screenHTML({ ...startRun(LEVELS), phase: "lost", spent: [true] }));
    expect(doc.querySelector(".board")?.classList.contains("dim")).toBe(true);
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
