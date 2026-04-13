function setActiveDiff(selectedId) {
  const ids = ["btn-easy", "btn-medium", "btn-hard"];
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) el.classList.remove("selected");
  }
  const sel = document.getElementById(selectedId);
  if (sel) sel.classList.add("selected");
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

  setActiveDiff("btn-medium");

  document.getElementById("btn-easy").addEventListener("click", function () {
    console.log("Difficulty: Easy clicked");
    game.selectDifficulty("easy");
    setActiveDiff("btn-easy");
  });
  document.getElementById("btn-medium").addEventListener("click", function () {
    console.log("Difficulty: Medium clicked");
    game.selectDifficulty("medium");
    setActiveDiff("btn-medium");
  });
  document.getElementById("btn-hard").addEventListener("click", function () {
    console.log("Difficulty: Hard clicked");
    game.selectDifficulty("hard");
    setActiveDiff("btn-hard");
  });
  document.getElementById("btn-start").addEventListener("click", function () {
    console.log("Start clicked");
    document.getElementById("startScreen").classList.add("hidden");
    game.startGame();
    const maze = game.maze;
    console.log("Maze initialized:", maze, {
      cols: maze.cols,
      rows: maze.rows,
      gc: maze.gc,
      gr: maze.gr,
      width: maze.width,
      height: maze.height
    });
  });
  document.getElementById("btn-restart").addEventListener("click", function () {
    game.restartGame();
  });
  document.getElementById("btn-next").addEventListener("click", function () {
    game.nextLevel();
  });
  document.getElementById("btn-menu-go").addEventListener("click", function () {
    game.goToMenu();
  });
  document.getElementById("btn-menu-lc").addEventListener("click", function () {
    game.goToMenu();
  });
  document.getElementById("muteBtn").addEventListener("click", function () {
    game.toggleMute();
  });

  window.addEventListener("resize", function () {
    resizeCanvas();
  });

  const previewCanvas = document.getElementById("preview-canvas");
  if (previewCanvas) {
    previewCanvas.width = 80;
    previewCanvas.height = 80;
    const ctx = previewCanvas.getContext("2d");
    let t = 0;
    function animPreview() {
      ctx.clearRect(0, 0, 80, 80);
      t += 0.04;
      const cx = 40;
      const cy = 40 + Math.sin(t) * 4;
      const r = 22;
      const bobT = t;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const wobble = r * 0.12 * Math.sin(angle * 3 + bobT * 0.7);
        const rad = r + wobble;
        const px = cx + rad * Math.cos(angle);
        const py = cy + rad * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fillStyle = "hsl(90,60%,70%)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 3, 3.5, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy - 3, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#333";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 5, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      requestAnimationFrame(animPreview);
    }
    animPreview();
  }
});
