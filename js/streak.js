/**
 * Consecutive calendar days with a visit to the game (start screen).
 * Bonus coins on each new day; extra coins when daily goals complete (see dailyChallenges).
 */
(function () {
  const STREAK = "bje_streak_count";
  const LAST = "bje_last_play_calendar";
  const BONUS = "bje_streak_login_bonus_day";

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function parseYMD(s) {
    const p = String(s).split("-").map(Number);
    if (p.length !== 3 || p.some((n) => isNaN(n))) return null;
    return new Date(p[0], p[1] - 1, p[2]);
  }

  function dayDiff(a, b) {
    const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ub - ua) / 86400000);
  }

  function addCoinsSafe(n) {
    const add = Math.floor(Number(n)) || 0;
    if (add <= 0) return;
    if (
      typeof DailyChallengeManager !== "undefined" &&
      DailyChallengeManager.addCoins
    ) {
      DailyChallengeManager.addCoins(add);
    }
  }

  const StreakManager = {
    /** Call when start screen is shown / refreshed. */
    touch() {
      const t = todayKey();
      const last = localStorage.getItem(LAST);
      const cur = parseInt(localStorage.getItem(STREAK) || "0", 10) || 0;

      if (last === t) {
        return { streak: cur, newDay: false, loginBonus: 0 };
      }

      let next = 1;
      if (last) {
        const dLast = parseYMD(last);
        const dToday = parseYMD(t);
        if (dLast && dToday) {
          const diff = dayDiff(dLast, dToday);
          if (diff === 1) {
            next = cur + 1;
          } else if (diff > 1) {
            next = 1;
          } else {
            next = Math.max(1, cur);
          }
        }
      }

      localStorage.setItem(STREAK, String(next));
      localStorage.setItem(LAST, t);

      let loginBonus = 0;
      if (localStorage.getItem(BONUS) !== t) {
        loginBonus = Math.min(35, 4 + next * 2);
        addCoinsSafe(loginBonus);
        localStorage.setItem(BONUS, t);
      }

      return { streak: next, newDay: true, loginBonus };
    },

    /** Streak to show (0 if broken by missing a full calendar day). */
    getDisplayStreak() {
      const t = todayKey();
      const last = localStorage.getItem(LAST);
      const n = parseInt(localStorage.getItem(STREAK) || "0", 10) || 0;
      if (!last) return 0;
      if (last === t) return n;
      const dLast = parseYMD(last);
      const dToday = parseYMD(t);
      if (!dLast || !dToday) return 0;
      if (dayDiff(dLast, dToday) === 1) {
        return n;
      }
      return 0;
    },

    /** Extra coins for daily completion (scaled by streak). */
    getDailyStreakBonusCoins() {
      const s = this.getDisplayStreak();
      return Math.min(28, Math.floor(s * 2.5));
    }
  };

  window.StreakManager = StreakManager;
})();
