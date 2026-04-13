class Portal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 22;
    this.t = 0;
    this.isOpen = false;
  }

  update(dt) {
    if (!this.isOpen) return;
    this.t += dt;
  }

  draw(ctx, camX, camY) {
    if (!this.isOpen) return;
    const sx = this.x - camX;
    const sy = this.y - camY;

    for (let i = 0; i < 3; i++) {
      const baseR = this.r + i * 8;
      const radius = baseR * (0.9 + 0.1 * Math.sin(this.t + i));
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
      grad.addColorStop(0, "rgba(100,255,180,0.7)");
      grad.addColorStop(0.5, "rgba(50,200,255,0.3)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.t * 2);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `hsla(${160 + i * 15}, 80%, 60%, 0.8)`;
      ctx.beginPath();
      ctx.ellipse(0, -this.r * 0.7, 1.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.font = "bold 13px Georgia";
    ctx.fillStyle = "#00e5ff";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", sx, sy + this.r + 18);
  }

  checkEnter(playerX, playerY, playerR) {
    if (!this.isOpen) return false;
    const d = Math.hypot(playerX - this.x, playerY - this.y);
    return d < this.r + playerR - 8;
  }

  open() {
    this.isOpen = true;
  }
}

window.Portal = Portal;
