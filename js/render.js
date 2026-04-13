/**
 * WorldRenderer — maze background + pencil wall strokes only.
 * Entity sprites stay in their classes; this module keeps large static drawing isolated.
 */
class WorldRenderer {
  /**
   * Warm paper field + thin gray-green wall edges with subtle jitter (hand-drawn feel).
   * @param {CanvasRenderingContext2D} ctx
   * @param {Maze} maze
   */
  drawMaze(ctx, maze) {
    const CELL = maze.CELL;
    const bg = "#f8f7f3";
    const wall = "#6b7d6b";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, maze.width, maze.height);

    const jx = (gx, gy, k) =>
      ((((gx * 47 + gy * 13 + k * 11) % 9) - 4) * 0.28);
    const jy = (gx, gy, k) =>
      ((((gx * 23 + gy * 41 + k * 5) % 9) - 4) * 0.28);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = wall;

    for (let gy = 0; gy < maze.gr; gy++) {
      for (let gx = 0; gx < maze.gc; gx++) {
        if (maze.grid[gy][gx] !== 1) continue;
        const x = gx * CELL;
        const y = gy * CELL;
        const up = gy === 0 || maze.grid[gy - 1][gx] !== 1;
        const down = gy === maze.gr - 1 || maze.grid[gy + 1][gx] !== 1;
        const left = gx === 0 || maze.grid[gy][gx - 1] !== 1;
        const right = gx === maze.gc - 1 || maze.grid[gy][gx + 1] !== 1;

        const lw = 1.1 + ((gx + gy + gx * gy) % 5) * 0.18;
        ctx.lineWidth = lw;

        if (up) {
          ctx.beginPath();
          ctx.moveTo(x + jx(gx, gy, 0), y + jy(gx, gy, 0));
          ctx.lineTo(x + CELL + jx(gx, gy, 1), y + jy(gx, gy, 1));
          ctx.stroke();
        }
        if (down) {
          ctx.beginPath();
          ctx.moveTo(x + jx(gx, gy, 2), y + CELL + jy(gx, gy, 3));
          ctx.lineTo(x + CELL + jx(gx, gy, 4), y + CELL + jy(gx, gy, 5));
          ctx.stroke();
        }
        if (left) {
          ctx.beginPath();
          ctx.moveTo(x + jx(gx, gy, 6), y + jy(gx, gy, 7));
          ctx.lineTo(x + jx(gx, gy, 8), y + CELL + jy(gx, gy, 9));
          ctx.stroke();
        }
        if (right) {
          ctx.beginPath();
          ctx.moveTo(x + CELL + jx(gx, gy, 10), y + jy(gx, gy, 11));
          ctx.lineTo(x + CELL + jx(gx, gy, 12), y + CELL + jy(gx, gy, 13));
          ctx.stroke();
        }
      }
    }
  }
}

window.WorldRenderer = WorldRenderer;
