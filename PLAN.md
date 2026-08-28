# PLAN

> **(draft — not yet locked in.)** Written at the end of an ideation session.
> Read cold, stress-test against the spec, and confirm or reject before any
> build work starts. Nothing here is a commitment yet.

## Thesis

A faithful remake of **Golf Peaks** — a turn-based grid puzzle where you spend
a finite hand of movement cards to roll a ball into a hole.

It is chosen because it answers the C5 spec natively rather than with
workarounds:

- **Pointer-only, so both viewports come free.** Tap a card, tap a direction.
  Identical interaction at 1920×1080 and 390×844 — no keyboard, no gestures,
  no separate mobile control scheme to invent and teach.
- **The wordless opening is already solved.** Level 1 is a ball, a hole two
  tiles away, and one card reading `2`. Tap the card, direction arrows appear
  around the ball, tap one, it rolls in. There is no version of that a
  stranger fails to read, and it spends no words doing it.
- **The rules engine is deterministic grid movement**, which is the cheapest
  thing on the shortlist to build *correctly* in the time available.

Rejected alternatives and why they lost are in git history and, if worth
telling, `PROCESS.md` — not here.

## The core idea

A grid of tiles. A ball. A hole. A hand of cards, each one a movement value.

Each turn: tap a card, tap one of four directions, watch the ball resolve.
The card is spent. Run the hand out without holing the ball and the level is
unwinnable — reset and try again.

**Terrain** (the source of every puzzle):

| tile | behaviour |
| --- | --- |
| ground | the ball travels across it and stops where the card says |
| wall | stops the ball dead at the tile before it |
| sand | stops the ball dead the moment it enters |
| water | the ball is lost; it returns to the level's start tile, card still spent |
| slope | the ball keeps sliding in the slope's direction until something stops it |
| hole | the level is won |

**Card types:** `move` rolls along the ground; `jump` arcs over whatever lies
between and lands N tiles away. The distinction only earns its keep once
height exists — see scope below.

Exact resolution rules (slope chaining, jump-into-water, stopping order) get
pinned during the build by playing the original, not by guessing from memory.

## Scope call: flat first

Ship a **complete flat game** before raised tiles exist. Slopes, sand, water
and walls give more interesting puzzles per line of code than height does,
and height is where the rules complexity actually lives — climb rules, the
move/jump distinction, roll-down behaviour.

Raised tiles are the **first stretch**, capped at a single step up rather
than arbitrary height. This ordering means there is always a finished,
playable game on the deployed URL, which matters because CI is marked fifteen
minutes after cutoff.

Target: **6–8 levels** and a real ending screen. The binding spec line is that
a stranger reaches an ending inside five minutes, so the level count is a cap,
not a floor, and the opening curve should be close to insultingly gentle.

## The one deviation from the original

**Three reset pips for the entire run.** Burn one restarting a level and it
greys out; burn the third and the run is over.

This exists solely to answer the spec's *"it can be lost — a wrong move is
possible, and play ends in a win, a loss or a finish"*. Golf Peaks itself has
free per-level resets, so a pure remake has no loss state at all.

It costs roughly twenty lines and no engine work. **If the remake should be
faithful above all, strike this at lock-in** — but then find another answer
for that spec line first.

## Where this is at risk

- **No loss state**, if the reset pips get dropped without a replacement.
- **Difficulty curve.** The pod plays cold and stays silent until someone
  finishes or gives up. A pod that stalls on level 3 costs the spec's most
  heavily-weighted, least-fakeable line. Early levels should feel almost too
  easy.
- **Level design is the real work**, not the engine. Budget day two for it.
- **Isometric vs. flat rendering.** The original is isometric; isometric is
  expensive. A flat top-down grid is far cheaper but loses the readability of
  height. This is a `design` decision, and it is scope-relevant — settle it
  there, not mid-build.

## Spec lines this has to answer

- deployed and live at the GitHub Pages URL by cutoff
- it can be lost; play ends in a win, a loss or a finish
- it teaches itself — no instructions anywhere, on screen or off
- a stranger reaches an ending inside five minutes
- **one rule under a focused automated test** — candidate: *a ball that enters
  water returns to its start tile and the card stays spent*
- **one change that came from playing the finished game**, not from reading its
  code
- incremental commits, `PROCESS.md`, and `reflections/crit-5.md`

## Next

Lock-in, then `design`. Do not write tasks from this draft.
