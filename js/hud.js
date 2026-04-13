class HUD {
  constructor() {
    this.livesEl = document.getElementById("lives-display");
    this.scoreEl = document.getElementById("score-display");
    this.levelEl = document.getElementById("level-display");
    this.pelletsEl = document.getElementById("pellets-display");
    this.pauseBadge = document.getElementById("pause-badge");
    this.coinsEl = document.getElementById("coin-display");
    this.powerupEl = document.getElementById("powerupHud");
    this.muteBtn = document.getElementById("muteBtn");
  }

  update(
    lives,
    score,
    level,
    pelletsLeft,
    pelletsTotal,
    activeEffects,
    paused,
    coins
  ) {
    const n = Math.max(0, lives);
    this.livesEl.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const h = document.createElement("span");
      h.className = "life-heart";
      h.textContent = "\u2665";
      h.setAttribute("aria-hidden", "true");
      this.livesEl.appendChild(h);
    }
    this.scoreEl.textContent = String(score);
    if (this.coinsEl) {
      const c =
        typeof coins === "number" && !isNaN(coins) ? Math.max(0, coins) : 0;
      this.coinsEl.textContent = "\u25C6 " + String(c);
    }
    this.levelEl.textContent = "Lv " + String(level);
    const got = pelletsTotal - pelletsLeft;
    this.pelletsEl.textContent = got + " / " + pelletsTotal;
    this._updatePowerups(activeEffects);
    if (this.pauseBadge) {
      this.pauseBadge.textContent = paused ? "Paused · P" : "";
    }
  }

  _updatePowerups(activeEffects) {
    this.powerupEl.innerHTML = "";
    if (activeEffects.speed > 0) {
      const div = document.createElement("div");
      div.className = "powerup-indicator pu-speed";
      div.textContent = "S " + activeEffects.speed.toFixed(1) + "s";
      this.powerupEl.appendChild(div);
    }
    if (activeEffects.invincible > 0) {
      const div = document.createElement("div");
      div.className = "powerup-indicator pu-invin";
      div.textContent = "I " + activeEffects.invincible.toFixed(1) + "s";
      this.powerupEl.appendChild(div);
    }
  }

  showMuteState(muted) {
    this.muteBtn.textContent = muted ? "🔇" : "🔊";
  }

  show() {
    document.getElementById("hud").classList.remove("hidden");
    document.getElementById("minimap").style.display = "block";
  }

  hide() {
    document.getElementById("hud").classList.add("hidden");
    document.getElementById("minimap").style.display = "none";
  }

  showScreen(screenId) {
    const screens = ["startScreen", "gameOverScreen", "levelCompleteScreen"];
    for (const id of screens) {
      document.getElementById(id).classList.add("hidden");
    }
    if (screenId !== null && screenId !== undefined) {
      document.getElementById(screenId).classList.remove("hidden");
    }
  }

  setFinalScore(score) {
    document.getElementById("go-score").textContent = "Score: " + score;
  }

  setLevelCompleteScore(score, level) {
    document.getElementById("lc-score").textContent =
      "Score: " + score + " | Level " + level + " Complete!";
  }
}

window.HUD = HUD;
