---
name: working-loop
description:
  Executes TASKS.md one task at a time until the project (including its
  fine-tuning tail) is done — respects the WIP limit, verifies before marking
  anything done, commits tests before implementation, and keeps TASKS.md and
  PROCESS.md honest as it goes. Use for "start working through tasks", "let's
  build", "continue the build", "next task", "keep going", or any time
  PLAN.md and TASKS.md already exist and the plan is confirmed.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, Agent, AskUserQuestion
---

# Working loop

This is the loop that burns down `TASKS.md`, task by task, across as many
sessions as the project needs. Planning already decided scope, acceptance
criteria, and execution strategy per task --- this skill's job is to execute
that faithfully and catch what planning couldn't have anticipated.

## Per task

1. **Pick the next task** from `TASKS.md`'s `Backlog`, respecting the WIP
   limit in `In progress`. Don't start a second task while the limit is
   already at capacity.

2. **Execute what's already decided directly.** Scope, acceptance criteria,
   and sequential-vs-subagent execution were settled by the `plan` skill.
   Don't re-ask about them --- re-litigating pre-made decisions per task is
   how a working loop turns into constant re-prompting.

3. **Surface only decisions planning couldn't have seen.** If something
   genuinely undecided turns up mid-implementation --- a design choice that
   only became visible once built, a conflict between two plan decisions ---
   ground it in the spec, the rendered result, or `PLAN.md` itself, and
   surface it before proceeding. Don't build past a real fork silently.

4. **Prove a repeatable pattern on one slice first.** If a task involves
   applying the same treatment repeatedly (a card style across many items, a
   component across many pages), build and check one instance before rolling
   it out to the rest.

5. **If a task's real scope doesn't match its `TASKS.md` description**, fix
   the entry immediately --- split it, merge it, re-scope it --- rather than
   quietly over- or under-delivering against a stale description.

6. **Commit tests before implementation.** Write the task's test(s) first and
   commit them red --- expected, per this repo's commit-discipline rule.
   Commit the implementation once it's green. Split a large implementation
   into multiple logical commits rather than one dump.

7. **Verification precedes "done".** A task isn't `Done` in `TASKS.md` until:
   its tests exist and pass, and --- for anything user-visible --- the
   rendered page has actually been checked at both viewports, not assumed.
   Use two-speed verification: cheap sanity checks while mid-task, the full
   `pnpm check` (plus both viewports) at task close, session close, and full
   project completion.

8. **Subagent output gets the same scrutiny as your own.** If this task was
   dispatched to a subagent, check its actual diff and the rendered result
   before trusting it --- a subagent's summary describes what it intended to
   do, not necessarily what it did.

9. **Collapse and narrate at task close.** Move the finished task to `Done`
   as one line + commit link, in the same commit that finishes it, dropping
   implementation notes (they belong in the commit message). Say briefly what
   changed and anything you noticed, even when no decision is needed --- so
   the user is never surprised by an accumulated diff at the end.

10. **Log candidate `PROCESS.md` moments as they happen**, not at the end.
    If this task involved a correction that landed in the harness --- a rule
    added, a check wired up, an attempt thrown away for a better one --- add
    a rough entry to `PROCESS.md`'s running list now. Most tasks won't
    produce one; don't manufacture a moment where there isn't one.

## At session close

Leave `TASKS.md` truthfully reflecting real state --- what's actually `Done`
vs. still `In progress` vs. blocked --- so the next session's orientation
step reads an accurate picture, not yesterday's intention.

## When the backlog empties except `Polish`

Populate `Polish` by reviewing the built site against the spec and the
rubric's shape, not from a pre-written list --- a first pass at a project
this size is realistically not going to be perfect. Execute polish tasks
through this same loop; they're not a different process.
