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

### T12 — Link-preview card *(independent)*

`meta description` and the title are done (`027096c` — "Forethought", one
sentence). `public/card.png` is still the Astro starter's placeholder
("Replace this card") — swap it for a real screenshot of the game.

**Done when:** the card is a screenshot of the actual game and the deployed
`<head>` points at a URL that resolves.

**Acceptance:** nothing in CI checks that the card path resolves, so verify it
against the deployed page, not the local build.

---

## In progress

*(empty — WIP limit 1)*

---

## Blocked

*(empty)*

---

## Done

- **T13 — Play it, then change one thing because of playing it** — `cb11594`
  first clarified the direction controls (markers animate out from the ball,
  a translucent backing, arrow-key/WASD focus with Enter/Escape to
  confirm/cancel). Playing the result cold then caught what no unit test
  could: the other three markers stayed on the board looking selectable while
  the ball was already rolling toward the fourth. `e4a1d9a` removes the whole
  selector the instant a choice is confirmed and restores it only once the
  roll — or the bounce off a blocked move — resolves. The change is traceable
  to play, not to reading the code.
- **Audio and brand** — `0bcfcdd` adds an original procedural soundtrack and
  distinct cues for selection, rolling, blocked moves, sand, falls, loss,
  holes and completion; off by default, on only after a user gesture, an
  explicit preference remembered. `027096c` renames the game *Forethought*
  and adds a matching favicon, resolved through Astro's base path so it
  doesn't 404 under the Pages subdirectory.
- **Feedback and motion polish** — `90afdba` distinguishes progress, failure
  and finish states; `6f88b36` makes every jump direction resolve (an empty
  landing falls, a ramp landing rolls to its foot) and gives a blocked roll a
  squash-and-rebound instead of a silent no-op; `1ea7980` fans every hand
  symmetrically from two to six cards with hover/focus states and separate
  assistive labels for move and jump; `649e3e7` gives level entry, dealing,
  scoring, landing and completion a shared motion language with a
  reduced-motion fallback, and splits sand stops out from blocked-wall
  rebounds as their own result.
- **Falling edges, four combined levels, a live restart counter** — `0f24917`/
  `0982824` make the edge a fall rather than a wall (`"fell"` joins
  `Outcome`; the card is still spent, and `solve()`/`losable()` treat it as a
  dead end, not a position to keep exploring from); `3e46a3b` animates it,
  drifting further and fading longer than a hole's `sink()`, since this is
  gone rather than in; `06056aa` puts `run.restarts` next to the level number
  during play, not only on the finish screen. `b441ba7`, `de3358a`,
  `39f428c`, `fc1cfc5` add L9–L12, combining what L1–L8 taught one at a time
  on bigger boards, each using the fall as a real hazard rather than an edge
  case: L9 climb + sand + a spit with open air beside it; L10 ramp + jump,
  the ramp serving only part of the route; L11 sand vs. jump changing the
  ball's effective range so card order decides a fall; L12 the finale, where
  the arc card can clear the ramp *or* the gap but not both, and every
  overshoot short of the gap lands safely in sand instead of falling. Full
  suite green (150 tests), played at `?level=N` for each, both a win and a
  loss, before moving to the next.
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
- **T6 — Three flat levels, then ship** — `2036eb3` ships three `move`-only
  levels with win and lose proven by test; the repo went public and deployed
  right after, and CI ran — and passed — for the first time.
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
