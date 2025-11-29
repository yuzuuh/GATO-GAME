"use strict";

const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const helmet = require("helmet");

// *************************
// SECURITY (FCC REQUIERE EXACTO ESTO)
// *************************

// Prevent MIME type sniffing
app.use(helmet.noSniff());

// Prevent XSS attacks
app.use(helmet.xssFilter());

// Disable client-side caching
app.use(helmet.noCache());

// Fake the X-Powered-By header
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));

// *************************
// STATIC FILES
// *************************
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// *************************
// GAME SERVER
// *************************

const server = http.createServer(app);
const io = socketIo(server);

class Player {
  constructor(id) {
    this.id = id;
    this.x = 50;
    this.y = 50;
    this.score = 0;
  }
}

class Collectible {
  constructor() {
    this.resetPosition();
  }

  resetPosition() {
    this.x = Math.floor(Math.random() * 550);
    this.y = Math.floor(Math.random() * 350);
    this.value = 1;
  }

  checkCollision(player) {
    return (
      Math.abs(player.x - this.x) < 20 &&
      Math.abs(player.y - this.y) < 20
    );
  }
}

const players = {};
const collectible = new Collectible();

io.on("connection", (socket) => {
  players[socket.id] = new Player(socket.id);

  socket.emit("init", {
    myId: socket.id,
    players,
    collectible
  });

  socket.broadcast.emit("playerJoined", players[socket.id]);

  socket.on("move", (data) => {
    const p = players[socket.id];
    if (!p) return;

    p.x = data.x;
    p.y = data.y;

    if (collectible.checkCollision(p)) {
      p.score++;
      collectible.resetPosition();
    }

    io.emit("stateUpdate", {
      players,
      collectible
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

module.exports = app;
