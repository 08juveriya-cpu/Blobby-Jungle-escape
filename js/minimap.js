class Minimap {
  constructor() {
    this.canvas = document.getElementById("minimapCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.size = 90;
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.updateInterval = 0;
    this.updateEvery = 0.2;
  }

  update(dt, maze, playerX, playerY, mazeWidth, mazeHeight, portal, portalOpen) {
    this.updateInterval -= dt;
    if (this.updateInterval > 0) return;
    this.updateInterval = this.updateEvery;
    this.draw(maze, playerX, playerY, mazeWidth, mazeHeight, portal, portalOpen);
  }

  draw(maze, playerX, playerY, mazeWidth, mazeHeight, portal, portalOpen) {
    const MM = this.size;
    const ctx = this.ctx;
    const cw = MM / maze.gc;
    const ch = MM / maze.gr;

    ctx.clearRect(0, 0, MM, MM);
    ctx.fillStyle = "rgba(235,228,216,0.92)";
    ctx.fillRect(0, 0, MM, MM);

    for (let gy = 0; gy < maze.gr; gy++) {
      for (let gx = 0; gx < maze.gc; gx++) {
        if (maze.grid[gy][gx] === 0) {
          ctx.fillStyle = "rgba(210,225,198,0.55)";
        } else if (maze.grid[gy][gx] === 1) {
          ctx.fillStyle = "rgba(120,140,118,0.35)";
        } else {
          continue;
        }
        ctx.fillRect(gx * cw, gy * ch, cw, ch);
      }
    }

    if (portalOpen && portal) {
      const mmPX = (portal.x / mazeWidth) * MM;
      const mmPY = (portal.y / mazeHeight) * MM;
      ctx.beginPath();
      ctx.arc(mmPX, mmPY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(188,55%,58%)";
      ctx.fill();
    }

    const mmX = (playerX / mazeWidth) * MM;
    const mmY = (playerY / mazeHeight) * MM;
    ctx.beginPath();
    ctx.arc(mmX, mmY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(44,82%,68%)";
    ctx.fill();
    ctx.strokeStyle = "rgba(90,82,70,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

window.Minimap = Minimap;
