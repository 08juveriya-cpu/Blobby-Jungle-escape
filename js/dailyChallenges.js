/**
 * Daily challenges: 1–3 tasks per local calendar day, progress in localStorage,
 * reset at local midnight. Rewards: coins + optional skin unlock.
 */
(function () {
  const STORAGE_DAY = "bje_daily_day";
  const STORAGE_JSON = "bje_daily_json";
  const COINS_KEY = "bje_coins";
  const SKIN_KEY = "bje_skin";
  const UNLOCKED_KEY = "bje_skins_unlocked";

  const MAX_SKIN_ID = 6;

  const SKIN_COLORS = {
    0: "hsl(158, 48%, 78%)",
    1: "hsl(268, 42%, 80%)",
    2: "hsl(22, 52%, 80%)",
    3: "hsl(200, 55%, 78%)",
    4: "hsl(330, 48%, 78%)",
    5: "hsl(48, 58%, 76%)",
    6: "hsl(215, 28%, 72%)"
  };

  /** Shop-only prices (coins). Id 0 is default/free. */
  const SHOP_SKINS = [
    { id: 1, name: "Lavender", price: 40 },
    { id: 2, name: "Peach", price: 55 },
    { id: 3, name: "Sky", price: 70 },
    { id: 4, name: "Rose", price: 85 },
    { id: 5, name: "Honey", price: 100 },
    { id: 6, name: "Slate", price: 120 }
  ];

  function localDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function getCoins() {
    const v = parseInt(localStorage.getItem(COINS_KEY) || "0", 10);
    return isNaN(v) || v < 0 ? 0 : v;
  }

  function setCoins(n) {
    localStorage.setItem(COINS_KEY, String(Math.max(0, Math.floor(n))));
  }

  function getUnlockedSkins() {
    try {
      const raw = localStorage.getItem(UNLOCKED_KEY);
      if (!raw) return [0];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return [0];
      if (!arr.includes(0)) arr.unshift(0);
      return arr.filter(
        (x) => typeof x === "number" && x >= 0 && x <= MAX_SKIN_ID
      );
    } catch (_e) {
      return [0];
    }
  }

  function setUnlockedSkins(arr) {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(arr));
  }

  class DailyChallengeManager {
    constructor() {
      this.dayKey = localDateKey();
      /** @type {{ tasks: Array<{type:string,target:number,label:string,progress:number,completed:boolean}>, rewardClaimed: boolean, todayBestScore: number } | null} */
      this.state = null;
      this.pendingToast = null;
      this._ensureCurrentDay();
    }

    _ensureCurrentDay() {
      const today = localDateKey();
      if (today !== this.dayKey) {
        this.dayKey = today;
      }
      const storedDay = localStorage.getItem(STORAGE_DAY);
      const raw = localStorage.getItem(STORAGE_JSON);
      if (storedDay === this.dayKey && raw) {
        try {
          this.state = JSON.parse(raw);
          if (!this.state.tasks || !Array.isArray(this.state.tasks)) {
            this._generateNewDay();
          } else {
            if (typeof this.state.todayBestScore !== "number") {
              this.state.todayBestScore = 0;
            }
            if (typeof this.state.rewardClaimed !== "boolean") {
              this.state.rewardClaimed = false;
            }
          }
          return;
        } catch (_e) {}
      }
      this._generateNewDay();
    }

    _generateNewDay() {
      this.dayKey = localDateKey();
      const seed = hashStr(this.dayKey + "bje-daily");
      const count = 1 + (seed % 3);

      const pool = [
        { type: "pellets", target: 18, label: "Collect 18 pellets" },
        { type: "pellets", target: 30, label: "Collect 30 pellets" },
        { type: "pellets", target: 45, label: "Collect 45 pellets" },
        { type: "level", target: 1, label: "Complete 1 level" },
        { type: "level", target: 2, label: "Complete 2 levels" },
        { type: "score", target: 120, label: "Reach 120 score (best run today)" },
        { type: "score", target: 220, label: "Reach 220 score (best run today)" },
        { type: "hard_win", target: 1, label: "Clear a level on Hard" }
      ];

      const shuffled = seededShuffle(pool.slice(), seed + 7);
      const picked = [];
      const usedTypes = new Set();
      for (let i = 0; i < shuffled.length && picked.length < count; i++) {
        const t = shuffled[i];
        if (usedTypes.has(t.type)) continue;
        usedTypes.add(t.type);
        picked.push({ type: t.type, target: t.target, label: t.label });
      }
      for (let j = 0; j < shuffled.length && picked.length < count; j++) {
        const t = shuffled[j];
        if (picked.some((p) => p.type === t.type && p.target === t.target)) {
          continue;
        }
        picked.push({ type: t.type, target: t.target, label: t.label });
      }
      if (picked.length === 0) {
        picked.push({
          type: "pellets",
          target: 20,
          label: "Collect 20 pellets"
        });
      }

      this.state = {
        tasks: picked.slice(0, count).map((t) => ({
          type: t.type,
          target: t.target,
          label: t.label,
          progress: 0,
          completed: false
        })),
        rewardClaimed: false,
        todayBestScore: 0
      };
      localStorage.setItem(STORAGE_DAY, this.dayKey);
      this._save();
    }

    _save() {
      if (!this.state) return;
      localStorage.setItem(STORAGE_JSON, JSON.stringify(this.state));
    }

    /** Call when score might set a new daily best (any moment in a run). */
    onScore(score) {
      this._ensureCurrentDay();
      if (!this.state) return;
      const s = Math.max(0, Math.floor(score));
      if (s > this.state.todayBestScore) {
        this.state.todayBestScore = s;
      }
      this._syncScoreTasks();
      this._tryGrantReward();
      this._save();
    }

    _syncScoreTasks() {
      if (!this.state) return;
      const best = this.state.todayBestScore;
      for (const t of this.state.tasks) {
        if (t.type !== "score" || t.completed) continue;
        t.progress = Math.min(t.target, best);
        if (best >= t.target) {
          t.completed = true;
        }
      }
    }

    onPelletCollected() {
      this._ensureCurrentDay();
      if (!this.state) return;
      for (const t of this.state.tasks) {
        if (t.type !== "pellets" || t.completed) continue;
        t.progress++;
        if (t.progress >= t.target) {
          t.progress = t.target;
          t.completed = true;
        }
      }
      this._tryGrantReward();
      this._save();
    }

    /**
     * @param {string} difficulty 'easy'|'medium'|'hard'
     */
    onLevelComplete(difficulty) {
      this._ensureCurrentDay();
      if (!this.state) return;
      for (const t of this.state.tasks) {
        if (t.type === "level" && !t.completed) {
          t.progress++;
          if (t.progress >= t.target) {
            t.progress = t.target;
            t.completed = true;
          }
        }
        if (t.type === "hard_win" && !t.completed && difficulty === "hard") {
          t.progress = 1;
          t.completed = true;
        }
      }
      this._tryGrantReward();
      this._save();
    }

    /** End of run (menu / game over) — freeze best score for the day. */
    finalizeRun(score) {
      this.onScore(score);
    }

    _tryGrantReward() {
      if (!this.state || this.state.rewardClaimed) return;
      const allDone = this.state.tasks.length > 0 && this.state.tasks.every((t) => t.completed);
      if (!allDone) return;

      const baseCoins = 20 + (hashStr(this.dayKey + "reward") % 16);
      setCoins(getCoins() + baseCoins);
      let msg = "Daily goals complete! +" + baseCoins + " coins";
      let streakExtra = 0;
      if (
        typeof StreakManager !== "undefined" &&
        StreakManager.getDailyStreakBonusCoins
      ) {
        streakExtra = StreakManager.getDailyStreakBonusCoins();
        if (streakExtra > 0) {
          setCoins(getCoins() + streakExtra);
          msg += " · +" + streakExtra + " streak bonus";
        }
      }

      const unlocked = getUnlockedSkins();
      if (!unlocked.includes(1)) {
        unlocked.push(1);
        setUnlockedSkins(unlocked);
        localStorage.setItem(SKIN_KEY, "1");
        msg += " · Skin: Lavender";
      } else if (!unlocked.includes(2)) {
        unlocked.push(2);
        setUnlockedSkins(unlocked);
        localStorage.setItem(SKIN_KEY, "2");
        msg += " · Skin: Peach";
      } else if (!unlocked.includes(3)) {
        unlocked.push(3);
        setUnlockedSkins(unlocked);
        localStorage.setItem(SKIN_KEY, "3");
        msg += " · Skin: Sky";
      } else {
        const bonus = 15;
        setCoins(getCoins() + bonus);
        msg += " · +" + bonus + " bonus coins";
      }

      this.state.rewardClaimed = true;
      this.pendingToast = msg;
      this._save();
    }

    /** Re-read day + render into #daily-challenges. */
    refreshStartUI() {
      this._ensureCurrentDay();
      if (typeof StreakManager !== "undefined" && StreakManager.touch) {
        StreakManager.touch();
      }
      const host = document.getElementById("daily-challenges");
      if (!host) return;

      const tasks = this.state.tasks || [];
      const done = tasks.filter((t) => t.completed).length;
      const total = tasks.length;

      const streakShow =
        typeof StreakManager !== "undefined" && StreakManager.getDisplayStreak
          ? StreakManager.getDisplayStreak()
          : 0;
      const streakLine =
        '<p class="daily-streak" aria-label="Daily streak">Streak: ' +
        escapeHtml(String(streakShow)) +
        (streakShow === 1 ? " day" : " days") +
        " · play daily for bonuses</p>";

      let html =
        '<div class="daily-panel-inner">' +
        '<h2 class="daily-heading">Daily challenges</h2>' +
        streakLine +
        '<p class="daily-coins" aria-label="Coins">' +
        escapeHtml(String(getCoins())) +
        " coins</p>" +
        '<p class="daily-progress">' +
        done +
        "/" +
        total +
        " completed · Resets at midnight</p>" +
        '<ul class="daily-list" role="list">';

      for (const t of tasks) {
        const rowDone = t.completed;
        const prog =
          t.type === "score"
            ? Math.min(t.target, this.state.todayBestScore) + "/" + t.target
            : Math.min(t.progress, t.target) + "/" + t.target;
        html +=
          '<li class="daily-item' +
          (rowDone ? " daily-item-done" : "") +
          '" role="listitem">' +
          '<span class="daily-check" aria-hidden="true">' +
          (rowDone ? "✓" : "○") +
          "</span>" +
          '<span class="daily-label">' +
          escapeHtml(t.label) +
          '</span><span class="daily-count">' +
          escapeHtml(prog) +
          "</span></li>";
      }

      html += "</ul>";
      if (this.state.rewardClaimed && done === total && total > 0) {
        html += '<p class="daily-reward">All goals done — rewards claimed.</p>';
      }
      html += "</div>";
      host.innerHTML = html;

      if (this.pendingToast) {
        this._showToast(this.pendingToast);
        this.pendingToast = null;
      }
    }

    _showToast(text) {
      let t = document.getElementById("daily-toast");
      if (!t) {
        t = document.createElement("div");
        t.id = "daily-toast";
        t.className = "daily-toast";
        t.setAttribute("role", "status");
        document.body.appendChild(t);
      }
      t.textContent = text;
      t.classList.add("daily-toast-visible");
      setTimeout(() => {
        t.classList.remove("daily-toast-visible");
      }, 4200);
    }

    static getCoins() {
      return getCoins();
    }

    static getEquippedSkinId() {
      const id = parseInt(localStorage.getItem(SKIN_KEY) || "0", 10);
      if (isNaN(id) || id < 0 || id > MAX_SKIN_ID) return 0;
      const u = getUnlockedSkins();
      return u.includes(id) ? id : 0;
    }

    static getSkinColorForPlayer() {
      const id = DailyChallengeManager.getEquippedSkinId();
      return SKIN_COLORS[id] || SKIN_COLORS[0];
    }

    static getSkinColorById(id) {
      const n = Math.floor(Number(id)) || 0;
      return SKIN_COLORS[n] || SKIN_COLORS[0];
    }

    static addCoins(n) {
      const add = Math.floor(Number(n)) || 0;
      if (add <= 0) return;
      setCoins(getCoins() + add);
    }

    static setEquippedSkin(id) {
      const sid = Math.floor(Number(id)) || 0;
      const u = getUnlockedSkins();
      if (!u.includes(sid)) return false;
      localStorage.setItem(SKIN_KEY, String(sid));
      return true;
    }

    /**
     * Buy a color if affordable and not owned.
     * @returns {{ ok: boolean, message: string }}
     */
    static tryBuySkin(skinId) {
      const id = Math.floor(Number(skinId));
      const row = SHOP_SKINS.find((s) => s.id === id);
      if (!row) return { ok: false, message: "Invalid item." };
      const u = getUnlockedSkins();
      if (u.includes(id)) return { ok: false, message: "Already owned." };
      const bal = getCoins();
      if (bal < row.price) {
        return { ok: false, message: "Not enough coins." };
      }
      setCoins(bal - row.price);
      u.push(id);
      u.sort((a, b) => a - b);
      setUnlockedSkins(u);
      localStorage.setItem(SKIN_KEY, String(id));
      return { ok: true, message: row.name + " unlocked!" };
    }

    /** HTML rows for the shop modal (caller sets container innerHTML). */
    static getShopSkinsMeta() {
      return SHOP_SKINS.slice();
    }

    static getUnlockedSkinIds() {
      return getUnlockedSkins().slice();
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function seededShuffle(arr, seed) {
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  window.DailyChallengeManager = DailyChallengeManager;
})();
