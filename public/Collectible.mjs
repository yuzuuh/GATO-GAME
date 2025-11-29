export default class Collectible {
  constructor(x = 100, y = 100) {
    this.x = x;
    this.y = y;
  }

  draw(ctx) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}
