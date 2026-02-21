# CLAUDE.md — Agent Instruction Manual
# Read this file FIRST before doing anything.

---

## 4-FILE SYSTEM

You operate using 4 files. Each has one job:

| File | Job | When to read |
|---|---|---|
| CLAUDE.md | Your rules — how to behave, code, and update files | Before every session |
| PROGRESS.md | Live state — which task is current, what's done, blockers | Before starting any task |
| TODO.md | Task definitions — exact action, files, done_when | When executing a task |
| PROJECT.md | Architecture reference — tech stack, event protocol, data models | When you need specs |

Read order: CLAUDE.md → PROGRESS.md → TODO.md → (PROJECT.md as needed)

---

## WORKFLOW

### Task execution loop

1. Read PROGRESS.md → find `current_task` ID.
2. Read TODO.md → find the matching `### T-XXX` block.
3. Check `depends_on` — all listed tasks must be `done`. If not, stop and report.
4. Set task status to `in_progress` in both TODO.md and PROGRESS.md.
5. Execute the `action` field exactly.
6. Verify against the `done_when` field.
7. Set task status to `done` in both files.
8. Update PROGRESS.md: `last_completed` = this task, `current_task` = next task.
9. **STOP. Wait for user to say "continue" before starting the next task.**

### Autonomy rules

- Complete ONE task, then STOP and wait.
- Never skip ahead to the next task without user approval.
- Never modify files outside of the current task's `files` list unless fixing a bug in a previous task.

### Error handling

- If a task fails (build error, runtime error, import issue):
  1. Attempt fix #1. Describe what broke and what you're trying.
  2. If still broken, attempt fix #2.
  3. If still broken after 2 attempts: STOP. Set task status to `blocked` in PROGRESS.md.
     Add entry to BLOCKERS section: `T-XXX: [description of error]`. Ask user for help.
- Never silently ignore errors. Every error gets either fixed or reported.

### Test checkpoints

Run the app and verify at these two points:

| After task | What to test |
|---|---|
| US-002 (server/index.js) | `npm install` from server/, `node server/index.js` starts, GET /health returns {ok:true} |
| US-020 (Room.jsx) | `npm run dev` starts both servers, open browser to :5173, join screen renders |

At checkpoints: if tests fail, fix before moving on. This counts as the current task — do not advance.

---

## CODING STYLE

### General

- ES modules everywhere (`import/export`, not `require/module.exports`).
- All package.json files have `"type": "module"`.
- Use `const` by default. `let` only when reassignment is needed. Never `var`.

### React components

- Function declarations, not arrow functions:
  ```jsx
  export default function JoinScreen({ onJoin, joinError }) {
    // ...
  }
  ```
- One component per file. File name = component name.
- Hooks at the top of the function body, before any logic.

### Naming

- Files: PascalCase for components (`JoinScreen.jsx`), camelCase for utils/hooks (`useDrawing.js`, `sounds.js`).
- Variables/functions: camelCase.
- Constants: UPPER_SNAKE_CASE only for true constants (`MAX_USERS = 5`, `CANVAS_WIDTH = 1280`).
- Socket events: colon-namespaced (`room:join`, `draw:stroke_start`, `chat:message`).

### Imports

- No strict ordering rules. Just import what you need.
- Prefer named imports for utilities: `import { nanoid } from 'nanoid'`.
- Default import for components: `import ChatPanel from './ChatPanel'`.

---

## QUALITY RULES

### Logging

- **Server:** log room join, leave, and errors only. Format: `console.log('[room:join]', roomId, nickname)`.
- **Client:** ZERO console.log statements. Remove any you add during debugging before marking task done.

### Comments

- Only add comments where logic is non-obvious (e.g., why `destination-out` is used for eraser).
- No comments that restate what code does (`// set state to joined` above `setSessionState('joined')`).
- No JSDoc. No file header comments.

### Error handling

- Server socket handlers: wrap in try/catch. On error, log and emit nothing (don't crash the server).
- Client: `.catch(() => {})` on fire-and-forget operations like audio play.
- No unnecessary validation. Trust internal data flowing between your own functions.

### CSS (Tailwind)

- Use Tailwind utility classes directly in JSX. No custom CSS unless Tailwind can't do it.
- No `@apply` in CSS files.
- Use Tailwind responsive prefixes for mobile: `md:flex-row flex-col`.

---

## FILE UPDATE PROTOCOL

After completing a task, make these exact changes:

**In TODO.md:** change the task's `status:` line from `pending` or `in_progress` to `done`.

**In PROGRESS.md:**
- Update `current_task:` to the next task ID.
- Update `last_completed:` to the task you just finished.
- In the TASK STATUS TABLE, change the task's Status cell to `done`.
- Append one line to COMPLETED LOG: `[date] T-XXX done — short summary`.

That's it. No other changes needed.

---

## KEY CONSTANTS

project_root: /home/priyansurout/claude-test/claude-build
server_port: 3001
client_port: 5173
canvas_width: 1280
canvas_height: 720
max_users: 5
max_messages: 200
cursor_fade_timeout: 2000ms
stroke_throttle: 16ms
cursor_throttle: 50ms
