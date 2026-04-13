class Maze {
  constructor(cols, rows) {
    this.cols = Math.max(1, Number.isFinite(cols) ? Math.floor(cols) : 1);
    this.rows = Math.max(1, Number.isFinite(rows) ? Math.floor(rows) : 1);
    this.gc = this.cols * 2 + 1;
    this.gr = this.rows * 2 + 1;
    this.grid = Array.from({ length: this.gr }, () => Array(this.gc).fill(1));
    this.CELL = 48;
    this.width = this.gc * this.CELL;
    this.height = this.gr * this.CELL;
  }

  generate() {
    this.gc = this.cols * 2 + 1;
    this.gr = this.rows * 2 + 1;
    this.grid = Array.from({ length: this.gr }, () => Array(this.gc).fill(1));
    this.width = this.gc * this.CELL;
    this.height = this.gr * this.CELL;

    const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ];

    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    };

    const carve = (cx, cy) => {
      visited[cy][cx] = true;
      this.grid[cy * 2 + 1][cx * 2 + 1] = 0;

      const dirs = shuffle(directions.slice());
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const inBounds = nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows;
        if (inBounds && !visited[ny][nx]) {
          this.grid[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = 0;
          carve(nx, ny);
        }
      }
    };

    carve(0, 0);
    return this;
  }

  cellCenter(cellX, cellY) {
    const mx = cellX * 2 + 1;
    const my = cellY * 2 + 1;
    const x = mx * this.CELL + this.CELL / 2;
    const y = my * this.CELL + this.CELL / 2;
    return { x, y };
  }

  isWall(pixelX, pixelY, radius) {
    const r = radius == null ? 0 : radius;
    if (r <= 0) {
      const gx = Math.floor(pixelX / this.CELL);
      const gy = Math.floor(pixelY / this.CELL);
      const outOfBounds = gx < 0 || gx >= this.gc || gy < 0 || gy >= this.gr;
      if (outOfBounds) return true;
      return this.grid[gy][gx] === 1;
    }
    const minGx = Math.floor((pixelX - r) / this.CELL);
    const maxGx = Math.floor((pixelX + r) / this.CELL);
    const minGy = Math.floor((pixelY - r) / this.CELL);
    const maxGy = Math.floor((pixelY + r) / this.CELL);
    const rr = r * r;
    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        if (gx < 0 || gx >= this.gc || gy < 0 || gy >= this.gr) return true;
        if (this.grid[gy][gx] !== 1) continue;
        const left = gx * this.CELL;
        const top = gy * this.CELL;
        const right = left + this.CELL;
        const bottom = top + this.CELL;
        const cx = Math.max(left, Math.min(pixelX, right));
        const cy = Math.max(top, Math.min(pixelY, bottom));
        const dx = pixelX - cx;
        const dy = pixelY - cy;
        if (dx * dx + dy * dy < rr) return true;
      }
    }
    return false;
  }

  getOpenCells(excludePositions = []) {
    const openCells = [];
    const minDistance = this.CELL * 4;

    for (let gy = 1; gy < this.gr; gy += 2) {
      for (let gx = 1; gx < this.gc; gx += 2) {
        if (this.grid[gy][gx] !== 0) continue;

        const x = gx * this.CELL + this.CELL / 2;
        const y = gy * this.CELL + this.CELL / 2;

        let excluded = false;
        for (const pos of excludePositions) {
          const dx = x - pos.x;
          const dy = y - pos.y;
          if (Math.hypot(dx, dy) < minDistance) {
            excluded = true;
            break;
          }
        }

        if (!excluded) {
          openCells.push({ x, y });
        }
      }
    }

    return openCells;
  }

  getFarthestCell(fromX, fromY) {
    const openCells = this.getOpenCells();
    let farthest = null;
    let maxDist = -1;

    for (const cell of openCells) {
      const dx = cell.x - fromX;
      const dy = cell.y - fromY;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) {
        maxDist = dist;
        farthest = cell;
      }
    }

    return farthest;
  }
}

window.Maze = Maze;
