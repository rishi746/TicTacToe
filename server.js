const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let turn = "X";

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Assign player symbol
    if (players.length < 2) {
        const symbol = players.length === 0 ? "X" : "O";
        players.push({ id: socket.id, symbol });
        socket.emit("player-assigned", symbol);
    } else {
        socket.emit("room-full");
    }

    // Broadcast move
    socket.on("make-move", (data) => {
        turn = turn === "X" ? "O" : "X";
        socket.broadcast.emit("move-made", data);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        players = players.filter((p) => p.id !== socket.id);
        io.emit("player-left");
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
