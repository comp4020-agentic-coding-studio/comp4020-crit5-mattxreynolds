# PLAN

## Thesis

A faithful remake of **Golf Peaks** — a turn-based grid puzzle where you spend
a finite hand of movement cards to roll a ball into a hole.

It answers the C5 spec natively rather than with workarounds:

- **Pointer-only, so both viewports come free.** Tap a card, tap a direction.
  Identical interaction at 1920×1080 and 390×844 — no keyboard, no gestures,
  no separate mobile control scheme to invent and teach.
- **The wordless opening is already solved.** Level 1 is a ball, a hole two
  tiles away, and one card reading `2`. Tap the card, direction arrows appear
  around the ball, tap one, it rolls in. There is no version of that a
  stranger fails to read, and it spends no words doing it.
- **Two interacting mechanics come free.** A finite hand of cards × terrain
  that redirects the ball is the brief's "harder, better move" without extra
  scope.
- **The rules engine is deterministic grid movement**, the cheapest thing to
  build *correctly* in the time available.

It is a remake, and originality is not a spec line. *"You can account for how
you directed, grounded and corrected the work"* is — and pinning the
resolution rules by playing the original beats guessing them from memory. The
levels are ours regardless, since our tile set doesn't match theirs.

## The core idea

A grid of tiles. A ball. A hole. A hand of cards, each one a movement value.

Each turn: tap a card, tap one of four directions, watch the ball resolve.
The card is spent. Run the hand out without holing the ball and the level is
lost — restart it and try again.

**Terrain:**

| tile | behaviour | scope |
| --- | --- | --- |
| ground | the ball travels across it and stops where the card says | core |
| raised tile | a climb: stops the ball dead at the tile before it (this is the old `wall`) | core |
| sand | stops the ball dead the moment it enters | core |
| ramp | joins two levels; the ball rolls up or down it, but can never come to rest on it | core |
| hole | the level is won | core |
| water | the ball is lost; it returns to the level's start tile, card still spent | **stretch** |

Height is core because it is the only thing that *changes what a card can
reach*. Every other tile is a stopping rule; height is what the finite hand
actually interacts with, and it is where "still interesting at five minutes"
comes from. Water is the stretch because it is the most expensive tile to
teach wordlessly — a ball that vanishes and reappears reads as a bug, not a
rule — and it adds the least, being a climb that costs a card.

**Card types:** `move` rolls along the ground, dropping down ledges and taking
ramps in either direction, but never climbing a sheer step. `jump` arcs over
whatever lies between and lands N tiles away, reaching ground no ramp serves.
Both are core, though `jump` is the more cuttable of the two.

Exact resolution rules (height deltas, whether a drop preserves remaining
movement, ramp chaining, stopping order) get pinned during the build by playing
the original, not by guessing from memory.

## Isometric, with height as a mechanic

**This reverses the earlier decision.** The first draft closed the isometric
question and put raised tiles out of scope, on the reasoning that height is
where the rules complexity lives and that isometric rendering is expensive.
Half of that held up and half did not, and both halves were tested by building
rather than argued:

- **Isometric rendering is cheap.** No 3D transforms and no library: a tile is
  three `clip-path` faces placed at `x=(c-r)·w/2, y=(c+r)·w/4`, painted in
  `z = r+c` order, all driven by one size knob. Height on top of that costs one
  variable per tile. `docs/design/height-demo.png` is the proof.
- **The rules complexity is real, and we are taking it on deliberately.** See
  the risks below.

Height also pays for itself visually, which is what prompted the reversal: flat
top-down could only say "wall" with a darker green square, where a raised slab
says it without words. That is the most heavily weighted spec line.

**Consequences for the rules:**

- **`wall` stops being a tile type.** A wall is just a tile one or more levels
  up, blocked by the same rule that blocks any climb. One fewer thing to teach.
- **`slope` becomes the ramp between levels**, replacing "keeps the ball
  sliding on flat ground". A ball can roll *up* a ramp as well as down, but it
  can never stop on one — it must have the steps to clear it.
- **`jump` stays core, but it is no longer the *only* way up.** Ramps are the
  ordinary way up; `jump` reaches what no ramp serves, and clears what is in
  the way. See the note on its scope under "Where this is at risk".
