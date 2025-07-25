const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {}; // { roomId: { players: [socket.id], turn: "X", playerNames: {socketId: name}, chatHistory: [], tournament: null } }
let tournaments = {}; // { tournamentId: { type: 'bo3'|'bo5'|'bo7', players: [], bracket: [], currentRound: 0, status: 'waiting'|'active'|'completed' } }
let seasonalLeaderboard = []; // { playerName: string, wins: number, losses: number, tournaments: number, rating: number }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Tournament creation
  socket.on("create-tournament", (data) => {
    const { tournamentId, type, playerName } = data; // type: 'bo3', 'bo5', 'bo7'
    
    if (tournaments[tournamentId]) {
      socket.emit("tournament-error", { message: "Tournament already exists" });
      return;
    }

    tournaments[tournamentId] = {
      type,
      players: [{ id: socket.id, name: playerName, wins: 0, losses: 0 }],
      bracket: [],
      currentRound: 0,
      status: 'waiting',
      createdAt: Date.now()
    };

    socket.join(tournamentId);
    socket.tournamentId = tournamentId;
    socket.emit("tournament-created", { tournamentId, type });
    console.log(`[Tournament] Created ${type} tournament: ${tournamentId}`);
  });

  // Join tournament
  socket.on("join-tournament", (data) => {
    const { tournamentId, playerName } = data;
    
    if (!tournaments[tournamentId]) {
      socket.emit("tournament-error", { message: "Tournament not found" });
      return;
    }

    const tournament = tournaments[tournamentId];
    
    if (tournament.status !== 'waiting') {
      socket.emit("tournament-error", { message: "Tournament already started" });
      return;
    }

    // Check max players (8 for bracket system)
    if (tournament.players.length >= 8) {
      socket.emit("tournament-error", { message: "Tournament is full" });
      return;
    }

    tournament.players.push({ 
      id: socket.id, 
      name: playerName, 
      wins: 0, 
      losses: 0 
    });

    socket.join(tournamentId);
    socket.tournamentId = tournamentId;
    
    io.to(tournamentId).emit("tournament-updated", {
      players: tournament.players,
      status: tournament.status,
      type: tournament.type
    });

    console.log(`[Tournament] Player ${playerName} joined tournament ${tournamentId}`);
  });

  // Start tournament
  socket.on("start-tournament", (data) => {
    const { tournamentId } = data;
    const tournament = tournaments[tournamentId];
    
    if (!tournament || tournament.players.length < 2) {
      socket.emit("tournament-error", { message: "Need at least 2 players to start" });
      return;
    }

    tournament.status = 'active';
    tournament.bracket = generateBracket(tournament.players);
    tournament.currentRound = 1;

    io.to(tournamentId).emit("tournament-started", {
      bracket: tournament.bracket,
      currentRound: tournament.currentRound,
      type: tournament.type
    });

    // Start first round matches
    startRoundMatches(tournamentId);
    console.log(`[Tournament] Started tournament ${tournamentId} with ${tournament.players.length} players`);
  });

  // Tournament match result
  socket.on("tournament-match-result", (data) => {
    const { tournamentId, matchId, winnerId, score } = data;
    const tournament = tournaments[tournamentId];
    
    if (!tournament) return;

    // Update match result in bracket
    updateBracketResult(tournament, matchId, winnerId, score);
    
    // Check if round is complete
    if (isRoundComplete(tournament)) {
      if (tournament.bracket.some(match => !match.winner && match.round === tournament.currentRound + 1)) {
        // Move to next round
        tournament.currentRound++;
        io.to(tournamentId).emit("tournament-round-complete", {
          currentRound: tournament.currentRound,
          bracket: tournament.bracket
        });
        startRoundMatches(tournamentId);
      } else {
        // Tournament complete
        tournament.status = 'completed';
        const winner = getTransparentWinner(tournament);
        updateSeasonalLeaderboard(tournament);
        
        io.to(tournamentId).emit("tournament-complete", {
          winner,
          finalBracket: tournament.bracket,
          leaderboard: getTopLeaderboard(10)
        });
        
        console.log(`[Tournament] Tournament ${tournamentId} completed. Winner: ${winner.name}`);
      }
    }
  });

  // Get leaderboard
  socket.on("get-leaderboard", () => {
    socket.emit("leaderboard-data", getTopLeaderboard(20));
  });

  socket.on("join-room", (data) => {
    const { roomId, playerName, type, tournamentId, matchId } = data;
    console.log(`[Server] Join Room Request: Room ID: ${roomId}, Player Name: ${playerName}, Type: ${type}`);
    
    if (type === 'create') {
      if (rooms[roomId]) {
        socket.emit("room-already-exists");
        return;
      }
      rooms[roomId] = { 
        players: [], 
        turn: "X", 
        playerNames: {},
        chatHistory: [],
        tournament: tournamentId ? { tournamentId, matchId } : null
      };
    } else if (type === 'join') {
      if (!rooms[roomId]) {
        socket.emit("room-not-found");
        return;
      }
    }

    const room = rooms[roomId];

    if (room.players.length >= 2) {
      socket.emit("room-full");
      return;
    }

    const symbol = room.players.length === 0 ? "X" : "O";
    room.players.push(socket.id);
    room.playerNames[socket.id] = playerName || `Player ${symbol}`;
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.symbol = symbol;
    socket.playerName = room.playerNames[socket.id];

    socket.emit("player-assigned", { 
      symbol, 
      playerName: socket.playerName,
      isTournamentMatch: !!room.tournament
    });

    socket.emit("chat-history", room.chatHistory);

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
      
      const opponentId = room.players.find(id => id !== socket.id);
      const opponentName = room.playerNames[opponentId];
      
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

    // Handle game end for tournament matches
    socket.on("game-ended", (data) => {
      const { winner, isDraw } = data;
      const room = rooms[socket.roomId];
      
      if (room && room.tournament) {
        // This is a tournament match
        const tournament = tournaments[room.tournament.tournamentId];
        if (tournament) {
          // Update match score logic here
          // This would need to track best-of-X series
          console.log(`[Tournament] Game ended in match ${room.tournament.matchId}`);
        }
      }
    });

    // Handle chat messages
    socket.on("chat-message", (messageData) => {
      const room = rooms[socket.roomId];
      if (!room) return;

      const cleanMessage = messageData.message.replace(/[<>]/g, '').trim();
      if (!cleanMessage) return;

      const chatMessage = {
        type: 'player',
        message: cleanMessage,
        sender: socket.playerName,
        senderId: socket.id,
        timestamp: Date.now()
      };

      room.chatHistory.push(chatMessage);
      if (room.chatHistory.length > 50) {
        room.chatHistory = room.chatHistory.slice(-50);
      }
      
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
      const tournamentId = socket.tournamentId;
      
      if (roomId && rooms[roomId]) {
        const playerName = rooms[roomId].playerNames[socket.id];
        
        rooms[roomId].players = rooms[roomId].players.filter((id) => id !== socket.id);
        delete rooms[roomId].playerNames[socket.id];
        
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

        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
        }
      }

      // Handle tournament disconnection
      if (tournamentId && tournaments[tournamentId]) {
        const tournament = tournaments[tournamentId];
        tournament.players = tournament.players.filter(p => p.id !== socket.id);
        
        if (tournament.players.length === 0) {
          delete tournaments[tournamentId];
          console.log(`[Tournament] Deleted empty tournament: ${tournamentId}`);
        } else {
          io.to(tournamentId).emit("tournament-updated", {
            players: tournament.players,
            status: tournament.status,
            type: tournament.type
          });
        }
      }
    });
  });
});

