class GameManager {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.state = "start";
    this.paused = false;
    this.difficulty = "medium";
    this.lives = 3;
    this.score = 0;
    this.level = 1;
    this.pelletsLeft = 0;
    this.pelletsTotal = 0;
    this.tapTarget = null;
    this.activeEffects = { speed: 0, invincible: 0 };
    this.animFrame = null;
    this.lastTime = 0;

    this.audio = new AudioManager();
    this.camera = new Camera();
    this.particles = new ParticleSystem();
    this.joystick = new Joystick();
    this.hud = new HUD();
    this.minimap = new Minimap();
    this.aiService = new AIService();
    this.renderer = new WorldRenderer();
    this.input = new GameInput(this);

    this.maze = null;
    this.player = null;
    this.enemies = [];
    this.pellets = [];
    this.powerups = [];
    this.portal = null;

    this._boundLoop = this._loop.bind(this);

    this._preventScroll = (e) => {
      if (this.state === "playing") {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", this._preventScroll, {
      passive: false
    });
    window.addEventListener("wheel", this._preventScroll, { passive: false });

    this.canvas.addEventListener(
      "touchstart",
      (e) => {
        if (this.state !== "playing") return;
        const t = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        const H = rect.height;
        if (x < 160 && y > H - 160) return;
        const w = this.camera.screenToWorld(x, y);
        this.tapTarget = { x: w.x, y: w.y, reached: false };
        e.preventDefault();
      },
      { passive: false }
    );
  }

  togglePause() {
    if (this.state !== "playing") return;
    this.paused = !this.paused;
  }

  selectDifficulty(d) {
    this.difficulty = d;
  }

  _resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  startGame() {
    const sl = localStorage.getItem("bje_level");
    const ss = localStorage.getItem("bje_score");
    if (sl !== null && sl !== "") {
      const lv = parseInt(sl, 10);
      if (!isNaN(lv) && lv >= 1) this.level = lv;
    }
    if (ss !== null && ss !== "") {
      const sc = parseInt(ss, 10);
      if (!isNaN(sc) && sc >= 0) this.score = sc;
    }

    this.lives = 3;
    this._resizeCanvas();
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.lastTime = 0;
    this.paused = false;
    this.input.clearKeys();

    this.hud.show();
    this.joystick.show();
    this._setupLevel();
    this.state = "playing";
    this._loop(0);
  }

  _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  _setupLevel() {
    const configs = {
      easy: { cols: 13, rows: 11, enemies: 2, speed: 40 },
      medium: { cols: 17, rows: 13, enemies: 4, speed: 65 },
      hard: { cols: 23, rows: 17, enemies: 7, speed: 90 }
    };
    const cfg = configs[this.difficulty] || configs.medium;
    const COLS = Math.min(35, cfg.cols + (this.level - 1) * 2);
    const ROWS = Math.min(29, cfg.rows + (this.level - 1) * 2);

    this.maze = new Maze(COLS, ROWS).generate();
    const spawn = this.maze.cellCenter(0, 0);
    this.player = new Player(spawn.x, spawn.y);

    this.pellets = [];
    const m = this.maze;
    for (let gy = 1; gy < m.gr; gy += 2) {
      for (let gx = 1; gx < m.gc; gx += 2) {
        if (m.grid[gy][gx] !== 0) continue;
        const cx = (gx - 1) / 2;
        const cy = (gy - 1) / 2;
        if (Math.abs(cx - 0) + Math.abs(cy - 0) <= 2) continue;
        if (Math.random() >= 0.75) continue;
        const c = m.cellCenter(cx, cy);
        this.pellets.push(new Pellet(c.x, c.y));
      }
    }
    this.pelletsLeft = this.pelletsTotal = this.pellets.length;

    const far = this.maze.getFarthestCell(this.player.x, this.player.y);
    this.portal = new Portal(far.x, far.y);

    const excludeForPick = [
      { x: this.player.x, y: this.player.y },
      { x: this.portal.x, y: this.portal.y }
    ];
    let openPick = this.maze.getOpenCells(excludeForPick);
    openPick = this._shuffle(openPick);
    const types = this._shuffle([
      "speed",
      "speed",
      "invincible",
      "invincible"
    ]);
    this.powerups = [];
    for (let i = 0; i < 4 && i < openPick.length; i++) {
      const p = openPick[i];
      this.powerups.push(new PowerUp(p.x, p.y, types[i]));
    }

    const mult = this.aiService.getDifficultyMultiplier();
    const enemySpeed = cfg.speed * mult;
    const excludeEnemies = excludeForPick.concat(
      this.powerups.map((pu) => ({ x: pu.x, y: pu.y }))
    );
    let openEnemies = this.maze.getOpenCells(excludeEnemies);
    openEnemies = this._shuffle(openEnemies);
    this.enemies = [];
    for (let i = 0; i < cfg.enemies && i < openEnemies.length; i++) {
      const ep = openEnemies[i];
      this.enemies.push(new Enemy(ep.x, ep.y, enemySpeed));
    }

    this.activeEffects = { speed: 0, invincible: 0 };
    this.particles.clear();
    this.tapTarget = null;
    this.aiService.init(this.difficulty);
    this.camera.update(
      this.player.x,
      this.player.y,
      this.canvas.width,
      this.canvas.height,
      this.maze.width,
      this.maze.height
    );
  }

  _loop(timestamp) {
    if (this.state !== "playing") {
      this.animFrame = null;
      return;
    }
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this._update(dt);
    this._render();
    this.animFrame = requestAnimationFrame(this._boundLoop);
  }

  _update(dt) {
    this.camera.updateShake(dt);

    if (this.paused) {
      this.hud.update(
        this.lives,
        this.score,
        this.level,
        this.pelletsLeft,
        this.pelletsTotal,
        this.activeEffects,
        true
      );
      return;
    }

    if (this.activeEffects.speed > 0) {
      this.activeEffects.speed = Math.max(0, this.activeEffects.speed - dt);
    }
    if (this.activeEffects.invincible > 0) {
      this.activeEffects.invincible = Math.max(
        0,
        this.activeEffects.invincible - dt
      );
    }

    const maze = this.maze;
    const player = this.player;
    const moveInput = this.input.getMoveVector(this.joystick);

    player.update(
      dt,
      moveInput,
      maze,
      this.activeEffects,
      this.tapTarget
    );
    if (this.tapTarget && this.tapTarget.reached) {
      this.tapTarget = null;
    }

    this.camera.update(
      player.x,
      player.y,
      this.canvas.width,
      this.canvas.height,
      maze.width,
      maze.height
    );

    for (const enemy of this.enemies) {
      enemy.update(dt, player.x, player.y, maze);
      enemy.checkHit(
        player.x,
        player.y,
        player.r,
        this.activeEffects,
        this.particles,
        this.audio,
        () => this._onPlayerHit()
      );
    }

    for (const pellet of this.pellets) {
      pellet.update(dt);
      const result = pellet.checkCollect(
        player.x,
        player.y,
        player.r,
        this.particles,
        this.audio
      );
      if (result) {
        this.score += 10;
        this.pelletsLeft--;
        if (typeof this.player.addCollectJuice === "function") {
          this.player.addCollectJuice();
        }
        if (this.pelletsLeft === 0) {
          this.portal.open();
        }
      }
    }

    for (const powerup of this.powerups) {
      powerup.update(dt);
      const type = powerup.checkCollect(
        player.x,
        player.y,
        player.r,
        this.audio
      );
      if (type === "speed") {
        this.activeEffects.speed = 5;
      } else if (type === "invincible") {
        this.activeEffects.invincible = 5;
      }
    }

    this.portal.update(dt);
    if (
      this.state === "playing" &&
      this.portal.checkEnter(player.x, player.y, player.r)
    ) {
      this._onLevelComplete();
    }

    this.particles.update(dt);
    this.minimap.update(
      dt,
      maze,
      player.x,
      player.y,
      maze.width,
      maze.height,
      this.portal,
      this.portal.isOpen
    );
    this.hud.update(
      this.lives,
      this.score,
      this.level,
      this.pelletsLeft,
      this.pelletsTotal,
      this.activeEffects,
      false
    );
  }

  _render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cam = this.camera;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 46, w, h - 46);
    ctx.clip();
    ctx.translate(-(cam.x + cam.shakeX), -(cam.y + cam.shakeY));

    this.renderer.drawMaze(ctx, this.maze);

    for (const pellet of this.pellets) {
      pellet.draw(ctx, 0, 0, cam);
    }
    for (const powerup of this.powerups) {
      powerup.draw(ctx, 0, 0);
    }
    this.portal.draw(ctx, 0, 0);
    for (const enemy of this.enemies) {
      enemy.draw(ctx, 0, 0);
    }
    this.player.draw(ctx, 0, 0, this.activeEffects);
    this.particles.draw(ctx, 0, 0);

    ctx.restore();
  }

  _onPlayerHit() {
    this.camera.addShake(5);
    this.lives--;
    this.hud.update(
      this.lives,
      this.score,
      this.level,
      this.pelletsLeft,
      this.pelletsTotal,
      this.activeEffects,
      false
    );
    if (this.lives <= 0) {
      this._gameOver();
    } else {
      this.player.respawn(this.activeEffects);
    }
  }

  _onLevelComplete() {
    if (this.state !== "playing") return;
    this.state = "levelcomplete";
    this.audio.sfxLevelUp();
    this._saveProgress();
    this.hud.setLevelCompleteScore(this.score, this.level);
    this.hud.showScreen("levelCompleteScreen");
  }

  _gameOver() {
    this.state = "gameover";
    localStorage.removeItem("bje_level");
    localStorage.removeItem("bje_score");
    this.hud.setFinalScore(this.score);
    this.hud.showScreen("gameOverScreen");
  }

  nextLevel() {
    this.level++;
    this._saveProgress();
    this.hud.showScreen(null);
    this.paused = false;
    this.input.clearKeys();
    this._setupLevel();
    this.state = "playing";
    this.lastTime = 0;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this._loop(0);
  }

  restartGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.hud.showScreen(null);
    this.paused = false;
    this.input.clearKeys();
    this._setupLevel();
    this.state = "playing";
    this.lastTime = 0;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this._loop(0);
  }

  goToMenu() {
    this.state = "start";
    this.paused = false;
    this.input.clearKeys();
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.hud.hide();
    this.joystick.hide();
    this.hud.showScreen("startScreen");
  }

  toggleMute() {
    const muted = this.audio.toggleMute();
    this.hud.showMuteState(muted);
  }

  _saveProgress() {
    localStorage.setItem("bje_level", String(this.level));
    localStorage.setItem("bje_score", String(this.score));
  }
}

window.GameManager = GameManager;
