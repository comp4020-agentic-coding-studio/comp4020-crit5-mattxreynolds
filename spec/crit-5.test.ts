import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// C5 "A game" — comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/05-game/
//
// Most of this week's spec is judged live at the crit, not by a test suite:
//
//   - it can be lost: a wrong move is possible, and play ends somewhere — a
//     win, a loss or a finish
//   - a stranger can pick it up and reach an ending inside five minutes
//   - one rule of the game has a focused automated test, and one change made
//     came from playing the finished game rather than reading its code — the
//     automated test is ours to add here once the mechanic is locked, not
//     something this starter can write for us
//   - the pod can account for how the work was directed, grounded and
//     corrected
//
// The no-tutorial rule is checkable in slices even before the mechanic is
// chosen: whatever we build, the opening screen can't lean on an
// instructions page, a how-to-play modal, or explanatory body copy.

const DIST = resolve("dist");

function shippedFiles(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? shippedFiles(path) : [path];
  });
}

const shipped = shippedFiles().map((path) => relative(DIST, path).split(sep).join("/"));
const htmlPages = shipped.filter((name) => name.endsWith(".html"));
const home = new JSDOM(readFileSync(join(DIST, "index.html"), "utf8")).window
  .document;

describe("crit 5: a game — no-tutorial rule", () => {
  it("ships no separate instructions/help/how-to-play page standing in for the tutorial", () => {
    const instructional = htmlPages.filter((name) =>
      /instructions|how-?to-?play|help|rules/i.test(name),
    );
    expect(
      instructional,
      `these pages read as an instructions page: ${instructional.join(", ")}`,
    ).toHaveLength(0);
  });

  it("has no modal or dialog element carrying how-to-play copy", () => {
    const candidates = home.querySelectorAll(
      '[role="dialog"], dialog, [class*="modal" i], [id*="modal" i], [class*="how-to" i], [id*="how-to" i]',
    );
    expect(
      candidates.length,
      "a how-to-play modal/dialog contradicts the no-tutorial rule",
    ).toBe(0);
  });

  it("gives no instructions in the opening screen's visible body copy", () => {
    // Prescriptive, second-person phrasing is the shape instructions take —
    // the opening screen has to make the first move obvious without it.
    const bodyText = [...home.querySelectorAll("main *")]
      .filter((el) => el.children.length === 0)
      .map((el) => el.textContent?.trim() ?? "")
      .filter(Boolean);

    for (const text of bodyText) {
      expect(
        /\b(click|tap|press|drag|use (the|your)|how to play|instructions|controls:)\b/i.test(text),
        `"${text}" reads as an instruction`,
      ).toBe(false);
    }
  });
});
