# Approved level redesign

This is the implementation contract approved level-by-level before any level
data was changed. Coordinates are `(r,c)`: increasing `c` travels southeast
(`se`), increasing `r` travels southwest (`sw`), and the inverse directions
are northwest (`nw`) and northeast (`ne`).

## Legend and shared constraints

- `G0`, `G1`, `G2`: flat ground at elevation 0, 1, or 2.
- `A0`, `A1`: sand at the stated elevation.
- `S0>1 se`: a slope rising southeast from 0 to 1.
- `S0>1 nw`: a slope rising northwest from 0 to 1, and therefore descending
  southeast.
- `B`, `H`, `.`: ball, hole, and gap/void.
- Cells outside each rectangular envelope are also void.
- While at least one card remains, a ball must never finish a non-winning move
  one cardinal movement step from the hole. An adjacent rest after the hand is
  exhausted is allowed, as is passing through an adjacent tile while holing.
- The listed solution is intended. Alternatives are acceptable only where
  noted and must exercise comparable planning without bypassing the level's
  purpose.

## Level 1 — core interaction

```text
     c0 c1 c2
r0   G0 G0 G0
r1   B0 G0 H0
r2   G0 G0 G0
```

Hand: `[Move 2]`

Solution and rests: `Move 2 se` -> hole `(1,2)`.

Introduces card selection and direction. Every wrong direction falls, so no
non-winning rest is adjacent to the hole. No alternative solution.

## Level 2 — order and turning

```text
     c0 c1 c2 c3
r0   G0 G0 G0 G0
r1   B0 G0 G0 G0
r2   G0 G0 G0 G0
r3   .  H0 G0 G0
```

Hand: `[Move 2, Move 1]`

Solution and rests:

1. `Move 1 se` -> `(1,1)`.
2. `Move 2 sw` -> hole `(3,1)`.

The gap at `(3,0)` prevents the reversed-order route. No alternative
solution.

## Level 3 — sheer elevation

```text
     c0 c1 c2 c3 c4
r0   G0 G0 G0 G0 G0
r1   H0 G0 G1 G0 B0
r2   G0 G0 G0 G0 G0
r3   G0 G0 G0 G0 G0
```

Hand: `[Move 4, Move 2, Move 2]`

Solution and rests:

1. `Move 2 sw` -> `(3,4)`.
2. `Move 4 nw` -> `(3,0)`.
3. `Move 2 ne` -> hole `(1,0)`.

The raised tile `(1,2)` makes the direct route stop at `(1,3)`. Every solution
must use the lower detour. The two equal cards may exchange indices, but there
is no geometrically different solution.

## Level 4 — downhill ledges preserve movement

```text
     c0 c1 c2 c3 c4 c5
r0   G1 G1 G0 G0 G0 G0
r1   B1 G1 G0 G0 .  G0
r2   .  G1 G0 G0 G0 G0
r3   .  G1 G0 G0 G0 H0
```

Hand: `[Move 2, Move 3, Move 2]`

Intended solution and rests:

1. `Move 3 se` -> `(1,3)`, crossing the drop between columns 1 and 2.
2. `Move 2 sw` -> `(3,3)`.
3. `Move 2 se` -> hole `(3,5)`.

Comparable alternative: `Move 2 se` -> `(1,2)`, `Move 2 sw` -> `(3,2)`,
`Move 3 se` -> hole. Both routes require the one-way descent. The gap `(1,4)`
prevents staying on the upper row.

## Level 5 — climbing a slope

```text
     c0 c1 c2        c3 c4 c5 c6
r0   G0 G0 S0>1 se   G1 G1 G1 G1
r1   B0 G0 S0>1 se   G1 G1 G1 G1
r2   G0 G0 S0>1 se   G1 G1 G1 G1
r3   G0 G0 S0>1 se   G1 G1 G1 H1
```

Hand: `[Move 2, Move 3, Move 3]`

Intended solution and rests:

1. `Move 3 se` -> `(1,3)` after clearing the slope.
2. `Move 2 sw` -> `(3,3)`.
3. `Move 3 se` -> hole `(3,6)`.

Comparable alternative: climb, then `Move 3 se` -> `(1,6)`, then `Move 2
sw` -> hole. Opening with `Move 2 se` expires on the slope and visibly rolls
back to `(1,1)`.

## Level 6 — automatic downhill rolling

```text
     c0 c1        c2
r0   G0 S0>1 se   B1
r1   G0 S0>1 se   G1
r2   G0 S0>1 se   G1
r3   H0 .         G1
```

Hand: `[Move 3, Move 1]`

Solution and rests:

1. `Move 1 nw` enters `(0,1)` and rolls automatically to `(0,0)`.
2. `Move 3 sw` -> hole `(3,0)`.

Displayed order strands the ball at `(3,2)` and the remaining northwest move
falls through `(3,1)`. No alternative solution.

## Level 7 — sand truncates movement

```text
     c0 c1 c2 c3 c4
r0   G0 G0 A0 G0 G0
r1   B0 G0 A0 G0 .
r2   .  G0 A0 G0 H0
r3   G0 G0 A0 G0 G0
```

Hand: `[Move 1, Move 4, Move 2]`

Solution and rests:

1. `Move 4 se` stops early on sand at `(1,2)`.
2. `Move 1 sw` -> sand `(2,2)`.
3. `Move 2 se` -> hole `(2,4)`.

The sand band is unavoidable. The gap `(2,0)` removes the displayed-order
route, while `(1,4)` prevents an adjacent rest with `Move 1` still available.
No alternative solution.

## Level 8 — jumping upward

```text
     c0 c1 c2 c3 c4 c5
r0   G1 G1 G1 G1 G0 G0
r1   G1 G1 G1 G1 G0 B0
r2   G1 G1 G1 G1 G0 G0
r3   H1 G1 G1 G1 G0 G0
```

