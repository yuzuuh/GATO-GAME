"use strict";

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

// ------------ SECURITY MIDDLEWARE (FCC REQUIERE HELMET V3) ------------

// 16. Prevent MIME sniffing
app.use(helmet.noSniff());

// 18. Prevent client-side caching
app.use(helmet.noCache());

// 19. Fake PHP header
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));

// ⚠️ Importante: NO usar helmet.xssFilter() porque Cloudflare lo pisotea
// → En la ruta "/" vamos a poner X-XSS-Protection: 0 manualmente.


// ------------ STATIC FILES ------------
app.use("/public", express.static(path.join(__dirname, "public")));

// ------------ MAIN PAGE (FIX PARA FCC) ------------
// Evita que Cloudflare sobreescriba este header
app.get("/", (req, res) => {
  // 17. Prevent XSS (FCC exige exactamente: X-XSS-Protection: 0)
  res.setHeader("X-XSS-Protection", "0");

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

// ------------ START SERVER ------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

module.exports = app; // FCC Tests

