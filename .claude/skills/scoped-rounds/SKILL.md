---
name: scoped-rounds
description: Use when starting a new feature-build or port on a project — or when the user says "use scoped rounds", "follow the usual structure", "do it in rounds", or similar. Especially applies when there is a source of truth to port from (a companion app, a legacy system, a spec). Triggers on phrases like "build this feature", "port X", "add Y to the portal", "maximize features", "start a new project".
---

# Scoped Rounds — iterative feature build / port workflow

A disciplined, low-risk way to build features on an existing codebase, especially when porting from a source of truth (a companion app, a legacy system, a spec doc).

## When to invoke

- Starting a new feature on a live project.
- User has an existing app/spec and wants its behavior mirrored in a new codebase.
- User asks to "maximize features", "fold in X", "build the next chunk".
- User explicitly says "use scoped rounds".

Do **not** invoke for: single-line fixes, one-shot questions, debug sessions, or anything the user has already scoped tightly themselves.

## Core principles

1. **Research before code.** Always read the target files and — if one exists — the source-of-truth files before proposing. Never guess at field names, scoring rules, or API shapes.
2. **Port, do not reinvent.** When there's a source of truth (mg-fms, a legacy controller, a reference implementation), mirror its field names, logic, and constants verbatim so data stays compatible. Fix bugs on port; don't copy them.
3. **Propose before building.** Offer 2-4 scoped options with trade-offs. Let the user pick. Never launch into a large build without confirmation.
4. **One round = one commit = one focused theme.** 3-8 related changes. If you're tempted to "also fix X while you're in there," stop — that's a future round.
5. **Call out scope cuts explicitly.** In the commit message AND in code comments: "Deliberately out of scope for this round: photos, PMS sub-flow, supervisor override." Makes gaps visible to future sessions.
6. **Build before commit.** Run the project's build/typecheck/lint. Never commit a broken tree.
7. **Commit messages explain *why*.** Reference source-of-truth file:line for ports. Name the bugs fixed. List what was cut and why.
8. **Don't open PRs unless asked.** Push the branch. Let the user decide when to open a PR.

## The round loop

Each round follows this shape:

### Step 1 — Audit (only on first round or when state is unclear)

Do a quick reality check on what the CLAUDE.md / docs claim vs what's actually in the repo. Flag stale docs. Don't skip — stale context leads to bad plans. Fix stale CLAUDE.md in a dedicated commit or as part of round 1.

### Step 2 — Research

Read the relevant source-of-truth files, the target files, and anything the new code will touch. Use parallel Read/Grep/Glob when the queries are independent. Use an Explore agent only when the search space is genuinely large (>3 independent queries).

### Step 3 — Propose

Present a **table or short list** of gaps you found, then a **scoped plan** with an explicit in-scope list AND an explicit out-of-scope list. Propose the smallest useful increment that delivers real value. Ask the user to pick or redirect. Do not write code yet.

### Step 4 — Build

Once the user approves, execute. Keep the diff focused on the agreed scope. Resist "while I'm in there" additions. If you discover a new gap mid-build, note it as a future round — don't expand scope.

### Step 5 — Verify

Run the project's build command (`npm run build`, `cargo build`, `mix compile`, whatever fits). If it fails, fix. If there's a typecheck or lint script, run it too. Never commit a broken tree.

### Step 6 — Commit + push

One commit per round. Message format:

```
<one-line summary of the round>

<paragraph: what problem this solves and why this scope>

<file-by-file or feature-by-feature breakdown>

<"Deliberately out of scope for this round: ..." list>

<if porting: cite source-of-truth file:line references>
```

Push to the working branch. Do not open a PR.

### Step 7 — Close out

Tell the user:
1. What shipped (with commit hash and 1-line descriptions).
2. What was deferred and why.
3. 2-4 suggested next rounds, ordered by trade-off — usually something like "cheap quality-of-life", "visible surface area", "connective tissue", "new feature".

Let the user pick.

## Guardrails

- **Tight feedback loop.** After 2-3 rounds, remind the user that pulling & clicking the UI catches bugs the build can't. Don't let the "build here" phase grow so long that bugs stack.
- **If you can't verify, say so.** You can't click buttons in a sandbox. Never claim "tested end-to-end" — claim "builds clean, UI not browser-verified."
- **When a design choice has a trade-off, surface it.** Don't silently pick. Give the user the call.
- **Confirm before destructive actions.** Force-pushes, branch deletes, `rm -rf`, schema migrations. The scoped-rounds cadence shouldn't override standard destructive-action caution.
- **Maintain CLAUDE.md.** If a round reveals that CLAUDE.md is stale (missing files, wrong state, outdated rules), fix it in the same round or a dedicated tiny round. Future sessions depend on it being accurate.

## Communication style within a round

- **Before a tool call**, one short sentence: "Reading the classification engine now."
- **After a find**, one short sentence: "Found it — `runEngine` at App.jsx:191, 1 line. Porting verbatim."
- **On blocker**, immediately: "Blocked — `fetchContextDoc` isn't exported. Options: (a) export it, (b) reimplement inline. (a) is cleaner."
- **End of turn**, 1-2 sentences: "Shipped round N as commit abc123. Next up: photos or re-assessment?"

No preamble, no trailing summaries, no narrating internal reasoning. Updates should be relevant, not performative.

## Source-of-truth handling

When the project has a companion app / legacy reference:

1. **Name it up front.** In CLAUDE.md or the first round's research, declare what the source of truth is and where it lives.
2. **Field names match verbatim.** If mg-fms writes `header.plate`, the portal writes `header.plate` — not `plate` or `plateNo`.
3. **Shared collections stay shared.** If both apps read/write the same collection, the write shape must remain compatible.
4. **Portal-only collections can drift intentionally.** Document the drift.
5. **Known bugs in the source — fix on port, don't copy.** Flag each fix in the commit so future readers know it was intentional.

## Anti-patterns to avoid

- Writing code in the first message of a conversation, before proposing.
- Rounds that touch 10+ files.
- "Let me also refactor X while I'm here."
- Silent schema changes (new field names, new collection, reshuffled docs).
- Claiming a feature is "done" when only the build passed.
- Skipping the scope-cut list in the commit message — makes gaps invisible.
- Opening a PR the user didn't ask for.
