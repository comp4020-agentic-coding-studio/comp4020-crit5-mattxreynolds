# Process overview

## What I built

A remake of *Golf Peaks*: an isometric grid puzzle where you spend a finite
hand of movement cards to roll a ball into the hole. It teaches itself because
it has to --- level 1 is a ball, a hole two tiles away, and one card reading
`2`.

## The moments that mattered

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

**Playing the finished game found what reading it never would.** Every
direction control I'd built was correct in isolation: confirmed, blocked,
resolved, all tested. Only playing the whole game cold showed that the other
three arrows stayed on the board while the ball was already rolling toward the
fourth --- correct states, wrong impression, and no unit test was ever going to
notice a marker *looking* clickable. The fix removes the whole selector the
moment a choice is confirmed and restores it only once the ball (or the
bounce) is done.
[`e4a1d9a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-mattxreynolds/commit/e4a1d9a)
