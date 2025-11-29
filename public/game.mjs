const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const rankingEl = document.getElementById("ranking");

function draw() {
  if (!players[playerId]) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw players
  for (const id in players) {
    const p = players[id];
    ctx.fillStyle = id === playerId ? "yellow" : "white";
    ctx.fillRect(p.x, p.y, 20, 20);
  }

  // Draw coin
  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
  ctx.fill();

  drawRanking();
  requestAnimationFrame(draw);
}

function drawRanking() {
  const sorted = Object.entries(players).sort((a, b) => b[1].score - a[1].score);
  rankingEl.innerHTML = sorted
    .map(([id, p]) => `<li>${p.score} pts${id === playerId ? " (you)" : ""}</li>`)
    .join("");
}

// Movement keys
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "arrowup" || key === "w") socket.emit("move", "up");
  if (key === "arrowdown" || key === "s") socket.emit("move", "down");
  if (key === "arrowleft" || key === "a") socket.emit("move", "left");
  if (key === "arrowright" || key === "d") socket.emit("move", "right");

  // Coin collision
  const me = players[playerId];
  if (me) {
    const dx = me.x - coin.x;
    const dy = me.y - coin.y;
    if (dx * dx + dy * dy < 20 * 20) {
      socket.emit("collect");
    }
  }
});

draw();
