/**
 * View camera: smooth lerp toward the player-centered target, clamped so the
 * viewport never leaves the maze bounds. Optional screen shake decays each frame.
 */
class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    /** Lerp factor per frame toward ideal scroll position (higher = snappier). */
    this.smoothing = 0.12;
    /** Current shake offset in pixels (applied only at render time). */
    this.shakeX = 0;
    this.shakeY = 0;
    this._shakeMag = 0;
  }

  /**
   * Impulse for hit feedback; decays automatically in updateShake.
   */
  addShake(amount) {
    this._shakeMag = Math.min(14, this._shakeMag + amount);
  }

  updateShake(dt) {
    if (this._shakeMag <= 0.01) {
      this.shakeX = 0;
      this.shakeY = 0;
      this._shakeMag = 0;
      return;
    }
    this.shakeX = (Math.random() - 0.5) * this._shakeMag;
    this.shakeY = (Math.random() - 0.5) * this._shakeMag * 0.85;
    this._shakeMag *= Math.pow(0.12, dt * 60);
  }

  update(targetX, targetY, canvasW, canvasH, worldW, worldH) {
    const maxX = Math.max(0, worldW - canvasW);
    const maxY = Math.max(0, worldH - canvasH);

    let tx = targetX - canvasW / 2;
    let ty = targetY - canvasH / 2;

    if (worldW < canvasW) {
      tx = (worldW - canvasW) / 2;
    } else {
      tx = Math.max(0, Math.min(maxX, tx));
    }
    if (worldH < canvasH) {
      ty = (worldH - canvasH) / 2;
    } else {
      ty = Math.max(0, Math.min(maxY, ty));
    }

    this.x += (tx - this.x) * this.smoothing;
    this.y += (ty - this.y) * this.smoothing;
  }

  worldToScreen(worldX, worldY) {
    return { x: worldX - this.x, y: worldY - this.y };
  }

  screenToWorld(screenX, screenY) {
    return { x: screenX + this.x, y: screenY + this.y };
  }

  isVisible(worldX, worldY, padding, canvasW, canvasH) {
    return (
      worldX >= this.x - padding &&
      worldX <= this.x + canvasW + padding &&
      worldY >= this.y - padding &&
      worldY <= this.y + canvasH + padding
    );
  }
}

window.Camera = Camera;
