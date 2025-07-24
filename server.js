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
    
    // --- Room Creation/Joining Logic ---
    if (type === 'create') {
      if (rooms[roomId]) {
        // Room already exists, cannot create
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
    } else if (type === 'join') {
      if (!rooms[roomId]) {
        // Room does not exist, cannot join
        socket.emit("room-not-found");
        return;
      }
    }

    const room = rooms[roomId];

    if (room.players.length >= 2) {
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
    }

    // Handle game moves
    socket.on("make-move", (data) => {
      const room = rooms[socket.roomId];
      if (!room) return;
      room.turn = room.turn === "X" ? "O" : "X";
      socket.to(socket.roomId).emit("move-made", data);
    });

    // Handle chat messages
    socket.on("chat-message", (messageData) => {
      const room = rooms[socket.roomId];
      if (!room) return;

      // Basic message filtering
      const cleanMessage = messageData.message.replace(/[<>]/g, '').trim();
      if (!cleanMessage) return;

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
        }

        // Delete room if empty
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted - no players remaining`);
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
      console.log(`Cleaned up empty room: ${roomId}`);
    }
  });
}, 300000); // Every 5 minutes

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
  console.log("StrategiX - Premium Tic Tac Toe Server Started");
});
