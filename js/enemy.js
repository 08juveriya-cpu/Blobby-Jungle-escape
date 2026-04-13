/**
 * Soft pastel "blob" enemy with smooth patrol / chase steering and wall sliding.
 * World position (x, y) is authoritative; rendering applies camera offset elsewhere.
 */
class Enemy {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.r = 15;
    this.vx = 0;
    this.vy = 0;
    this.bobT = Math.random() * Math.PI * 2;
    this.eyeT = Math.random() * Math.PI * 2;
    this.color = this._softPastel();
    this.chaseRange = 48 * 6;
    this._desiredVx = 0;
    this._desiredVy = 0;
    this._rethink = 0;
  }

  _softPastel() {
    const colors = [
      "hsl(160,42%,76%)",
      "hsl(270,38%,78%)",
      "hsl(25,48%,78%)",
      "hsl(230,36%,76%)"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt, playerX, playerY, maze) {
    this.bobT += dt * 1.9;
    this.eyeT += dt * 1.15;
    this._rethink -= dt;

    if (this._rethink <= 0) {
      this._rethink = 0.35 + Math.random() * 0.25;
      const dist = Math.hypot(playerX - this.x, playerY - this.y);
      if (dist < this.chaseRange && dist > 1) {
        const inv = 1 / dist;
        this._desiredVx = (playerX - this.x) * inv * this.speed;
        this._desiredVy = (playerY - this.y) * inv * this.speed;
      } else {
        const ang = Math.random() * Math.PI * 2;
        this._desiredVx = Math.cos(ang) * this.speed * 0.55;
        this._desiredVy = Math.sin(ang) * this.speed * 0.55;
      }
    }

    const follow = Math.min(1, 5.5 * dt);
    this.vx += (this._desiredVx - this.vx) * follow;
    this.vy += (this._desiredVy - this.vy) * follow;

    const nxp = this.x + this.vx * dt;
    const nyp = this.y + this.vy * dt;
    if (!maze.isWall(nxp, nyp, this.r)) {
      this.x = nxp;
      this.y = nyp;
    } else if (!maze.isWall(nxp, this.y, this.r)) {
      this.x = nxp;
      this.vy *= 0.3;
    } else if (!maze.isWall(this.x, nyp, this.r)) {
      this.y = nyp;
      this.vx *= 0.3;
    } else {
      this.vx *= -0.35;
      this.vy *= -0.35;
      this._rethink = 0;
    }

    this.x = Math.max(this.r, Math.min(maze.width - this.r, this.x));
    this.y = Math.max(this.r, Math.min(maze.height - this.r, this.y));
  }

  draw(ctx, camX, camY) {
    const breath = 1 + Math.sin(this.bobT * 1.4) * 0.02;
    const sx = this.x - camX;
    const sy = this.y - camY + Math.sin(this.bobT) * 1.2;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(breath, breath);
    ctx.translate(-sx, -sy);

    ctx.beginPath();
    ctx.ellipse(sx, sy + this.r * 0.8, this.r * 0.3, this.r * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(55,50,48,0.07)";
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const w = this.r * 0.06 * Math.sin(a * 3 + this.bobT * 0.6);
      const px = sx + (this.r * 0.95 + w) * Math.cos(a + 0.04);
      const py = sy + (this.r * 1.02 + w) * Math.sin(a + 0.04);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(75,70,82,0.45)";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    const eyeOff = Math.sin(this.eyeT) * 0.5;
    ctx.fillStyle = "rgba(48,44,52,0.88)";
    ctx.beginPath();
    ctx.arc(sx - 4, sy - 2 + eyeOff, 1.8, 0, Math.PI * 2);
    ctx.arc(sx + 4, sy - 2 + eyeOff, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy + 3.5, 3.2, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = "rgba(48,44,52,0.72)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  checkHit(
    playerX,
    playerY,
    playerR,
    activeEffects,
    particleSystem,
    audioManager,
    onHit
  ) {
    if (activeEffects.invincible > 0) return false;
    const d = Math.hypot(playerX - this.x, playerY - this.y);
    if (d < this.r + playerR - 4) {
      audioManager.sfxHit();
      particleSystem.spawnHit(playerX, playerY);
      onHit();
      return true;
    }
    return false;
  }
}

window.Enemy = Enemy;
