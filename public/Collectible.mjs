class Collectible {
  constructor(x = 300, y = 200) {
    this.x = x;
    this.y = y;
    this.size = 10; // para colisión
  }

  // Se llama cuando un jugador lo recoge
  resetPosition() {
    this.x = Math.floor(Math.random() * 580) + 10;
    this.y = Math.floor(Math.random() * 380) + 10;
  }

  // Ver si un jugador lo tocó
  checkCollision(player) {
    const distX = this.x - player.x;
    const distY = this.y - player.y;
    const distance = Math.sqrt(distX * distX + distY * distY);

    return distance < player.size + this.size;
  }
}

module.exports = Collectible;
export default Collectible;