- **The resolver compares heights at every step.** Higher blocks, equal
  continues, lower drops. Whether a ball keeps its remaining movement after a
  drop is exactly the sort of rule to pin by playing the original.

**A constraint the renderer imposes on the level format:** height belongs to
grid *vertices*, not tiles. A ramp's raised corner is a vertex shared with three
other tiles, and if they disagree about its height the terrain tears visibly.
Ramps therefore span a whole boundary or are bounded by a level change. This was
found by rendering an invalid level, not by reasoning — see
`docs/design/ramp-check.html`.

Target: **6–8 levels** and a real ending screen. The binding spec line is that
a stranger reaches an ending inside five minutes, so the level count is a cap,
not a floor, and the opening curve should be close to insultingly gentle.

## Visual contract

- **Palette.** Card orange `#dfa561` marks anything you can act on *in the card
  and button layer*; flag red `#d64a3c` marks the goal and nothing else. On the
  board itself an affordance is a white tile ring plus an ink marker, because
  the terrain green cannot carry orange at usable contrast (measured ≈1.2:1).
  Terrain is one green ramp — fairway `#b6ccab` top / `#94ac8a` left /
  `#84997a` right, seam `#a3bb98`; raised ground the same ramp two steps
  darker; sand `#eddcae` stippled. **Higher ground is always darker — one
  convention, every page.** Field wash `#e6f1e8` → `#f8f2e6`. The lost state
  desaturates the whole board on purpose, so the restart is the only saturated
  thing left; that is a state treatment, not a second palette.
- **Type.** One display role: Nunito 900 numerals. The card value outranks the
  level number. There is no body role, because there is no prose and no counts.
- **Spacing.** 8/16/24/32/48 as `--s1`…`--s6`. One knob `--w` (tile width)
  drives every board dimension; card width `--cw` is independent.
- **Motif.** No page-level frame or panel: a 2:1 isometric board floats on one
  continuous field, board and hand centred as a single group, level number and
  restart pinned to the viewport gutters — one restart, one place, every state.
  Height is real: tiles are slabs, ramps are tilted planes, and the board reads
  as one solid on a level base.
- **Imagery.** Geometry only, no illustration and no icon set. Terrain is told
  apart by height, fill and stipple. A direction marker is one filled arrow
  lying in the ground plane, sized to stay inside its own tile: split into a
  separate stem and head it comes apart under the shear, and a bare triangle
  reads as a wedge aimed at the ball rather than a heading. On a ramp it leans
  into the slope — *partly*: a ramp is close to edge-on at this camera, so an
  arrow lying in the plane exactly collapses into an unreadable sliver, the
  same way the ramp's own surface nearly does. It leans about half as far as
  the terrain does, which reads as following the slope while staying an arrow.
  A marker also carries a white keyline, sized off the tile, so it survives
  being drawn over the cup or over raised ground. The only glyphs are
  numerals, the card's move/jump mark, and the restart arrow.

## What the design critic still has open

The contract above was validated against a rendered slice over two independent
critiques (`docs/design/iso-slice.html`). These survive and belong to `plan`,
not to `design`:

- ~~**Markers sit on the adjacent tile, not the landing tile.**~~ **Closed, the
  other way.** Landing-tile markers were built in T5 and played, and they read
  as four unrelated destinations rather than a choice of heading; on the hole
  the marker collided with the cup. Markers are back on the tiles beside the
  ball — see "Markers sit on the tile beside the ball" under Build decisions
  for why the original argument didn't survive contact.
- **`move` versus `jump` is never demonstrated in a played state.** The rule that
  a `move` card cannot climb has no on-screen consequence a stranger can see.
  This is level-design work, and it is the same teaching-budget risk named above.
- **Composition differs between viewports.** Desktop leaves large dead field on
  the smallest levels; phone gives the hand more visual weight than the board.
  These need different treatments rather than one shared cap.
- **Three hand layouts across four states** (single card, rotated fan, flat row).
  Pick one.

## Build decisions

