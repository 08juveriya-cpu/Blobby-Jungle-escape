/**
 * Touch joystick: output only counts as "active" after the finger moves past a small
 * drag threshold — avoids drift and "always on" feel from touchstart alone.
 */
class Joystick {
  constructor() {
    this.dx = 0;
    this.dy = 0;
    this.touchId = -1;
    this.baseX = 0;
    this.baseY = 0;
    this.maxRadius = 60;
    /** Normalized deadzone on stick magnitude (0–1). */
    this.deadzone = 0.16;
    /** Pixels of movement before we consider the stick "dragged". */
    this.dragThresholdPx = 6;

    this._fingerDown = false;
    this._hasDragged = false;

    this.area = document.getElementById("joystickArea");
    this.base = document.getElementById("joystickBase");
    this.knob = document.getElementById("joystickKnob");

    this._bindEvents();
  }

  _bindEvents() {
    this.area.addEventListener("touchstart", this._onStart.bind(this), {
      passive: false
    });
    document.addEventListener("touchmove", this._onMove.bind(this), {
      passive: false
    });
    document.addEventListener("touchend", this._onEnd.bind(this));
    document.addEventListener("touchcancel", this._onEnd.bind(this));
  }

  _onStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;
    const rect = this.base.getBoundingClientRect();
    this.baseX = rect.left + rect.width / 2;
    this.baseY = rect.top + rect.height / 2;
    this._fingerDown = true;
    this._hasDragged = false;
    this.dx = 0;
    this.dy = 0;
  }

  _findTouch(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        return e.changedTouches[i];
      }
    }
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        return e.touches[i];
      }
    }
    return null;
  }

  _onMove(e) {
    e.preventDefault();
    if (!this._fingerDown || this.touchId < 0) return;

    const touch = this._findTouch(e);
    if (!touch) return;

    const px = touch.clientX - this.baseX;
    const py = touch.clientY - this.baseY;
    const dist = Math.hypot(px, py);

    if (!this._hasDragged && dist >= this.dragThresholdPx) {
      this._hasDragged = true;
    }

    if (!this._hasDragged) {
      this.dx = 0;
      this.dy = 0;
      this.knob.style.transform = "translate(-50%, -50%)";
      return;
    }

    const dz = this.deadzone * this.maxRadius;
    const clamped = Math.min(dist, this.maxRadius);
    const nx = dist > 0 ? px / dist : 0;
    const ny = dist > 0 ? py / dist : 0;

    if (dist < dz) {
      this.dx = 0;
      this.dy = 0;
    } else {
      const mag = Math.min((dist - dz) / (this.maxRadius - dz), 1);
      this.dx = nx * mag;
      this.dy = ny * mag;
    }

    const ox = nx * clamped;
    const oy = ny * clamped;
    this.knob.style.transform =
      "translate(calc(-50% + " + ox + "px), calc(-50% + " + oy + "px))";
  }

  _onEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        this._fingerDown = false;
        this._hasDragged = false;
        this.dx = 0;
        this.dy = 0;
        this.touchId = -1;
        this.knob.style.transform = "translate(-50%, -50%)";
        break;
      }
    }
  }

  /**
   * active === true only while finger is down AND user has dragged past threshold
   * AND stick vector is outside the radial deadzone.
   */
  getInput() {
    const mag = Math.hypot(this.dx, this.dy);
    const active =
      this._fingerDown &&
      this._hasDragged &&
      mag > 0.02;
    return {
      active: active,
      dx: this.dx,
      dy: this.dy
    };
  }

  show() {
    this.area.classList.remove("hidden");
  }

  hide() {
    this.area.classList.add("hidden");
  }
}

window.Joystick = Joystick;
