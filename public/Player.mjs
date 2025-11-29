class Player {
  constructor(id, x = 50, y = 50, score = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.score = score;
    this.size = 20; // tamaño del jugador en el canvas
  }

  movePlayer(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  // Chequea colisión con un ítem
  collision(item) {
    const distX = this.x - item.x;
    const distY = this.y - item.y;
    const distance = Math.sqrt(distX * distX + distY * distY);

    return distance < this.size + item.size;
  }

  calculateRank(playersArray) {
    const sorted = [...playersArray].sort((a, b) => b.score - a.score);
    return sorted.findIndex(p => p.id === this.id) + 1;
  }
}

module.exports = Player;
export default Player;
