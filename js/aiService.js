class AIService {
  constructor() {
    this.enabled = false;
    this.difficulty = "medium";
  }

  init(difficulty) {
    this.difficulty = difficulty;
    this.enabled = true;
  }

  getEnemyBehavior(enemyX, enemyY, playerX, playerY, mazeCells) {
    if (!this.enabled) return null;
    const dist = Math.hypot(playerX - enemyX, playerY - enemyY);
    if (dist < 200) return "chase";
    if (dist < 400) return "patrol";
    return "roam";
  }

  getDifficultyMultiplier() {
    switch (this.difficulty) {
      case "easy":
        return 0.7;
      case "medium":
        return 1.0;
      case "hard":
        return 1.4;
      default:
        return 1.0;
    }
  }

  isReplaceable() {
    return true;
  }
}

window.AIService = AIService;