// Tournament helper functions
function generateBracket(players) {
  const bracket = [];
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  
  // Create first round matches
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    if (i + 1 < shuffledPlayers.length) {
      bracket.push({
        id: `match_${bracket.length}`,
        round: 1,
        player1: shuffledPlayers[i],
        player2: shuffledPlayers[i + 1],
        winner: null,
        score: { player1: 0, player2: 0 }
      });
    }
  }
  
  // Generate subsequent rounds
  let currentRoundMatches = bracket.filter(m => m.round === 1);
  let round = 2;
  
  while (currentRoundMatches.length > 1) {
    const nextRoundMatches = [];
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      if (i + 1 < currentRoundMatches.length) {
        nextRoundMatches.push({
          id: `match_${bracket.length}`,
          round,
          player1: null, // Will be filled when previous matches complete
          player2: null,
          winner: null,
          score: { player1: 0, player2: 0 },
          dependsOn: [currentRoundMatches[i].id, currentRoundMatches[i + 1].id]
        });
        bracket.push(nextRoundMatches[nextRoundMatches.length - 1]);
      }
    }
    currentRoundMatches = nextRoundMatches;
    round++;
  }
  
  return bracket;
}

function startRoundMatches(tournamentId) {
  const tournament = tournaments[tournamentId];
  const currentRoundMatches = tournament.bracket.filter(
    match => match.round === tournament.currentRound && !match.winner
  );

  currentRoundMatches.forEach(match => {
    if (match.player1 && match.player2) {
      // Create room for this match
      const roomId = `tournament_${tournamentId}_${match.id}`;
      
      // Notify players about their match
      const player1Socket = io.sockets.sockets.get(match.player1.id);
      const player2Socket = io.sockets.sockets.get(match.player2.id);
      
      if (player1Socket && player2Socket) {
        [player1Socket, player2Socket].forEach(socket => {
          socket.emit("tournament-match-ready", {
            roomId,
            matchId: match.id,
            opponent: socket.id === match.player1.id ? match.player2 : match.player1,
            tournamentType: tournament.type
          });
        });
      }
    }
  });
}

