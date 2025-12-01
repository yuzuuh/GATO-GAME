"use strict";

const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

// --- MANUAL SECURITY HEADERS (set en todas las respuestas) ---
app.use((req, res, next) => {
  // 16. Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // 17. Prevent XSS (FCC exige exactamente: 0)
  res.setHeader("X-XSS-Protection", "0");

  // 18. Prevent client-side caching (no-store + compat)
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  // 19. Fake powered-by header
  res.setHeader("X-Powered-By", "PHP 7.4.3");

  next();
});

// Serve static files (after headers middleware)
app.use("/public", express.static(path.join(__dirname, "public")));

// Ensure root also sets header (redundant but defensive)
app.get("/", (req, res) => {
  // already set by middleware above, but keep explicit for safety
  res.setHeader("X-XSS-Protection", "0");
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// --- Minimal socket server so game keeps working ---
const server = http.createServer(app);
const io = socketIo(server);

// Simple server-side Player & Collectible (keeps parity with earlier)
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
    return Math.abs(player.x - this.x) < 20 && Math.abs(player.y - this.y) < 20;
  }
}

const players = {};
const collectible = new Collectible();

io.on("connection", (socket) => {
  players[socket.id] = new Player(socket.id);
  socket.emit("init", { myId: socket.id, players, collectible });
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
    io.emit("stateUpdate", { players, collectible });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));

module.exports = app; // FCC Tests
