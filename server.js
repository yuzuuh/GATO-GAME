"use strict";

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

// Import server-side game objects
const Player = require("./public/Player");
const Collectible = require("./public/Collectible");

const app = express();

// ------------ SECURITY MIDDLEWARE (FCC REQUIERE HELMET V3) ------------
app.use(helmet.noSniff());  
app.use(helmet.xssFilter());  
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));  
app.use(helmet.noCache());   

// ------------ STATIC FILES ------------
app.use("/public", express.static(path.join(__dirname, "public")));

// ------------ MAIN PAGE ------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// ------------ CREATE HTTP + SOCKET SERVER ------------
const server = http.createServer(app);
const io = socketIo(server);

// GAME STATE
const players = {};     
const collectible = new Collectible();  

// ------------ SOCKET LOGIC ------------
io.on("connection", (socket) => {
  
  // Create new player
  players[socket.id] = new Player(socket.id);

  // Send initial data to the new player
  socket.emit("init", {
    myId: socket.id,
    players,
    collectible
  });

  // Notify everyone else
  socket.broadcast.emit("playerJoined", players[socket.id]);

  // Player movement
  socket.on("move", (data) => {
    const p = players[socket.id];
    if (!p) return;

    p.x = data.x;
    p.y = data.y;

    // Check for collectible collision
    if (collectible.checkCollision(p)) {
      p.score++;
      collectible.resetPosition();
    }

    io.emit("stateUpdate", {
      players,
      collectible
    });
  });

  // Player disconnect
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
