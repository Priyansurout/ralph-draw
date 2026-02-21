import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createRoomManager } from './rooms.js'

const SERVER_PORT = 3001

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

const roomManager = createRoomManager()

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

io.on('connection', (socket) => {
})

httpServer.listen(SERVER_PORT, () => {
  console.log('[server] listening on :3001')
})