Hand: `[Move 3, Move 2, Jump 2]`

Intended solution and rests:

1. `Jump 2 nw` -> higher ground `(1,3)`.
2. `Move 2 sw` -> `(3,3)`.
3. `Move 3 nw` -> hole `(3,0)`.

Comparable alternative: after the jump, `Move 3 nw` -> `(1,0)`, then `Move
2 sw` -> hole. Ordinary moves cannot cross the sheer boundary, so the upward
jump is mandatory.

## Level 9 — safe versus lethal downhill slopes

```text
     c0 c1 c2        c3 c4
r0   G0 G0 S0>1 se   G1 G1
r1   G0 G0 S0>1 se   G1 G1
r2   G0 .  S0>1 se   G1 B1
r3   G0 .  S0>1 se   G1 G1
r4   H0 .  S0>1 se   G1 G1
```

Hand: `[Move 3, Move 1, Move 2, Move 1]`

Solution and rests:

1. `Move 1 ne` -> `(1,4)`.
2. `Move 2 nw` enters the safe slope and rolls to `(1,1)`.
3. `Move 1 nw` -> `(1,0)`.
4. `Move 3 sw` -> hole `(4,0)`.

Rows 2–4 have no downhill foot. Entering any of those slopes downhill causes
a fall. The safe row and all four card roles are mandatory; equal cards may
exchange indices only.

## Level 10 — gap, upward jump, and sand order

```text
     c0 c1 c2 c3 c4 c5 c6 c7 c8
r0   G1 G1 A1 G1 G1 G1 .  G0 G0
r1   G1 G1 A1 G1 G1 G1 .  G0 B0
r2   G1 G1 A1 G1 G1 G1 .  G0 G0
r3   H1 G1 A1 G1 G1 G1 .  G0 G0
```

Hand: `[Move 2, Move 4, Move 2, Jump 3]`

Intended solution and rests:

1. `Jump 3 nw` -> higher platform `(1,5)`.
2. `Move 4 nw` -> sand stop `(1,2)` with one step discarded.
3. `Move 2 nw` -> `(1,0)`.
4. `Move 2 sw` -> hole `(3,0)`.

The lower route proposed during wireframing is not valid: moving southwest
from `(1,2)` stops immediately on sand `(2,2)`. The approved upper route is
therefore the canonical route. Playing a short card before `Move 4` on the
plateau leaves too few cards to make the final corner.

## Level 11 — climb, sand, lethal descent, and second upward jump

```text
     c0 c1 c2        c3 c4 c5        c6 c7
r0   G2 .  S0>1 se   A1 G1 S0>1 nw   G0 B0
r1   G2 .  S0>1 se   A1 G1 S0>1 nw   G0 G0
r2   G2 .  S0>1 se   A1 G1 S0>1 nw   G0 G0
r3   G2 .  S0>1 se   A1 G1 S0>1 nw   G0 G0
r4   G2 .  S0>1 se   A1 G1 S0>1 nw   G0 G0
r5   H2 .  S0>1 se   A1 G1 S0>1 nw   G0 G0
```

Hand: `[Jump 3, Move 2, Move 5, Move 3]`

Intended solution and rests:

1. `Move 3 nw` -> `(0,4)` after climbing.
2. `Move 2 nw` -> sand `(0,3)` with one step discarded.
3. `Jump 3 nw` -> higher ground `(0,0)`, crossing the lethal slope and gap.
4. `Move 5 sw` -> hole `(5,0)`.

Comparable alternative uses `Move 5` to climb and reach sand, then divides
the final descent into `Move 3` and `Move 2`, resting safely at `(3,7)`. An
early jump can reach elevation 1 but then cannot cross the later barrier.

## Level 12 — finale

```text
     c0 c1 c2        c3 c4 c5        c6 c7 c8 c9 c10
r0   G0 .  S0>1 se   G1 A1 S0>1 nw   .  .  .  .  .
r1   G0 G0 S0>1 se   G1 A1 S0>1 nw   .  .  .  .  .
r2   G0 .  S0>1 se   G1 A1 S0>1 nw   .  .  .  .  .
r3   B0 .  S0>1 se   G1 A1 S0>1 nw   .  G2 G2 G2 H2
r4   G0 .  S0>1 se   G1 A1 S0>1 nw   .  .  .  .  .
```

Hand: `[Move 4, Move 2, Jump 3, Move 3, Move 2, Move 3]`

Solution and rests:

1. `Move 2 ne` -> `(1,0)`.
2. `Move 3 se` -> `(1,3)` through the sole safe ramp foot.
3. `Move 2 sw` -> `(3,3)`, aligning before sand.
4. `Move 4 se` -> sand `(3,4)`, discarding three steps.
5. `Jump 3 se` -> higher platform `(3,7)`, crossing the lethal slope and gap.
6. `Move 3 se` -> hole `(3,10)`.

All other ramp feet are gaps. Jumping from the wrong row lands in void. Sand
prevents correcting the row after entering column 4. The jump is the only way
past the downhill slope and gap. No geometrically distinct alternative is
intended; equal-valued cards may exchange indices.

## Verification required during implementation

- Validate level structure and shared ramp vertices.
- Exhaustively search every card order and offered direction.
- Prove every level solvable and Levels 2–12 genuinely losable.
- Check the intended route and every stated resting position.
- Reject reachable non-winning rests adjacent to the hole while one or more
  cards remain, including rests caused by sand, blocking, jump landings, and
  automatic slope resolution.
- Prove the teaching mechanic cannot be removed or substituted where relevant.
- Cover upward jumps and downhill slopes whose missing foot causes a fall.
- Review all levels in a browser at 1920x1080 and 390x844 before review.
