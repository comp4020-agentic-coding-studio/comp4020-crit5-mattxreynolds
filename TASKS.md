# TASKS

Execution order is top to bottom. `PLAN.md` holds the decisions; this file
holds the work. Nothing here re-opens a decision made there.

**Test policy (decided once, applies to every task below).** Tests are written
alongside the implementation they cover, in the same task, and passing them is
part of that task's completion condition. There is no separate testing pass.
Engine modules are pure and tested directly; render and wiring are tested
through the built DOM, the way `spec/` already does.

**Execution strategy.** Sequential by default — most of this is one dependency
chain from types through resolver to levels. Two tasks are marked
**independent** and can be dispatched to a subagent in parallel with whatever
is in progress, because they touch no file the chain touches.

**WIP limit: 1** for the sequential thread, plus at most 1 dispatched
independent task at a time.

---

## Milestone: ship something playable early

`PLAN.md` commits to engine-first order so a finished, playable game is always
on the deployed URL. **T1–T6 is that game**: three flat levels, move cards
only, win and lose states, deployed and green. Everything after T6 adds
mechanics to a game that already works.

That ordering is deliberate insurance. The cutoff is **Wed 2 Sep 08:30**, CI is
marked fifteen minutes later, and CI has never yet run on this repo — every job
is gated behind `!github.event.repository.private` and the repo is still
private. T5 is where that gets discovered, not the morning of the cutoff.

---

## Backlog

### T6 — Three flat levels, then ship

Three `move`-only levels: L1 is the ball, the hole two tiles away, one card.

Then flip the repo public and deploy — `/comp4020:ship`.

**Done when:** the deployed GitHub Pages URL serves a playable game and CI is
green.

**Acceptance:** CI actually *runs* (jobs are no longer `skipped` — note a
skipped run still exits 0 under `gh run watch`, so check the run's conclusion,
not the exit code). Links check and secrets scan pass, both of which have never
executed on this repo. A stranger can finish L1 without being told anything.

### T8 — Resolver: ramps and sand

**Carried from T7:** height renders but has never been *seen* in a shipped
level --- `--lv` lift, the three-step ground ramp (`gr` / `up` / `up2`) and the
climb rule all need one screenshot of a real level before they are trusted. The
slice proved the CSS; the renderer emitting it is what hasn't been checked.
Sand at height also loses its height colour, since `sd` replaces the ground
class rather than layering on it --- decide whether that matters when sand
first ships.

**Carried from T1's port:** the four `.sl-*` gradient rules in `styles.css`
put the *light* end at the ramp's raised edge, which inverts the contract's one
height convention. Only the `.sl.up` override (the combination the slice
actually rendered) has it the right way round. Fix all four when ramps first
render from data, and check it on a screenshot rather than by reading the CSS.

**This task carries the spec's one focused automated test.** A ball never comes
to rest on a ramp: too few steps to clear one going up and it stops at the foot
(card still spent, so a failed climb is a real wrong move); steps running out
going down and it rolls on to the bottom at no extra cost. Sand stops the ball
dead on entry and discards remaining steps.

**Done when:** unit tests cover going up with enough steps, going up with too
few, going down with steps to spare, going down with steps running out
mid-ramp, a multi-tile ramp, and sand discarding remaining movement.

**Acceptance:** the focused test is named and self-contained, and asserts both
halves of the rule. Assert as an invariant over every shipped level that no
resolved landing tile is ever a ramp — not just over the hand-written cases.

### T9 — Resolver: `jump` *(first thing to cut if the schedule slips)*

Lands exactly N away, ignores everything between, ignores height in both
directions. Reaches ground no ramp serves.

Ramps being climbable means `jump` is no longer the ordinary way up, so it now
has to earn a second traversal algorithm and a second wordless glyph. If T1–T8
run late, cut this before cutting levels — see `PLAN.md`'s risk list.

**Done when:** unit tests cover jumping over a raised block, up onto one, and
off the board (not offered).

**Acceptance:** the card's jump mark is visually distinct from the move mark,
per the contract's glyph rule. If cut, no level in T10 may require it.

### T10 — The level set, and a solvability test

Grow to 6–8 levels along the teaching curve: move → distance → a sheer step
blocks → drop off a ledge → ramp up (and the run-up it needs) → jump →
combinations. Teaching levels must double as real puzzles.

**Done when:** every shipped level is solvable, proven by a test.

