class Particle {
  constructor(x, y, vx, vy, color, life, r = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.r = r;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 60 * dt;
    this.life -= dt;
  }

  draw(ctx, camX, camY) {
    const a = Math.max(0, this.life / this.maxLife);
    const sx = this.x - camX;
    const sy = this.y - camY;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(sx, sy, this.r * a, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnCollect(x, y) {
    const colors = ["#ffcc00", "#ff8800", "#fff176", "#ffe082"];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 50;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const life = 0.5 + Math.random() * 0.4;
      const r = 2 + Math.random() * 3;
      this.particles.push(new Particle(x, y, vx, vy, color, life, r));
    }
    for (let j = 0; j < 10; j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 45;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 35;
      const life = 0.35 + Math.random() * 0.35;
      const r = 1 + Math.random() * 1.2;
      this.particles.push(
        new Particle(x, y, vx, vy, "rgba(255,200,120,0.9)", life, r)
      );
    }
  }

  /** Tiny burst when an enemy passes very close (near-miss juice). */
  spawnNearMiss(x, y) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 18 + Math.random() * 38;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 25;
      const life = 0.22 + Math.random() * 0.2;
      const r = 0.9 + Math.random() * 1.3;
      const c =
        Math.random() > 0.45
          ? "rgba(255, 170, 160, 0.85)"
          : "rgba(255, 255, 255, 0.75)";
      this.particles.push(new Particle(x, y, vx, vy, c, life, r));
    }
  }

  spawnHit(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 80;
      const color = `hsl(${Math.random() * 30 + 340}, 80%, 60%)`;
      const life = 0.6 + Math.random() * 0.5;
      const r = 3 + Math.random() * 4;
      this.particles.push(new Particle(x, y, vx, vy, color, life, r));
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.update(dt);
    }
    this.particles = this.particles.filter((p) => !p.isDead());
  }

  draw(ctx, camX, camY) {
    for (const p of this.particles) {
      p.draw(ctx, camX, camY);
    }
  }

  clear() {
    this.particles = [];
  }
}

window.Particle = Particle;
window.ParticleSystem = ParticleSystem;
