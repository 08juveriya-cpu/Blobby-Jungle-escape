class Pellet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 6;
    this.t = Math.random() * Math.PI * 2;
    this.collected = false;
    this._popT = 0;
  }

  update(dt) {
    if (this.collected) {
      if (this._popT > 0) {
        this._popT -= dt;
      }
      return;
    }
    this.t += dt * 2.2;
  }

  draw(ctx, camX, camY, camera) {
    if (this.collected && this._popT <= 0) return;
    const canvas = ctx.canvas;
    if (
      !this.collected &&
      !camera.isVisible(this.x, this.y, 20, canvas.width, canvas.height)
    ) {
      return;
    }

    const sx = this.x - camX;
    const sy = this.y - camY;
    const idle = 1 + 0.06 * Math.sin(this.t);
    let drawScale = idle;
    if (this.collected && this._popT > 0) {
      const u = 1 - this._popT / 0.22;
      drawScale = idle + 0.55 * Math.sin(u * Math.PI);
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(drawScale, drawScale);
    ctx.translate(-sx, -sy);

    ctx.shadowColor = "rgba(255, 190, 90, 0.45)";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(sx, sy, this.r, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(38,82%,74%)";
    ctx.fill();
    ctx.strokeStyle = "hsl(32,38%,52%)";
    ctx.lineWidth = 1.35;
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(sx, sy, this.r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(44,88%,80%)";
    ctx.fill();

    ctx.restore();
  }

  checkCollect(playerX, playerY, playerR, particleSystem, audioManager) {
    if (this.collected) return false;
    const d = Math.hypot(playerX - this.x, playerY - this.y);
    if (d < this.r + playerR) {
      this.collected = true;
      this._popT = 0.22;
      particleSystem.spawnCollect(this.x, this.y);
      if (typeof audioManager.hookCoinCollect === "function") {
        audioManager.hookCoinCollect();
      } else {
        audioManager.sfxCollect();
      }
      return true;
    }
    return false;
  }
}

window.Pellet = Pellet;
