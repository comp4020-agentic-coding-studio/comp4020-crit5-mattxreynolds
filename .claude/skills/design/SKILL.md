---
name: design
description:
  Locks a visual direction for this deliverable's prototype before task
  planning starts: grounds generation in real references, produces genuinely
  different rendered directions (not palette variations on one layout),
  selects one with the user, writes a compact visual contract into PLAN.md,
  builds one representative slice against it, and has an independent
  design-critic subagent critique the rendered result before the rest of the
  build proceeds. Use for "let's figure out how this should look", "lock in a
  visual direction", "pick a design direction", or right after `ideate`'s
  lock-in stage confirms a thesis and before `plan` writes tasks.
allowed-tools: Read, Write, Edit, WebFetch, WebSearch, Glob, Grep, Bash, Agent, AskUserQuestion
---

# Design

Visual direction is a decision, same as the thesis --- it deserves its own
comparison and its own explicit lock-in, not a bullet point invented while
writing tasks. This skill produces exactly one durable artifact: a compact
visual contract in `PLAN.md`, checked against a real rendered slice before
`plan` treats it as settled.

## Precondition

`PLAN.md` must have a locked (not draft) thesis. If it doesn't, stop and hand
back to `ideate` --- a visual direction grounded in an unconfirmed thesis gets
re-litigated the moment the thesis changes.

## 1. Ground the direction

Read the locked thesis and the spec's constraints together, then gather
something concrete to anchor generation in --- not the default output of
generating from nothing:

- Ask the user for inspiration: links, screenshots, a site or app whose feel
  (not necessarily content) fits. Not everyone has this ready; if they don't,
  say so and move on rather than stalling on it.
- Independently look for a couple of real references yourself suited to the
  thesis's domain and mood, so the comparison in step 2 has more than one
  source of ideas behind it. Screenshot each one with the same browser CLI
  the `design-critic` uses and look at the image --- `WebFetch` returns
  markdown, not pixels, so reading a page's text isn't grounding in what it
  looks like. A reference you've only read about isn't a reference yet.
- Note hard constraints the directions all have to respect (light/dark only,
  must work at both viewports, anything the spec requires outright).

## 2. Generate genuinely different directions

Produce 3 directions, each taking a different stance on a named composition
axis (e.g. full-bleed vs. split-screen vs. dense-grid; or restrained vs.
maximalist vs. brutalist --- pick the axis that fits the thesis). At least
one direction should be a deliberately bold option, not three safe middle
grounds. Each is a compact spec --- 2--3 palette roles, 2 type roles, a
spacing/density feel, one motif or composition line --- and each has to
differ in composition and mood, not just swap a palette across one shared
layout. Three variations on the same centered card is not three directions,
and "make them different" as an instruction to yourself isn't enough of a
forcing function on its own --- the named axis is what actually forces it.

Render them, don't just describe them: build a small side-by-side comparison
as plain static HTML files in a scratch location outside `src/` (so they
never reach `dist/` and never trip `invariants.test.ts`'s per-page checks ---
a comparison page with three headings is not a real page), and open it with
the browser CLI or a plain `file://` URL. So the choice in step 3 is made by
looking at pixels, not reading hex codes.

## 3. Select

Confirm explicitly with the user which direction to commit to --- same ritual
`ideate` already uses for the thesis lock-in. A deliberate graft between two
directions is fine if the user wants one; say so explicitly rather than
quietly blending without noting it.

Keep a copy of the comparison render and commit it (e.g. under `docs/` or
similar) rather than discarding it once a direction is chosen --- `PROCESS.md`
explicitly welcomes screenshots as evidence, and this is a cheap, strong
exhibit of real design judgement for that file later.

## 4. Write the visual contract into `PLAN.md`

Fixed, compact shape --- this is what keeps it from becoming a style guide:

- **Palette** --- 2--3 roles (background/surface, primary action, accent) plus
  how neutrals are handled.
- **Type** --- 2 roles (display, body): family, weight(s), scale.
- **Spacing** --- a small repeated scale, not a rule to eyeball each gap.
- **Motif / composition** --- one sentence describing the layout's shape and
  feel.
- **Imagery / iconography** --- one sentence on the shared treatment.

If it doesn't fit in roughly 15 lines, it isn't compact yet --- trim it rather
than let it grow.

Mark it explicitly provisional at this point --- a `(draft --- not yet
validated against a rendered slice)` note at the top of the section, the same
device `ideate` uses for the thesis. A contract without this marker reads as
locked; don't let steps 5--7 happen invisibly.

## 5. Build one representative slice

Pick one real page or section (the landing hero, or the core interaction) and
build it fully against the contract. This is `working-loop` step 4's
principle ("prove a repeatable pattern on one slice first") applied to the
visual contract specifically, before the rest of the build touches it.

## 6. Independent rendered critique

Dispatch the `design-critic` subagent fresh (`Agent` tool,
`subagent_type: "design-critic"`) --- give it the dev server URL (or, if the
slice has more than one meaningful screen or state --- e.g. a game's start,
mid-play, and end states --- a short list of named states and how to reach
each one) and the locked visual contract, nothing else. It has no access to
this conversation's implementation rationale, on purpose: it screenshots
itself and judges only what actually rendered. It's an automated judgment
call, not a deterministic check --- treat its findings as observations to
weigh against the render yourself, not as an unquestionable verdict; verify
anything surprising against the screenshots or the live page before acting,
but don't dismiss a finding just because it's inconvenient.

## 7. Refine

Apply the critique's fixes to the slice. If the critique says the *direction*
itself doesn't serve the thesis --- not just its execution --- stop and
return to step 2/3 with the user rather than patching around a bad fit.

## 8. Hand off to `plan`

Once the slice is built and the critique comes back clean, remove the draft
marker from `PLAN.md`'s visual contract --- this is what makes it locked, and
it's the last thing this skill does, not an earlier or implied step. Note in
the hand-off exactly which files/pages the slice already produced, so `plan`
marks that work `Done` in `TASKS.md` instead of re-scoping it as backlog ---
without this, the slice's files and `plan`'s first tasks silently duplicate
each other. Then hand off to the `plan` skill explicitly. `plan` treats the
visual contract as an already-locked decision, the same way it treats the
thesis --- it doesn't re-invent, re-ask about it, or remove the draft marker
itself.

## Recurring failures become critic rules, not repeated corrections

If the `design-critic` flags the same failure mode twice within one project
(e.g. a centered narrow column with dead margins, or color doing no semantic
work), that's a candidate for `working-loop` step 10: add it to the
`design-critic` agent's rubric directly rather than re-explaining it next
time. The rubric is the reusable, cross-project part of this --- `PLAN.md`'s
contract is not.
