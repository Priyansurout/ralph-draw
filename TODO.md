# TODO.md — Task Definitions

### US-001
status: pending
depends_on: none
action: Create root package.json (type:module, scripts.dev with concurrently), server/package.json (type:module, deps: express socket.io nanoid), client/package.json (type:module, deps: react react-dom, devDeps: vite @vitejs/plugin-react socket.io-client tailwindcss postcss autoprefixer). Do NOT run npm install.
files: package.json, server/package.json, client/package.json
done_when: All three package.json files exist with correct type:module and dependency fields

### US-002
status: pending
depends_on: US-001
action: Create server/index.js (ES modules, Express app, Socket.IO attached to http server, GET /health → {ok:true}, listen on 3001) and server/rooms.js (exports createRoomManager() returning rooms Map with addUser/removeUser/getRoom/getRoomUsers helpers)
files: server/index.js, server/rooms.js
done_when: node server/index.js starts without error, GET http://localhost:3001/health returns {ok:true}

### US-003
status: pending
depends_on: US-002
action: Add room:join and disconnect handlers to server/index.js. room:join validates MAX_USERS=5, assigns color from palette, adds user to room via roomManager, emits room:joined to sender with {users,chatHistory}, broadcasts room:user_joined to room. disconnect removes user, broadcasts room:user_left. All in try/catch.
files: server/index.js
done_when: Two socket clients can join same room and each receives room:joined with correct user list

### US-004
status: pending
depends_on: US-003
action: Add draw event handlers to server/index.js: draw:stroke_start, draw:stroke_move, draw:stroke_end, draw:clear. Each broadcasts to room excluding sender via socket.to(roomId).emit(), adding userId to payload.
files: server/index.js
done_when: draw events received by one client are relayed to others in the room with userId attached

### US-005
status: pending
depends_on: US-004
action: Add chat:message handler to server/index.js. Validates text is non-empty string (max 500 chars). Creates {id:nanoid(), userId, nickname, text, timestamp:Date.now()}. Appends to chatHistory (trim to MAX_MESSAGES=200). Broadcasts to entire room. In try/catch.
files: server/index.js
done_when: chat:message broadcast to all users in room including sender; chatHistory never exceeds 200

### US-006
status: pending
depends_on: US-005
action: Add cursor:move handler to server/index.js. Looks up user's nickname and color from room state. Broadcasts cursor:move {userId,nickname,color,x,y} to all others in room. In try/catch.
files: server/index.js
done_when: cursor:move received from one client relayed to others with userId/nickname/color added

