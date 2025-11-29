export default class Player {
  constructor(id, x = 50, y = 50, score = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.score = score;
  }

  draw(ctx, isMe = false) {
    ctx.fillStyle = isMe ? "blue" : "green";
    ctx.fillRect(this.x, this.y, 20, 20);

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(this.score, this.x + 3, this.y - 5);
  }
}
