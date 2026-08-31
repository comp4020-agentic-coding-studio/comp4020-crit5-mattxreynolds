# Process overview

## What I built

A remake of *Golf Peaks*: an isometric grid puzzle where you spend a finite
hand of movement cards to roll a ball into the hole. It teaches itself because
it has to --- level 1 is a ball, a hole two tiles away, and one card reading
`2`.

## The moments that mattered

**The critic was wrong about the fact and right about the thing.** A
`design-critic` subagent, run against the rendered slice with no knowledge of
why anything had been decided, reported that the four direction arrows pointed
*at* the ball. I checked it against the live DOM: four distinct headings, every
transform determinant +1, nothing mirrored. The claim was false. But a bare
triangle sheared into the ground plane really does put its bulk toward the ball
and taper away, so cold it reads as a wedge aimed at it --- the observation
behind the wrong claim was right. Markers became a stem plus a head, and the
rule went into the contract so a later pass couldn't quietly undo it.
[`acea345`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mattxreynolds/commit/acea345)

**Reasoning closed the isometric question; rendering reopened it.** Planning
had ruled isometric out and cut raised tiles, on the grounds that the rendering
was expensive and height was where the rules complexity lived. A rendered slice
showed half of that was simply wrong --- three `clip-path` faces per tile, one
size knob --- so height came back as the game's central mechanic. Rendering a
deliberately invalid level then found a constraint no amount of arguing had:
height belongs to grid *vertices*, or ramps tear away from their neighbours.
[`b8eeb12...33d689b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mattxreynolds/compare/b8eeb12...33d689b)

**A screenshot that lied.** `agent-browser --viewport 1920x1080` is silently
ignored, so my "desktop" checks were really 1280×577 and the board was sizing
off the wrong height. The correction went into `CLAUDE.md` rather than into a
retry. [`3619197`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mattxreynolds/commit/3619197)