### US-007
status: pending
depends_on: US-001
action: Create client/ scaffold: client/index.html (root div, script for main.jsx), client/vite.config.js (React plugin + /socket.io proxy to localhost:3001 with ws:true), client/src/main.jsx (renders App into #root), client/src/App.jsx (placeholder function component returning <div>Loading</div>). Run npm install from client/.
files: client/index.html, client/vite.config.js, client/src/main.jsx, client/src/App.jsx
done_when: npm run dev from client/ starts Vite server without errors

### US-008
status: pending
depends_on: US-007
action: Add Tailwind CSS. Create client/tailwind.config.js (content: ./src/**/*.{jsx,js}), client/postcss.config.js (tailwindcss + autoprefixer). Create client/src/index.css with @tailwind base/components/utilities. Import index.css in main.jsx. Install tailwindcss postcss autoprefixer in client/.
files: client/tailwind.config.js, client/postcss.config.js, client/src/index.css, client/src/main.jsx
done_when: Tailwind utility classes render in browser (test with a bg-blue-500 class temporarily)

### US-009
status: pending
depends_on: US-008
action: Implement App.jsx with full session state: sessionState('join'|'room'), roomId, nickname, myColor, myId, users[], chatMessages[], joinError. Renders JoinScreen when 'join', Room when 'room'. Uses function declaration. Imports useSocket and Room/JoinScreen (stubs acceptable for now).
files: client/src/App.jsx
done_when: App.jsx compiles, renders JoinScreen by default, has all state fields

### US-010
status: pending
depends_on: US-009
action: Create client/src/components/JoinScreen.jsx. Props: onJoin(roomId, nickname), joinError. Centered form with roomId input, nickname input, Join button. Validates both non-empty before calling onJoin. Shows joinError in red. Tailwind styling. Function declaration.
files: client/src/components/JoinScreen.jsx
done_when: Form renders, submit calls onJoin with trimmed values, joinError displays in red

### US-011
status: pending
depends_on: US-009
action: Create client/src/hooks/useSocket.js. Named export function useSocket({roomId,nickname,onJoined,onUserJoined,onUserLeft,onDrawEvent,onChatMessage,onCursorMove,onError}). Connects socket only when roomId+nickname truthy. Registers all event listeners. Returns {socket,isConnected}. Disconnects on cleanup.
files: client/src/hooks/useSocket.js
done_when: Hook connects socket when args provided, cleans up on unmount, returns socket

### US-012
status: pending
depends_on: US-011, US-013
action: Wire App.jsx to real useSocket. Callbacks: onJoined sets sessionState='room', populates users/chatMessages/myColor/myId; onUserJoined appends to users; onUserLeft removes from users; onChatMessage appends to chatMessages (cap 200); onError sets joinError. Plays sounds in onJoined/onUserJoined/onUserLeft/onChatMessage.
files: client/src/App.jsx
done_when: Joining a room transitions to room state, users list updates, chat messages append

### US-013
status: pending
depends_on: US-007
action: Create client/src/utils/sounds.js. Named exports: playJoin(), playLeave(), playMessage(). Each uses Web Audio API (AudioContext, OscillatorNode, GainNode) for short synthesized tone. All wrapped in try/catch. No audio files, no imports.
files: client/src/utils/sounds.js
done_when: sounds.js exports 3 functions, no import errors, errors are swallowed silently

### US-014
status: pending
depends_on: US-009
action: Create client/src/hooks/useDrawing.js. Named export function useDrawing(). Returns {canvasRef, tool, color, brushSize, setTool, setColor, setBrushSize, startStroke, moveStroke, endStroke, clearCanvas, drawRemoteStart, drawRemoteMove, drawRemoteEnd}. Brush=source-over, Eraser=destination-out. Remote draw functions tracked by userId.
files: client/src/hooks/useDrawing.js
done_when: Hook returns all specified functions, brush/eraser compositing correct

### US-015
status: pending
depends_on: US-014
action: Create client/src/components/DrawingCanvas.jsx. Props: socket, drawingHook (result of useDrawing()). Canvas 1280x720. Mouse handlers: onMouseDown(startStroke+emit draw:stroke_start), onMouseMove(moveStroke+emit draw:stroke_move throttled 16ms; emit cursor:move throttled 50ms), onMouseUp(endStroke+emit draw:stroke_end). Listens to socket draw:* events → drawRemote* functions.
files: client/src/components/DrawingCanvas.jsx
done_when: Drawing on canvas emits events, remote events render on canvas

### US-016
status: pending
depends_on: US-014
action: Create client/src/components/Toolbar.jsx. Props: tool, color, brushSize, setTool, setColor, setBrushSize, onClear, socket. Color picker (type=color), brush size slider (2-40), Brush button, Eraser button (active state highlighted), Clear button (calls onClear + emits draw:clear). Tailwind only.
files: client/src/components/Toolbar.jsx
done_when: Color/size change drawing state, tool buttons toggle with active highlight, clear works

### US-017
status: pending
depends_on: US-011
action: Create client/src/components/ChatPanel.jsx. Props: socket, messages[], nickname, myColor. Scrollable message list (auto-scroll on new msg), text input + Send button. Each message shows nickname in user's color, text, timestamp. Send emits chat:message{text}, clears input. Enter key also sends. Max input 500 chars.
files: client/src/components/ChatPanel.jsx
done_when: Messages render with colors, auto-scroll works, send emits chat:message

### US-018
status: pending
depends_on: US-009
action: Create client/src/components/UserList.jsx. Props: users[], myId. Lists users with colored dot (inline style for dynamic color) and nickname. Marks current user with '(you)'. Shows count 'N / 5 users'. Tailwind styling.
files: client/src/components/UserList.jsx
done_when: All users listed with correct color dots, (you) label correct, count shown

### US-019
status: pending
depends_on: US-011
action: Create client/src/components/CursorOverlay.jsx. Props: socket, users[], myId. Tracks remote cursors in internal state Map {userId→{nickname,color,x,y,lastSeen}}. Listens to cursor:move events. Renders absolute positioned labels for remote users. pointer-events:none. Overlay is 1280x720. Cursors fade after 2000ms via setInterval cleanup.
files: client/src/components/CursorOverlay.jsx
done_when: Remote cursors show as positioned labels, disappear after 2000ms, overlay non-interactive

### US-020
status: pending
depends_on: US-015, US-016, US-017, US-018, US-019
action: Create client/src/components/Room.jsx. Props: socket, roomId, nickname, myColor, myId, users, chatMessages. Calls useDrawing() internally. Composes Toolbar+DrawingCanvas+CursorOverlay+UserList+ChatPanel. Tailwind flex layout. Function declaration.
files: client/src/components/Room.jsx
done_when: Room renders all components, drawing/chat/cursors all functional together

### US-021
status: pending
depends_on: US-020
action: Run npm install from root, server/, and client/. Fix any missing dependency or config errors discovered. Verify: node server/index.js starts, GET localhost:3001/health → {ok:true}, npm run dev starts both processes, browser at localhost:5173 renders JoinScreen without console errors.
files: package.json, server/package.json, client/package.json (fixups only)
done_when: All npm installs succeed, health endpoint works, JoinScreen renders in browser

### US-022
status: pending
depends_on: US-021
action: Open two browser tabs at localhost:5173. Tab 1: join 'testroom' as 'Alice'. Tab 2: join 'testroom' as 'Bob'. Verify both users in UserList, drawing syncs between tabs, chat messages appear on both, cursor labels show for remote user. Fix any wiring bugs found.
files: any files with wiring bugs
done_when: Two users can draw together, chat together, see each other's cursors in real time