**Acceptance:** a search over card orderings and directions finds a solution for
every level — this is the cheapest possible defence of the difficulty curve, and
the curve is the top risk in `PLAN.md`. L1 is solvable in one move.
**`move` versus `jump` must be visible in a played level** — the critic's second
open finding: the rule that a move card cannot climb currently has no on-screen
consequence a stranger can see.

### T11 — Ending screen and the run score

**Carried from T5:** `finished` currently falls through to the lost screen's
markup without the dim. It needs its own treatment, or a win and a loss look
alike.

Finishing the last level ends the run, showing the total restart count.
Wordless: numerals and icons only.

**Done when:** finishing the last level reaches a distinct end state.

**Acceptance:** answers *"play ends somewhere — a win, a loss or a finish"*. No
`<dialog>`, no `role="dialog"`, no `modal` in any class or id, no instruction
words — all four fail `spec/crit-5.test.ts`.

### T12 — Link-preview card and description *(independent)*

Replace `public/card.png` (1200×630) with a real render of the game, and the
`meta description` with one sentence saying what this is.

**Done when:** the card is a screenshot of the actual game and the deployed
`<head>` points at a URL that resolves.

**Acceptance:** nothing in CI checks that the card path resolves, so verify it
against the deployed page, not the local build.

### T13 — Play it, then change one thing because of playing it

The spec asks for **one change that came from playing the finished game**, not
from reading its code. Play the deployed build cold, at both viewports, and fix
the thing that most gets in the way.

**Done when:** the change is committed with a message saying what playing it
revealed.

**Acceptance:** the change is traceable to play, not to code review. This cannot
be done early — it needs the finished game.

---

## In progress

*(empty — WIP limit 1)*

---

## Blocked

*(empty)*

---

## Polish

- **Revisit `PROCESS.md` and `reflections/crit-5.md` at the end.** Both were
  written at T2 because `check:evidence` gates `deploy`, so they cover the
  design phase and nothing after it. The moment that comes out of T13 —
  playing the finished game — is the one most likely to be worth citing, and
  it doesn't exist yet.
- **Candidate `PROCESS.md` moment (for the final revisit):** `clip-path`
  clips an element's own `filter` output, so the white keyline that makes a
  marker readable over the cup had to move to the unclipped parent. Found by
  screenshotting, after the outline appeared correctly in computed styles and
  not at all on the page.
- **Composition differs between the two viewports.** Now visible in the real
  game, not just the slice: desktop leaves a large dead field around a small
  board, and on the phone the board sits high with the field empty below it.
  This is the design critic's third open finding in `PLAN.md`, and it needs
  different treatments per viewport rather than one shared cap.
- **L1 teaches the numeral only in one direction.** The ball starts at the
  board's edge, so two of the three offered directions land one tile away
  (stopped by the rim) while the card reads `2`. Correct, and it teaches the
  edge rule — but it works against the numeral teaching itself on the very
  first screen. Worth reshaping when T10 revisits the curve.
- *(the rest populated by review against the spec once the backlog is built,
  per the `working-loop` convention — not specified in advance)*

---

## Done

- **T7 — Resolver: height** — the climb rule stops the ball at the tile before
  a step up, of any size; a drop keeps the steps it has left, so a staircase is
  one-way. A blocked direction isn't offered.
- **T5 — Wiring, render and the direction markers** — one renderer shared by
  the Astro build and the browser, so the page ships a real board rather than
  an empty div. The roll is animated; win, loss and restart all work at both
  viewports. Markers were built on the landing tile per `PLAN.md`, played,
  and moved back to the tiles beside the ball — the reversal and its reasons
  are recorded in `PLAN.md`.
- **T4 — Resolver: `move` on flat ground** — `resolve()` returns the whole
  stepped path, the landing and the outcome. Pure; a no-op direction resolves
  to the start tile rather than erroring, so T5 can decline to offer it.
- **T3 — Level format and validator** — `types.ts`, `levels.ts`, `validate.ts`.
  Height lives on grid vertices; a vertex is only checked where a ramp touches
  it, so a cliff stays legal and only a ramp that tears the ground is rejected.
- **T2 — Evidence gate** — `pnpm check:evidence` exits 0: a real
  `PROCESS.md` citing four commits that resolve, and `reflections/crit-5.md`.
- **T1 — Page shell and the visual contract in `src/`** — `1e61c99` (port),
  `6f6e72d` (tests, committed red). The slice's geometry and palette moved
  across unchanged; board sizing now derives from the level's own `--cols`
  and `--rows`. Verified rendered at both viewports.
