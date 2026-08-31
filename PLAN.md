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
| wall | stops the ball dead at the tile before it | core |
| sand | stops the ball dead the moment it enters | core |
| slope | the ball keeps sliding in the slope's direction until something stops it | core |
| hole | the level is won | core |
| water | the ball is lost; it returns to the level's start tile, card still spent | **stretch** |

Slope is core because it is the only tile that *moves* the ball. Every other
tile is a stopping rule; slope is what the finite hand actually interacts
with, and it is where "still interesting at five minutes" comes from. Water
is the stretch because it is the most expensive tile to teach wordlessly — a
ball that vanishes and reappears reads as a bug, not a rule — and it adds the
least, being a wall that costs a card.

**Card types:** `move` rolls along the ground. `jump` arcs over whatever lies
between and lands N tiles away — it only earns its keep once there is
something worth arcing over, so it ships only if the levels want it.

Exact resolution rules (slope chaining, stopping order) get pinned during the
build by playing the original, not by guessing from memory.

## Flat, top-down, no height

Raised tiles are **out of scope**, not a stretch. Height is where the rules
complexity lives — climb rules, the move/jump distinction, roll-down
behaviour — and it is the only thing that would justify isometric rendering,
which is expensive. So: a flat top-down grid, and the isometric question is
closed.

Target: **6–8 levels** and a real ending screen. The binding spec line is that
a stranger reaches an ending inside five minutes, so the level count is a cap,
not a floor, and the opening curve should be close to insultingly gentle.

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
- **Teaching budget.** Five core tile types each need a level that teaches
  them before any level gets to be *interesting*. Out of 6–8 levels that is
  most of the budget — so teaching levels must double as real puzzles.
- **Restart discoverability.** A stranger *will* get stuck, and the restart
  has to be findable without words before they conclude the game is broken.
- **Level design is the real work**, not the engine.

## Time

Cutoff **Wed 2 Sep, 08:30** (Australia/Canberra). CI is marked fifteen minutes
after, and green checks are worth half the shipped mark — so ship with time
for CI to finish. Build order is engine-first so there is always a finished,
playable game on the deployed URL: ground/wall/hole → playable → sand → slope
→ water if time allows.

## Spec lines this has to answer

- deployed and live at the GitHub Pages URL by the cutoff
- it can be lost; play ends in a win, a loss or a finish
- it teaches itself — no instructions anywhere, on screen or off
- a stranger reaches an ending inside five minutes
- **one rule under a focused automated test** — candidate: *a slope keeps the
  ball sliding until something stops it*, or *a hand spent without holing the
  ball loses the level and increments the restart count*
- **one change that came from playing the finished game**, not from reading its
  code
- incremental commits, `PROCESS.md`, and `reflections/crit-5.md`

## Next

`design` — lock a visual direction into a contract here before any task
breakdown. Do not write tasks yet.
