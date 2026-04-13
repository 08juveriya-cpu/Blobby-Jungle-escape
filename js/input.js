/**
 * Centralizes keyboard (WASD + arrows) and merges with the on-screen joystick.
 * Diagonal vectors are normalized so diagonal speed matches cardinal speed.
 * The joystick instance is queried each frame; it only reports "active" after a real drag.
 */
class GameInput {
  /**
   * @param {GameManager} game - owner; reads state / paused for preventDefault policy
   */
  constructor(game) {
    this.game = game;
    this._keyDown = Object.create(null);
    this._moveCodes = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyP"
    ]);
    this._onKeyDown = (e) => this._handleKeyDown(e);
    this._onKeyUp = (e) => this._handleKeyUp(e);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  _shouldCapture() {
    return this.game.state === "playing" && !this.game.paused;
  }

  _handleKeyDown(e) {
    if (e.code === "KeyP" && this.game.state === "playing") {
      e.preventDefault();
      this.game.togglePause();
      return;
    }
    if (!this._moveCodes.has(e.code)) return;
    if (this._shouldCapture()) {
      e.preventDefault();
    }
    this._keyDown[e.code] = true;
  }

  _handleKeyUp(e) {
    if (!this._moveCodes.has(e.code)) return;
    if (this._shouldCapture()) {
      e.preventDefault();
    }
    this._keyDown[e.code] = false;
  }

  /** Unit direction from keys, or inactive if none pressed. */
  getKeyboardVector() {
    const k = this._keyDown;
    let dx = 0;
    let dy = 0;
    if (k["ArrowRight"] || k["KeyD"]) dx += 1;
    if (k["ArrowLeft"] || k["KeyA"]) dx -= 1;
    if (k["ArrowDown"] || k["KeyS"]) dy += 1;
    if (k["ArrowUp"] || k["KeyW"]) dy -= 1;
    if (dx === 0 && dy === 0) {
      return { active: false, dx: 0, dy: 0 };
    }
    const len = Math.hypot(dx, dy);
    return { active: true, dx: dx / len, dy: dy / len };
  }

  /**
   * Final movement intent for the player: keyboard overrides joystick when both matter;
   * joystick only contributes after a deliberate drag (see Joystick.getInput).
   */
  getMoveVector(joystick) {
    const key = this.getKeyboardVector();
    if (key.active) {
      return key;
    }
    const joy = joystick.getInput();
    if (joy.active && (joy.dx !== 0 || joy.dy !== 0)) {
      const len = Math.hypot(joy.dx, joy.dy) || 1;
      return { active: true, dx: joy.dx / len, dy: joy.dy / len };
    }
    return { active: false, dx: 0, dy: 0 };
  }

  clearKeys() {
    for (const c of this._moveCodes) {
      this._keyDown[c] = false;
    }
  }

  destroy() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}

window.GameInput = GameInput;
