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

The cost was real, and I can now say it was paid. Height meant three rules to
teach wordlessly on top of the cards, and `jump` was the one I'd marked to cut
first if the budget ran out. It didn't get cut. Twelve levels shipped, four of
them combining what the rest taught one at a time — L11 puts a roll's
sand-stop and a jump's fixed reach on the identical tile, and only one order of
playing them leaves a card able to clear the gap after. That's a level doing
with rules what the flat board could only have done with a sign.

## What did this work change about who I want to be as a software developer?

I want to be the kind of developer whose judgement is checkable by someone
else. The most useful thing this week was a critic that ran against the
rendered page with no idea why anything had been decided — and the most useful
moment was when it was factually wrong and still pointed at a real problem. I
had to check its claim against the DOM to find that out. Neither obeying it nor
dismissing it would have got there.
