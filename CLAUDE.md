# COMP4020 prototype

This is your starter repo for a COMP4020 prototype: a static site written in
HTML/CSS/TypeScript (this repo runs on Astro) that builds to plain HTML/CSS/JS
and deploys to GitHub Pages. The **deployed site is what gets marked** --- not
this repo, and not "it works on my machine". It's marked live in Chrome
against the deployed URL at two viewports --- 1920×1080 (desktop) and 390×844
(phone) --- and both count in full.

The spec for this deliverable is published on the course website, not in this
repo. Read it before building; see `spec/README.md` for how the checks here
relate to it.

## Orient at the start of a session

Before doing anything else, read `TASKS.md` (or `PLAN.md` if `TASKS.md`
doesn't exist yet) for the current stage and next task, state it back
plainly, and ask whether to proceed with it or do something else. Don't start
working from an assumed context.

## The workflow

Three project-local skills carry this prototype from idea to shipped build,
in order. Each is self-triggering (invoke by name, or just describe the stage
you're in) --- see each skill for its procedure.

- **`ideate`** --- brainstorm directions, then lock one in once we're both
  convinced.
- **`plan`** --- turn the locked idea into `PLAN.md`'s decisions and
  `TASKS.md`'s full task breakdown.
- **`working-loop`** --- execute `TASKS.md` one task at a time, including the
  fine-tuning tail at the end, verifying before marking anything done.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make
  them.
- Before you push, run `pnpm check` --- typecheck (`astro check`), build, and
  vitest (the spec suite plus your own tests). That's the whole local loop;
  see "The checks" below for what CI adds on top.
- Open the rendered page in a browser (the `agent-browser` CLI, documented on
  [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth))
  before trusting a mental model of it --- the rendered page is the truth.
- When a check fails, read its output before changing anything. It names the
  file, the line, or the contract; treat a red check as authoritative.
- Commit when every remaining failure is known and expected, not only when
  everything is green. A spec test failing because its requirement isn't
  built yet is expected --- commit alongside it. A newly broken or
  unexplained failure is not: find the cause before committing. Never weaken
  or delete a test to force it green.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names
it, like any link --- `./card.png` is wrong one directory down, and nothing
in CI checks it, so look at the deployed head when you add pages.

## The checks (your sensors)

CI runs these once the repo is public, gated on `check` passing before
`deploy` runs. At a crit, the sweep runs fifteen minutes after your cutoff,
and green checks there are worth half that week's shipped mark --- still
running counts as not green, so ship with time for CI to finish.

- **typecheck, build, tests** --- `pnpm check` (astro check, build, then
  vitest for the spec suite and your own tests together). Fails fast: an
  early step stops the later ones for that run.
- **evidence** (`pnpm check:evidence`) --- `PROCESS.md`'s citations resolve
  to real commits, the current deliverable's exact reflection exists in
  `reflections/`, and `CLAUDE.md` is present. Gates `deploy` alongside
  everything else.
- **links, secrets, deploy --- CI only.** Reproduce the links check locally
  with `pnpm dlx linkinator ./dist --silent` against a fresh `pnpm build`.
  The secrets scan is backed locally by a pre-commit hook
  (`.githooks/pre-commit`) that blocks anything shaped like an API key before
  it's ever pushed.

Nothing here measures **accessibility** or **performance** --- wiring those
sensors is your own work this course asks for separately.

## This file is yours

This CLAUDE.md is a starting point, not a fixed rulebook. As you learn what
your prototype needs --- a convention to hold the agent to, a sensor that
keeps catching you out, a fact about the stack the agent keeps getting wrong
--- write it down here.
