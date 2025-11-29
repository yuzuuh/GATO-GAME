"use strict";

const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

// CREA APP
const app = express();

// ------------ SECURITY MIDDLEWARE (FCC REQUIERE HELMET V3) ------------
const helmet = require("helmet");

app.use(helmet.noSniff());                          // Prevent MIME sniffing
app.use(helmet.xssFilter());                       // Prevent XSS
app.use(helmet.noCache());                         // No cache
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" })); // Fake PHP header

// ------------ STATIC FILES ------------
app.use("/public", express.static(path.join(__dirname, "public")));

// ------------ MAIN PAGE ------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// ------------ CREATE HTTP + SOCKET SERVER ------------
const server = http.createServer(app);
const io = socketIo(server);

// ---------------- SERVER-SIDE GAME OBJECTS ----------------
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

// GAME STATE
const players = {};
const collectible = new Collectible();

// ---------------- SOCKET LOGIC ----------------
io.on("connection", (socket) => {

  // Crear nuevo jugador
  players[socket.id] = new Player(socket.id);

  // Enviar info inicial
  socket.emit("init", {
    myId: socket.id,
    players,
    collectible
  });

  // Avisar al resto
  socket.broadcast.emit("playerJoined", players[socket.id]);

  // Movimiento
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

  // Desconexión
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });
});

// ------------ START SERVER ------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

module.exports = app; // Para FCC tests
