export function createRoomManager() {
  const rooms = new Map()
  const socketToRoom = new Map()

  function addUser(roomId, socketId, nickname, color) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Map(), chatHistory: [] })
    }
    const room = rooms.get(roomId)
    room.users.set(socketId, { id: socketId, nickname, color })
    socketToRoom.set(socketId, roomId)
  }

  function removeUser(socketId) {
    const roomId = socketToRoom.get(socketId)
    socketToRoom.delete(socketId)
    if (!roomId) return
    const room = rooms.get(roomId)
    if (!room) return
    room.users.delete(socketId)
    if (room.users.size === 0) {
      rooms.delete(roomId)
    }
  }

  function getRoom(roomId) {
    return rooms.get(roomId) ?? null
  }

  function getRoomForSocket(socketId) {
    return socketToRoom.get(socketId) ?? null
  }

  function getUsersArray(roomId) {
    const room = rooms.get(roomId)
    if (!room) return []
    return Array.from(room.users.values())
  }

  return { addUser, removeUser, getRoom, getRoomForSocket, getUsersArray }
}
