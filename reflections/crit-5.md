# Crit 5 — a game

## What was the breakthrough that moved the work forward?

Building the thing I had already decided not to build. My plan closed the
isometric question on paper: rendering height looked expensive, and height was
where the rules complexity lived, so raised tiles went out of scope and the
board went flat. Then I rendered a slice to check the visual direction, and one
half of that reasoning collapsed immediately — an isometric tile is three
`clip-path` faces and one size variable, and height on top of it costs one more.
The other half was true, and I took it on anyway, because a flat board could
only say "wall" with a darker green square where a raised slab says it without
words. That is the spec line I am most exposed on.

The cost is real and I should be honest that it is still unpaid. Height added
three rules to teach wordlessly — a sheer step blocks you, a ramp doesn't but
you need the run-up, and a jump reaches what neither does — in the same six to
eight levels that already have to teach the cards. That is now the top risk in
my plan, ahead of the engine, and `jump` is marked as the first thing to cut.

## What did this work change about who I want to be as a software developer?

I want to be the kind of developer whose judgement is checkable by someone
else. The most useful thing this week was a critic that ran against the
rendered page with no idea why anything had been decided — and the most useful
moment was when it was factually wrong and still pointed at a real problem. I
had to check its claim against the DOM to find that out. Neither obeying it nor
dismissing it would have got there.