function updateBracketResult(tournament, matchId, winnerId, score) {
  const match = tournament.bracket.find(m => m.id === matchId);
  if (!match) return;

  match.winner = winnerId;
  match.score = score;

  // Update dependent matches
  tournament.bracket.forEach(nextMatch => {
    if (nextMatch.dependsOn && nextMatch.dependsOn.includes(matchId)) {
      if (!nextMatch.player1) {
        nextMatch.player1 = match.winner;
      } else if (!nextMatch.player2) {
        nextMatch.player2 = match.winner;
      }
    }
  });
}

function isRoundComplete(tournament) {
  const currentRoundMatches = tournament.bracket.filter(
    match => match.round === tournament.currentRound
  );
  return currentRoundMatches.every(match => match.winner);
}

function getTransparentWinner(tournament) {
  const finalMatch = tournament.bracket.find(
    match => match.round === Math.max(...tournament.bracket.map(m => m.round))
  );
  return finalMatch ? finalMatch.winner : null;
}

function updateSeasonalLeaderboard(tournament) {
  tournament.players.forEach(player => {
    let leaderboardEntry = seasonalLeaderboard.find(entry => entry.playerName === player.name);
    
    if (!leaderboardEntry) {
      leaderboardEntry = {
        playerName: player.name,
        wins: 0,
        losses: 0,
        tournaments: 0,
        rating: 1000
      };
      seasonalLeaderboard.push(leaderboardEntry);
    }
    
    leaderboardEntry.wins += player.wins;
    leaderboardEntry.losses += player.losses;
    leaderboardEntry.tournaments += 1;
    
    // Simple ELO-like rating system
    const winRate = leaderboardEntry.wins / (leaderboardEntry.wins + leaderboardEntry.losses);
    leaderboardEntry.rating = Math.round(1000 + (winRate - 0.5) * 1000 + leaderboardEntry.tournaments * 10);
  });
  
  // Sort by rating
  seasonalLeaderboard.sort((a, b) => b.rating - a.rating);
}

function getTopLeaderboard(limit = 10) {
  return seasonalLeaderboard.slice(0, limit);
}

// Cleanup
setInterval(() => {
  // Clean up empty rooms
  Object.keys(rooms).forEach(roomId => {
    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
    }
  });
  
  // Clean up old tournaments
  Object.keys(tournaments).forEach(tournamentId => {
    const tournament = tournaments[tournamentId];
    if (tournament.players.length === 0 || 
        (tournament.status === 'completed' && Date.now() - tournament.createdAt > 3600000)) {
      delete tournaments[tournamentId];
    }
  });
}, 300000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("StrategiX - Premium Tic Tac Toe Server with Tournaments Started");
});