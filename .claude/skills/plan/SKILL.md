---
name: plan
description:
  Turns a locked idea in PLAN.md into a full execution plan — PLAN.md's
  durable decisions, and TASKS.md's complete session-sized task breakdown
  with acceptance criteria, execution strategy (sequential vs. independent
  subagents), and the test-alongside-implementation policy. Use for "write
  the project plan", "break this into tasks", "plan out the build", "turn
  this into tasks", or right after `ideate`'s lock-in stage confirms a
  direction.
allowed-tools: Read, Write, Edit, WebFetch, Glob, Grep, Bash, AskUserQuestion
---

# Plan

This is the one point in the whole workflow where the *entire* build gets
decided before any of it happens. Get it right here so `working-loop` can
execute without re-litigating these calls task by task.

## Precondition

`PLAN.md` must have a locked (not draft) thesis. If it doesn't, stop and hand
back to the `ideate` skill instead of planning against an unconfirmed idea.

## 1. Ground the plan

Re-read the spec's checkable lines and the locked thesis together. Every task
this produces should trace back to one or the other --- not to an assumption
about what "feels right" to build next.

## 2. Expand `PLAN.md`

Add whatever durable decisions the build needs beyond the thesis: the design
system, page/content structure, anything that would otherwise get re-decided
ad hoc mid-build. Current decisions only, written as if today were the first
day anyone read them --- no "originally we considered X" history (that's
git's job).

## 3. Write `TASKS.md`

Break the plan into session-sized tasks. For each task, decide and record:

- **A concise, observable completion condition** --- what "done" looks like,
  checkable without re-reading the whole plan.
- **Acceptance criteria** tied back to the spec or the plan's own decisions,
  specific enough that `working-loop` can verify against them without
  guessing.
- **Execution strategy** --- sequential by default. Only mark a task (or a
  cluster of tasks) for independent/parallel subagent execution if it
  genuinely doesn't need to see another in-flight task's finished output ---
  when in doubt, sequential.
- **Test policy** --- tests are written alongside that task's own
  implementation and are part of its completion condition, not a separate
  pass done later. Say this once here rather than re-deciding it per task.

Structure `TASKS.md` as sections: `Backlog`, `In progress` (WIP-limited ---
1 for a sequential thread, or matching the number of subagents actually
dispatched for a genuinely independent batch), `Blocked`, `Done` (collapsed
to one line + commit link per entry, per `working-loop`'s convention). Leave
a `Polish` section present but empty --- it gets populated by review against
the spec once the main backlog is built, not specified in detail now.

## 4. Confirm before handing off

Walk the user through the plan and the task breakdown before `working-loop`
starts executing it. This is the one "decide before building" pass for the
whole project; once confirmed, `working-loop` executes what's here directly
rather than re-asking.
