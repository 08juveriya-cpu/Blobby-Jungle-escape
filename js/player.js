class Player {
  /**
   * @param {number} x
   * @param {number} y
   * @param {string | null} colorOverride - equipped skin color; if null, random pastel
   */
  constructor(x, y, colorOverride) {
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.vx = 0;
    this.vy = 0;
    this.r = 16;
    this.bobT = 0;
    this.eyeT = 0;
    this.color =
      typeof colorOverride === "string" && colorOverride.length > 0
        ? colorOverride
        : this._randomPastel();
    this.respawnTimer = 0;
    this._juicePop = 0;
    this._accel = 11;
  }

  _randomPastel() {
    const palette = [
      "hsl(158,48%,78%)",
      "hsl(268,42%,80%)",
      "hsl(22,52%,80%)"
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  addCollectJuice() {
    this._juicePop = 0.22;
  }

  update(dt, input, maze, activeEffects, tapTarget) {
    this.bobT += dt * 2.2;
    this.eyeT += dt * 1.1;
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
    }
    if (this._juicePop > 0) {
      this._juicePop = Math.max(0, this._juicePop - dt);
    }

    const maxSpd = activeEffects.speed > 0 ? 195 : 118;
    let tx = 0;
    let ty = 0;
    const hasInput = input && input.active;

    if (hasInput) {
      const dx = input.dx != null ? input.dx : 0;
      const dy = input.dy != null ? input.dy : 0;
      tx = dx * maxSpd;
      ty = dy * maxSpd;
    } else if (tapTarget) {
      const tdx = tapTarget.x - this.x;
      const tdy = tapTarget.y - this.y;
      const dist = Math.hypot(tdx, tdy);
      if (dist > 4) {
        tx = (tdx / dist) * maxSpd;
        ty = (tdy / dist) * maxSpd;
      } else {
        tapTarget.reached = true;
      }
    }

    const k = this._accel;
    const t = Math.min(1, k * dt);
    this.vx += (tx - this.vx) * t;
    this.vy += (ty - this.vy) * t;

    if (!hasInput && !tapTarget) {
      this.vx *= Math.pow(0.18, dt * 60);
      this.vy *= Math.pow(0.18, dt * 60);
      if (this.vx * this.vx + this.vy * this.vy < 4) {
        this.vx = 0;
        this.vy = 0;
      }
    }

    const nxp = this.x + this.vx * dt;
    const nyp = this.y + this.vy * dt;
    if (!maze.isWall(nxp, nyp, this.r)) {
      this.x = nxp;
      this.y = nyp;
    } else if (!maze.isWall(nxp, this.y, this.r)) {
      this.x = nxp;
      this.vy = 0;
    } else if (!maze.isWall(this.x, nyp, this.r)) {
      this.y = nyp;
      this.vx = 0;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    this.x = Math.max(this.r, Math.min(maze.width - this.r, this.x));
    this.y = Math.max(this.r, Math.min(maze.height - this.r, this.y));
  }

  draw(ctx, camX, camY, activeEffects) {
    const bob = Math.sin(this.bobT) * 2;
    const idleScale = 1 + Math.sin(this.bobT * 1.7) * 0.02;
    const breath = 0.99 + Math.sin(this.bobT * 1.25) * 0.015;
    const sx = this.x - camX;
    const sy = this.y - camY + bob;
    const spd = Math.hypot(this.vx, this.vy);
    const squash = Math.min(0.14, spd / 520);
    const juiceY =
      this._juicePop > 0
        ? -6 * Math.sin((this._juicePop / 0.22) * Math.PI)
        : 0;

    const isInvincible = activeEffects.invincible > 0;
    if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }

    const ang = spd > 8 ? Math.atan2(this.vy, this.vx) : 0;
    const sxScale = breath * idleScale * (1 + squash * 0.55);
    const syScale = breath * idleScale * (1 - squash * 0.42);

    ctx.save();
    ctx.translate(sx, sy + juiceY);
    ctx.rotate(ang);
    ctx.scale(sxScale, syScale);
    ctx.translate(-sx, -(sy + juiceY));

    ctx.beginPath();
    ctx.ellipse(
      sx,
      sy + juiceY + this.r * 0.85,
      this.r * 0.38,
      this.r * 0.11,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "rgba(55, 50, 45, 0.1)";
    ctx.fill();

    const wRx =
      1 + Math.sin(this.bobT * 0.95) * 0.045 + Math.sin(this.bobT * 1.4 + 0.5) * 0.02;
    const wRy =
      1 +
      Math.sin(this.bobT * 0.95 + 1.1) * 0.05 +
      Math.sin(this.bobT * 1.2) * 0.025;
    const blobRot = Math.sin(this.bobT * 0.55) * 0.07;

    ctx.beginPath();
    ctx.ellipse(
      sx,
      sy + juiceY,
      this.r * sxScale * wRx,
      this.r * syScale * wRy,
      blobRot,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(95, 100, 105, 0.32)";
    ctx.lineWidth = 1.35;
    ctx.stroke();

    const eyeOff = Math.sin(this.eyeT) * 0.65;
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(sx - 5, sy + juiceY - 2 + eyeOff, 2.4, 0, Math.PI * 2);
    ctx.arc(sx + 5, sy + juiceY - 2 + eyeOff, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(25, 25, 28, 0.8)";
    ctx.lineWidth = 1.25;
    ctx.lineCap = "round";
    ctx.arc(sx, sy + juiceY + 4, 4.2, 0.18, Math.PI - 0.18);
    ctx.stroke();

    if (isInvincible) {
      ctx.beginPath();
      ctx.arc(sx, sy + juiceY, this.r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,180,220,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  respawn(activeEffects) {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.respawnTimer = 1.0;
    activeEffects.invincible = 1.85;
  }
}

window.Player = Player;
