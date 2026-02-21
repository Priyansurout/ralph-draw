# PROJECT.md — Architecture Reference

## Tech Stack

| Layer    | Technology              | Notes                  |
|----------|-------------------------|------------------------|
| Runtime  | Node.js >=18            |                        |
| Backend  | Express + Socket.IO ^4  | HTTP + WebSocket       |
| Frontend | React 18 + Vite         | Dev on :5173           |
| Styling  | Tailwind CSS ^3         | Utility classes only   |
| IDs      | nanoid ^5               | Named import           |

## Ports

| Service | Port |
|---------|------|
| Server  | 3001 |
| Client  | 5173 |

## Folder Structure (target)

```
project-root/
  server/
    index.js        — Express + Socket.IO entry point, health endpoint
    rooms.js        — In-memory room state manager (createRoomManager)
  client/
    index.html
    vite.config.js  — MUST include proxy: /socket.io → http://localhost:3001
    tailwind.config.js
    postcss.config.js
    src/
      main.jsx
      App.jsx         — Top-level session state: 'join' | 'room'
      index.css       — @tailwind base/components/utilities only
      hooks/
        useSocket.js  — Socket.IO connection lifecycle (named export)
        useDrawing.js — Canvas drawing state + operations (named export)
      components/
        JoinScreen.jsx
        Room.jsx        — Main room layout, composes all other components
        DrawingCanvas.jsx
        ChatPanel.jsx
        UserList.jsx
        CursorOverlay.jsx
        Toolbar.jsx
      utils/
        sounds.js     — Web Audio API: playJoin, playLeave, playMessage
  package.json        — Root workspace, "npm run dev" via concurrently
  server/package.json
  client/package.json
```

## Socket Event Protocol

### Client → Server

| Event              | Payload                                    | Notes                   |
|--------------------|--------------------------------------------|-------------------------|
| `room:join`        | `{ roomId, nickname }`                     |                         |
| `chat:message`     | `{ text }`                                 | max 500 chars           |
| `draw:stroke_start`| `{ x, y, color, brushSize, tool }`         | throttled 16ms          |
| `draw:stroke_move` | `{ x, y }`                                 | throttled 16ms          |
| `draw:stroke_end`  | `{}`                                       |                         |
| `draw:clear`       | `{}`                                       |                         |
| `cursor:move`      | `{ x, y }`                                 | throttled 50ms          |

### Server → Client

| Event              | Payload                                              | Direction         |
|--------------------|------------------------------------------------------|-------------------|
| `room:joined`      | `{ users:[{id,nickname,color}], chatHistory:[...] }` | → sender only     |
| `room:user_joined` | `{ id, nickname, color }`                            | → rest of room    |
| `room:user_left`   | `{ id, nickname }`                                   | → rest of room    |
| `room:error`       | `{ message }`                                        | → sender only     |
| `draw:stroke_start`| `{ userId, x, y, color, brushSize, tool }`           | → room excl sender|
| `draw:stroke_move` | `{ userId, x, y }`                                   | → room excl sender|
| `draw:stroke_end`  | `{ userId }`                                         | → room excl sender|
| `draw:clear`       | `{}`                                                 | → room excl sender|
| `chat:message`     | `{ id, userId, nickname, text, timestamp }`          | → entire room     |
| `cursor:move`      | `{ userId, nickname, color, x, y }`                  | → room excl sender|

## Constants

```js
const CANVAS_WIDTH         = 1280
const CANVAS_HEIGHT        = 720
const MAX_USERS            = 5
const MAX_MESSAGES         = 200
const CURSOR_FADE_TIMEOUT  = 2000   // ms — remote cursor disappears after this
const STROKE_THROTTLE      = 16     // ms — draw:stroke_move emit interval
const CURSOR_THROTTLE      = 50     // ms — cursor:move emit interval
const SERVER_PORT          = 3001
const CLIENT_PORT          = 5173
```

## Room State (server, in-memory)

```js
// rooms.js manages this structure
rooms = Map<roomId, {
  users: Map<socketId, { id: socketId, nickname: string, color: string }>,
  chatHistory: Array<{ id, userId, nickname, text, timestamp }>
}>
```

## User Color Palette (assigned in join order)

```js
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7']
// First joiner gets index 0, second gets index 1, etc.
// If room has 5 users (MAX_USERS), emit room:error { message: 'Room is full' }
```

## Client Session State (App.jsx)

```js
// useState in App.jsx
sessionState  // 'join' | 'room'
roomId        // string
nickname      // string
myColor       // string (assigned by server on room:joined)
myId          // string (socket.id)
users         // Array<{ id, nickname, color }>
chatMessages  // Array<{ id, userId, nickname, text, timestamp }>
joinError     // string | null
```

## Canvas Compositing (CRITICAL)

```js
// Brush tool — draws normally
ctx.globalCompositeOperation = 'source-over'

// Eraser tool — cuts out pixels (NOT white paint)
ctx.globalCompositeOperation = 'destination-out'
// Note: stroke color is irrelevant for eraser; the alpha channel is what matters
```

## Drawing State (useDrawing hook)

```js
// Returns from useDrawing():
{
  canvasRef,          // attach to <canvas ref={canvasRef}>
  tool,               // 'brush' | 'eraser'
  color,              // hex string
  brushSize,          // number (px)
  setTool,
  setColor,
  setBrushSize,
  startStroke,        // (ctx, x, y) → begins local stroke
  moveStroke,         // (ctx, x, y) → continues local stroke
  endStroke,          // (ctx) → ends local stroke
  clearCanvas,        // (ctx) → clears entire canvas
  drawRemoteStart,    // (ctx, {userId,x,y,color,brushSize,tool}) → remote stroke start
  drawRemoteMove,     // (ctx, {userId,x,y}) → remote stroke continue
  drawRemoteEnd,      // (userId) → remote stroke end (cleanup)
}
```

## Sounds (Web Audio API)

```js
// sounds.js — no audio files, synthesized tones only
export function playJoin()    // short ascending tone
export function playLeave()   // short descending tone
export function playMessage() // brief click/pop

// All functions: wrap in try/catch or .catch(() => {})
// Browsers block audio until first user interaction — this is expected
```

## Vite Proxy Configuration (REQUIRED)

```js
// client/vite.config.js — WITHOUT this, Socket.IO fails with CORS errors
export default defineConfig({
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      }
    }
  }
})
```

## Quality Checks (before every commit)

```bash
# Server files
node --check server/index.js server/rooms.js

# Client (if vite installed)
cd client && npx vite build 2>&1 | head -30
```