**One page, no routes.** `src/pages/index.astro` is the whole site. Every state
(level, lost, run finished) is the same page in a different state — a second
page would read as an instructions page to `spec/crit-5.test.ts`, and there is
nothing to put on one. The invariants still need a `<nav>` landmark and exactly
one `<h1>`; both are visually hidden, since the game carries no words.

**Module layout.** The engine is pure and DOM-free so it can be unit-tested
without a browser:

| file | holds |
| --- | --- |
| `src/game/types.ts` | `Level`, `Tile`, `Card`, `Move`, `Outcome` |
| `src/game/levels.ts` | the shipped level set, as data |
| `src/game/validate.ts` | level integrity, including the vertex-height rule |
| `src/game/rules.ts` | `resolve(level, from, card, dir)` — pure, the whole engine |
| `src/game/state.ts` | run state: current level, hand, restart count |
| `src/game/render.ts` | state → DOM; the only file that knows about tiles as HTML |
| `src/scripts/main.ts` | wiring: events in, render out |

**Resolution rules, pinned.** `PLAN.md` previously deferred these to "playing
the original". We do not have it to hand, so they are decided here and the game
is tuned by playing *ours*. A `move` card of value N in direction d takes up to
N steps, and at each step, from the current tile to the next:

- next is off the board → stop where you are, card still spent
- next is **higher**, with no ramp → blocked, stop where you are (the climb
  rule)
- next is **lower** → the ball drops onto it and **keeps its remaining steps**
- next is **level** → continue
- next is **sand** → the ball enters and stops dead, remaining steps discarded
- next is **the hole** → the level is won
- a **ramp** can be taken in either direction, but **a ball never comes to rest
  on a ramp**:
  - *going up* — the ball comes to rest past the ramp only if the remaining
    steps are enough to leave it at the top. If they are not, it still sets
    off up the slope, runs out of momentum and rolls back down to the tile it
    started from — so the resolved path is the whole round trip, and the
    animation shows the failed climb rather than hiding it. The card is still
    spent, so failing a climb is a real wrong move.
  - *going down* — always allowed. If the steps run out mid-ramp the ball
    keeps rolling to the foot of the ramp and stops there; gravity finishes the
    move at no extra cost.
  - a ramp spanning several tiles follows the same rule: the ball must be able
    to clear every ramp tile and land on something level.

A `jump` card of value N lands the ball exactly N tiles away in direction d,
ignoring everything between and ignoring height in both directions. It is not
the only way up — ramps are — but it is the only way onto ground no ramp
reaches, and the only way over something in the way. If the landing tile is off the board the direction is not offered.

**Only offer a direction in which the ball actually does something.** The test
is whether the ball *moves*, not whether it ends up somewhere new. A stranger
tapping an arrow and seeing nothing happen reads the game as broken, so a
direction running straight off the board, or into a sheer step, is not shown.

But a ball that sets off up a ramp and rolls back down **has** moved, and has
shown exactly why the climb failed — so that direction *is* offered, the arrow
sits on the slope, and taking it costs the card like any other wrong move.
Hiding it instead made the rule invisible: the arrow silently vanished and the
player was left to infer what had happened. Wrong moves stay possible — plenty
of legal moves waste a card — so none of this softens "it can be lost".

**Markers sit on the tile beside the ball**, one step in each offered
direction. *This reverses an earlier decision, and the reversal came from
playing the built game rather than from arguing about it.*

The landing-tile rule was the design critic's finding and the argument for it
was good: a card reading `2` whose marker lands two tiles away teaches the
numeral for free. Built and played, it did not hold up. Four markers at four
different distances read as four unrelated destinations rather than as a
choice of heading, and on a small board the distances are mostly *not* the
card's value anyway --- a move that stops at the rim puts its marker one tile
out from a card reading `2`, which teaches the wrong thing. Worse, a marker
landing on the hole collided with the cup, the one tile where the affordance
has to be unmissable.

Four arrows around the ball is what the original does and what the validated
slice showed. The numeral now teaches itself by being played: tap `2`, watch
the ball roll two. The resolver is still what decides which directions are
offered at all --- a direction whose landing equals the start is still not
shown --- so the resolver still has to exist before the markers do.

