import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";

const socket = io({
  transports: ["websocket"],
  upgrade: false,
});

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game objects
let players = {};
let me = null;
let collectible = null;

// --- RECEIVE INITIAL GAME STATE ---
socket.on("init", (data) => {
  // My player
  me = new Player(data.myId, data.players[data.myId].x, data.players[data.myId].y);

  // Other players
  for (const id in data.players) {
    const p = data.players[id];
    players[id] = new Player(id, p.x, p.y, p.score);
  }

  // Collectible
  collectible = new Collectible(data.collectible.x, data.collectible.y);

  gameLoop();
});

// --- NEW PLAYER JOINED ---
socket.on("playerJoined", (player) => {
  players[player.id] = new Player(player.id, player.x, player.y, player.score);
});

// --- PLAYER LEFT ---
socket.on("playerLeft", (id) => {
  delete players[id];
});

// --- RECEIVE UPDATED POSITIONS ---
socket.on("stateUpdate", (data) => {
  for (const id in data.players) {
    if (players[id]) {
      players[id].x = data.players[id].x;
      players[id].y = data.players[id].y;
      players[id].score = data.players[id].score;
    }
  }

  // Update collectible
  collectible.x = data.collectible.x;
  collectible.y = data.collectible.y;

  updateRanking();
});

// --- MOVEMENT CONTROLS ---
window.addEventListener("keydown", (e) => {
  if (!me) return;

  const speed = 5;

  if (e.key === "ArrowUp") me.y -= speed;
  if (e.key === "ArrowDown") me.y += speed;
  if (e.key === "ArrowLeft") me.x -= speed;
  if (e.key === "ArrowRight") me.x += speed;

  socket.emit("move", { x: me.x, y: me.y });
});

// --- DRAW LOOP ---
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw collectible
  collectible.draw(ctx);

  // Draw players
  for (const id in players) {
    players[id].draw(ctx, id === me.id);
  }

  requestAnimationFrame(gameLoop);
}

// --- UPDATE RANKING UI ---
function updateRanking() {
  const list = document.getElementById("ranking");
  list.innerHTML = "";

  const sorted = Object.values(players).sort((a, b) => b.score - a.score);

  sorted.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `Player ${p.id}: ${p.score}`;
    list.appendChild(li);
  });
}
