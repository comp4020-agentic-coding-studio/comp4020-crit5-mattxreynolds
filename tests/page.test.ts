import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Page-level contracts for the built game, checked through the DOM the way
// spec/ does. These are ours, not the course spec's: they pin the parts of
// PLAN.md's visual contract and build decisions that a rendered page can be
// asked about without a browser.

const DIST = resolve("dist");
const doc = new JSDOM(readFileSync(join(DIST, "index.html"), "utf8")).window.document;

describe("the page shell", () => {
  it("is one page: the game is the whole site", () => {
    const board = doc.querySelector(".board");
    expect(board, "the board renders into index.html itself").toBeTruthy();
  });

  it("hides the heading and the nav landmark, because the game carries no words", () => {
    // Both exist for the invariants and for assistive tech; neither is part of
    // the visual design.
    for (const selector of ["h1", "nav"]) {
      const el = doc.querySelector(selector);
      expect(el, `${selector} is missing`).toBeTruthy();
      expect(
        el?.classList.contains("vh"),
        `${selector} is visible on the page; the game shows no prose`,
      ).toBe(true);
    }
  });

  it("shows a restart control in the gutter bar", () => {
    // One restart, one place, every state --- PLAN.md's motif line.
    const restarts = doc.querySelectorAll(".redo");
    expect(restarts.length).toBe(1);
    expect(doc.querySelector(".top-bar .redo")).toBeTruthy();
  });
});

describe("the board", () => {
  // Looked up per-test rather than once: a missing board should fail as a
  // named assertion, not as a collection-time throw reporting "no tests".
  const board = () => {
    const el = doc.querySelector(".board");
    expect(el, "no board rendered into index.html").toBeTruthy();
    return el!;
  };
  const shape = () => board().getAttribute("style") ?? "";

  it("declares the shape its own sizing formula reads", () => {
    for (const name of ["--cols", "--rows", "--fx", "--fy"]) {
      expect(shape(), `the board's inline style is missing ${name}`).toContain(name);
    }
  });

  it("renders one tile per grid cell", () => {
    const cols = Number(/--cols:(\d+)/.exec(shape())?.[1]);
    const rows = Number(/--rows:(\d+)/.exec(shape())?.[1]);
    expect(board().querySelectorAll(".t").length).toBe(cols * rows);
  });

  it("gives every tile all three faces and a ground plane", () => {
    // A tile missing a face reads as a hole torn in the terrain.
    for (const tile of board().querySelectorAll(".t")) {
      for (const face of [".top", ".fl", ".fr", ".fx"]) {
        expect(tile.querySelector(face), `a tile is missing ${face}`).toBeTruthy();
      }
    }
  });

  it("puts exactly one ball and one hole on the board", () => {
    expect(board().querySelectorAll(".ball").length).toBe(1);
    expect(board().querySelectorAll(".cup").length).toBe(1);
    expect(board().querySelectorAll(".flag").length).toBe(1);
  });
});

describe("the hand", () => {
  it("deals at least one playable card", () => {
    const cards = doc.querySelectorAll(".hand .c");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("labels every card with a numeral, the one type role the contract has", () => {
    for (const card of doc.querySelectorAll(".hand .c")) {
      const num = card.querySelector(".num");
      expect(num, "a card has no value").toBeTruthy();
      expect(num?.textContent?.trim()).toMatch(/^\d+$/);
    }
  });
});
