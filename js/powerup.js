class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.r = 10;
    this.t = 0;
    this.collected = false;
  }

  update(dt) {
    if (this.collected) return;
    this.t += dt * 2.2;
  }

  draw(ctx, camX, camY) {
    if (this.collected) return;
    const sx = this.x - camX;
    const sy = this.y - camY;
    const pulse = 0.96 + 0.04 * Math.sin(this.t);
    const fill =
      this.type === "speed" ? "hsl(48,76%,78%)" : "hsl(192,48%,78%)";
    const stroke =
      this.type === "speed" ? "hsl(38,35%,52%)" : "hsl(192,30%,48%)";
    const label = this.type === "speed" ? "S" : "I";

    ctx.beginPath();
    ctx.arc(sx, sy, this.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `italic ${Math.round(11 * pulse)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(55,52,48,0.75)";
    ctx.fillText(label, sx, sy + 0.5);
  }

  checkCollect(playerX, playerY, playerR, audioManager) {
    if (this.collected) return null;
    const d = Math.hypot(playerX - this.x, playerY - this.y);
    if (d < this.r + playerR) {
      this.collected = true;
      if (typeof audioManager.hookPowerupPulse === "function") {
        audioManager.hookPowerupPulse();
      } else {
        audioManager.sfxPowerup();
      }
      return this.type;
    }
    return null;
  }
}

window.PowerUp = PowerUp;
