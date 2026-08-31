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
| ramp | joins two levels; the ball rolls down it and can never roll up | core |
| hole | the level is won | core |
| water | the ball is lost; it returns to the level's start tile, card still spent | **stretch** |

Height is core because it is the only thing that *changes what a card can
reach*. Every other tile is a stopping rule; height is what the finite hand
actually interacts with, and it is where "still interesting at five minutes"
comes from. Water is the stretch because it is the most expensive tile to
teach wordlessly — a ball that vanishes and reappears reads as a bug, not a
rule — and it adds the least, being a climb that costs a card.

**Card types:** `move` rolls along the ground, dropping down ledges but never
climbing. `jump` arcs over whatever lies between and lands N tiles away, and is
the only way up. Both are core — height is precisely the thing worth arcing
over, so `jump` is no longer conditional.

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
- **`slope` becomes the ramp between levels** — roll down it, never up —
  replacing "keeps the ball sliding on flat ground".
- **`jump` becomes core, not conditional.** Height is the thing worth arcing
  over, so the second card type is no longer optional: it is the only way up.
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
  reads as a wedge aimed at the ball rather than a heading. The only glyphs are
  numerals, the card's move/jump mark, and the restart arrow.

## What the design critic still has open

The contract above was validated against a rendered slice over two independent
critiques (`docs/design/iso-slice.html`). These survive and belong to `plan`,
not to `design`:

- **Markers sit on the adjacent tile, not the landing tile.** A card reading `2`
  puts its marker one tile away, so the numeral never teaches itself. Moving the
  marker to where the ball actually stops fixes that for free — but it needs the
  resolver, which is why it is a build task and not a visual one.
- **`move` versus `jump` is never demonstrated in a played state.** The rule that
  a `move` card cannot climb has no on-screen consequence a stranger can see.
  This is level-design work, and it is the same teaching-budget risk named above.
- **Composition differs between viewports.** Desktop leaves large dead field on
  the smallest levels; phone gives the hand more visual weight than the board.
  These need different treatments rather than one shared cap.
- **Three hand layouts across four states** (single card, rotated fan, flat row).
  Pick one.

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
  wordlessly (can't roll up, can roll down, jump gets you up) on top of the
  tile types, in the same 6–8 levels. This was flagged as the main cost of
  taking on the full height model, and accepted deliberately. Teaching levels
  must double as real puzzles, and if the curve slips it is the level count
  that gets cut, not the opening's gentleness.
- **Engine scope against the cutoff.** Two card types and a height-aware
  resolver is materially more than the flat design was. Build order stays
  engine-first so a playable game is always deployed.
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
- **one rule under a focused automated test** — candidate: *a `move` card
  never climbs: the ball stops at the tile before a higher one*, or *a hand
  spent without holing the ball loses the level and increments the restart
  count*
- **one change that came from playing the finished game**, not from reading its
  code
- incremental commits, `PROCESS.md`, and `reflections/crit-5.md`

## Next

`design` — lock a visual direction into a contract here before any task
breakdown. Do not write tasks yet.
