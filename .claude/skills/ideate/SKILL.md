---
name: ideate
description:
  Brainstorms directions for this deliverable's prototype and locks one in
  before any planning or building starts. Two stages: an open brainstorm that
  generates and cross-examines independent directions (not just react to one
  idea), and a lock-in pass in a fresh session that stress-tests the leading
  direction before committing to it. Use for "let's brainstorm ideas for this
  week's prototype", "what could this deliverable be", "help me pick a
  direction", "I want to flesh out this idea before we commit", "lock in the
  idea we discussed", or at the very start of a deliverable when PLAN.md
  doesn't exist yet.
allowed-tools: Read, Write, Edit, WebFetch, WebSearch, Glob, Grep, AskUserQuestion
---

# Ideate

Picking the direction is a decision, not a formality --- treat it with the same
rigor as any other "decide before building" moment, just earlier. This skill
has two stages. Figure out which one applies from what's already in `PLAN.md`
(or the lack of it) rather than assuming.

## Stage 1: Brainstorm (no `PLAN.md`, or `PLAN.md` marked draft with no lock-in)

1. Read the week's spec (course website, and `spec/README.md` for how it maps
   to this repo's checks) before generating anything --- directions have to be
   grounded in what's actually being asked, not invented in the abstract.
2. Generate genuinely independent directions yourself, even if the user
   already brought one. Don't just react to their idea --- investigate your
   own angles too, so the comparison is real.
3. Cross-examine each direction together: does it hit the spec's checkable
   lines without a punishing amount of scope, does it hold up at both
   viewports, is there a version of it that's actually buildable in the time
   available. The goal is the best grade this deliverable can get, which
   usually (not always) means the same thing as the best prototype --- when
   they diverge, say so rather than picking silently.
4. Bound the brainstorm. Converge on a small number of live directions (2--4)
   rather than sprawling --- this is a full-weight step, not an unbounded one.
5. Once a leading direction emerges, write it into `PLAN.md` as a **draft**:
   a thesis and the core idea, explicitly marked provisional (e.g. a `(draft
   --- not yet locked in)` note at the top). This is the artefact the next
   session picks up cold.
6. Recommend ending the session here. The lock-in stage benefits from a fresh
   context reload (`/clear` then `@PLAN.md`) rather than continuing in a
   thread cluttered with the directions that lost.

Do not treat a direction as decided just because it's the one written down ---
that happens in Stage 2, explicitly, with the user.

## Stage 2: Lock-in (`PLAN.md` has a draft thesis)

1. Re-read the draft in `PLAN.md` cold, as if seeing it for the first time.
2. Stress-test it: try to break it against the spec, check it's still
   feasible at both viewports, check the scope is real given the time left.
   Ground this in the spec and rendered feasibility, not a second round of
   assumption.
3. Confirm explicitly with the user before treating anything as locked. If it
   doesn't hold up, say so and go back to brainstorming (more directions, or
   a revised version of this one) rather than forcing a choice to keep
   moving.
4. Once locked: rewrite `PLAN.md`'s thesis section as a committed decision
   (drop the draft marker and any "originally considered..." framing --- that
   belongs in git history and, if it's a good story, `PROCESS.md`, not in
   `PLAN.md` itself).
5. Hand off to the `plan` skill next --- say so explicitly rather than
   drifting into task breakdown here.
