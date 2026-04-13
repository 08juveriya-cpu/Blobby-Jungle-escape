function setActiveDiff(selectedId) {
  const ids = ["btn-easy", "btn-medium", "btn-hard"];
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) el.classList.remove("active");
  }
  const sel = document.getElementById(selectedId);
  if (sel) sel.classList.add("active");
}

function playUIClick(game) {
  if (game && game.audio && typeof game.audio.sfxUIClick === "function") {
    game.audio.sfxUIClick();
  }
}

function resizeCanvas() {
  const canvas = document.getElementById("gameCanvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (
    window.game &&
    window.game.state === "playing" &&
    window.game.player &&
    window.game.maze
  ) {
    window.game.camera.update(
      window.game.player.x,
      window.game.player.y,
      canvas.width,
      canvas.height,
      window.game.maze.width,
      window.game.maze.height
    );
  }
}

document.addEventListener("DOMContentLoaded", function () {
  window.game = new GameManager();
  const game = window.game;
  resizeCanvas();

  const savedLevel = localStorage.getItem("bje_level");
  const savedScore = localStorage.getItem("bje_score");
  if (savedLevel && savedLevel !== "1") {
    const info = document.getElementById("saved-info");
    if (info) {
      info.textContent =
        "Continue: Level " + savedLevel + " | Score " + savedScore;
      info.removeAttribute("hidden");
    }
  }

  game.hud.showScreen("startScreen");

  if (game.daily) {
    game.daily.refreshStartUI();
  }

  setActiveDiff("btn-medium");

  document.getElementById("btn-easy").addEventListener("click", function () {
    playUIClick(game);
    game.selectDifficulty("easy");
    setActiveDiff("btn-easy");
  });
  document.getElementById("btn-medium").addEventListener("click", function () {
    playUIClick(game);
    game.selectDifficulty("medium");
    setActiveDiff("btn-medium");
  });
  document.getElementById("btn-hard").addEventListener("click", function () {
    playUIClick(game);
    game.selectDifficulty("hard");
    setActiveDiff("btn-hard");
  });
  document.getElementById("btn-start").addEventListener("click", function () {
    playUIClick(game);
    document.getElementById("startScreen").classList.add("hidden");
    game.startGame();
  });
  document.getElementById("btn-restart").addEventListener("click", function () {
    playUIClick(game);
    game.restartGame();
  });
  document.getElementById("btn-next").addEventListener("click", function () {
    playUIClick(game);
    game.nextLevel();
  });
  document.getElementById("btn-menu-go").addEventListener("click", function () {
    playUIClick(game);
    game.goToMenu();
  });
  document.getElementById("btn-menu-lc").addEventListener("click", function () {
    playUIClick(game);
    game.goToMenu();
  });
  document.getElementById("muteBtn").addEventListener("click", function () {
    playUIClick(game);
    game.toggleMute();
  });

  const shopModal = document.getElementById("shop-modal");
  function closeShop() {
    if (!shopModal) return;
    shopModal.classList.add("hidden");
    shopModal.setAttribute("aria-hidden", "true");
    if (game.daily) {
      game.daily.refreshStartUI();
    }
  }
  function openShop() {
    if (!shopModal || typeof DailyChallengeManager === "undefined") return;
    renderShopList(game);
    shopModal.classList.remove("hidden");
    shopModal.setAttribute("aria-hidden", "false");
  }
  function renderShopList(game) {
    const list = document.getElementById("shop-list");
    const bal = document.getElementById("shop-balance");
    if (!list || !bal) return;
    const meta = DailyChallengeManager.getShopSkinsMeta();
    const coins = DailyChallengeManager.getCoins();
    const owned = new Set(DailyChallengeManager.getUnlockedSkinIds());
    const equipped = DailyChallengeManager.getEquippedSkinId();
    bal.textContent = "Coins: " + coins;
    list.innerHTML = "";
    for (let i = 0; i < meta.length; i++) {
      const s = meta[i];
      const li = document.createElement("li");
      li.className = "shop-row";
      const sw = document.createElement("span");
      sw.className = "shop-swatch";
      sw.style.background = DailyChallengeManager.getSkinColorById(s.id);
      const nm = document.createElement("span");
      nm.className = "shop-name";
      nm.textContent = s.name;
      const actions = document.createElement("span");
      actions.className = "shop-actions";
      const isOwned = owned.has(s.id);
      const isEq = equipped === s.id;
      if (!isOwned) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "shop-buy";
        b.textContent = s.price + " coins";
        b.addEventListener("click", function () {
          playUIClick(game);
          const r = DailyChallengeManager.tryBuySkin(s.id);
          if (r.ok && game.audio && game.audio.sfxPowerup) {
            game.audio.sfxPowerup();
          }
          renderShopList(game);
        });
        actions.appendChild(b);
      } else if (!isEq) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "shop-equip";
        b.textContent = "Equip";
        b.addEventListener("click", function () {
          playUIClick(game);
          DailyChallengeManager.setEquippedSkin(s.id);
          renderShopList(game);
        });
        actions.appendChild(b);
      } else {
        const sp = document.createElement("span");
        sp.className = "shop-equipped";
        sp.textContent = "Equipped";
        actions.appendChild(sp);
      }
      li.appendChild(sw);
      li.appendChild(nm);
      li.appendChild(actions);
      list.appendChild(li);
    }
  }
  const btnShop = document.getElementById("btn-shop");
  if (btnShop) {
    btnShop.addEventListener("click", function () {
      playUIClick(game);
      openShop();
    });
  }
  const shopClose = document.getElementById("shop-close");
  if (shopClose) {
    shopClose.addEventListener("click", function () {
      playUIClick(game);
      closeShop();
    });
  }
  const shopBackdrop = document.getElementById("shop-backdrop");
  if (shopBackdrop) {
    shopBackdrop.addEventListener("click", function () {
      closeShop();
    });
  }

  window.addEventListener("resize", function () {
    resizeCanvas();
  });

  const previewCanvas = document.getElementById("preview-canvas");
  if (previewCanvas) {
    const W = previewCanvas.width;
    const H = previewCanvas.height;
    const ctx = previewCanvas.getContext("2d");
    let t = 0;
    function drawPreviewBlob() {
      ctx.clearRect(0, 0, W, H);
      t += 0.035;
      const cx = W / 2;
      const cy = H / 2 + Math.sin(t * 1.1) * 5;
      const baseR = 50;
      const breath = 1 + Math.sin(t * 1.35) * 0.028;
      const wobble = 1 + Math.sin(t * 0.85) * 0.022;
      const rx = baseR * breath * wobble;
      const ry = baseR * breath * (2 - wobble) * 0.96;

      ctx.save();
      ctx.translate(cx, cy + baseR * 0.72);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.42, rx * 0.18, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(55, 50, 45, 0.12)";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.5) * 0.04);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(-rx * 0.25, -ry * 0.35, 0, 0, 0, baseR);
      g.addColorStop(0, "hsl(152, 52%, 88%)");
      g.addColorStop(0.55, "hsl(158, 48%, 78%)");
      g.addColorStop(1, "hsl(168, 38%, 72%)");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(51, 51, 51, 0.42)";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      const eyeY = -ry * 0.1 + Math.sin(t * 1.15) * 1.2;
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-rx * 0.26, eyeY, 3.4, 0, Math.PI * 2);
      ctx.arc(rx * 0.26, eyeY, 3.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(51, 51, 51, 0.72)";
      ctx.lineWidth = 1.65;
      ctx.lineCap = "round";
      ctx.arc(0, ry * 0.1, ry * 0.3, 0.22, Math.PI - 0.22);
      ctx.stroke();
      ctx.restore();
    }
    function animPreview() {
      drawPreviewBlob();
      requestAnimationFrame(animPreview);
    }
    animPreview();
  }

  const startParticles = document.getElementById("start-bg-particles");
  const startScreenEl = document.getElementById("startScreen");
  if (startParticles && startScreenEl) {
    const pctx = startParticles.getContext("2d");
    const dots = [];
    const DOT_N = 42;
    function resizeStartParticles() {
      startParticles.width = window.innerWidth;
      startParticles.height = window.innerHeight;
      dots.length = 0;
      for (let i = 0; i < DOT_N; i++) {
        dots.push({
          x: Math.random() * startParticles.width,
          y: Math.random() * startParticles.height,
          r: 0.8 + Math.random() * 1.4,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          a: 0.12 + Math.random() * 0.18
        });
      }
    }
    resizeStartParticles();
    window.addEventListener("resize", resizeStartParticles);
    let pt = 0;
    let lastPt = performance.now();
    function animStartParticles(now) {
      const dt = Math.min((now - lastPt) / 1000, 0.05);
      lastPt = now;
      if (!startScreenEl.classList.contains("hidden")) {
        pt += dt;
        const pw = startParticles.width;
        const ph = startParticles.height;
        pctx.clearRect(0, 0, pw, ph);
        for (const d of dots) {
          d.x += d.vx * dt;
          d.y += d.vy * dt + Math.sin(pt * 0.8 + d.x * 0.012) * 7 * dt;
          if (d.x < -20) d.x = pw + 20;
          if (d.x > pw + 20) d.x = -20;
          if (d.y < -20) d.y = ph + 20;
          if (d.y > ph + 20) d.y = -20;
          pctx.beginPath();
          pctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          pctx.fillStyle = `rgba(180, 185, 190, ${d.a})`;
          pctx.fill();
        }
      }
      requestAnimationFrame(animStartParticles);
    }
    animStartParticles();
  }
});
