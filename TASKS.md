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

Candidates so far, all found by playing rather than by reading — but all found
before the game was finished, so T13 still needs its own:
the click-through bug where a tile in front swallowed taps meant for the tile
behind, the ball hiding the cup it had just gone into, and the failed climb
that used to hide its own arrow instead of rolling up the slope and back.

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
- **A raised tile hides what is behind it.** Correct isometric occlusion ---
  painting order is r+c --- but it means a ball resting *behind* a raised slab
  is half-covered by the thing that stopped it. L4 works around it by having
  the ball approach from the front. If a later level can't, the ball needs a
  treatment of its own rather than the level being bent around it.
- **Composition differs between the two viewports.** Desktop leaves a large
  dead field around a small board, and on the phone the board sits high with
  the field empty below it. (The related centring bug is fixed: the board's
  box now includes the headroom raised ground needs, so it centres on its own
  ink rather than on the flat rectangle underneath it.)
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

- **T11 — Ending screen and the run score** — finishing the last level reaches
  its own screen: the goal at size, and the run's restart count as the score.
  Wordless. The gutter restart becomes play-again, and the score reads 0 on a
  clean run.
- **T10 — The level set, and a solvability test** — eight levels, one new idea
  each: move, distance, four directions with a wrong one among them, a step
  that blocks, a step that doesn't, the ramp between them, the card that
  ignores all of it, and sand. Every level is proven solvable and losable by
  search, L1 in one card, and the jump levels are proven to *need* the jump.
  Played through end to end in the browser, L1 to the finish.
- **T9 — Resolver: `jump`** — lands exactly N away over whatever lies between,
  ignoring height at both ends; not offered when there is nowhere to arrive,
  and it rolls to the foot if it lands on a slope, so "never rests on a ramp"
  holds for the whole game rather than only for `move`. Not cut, so T10 may
  use it.
- **T8 — Resolver: ramps and sand** — carries the spec's focused test, *a ball
  never comes to rest on a ramp*, both halves plus a property assertion over
  every shipped level. Ramps and height now render from data (L4 the sheer
  step, L5 the ramp), and the failed climb is visible in play: with too small a
  card left, the direction simply stops being offered.
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
