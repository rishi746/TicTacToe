const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {}; // { roomId: { players: [socket.id], turn: "X", playerNames: {socketId: name}, chatHistory: [] } }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (data) => {
    const { roomId, playerName, type } = data; // Added 'type' (create/join)
    console.log(`[Server] Join Room Request: Room ID: ${roomId}, Player Name: ${playerName}, Type: ${type}`);
    
    // --- Room Creation/Joining Logic ---
    if (type === 'create') {
      if (rooms[roomId]) {
        // Room already exists, cannot create
        console.log(`[Server] Room ${roomId} already exists. Emitting 'room-already-exists'.`);
        socket.emit("room-already-exists");
        return;
      }
      // Create new room
      rooms[roomId] = { 
        players: [], 
        turn: "X", 
        playerNames: {},
        chatHistory: []
      };
      console.log(`[Server] Room ${roomId} created successfully.`);
    } else if (type === 'join') {
      if (!rooms[roomId]) {
        // Room does not exist, cannot join
        console.log(`[Server] Room ${roomId} not found. Emitting 'room-not-found'.`);
        socket.emit("room-not-found");
        return;
      }
    }

    const room = rooms[roomId];

    if (room.players.length >= 2) {
      console.log(`[Server] Room ${roomId} is full. Emitting 'room-full'.`);
      socket.emit("room-full");
      return;
    }

    // Assign symbol: 'X' for the first player in the room, 'O' for the second
    const symbol = room.players.length === 0 ? "X" : "O";
    room.players.push(socket.id);
    room.playerNames[socket.id] = playerName || `Player ${symbol}`;
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.symbol = symbol;
    socket.playerName = room.playerNames[socket.id];

    console.log(`[Server] Player ${socket.playerName} (${socket.symbol}) joined room ${roomId}. Total players: ${room.players.length}`);

    socket.emit("player-assigned", { 
      symbol, 
      playerName: socket.playerName 
    });

    // Send chat history to new player
    socket.emit("chat-history", room.chatHistory);

    // Notify about player joining
    const joinMessage = {
      type: 'system',
      message: `${socket.playerName} joined the game`,
      timestamp: Date.now()
    };
    room.chatHistory.push(joinMessage);
    io.to(roomId).emit("chat-message", joinMessage);

    if (room.players.length === 2) {
      const readyMessage = {
        type: 'system',
        message: 'Both players ready! Game started.',
        timestamp: Date.now()
      };
      room.chatHistory.push(readyMessage);
      
      // Get opponent name for scoreboard
      const opponentId = room.players.find(id => id !== socket.id);
      const opponentName = room.playerNames[opponentId];
      
      // Send to both players with opponent info
      room.players.forEach(playerId => {
        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket) {
          const otherPlayerId = room.players.find(id => id !== playerId);
          const otherPlayerName = room.playerNames[otherPlayerId];
          playerSocket.emit("both-players-ready", { opponentName: otherPlayerName });
        }
      });
      
      io.to(roomId).emit("chat-message", readyMessage);
      console.log(`[Server] Room ${roomId} now has 2 players. Game starting.`);
    }

    // Handle game moves
    socket.on("make-move", (data) => {
      const room = rooms[socket.roomId];
      if (!room) {
        console.log(`[Server] Error: Room ${socket.roomId} not found for move.`);
        return;
      }
      room.turn = room.turn === "X" ? "O" : "X";
      console.log(`[Server] Move made in room ${socket.roomId} by ${data.symbol} at index ${data.index}. New turn: ${room.turn}`);
      socket.to(socket.roomId).emit("move-made", data);
    });

    // Handle chat messages
    socket.on("chat-message", (messageData) => {
      const room = rooms[socket.roomId];
      if (!room) {
        console.log(`[Server] Error: Room ${socket.roomId} not found for chat message.`);
        return;
      }

      // Basic message filtering
      const cleanMessage = messageData.message.replace(/[<>]/g, '').trim();
      if (!cleanMessage) {
        console.log(`[Server] Empty chat message from ${socket.playerName}.`);
        return;
      }

      const chatMessage = {
        type: 'player',
        message: cleanMessage,
        sender: socket.playerName,
        senderId: socket.id,
        timestamp: Date.now()
      };

      // Store in chat history
      room.chatHistory.push(chatMessage);
      
      // Keep only last 50 messages
      if (room.chatHistory.length > 50) {
        room.chatHistory = room.chatHistory.slice(-50);
      }
      console.log(`[Server] Chat message from ${socket.playerName} in room ${socket.roomId}: "${cleanMessage}"`);
      // Send to all players in room
      io.to(socket.roomId).emit("chat-message", chatMessage);
    });

    // Handle game reset
    socket.on("reset-game", () => {
      const roomId = socket.roomId;
      if (rooms[roomId]) {
        rooms[roomId].turn = "X";
        const resetMessage = {
          type: 'system',
          message: 'New game started!',
          timestamp: Date.now()
        };
        rooms[roomId].chatHistory.push(resetMessage);
        console.log(`[Server] Game reset in room ${roomId}.`);
        io.to(roomId).emit("reset-board");
        io.to(roomId).emit("chat-message", resetMessage);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const roomId = socket.roomId;
      
      if (roomId && rooms[roomId]) {
        const playerName = rooms[roomId].playerNames[socket.id];
        
        // Remove player from room
        rooms[roomId].players = rooms[roomId].players.filter((id) => id !== socket.id);
        delete rooms[roomId].playerNames[socket.id];
        
        // Notify other players
        const leaveMessage = {
          type: 'system',
          message: `${playerName} left the game`,
          timestamp: Date.now()
        };
        
        if (rooms[roomId].players.length > 0) {
          rooms[roomId].chatHistory.push(leaveMessage);
          socket.to(roomId).emit("player-left");
          socket.to(roomId).emit("chat-message", leaveMessage);
          console.log(`[Server] Player ${playerName} left room ${roomId}. Remaining players: ${rooms[roomId].players.length}`);
        }

        // Delete room if empty
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
          console.log(`[Server] Room ${roomId} deleted - no players remaining`);
        }
      }
    });
  });
});

// Cleanup empty rooms periodically
setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
      console.log(`[Server] Cleaned up empty room: ${roomId}`);
    }
  });
}, 300000); // Every 5 minutes

// Use process.env.PORT for deployment environments like Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("StrategiX - Premium Tic Tac Toe Server Started");
});
