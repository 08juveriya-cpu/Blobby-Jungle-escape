class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensureContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (this.ctx === null) {
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTone(freq, dur, type = "sine", vol = 0.3, detune = 0) {
    if (this.muted) return;

    try {
      this.ensureContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch (_err) {
    }
  }

  sfxCollect() {
    this.playTone(880, 0.12, "sine", 0.25);
    setTimeout(() => {
      this.playTone(1100, 0.1, "sine", 0.2);
    }, 60);
  }

  sfxHit() {
    this.playTone(200, 0.3, "sawtooth", 0.3);
    this.playTone(150, 0.4, "square", 0.2, -200);
  }

  sfxLevelUp() {
    const tones = [523, 659, 784, 1047];
    tones.forEach((tone, index) => {
      setTimeout(() => {
        this.playTone(tone, 0.25, "sine", 0.25);
      }, index * 100);
    });
  }

  sfxPowerup() {
    this.playTone(660, 0.1, "sine", 0.25);
    setTimeout(() => {
      this.playTone(880, 0.15, "sine", 0.25);
    }, 100);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  hookCoinCollect() {
    this.sfxCollect();
  }

  hookPlayerBump() {
    this.playTone(120, 0.04, "sine", 0.08, 0);
  }

  hookPowerupPulse() {
    this.sfxPowerup();
  }

  /** Soft UI tick for menus and buttons (respects mute). */
  sfxUIClick() {
    this.playTone(520, 0.045, "triangle", 0.12);
    setTimeout(() => {
      this.playTone(380, 0.035, "sine", 0.08);
    }, 22);
  }

  /** Quiet tension tick when an enemy skims close (near-miss). */
  sfxNearMiss() {
    this.playTone(198, 0.055, "sine", 0.055);
    this.playTone(245, 0.04, "triangle", 0.035);
  }
}

window.AudioManager = AudioManager;