**The ball animates along its path** — one CSS transform transition per step,
queued. A ball that teleports doesn't show *why* it stopped, and every rule
here is about where it stops.

**`?level=N` opens a level directly.** A working affordance, not a feature:
it is how a level gets looked at after a change without playing up to it.
Nothing on screen mentions it, so a cold player never meets it, and the run it
starts is a whole run — it plays on to the end and scores its restarts the
same way.

**No persistence.** Restart count lives in memory for the run. Reloading starts
a fresh run; that is the intended way to try for a better score.

**Test policy.** Tests are written alongside the task that implements the thing
they test, and passing them is part of that task's completion condition — not a
separate pass at the end. The engine is pure, so it is tested directly; the
render and wiring are tested through the built DOM the way the spec suite
already does.

## Losing, and the score

**The loss is level-scale.** Spend the hand without holing the ball and the
level is lost: a wordless overlay showing the spent hand and a circular-arrow
restart button. Restarts are unlimited.

**The run counts total restarts.** Finishing the last level ends the run with
that count, and the goal is to finish with as few as possible. This is what
makes the game worth a second run — the brief's *"a skill that sharpens"* —
and it costs no engine work.

Together this answers *"it can be lost: a wrong move is possible, and play
ends somewhere — a win, a loss or a finish"*: wrong moves are irreversible
(a spent card is spent), levels are genuinely losable, and the run ends in a
finish with a score.

**Constraint on the loss overlay:** `spec/crit-5.test.ts` fails any `main`
text matching `/click|tap|press|drag|use (the|your)|instructions|controls:/i`.
The restart affordance is an icon, never the words "click to restart" — which
is the right call anyway, since the overlay has to be as wordless as the rest.

## Where this is at risk

- **Difficulty curve.** The pod plays cold and stays silent until someone
  finishes or gives up. A pod that stalls on level 3 costs the spec's most
  heavily-weighted, least-fakeable line. Early levels should feel almost too
  easy.
- **Teaching budget — now the top risk.** Height adds three things to teach
  wordlessly (a sheer step blocks you, a ramp doesn't but you need the run-up
  to clear it, and `jump` reaches what neither does) on top of the tile types,
  in the same 6–8 levels. This was flagged as the main cost of
  taking on the full height model, and accepted deliberately. Teaching levels
  must double as real puzzles, and if the curve slips it is the level count
  that gets cut, not the opening's gentleness.
- **Engine scope against the cutoff.** Two card types and a height-aware
  resolver is materially more than the flat design was. Build order stays
  engine-first so a playable game is always deployed.
- **`jump` may not earn its keep.** Once ramps became climbable, the ordinary
  way up stopped being `jump`, and it now only pays for itself on levels that
  need to reach ground no ramp serves. It is a second traversal algorithm and a
  second card glyph to teach wordlessly. If the schedule slips, `jump` is the
  first thing to cut — ahead of the level count.
- **Restart discoverability.** A stranger *will* get stuck, and the restart
  has to be findable without words before they conclude the game is broken.
- **Level design is the real work**, not the engine.

## Time

Cutoff **Wed 2 Sep, 08:30** (Australia/Canberra). CI is marked fifteen minutes
after, and green checks are worth half the shipped mark — so ship with time
for CI to finish. Build order is engine-first so there is always a finished,
playable game on the deployed URL: flat move + hole → playable → heights and
climbs → ramps → jump → sand → water if time allows.

## Spec lines this has to answer

- deployed and live at the GitHub Pages URL by the cutoff
- it can be lost; play ends in a win, a loss or a finish
- it teaches itself — no instructions anywhere, on screen or off
- a stranger reaches an ending inside five minutes
- **one rule under a focused automated test** — *a ball never comes to rest on
  a ramp*: too few steps to clear one going up and it stops at the foot; steps
  running out going down and it rolls on to the bottom. This is the game's most
  interesting rule and the one most easily got wrong, which is what makes it
  worth the test
- **one change that came from playing the finished game**, not from reading its
  code
- incremental commits, `PROCESS.md`, and `reflections/crit-5.md`

## Next

`design` — lock a visual direction into a contract here before any task
breakdown. Do not write tasks yet.
