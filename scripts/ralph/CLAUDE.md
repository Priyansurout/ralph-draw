# Ralph Iteration Instructions

You are an autonomous coding agent building a real-time collaborative drawing and chat web app.
You will complete exactly ONE user story per run using a multi-agent planning approach, then commit and push.

---

## PHASE 1 — Load Context

Read these files in order before doing anything else:

1. `scripts/ralph/prd.json` — find the next story where `passes: false` (lowest index). That is your story for this run.
2. `scripts/ralph/progress.txt` — read the **## Codebase Patterns** section at the top for accumulated knowledge from previous iterations.
3. `PROJECT.md` — architecture reference: socket event protocol, folder structure, constants, data models.
4. `CLAUDE.md` (project root) — coding rules you MUST follow exactly.

If ALL stories in prd.json have `passes: true`, output `<promise>COMPLETE</promise>` and stop.

---

## PHASE 2 — Multi-Agent Planning (3 Plans in Parallel)

Use the Task tool to spawn **3 Plan sub-agents IN PARALLEL** (single message, all three at once).

Create directory `plans/` first. Each agent writes its plan to a file:

**Agent A — Minimal approach** (`plans/plan_A.md`):
- Simplest correct implementation. Fewest abstractions. Hardcode where sensible.
- Prioritize: it works, it's readable, it follows the coding rules.
- Plan format: list of files to create/edit, code snippets for key sections, implementation steps.

**Agent B — Robust approach** (`plans/plan_B.md`):
- Full implementation with defensive coding. Proper try/catch everywhere. Edge cases handled.
- More thorough validation, cleaner separation of concerns.
- Plan format: same as A, plus notes on error handling decisions.

**Agent C — Pattern-aligned approach** (`plans/plan_C.md`):
- Implementation that maximally reuses patterns already in `scripts/ralph/progress.txt`.
- Prioritizes consistency with what's been built — same naming, same structure, same idioms.
- If progress.txt has no patterns yet, default to the Minimal approach.
- Plan format: same as A, plus reference to which patterns from progress.txt are being reused.

Each agent prompt must include: the full story description, acceptanceCriteria, the content of PROJECT.md, and the Codebase Patterns section from progress.txt.

---

## PHASE 3 — Evaluation (1 Evaluator Agent)

After all 3 plans are written, spawn **1 Evaluator sub-agent** that:

1. Reads `plans/plan_A.md`, `plans/plan_B.md`, `plans/plan_C.md`
2. Reads the story's `acceptanceCriteria`
3. Reads the Codebase Patterns section from `scripts/ralph/progress.txt`
4. Selects the best plan with explicit reasoning
5. Writes decision to `plans/chosen_plan.md` in this format:
   ```
   CHOSEN: A
   REASON: [2-3 sentences explaining why this plan is best for this specific story]
   KEY_DECISIONS: [bullet list of non-obvious implementation choices from the chosen plan]
   ```

Evaluation criteria (in order of priority):
1. Correctness — does it meet all acceptanceCriteria?
2. Coding rule compliance — ES modules, function declarations, no console.log on client, etc.
3. Consistency — does it match patterns from progress.txt codebase patterns?
4. Simplicity — simpler is better when correctness is equal

---

## PHASE 4 — Implement

Read `plans/chosen_plan.md`. Implement the story following the chosen plan.

Apply ALL coding rules from `CLAUDE.md` (project root):
- ES modules everywhere (`import/export`, never `require`)
- React components: `export default function Name({ prop }) {}` — function declarations only
- Hooks (`useState`, `useEffect`, `useRef`) at the TOP of the function body, before any logic
- Tailwind utility classes only in JSX — no custom CSS except `index.css` for @tailwind directives
- Client code: ZERO `console.log` statements
- Server code: log ONLY `room:join`, `room:leave`, and errors — format: `console.log('[room:join]', roomId, nickname)`
- Server socket handlers: wrap in `try/catch` — on error, log and do nothing else
- Audio calls: wrap in `.catch(() => {})`

**Non-obvious rules to remember:**
- Eraser tool MUST use `ctx.globalCompositeOperation = 'destination-out'` — not white paint
- Vite config MUST proxy `/socket.io` to `http://localhost:3001` with `ws: true` — without this, Socket.IO fails
- All `package.json` files need `"type": "module"`

**Key constants — use these, do not hardcode different values:**
```
CANVAS_WIDTH  = 1280
CANVAS_HEIGHT = 720
MAX_USERS     = 5
MAX_MESSAGES  = 200
CURSOR_FADE_TIMEOUT = 2000
STROKE_THROTTLE     = 16
CURSOR_THROTTLE     = 50
SERVER_PORT   = 3001
CLIENT_PORT   = 5173
```

---

## PHASE 5 — Quality Checks

Before committing, run these checks and fix ALL errors:

If server files were created or modified:
```bash
node --check server/index.js
node --check server/rooms.js
```

If client files were created or modified (only if node_modules/vite exists):
```bash
cd client && npx vite build 2>&1 | head -40
```

If quality checks fail:
1. Read the error carefully
2. Fix the root cause
3. Re-run the check
4. If still failing after 2 fix attempts: continue anyway but note the issue in progress.txt

---

## PHASE 6 — Commit and Push

Stage only the files changed for this story:
```bash
git add [specific files]
git commit -m "feat: US-XXX - story title"
git push origin main
```

If pushing fails because branch doesn't exist yet:
```bash
git push -u origin main
```

---

## PHASE 7 — Update prd.json

Set `passes: true` for the completed story in `scripts/ralph/prd.json`. Then commit and push this change:
```bash
git add scripts/ralph/prd.json
git commit -m "chore: mark US-XXX complete"
git push origin main
```

---

## PHASE 8 — Save Long-Term Learnings

Append to `scripts/ralph/progress.txt` (NEVER overwrite — always append to end):

```
## [YYYY-MM-DD] - US-XXX: Story Title
- Plan chosen: A/B/C
- Reason: [evaluator's reason from chosen_plan.md]
- Files created: [list]
- Files modified: [list]
- Implementation notes: [what was done, non-obvious decisions]
- Learnings for future iterations:
  - [specific pattern or gotcha learned]
  - [another learning if applicable]
---
```

If you discovered a **broadly reusable pattern** (e.g., how Socket.IO events are structured in this codebase, how to set up a Vite proxy, how the canvas compositing works, how hooks are exported), update the **## Codebase Patterns** section at the TOP of `scripts/ralph/progress.txt`. Create this section if it doesn't exist yet.

Format for Codebase Patterns entries:
```
## Codebase Patterns

### [Pattern Name]
[1-2 sentence description of the pattern]
Example: `export function useSocketHook({ ... }) { ... }` — named export, function declaration

### [Another Pattern]
...
---
[iteration logs below]
```

Commit the updated progress.txt:
```bash
git add scripts/ralph/progress.txt
git commit -m "docs: add progress notes for US-XXX"
git push origin main
```

---

## PHASE 9 — Cleanup and Completion Check

Delete the temp plan files:
```bash
rm -rf plans/
```

Read `scripts/ralph/prd.json`. Count stories where `passes: false`.

If ALL stories have `passes: true`, output:
```
<promise>COMPLETE</promise>
```

Otherwise, stop here. Ralph will start a new iteration for the next story.
