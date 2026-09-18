/* XO MD5 QATIB - Sistema de sonido 100% local, sin archivos externos */
(function () {
  "use strict";

  let audioCtx = null;
  let musicEnabled = true;
  let musicStarted = false;
  let musicTimer = null;
  let musicStep = 0;

  const notes = [220, 277.18, 329.63, 415.30, 329.63, 277.18, 246.94, 329.63];

  function getAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, duration, type, volume, when) {
    const ctx = getAudio();
    if (!ctx) return;

    const now = when || ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume || 0.05, 0.001), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  window.playMoveSound = function (player) {
    const ctx = getAudio();
    if (!ctx) return;

    startBackgroundMusic();

    if (player === "X") {
      tone(520, 0.11, "sine", 0.10);
      tone(780, 0.10, "triangle", 0.055, ctx.currentTime + 0.055);
    } else {
      tone(300, 0.13, "triangle", 0.10);
      tone(225, 0.11, "sine", 0.055, ctx.currentTime + 0.055);
    }
  };

  window.playWinSound = function (player) {
    const ctx = getAudio();
    if (!ctx) return;

    const start = ctx.currentTime;
    const melody = player === "X"
      ? [523.25, 659.25, 783.99, 1046.50]
      : [392.00, 493.88, 587.33, 783.99];

    melody.forEach((freq, i) => {
      tone(freq, 0.28, i === 3 ? "sine" : "triangle", i === 3 ? 0.13 : 0.085, start + i * 0.13);
    });

    tone(melody[0] / 2, 0.65, "sine", 0.045, start);
    tone(melody[3] / 2, 0.65, "sine", 0.045, start + 0.39);
  };

  window.playDrawSound = function () {
    const ctx = getAudio();
    if (!ctx) return;
    tone(330, 0.22, "sine", 0.07);
    tone(277.18, 0.30, "sine", 0.055, ctx.currentTime + 0.16);
  };

  function musicTick() {
    if (!musicEnabled || !musicStarted) return;

    const ctx = getAudio();
    if (!ctx) return;

    const root = notes[musicStep % notes.length];
    tone(root, 0.72, "sine", 0.018);
    tone(root / 2, 0.85, "triangle", 0.010, ctx.currentTime + 0.02);

    musicStep++;
    musicTimer = window.setTimeout(musicTick, 620);
  }

  window.startBackgroundMusic = function () {
    if (!musicEnabled || musicStarted) return;
    const ctx = getAudio();
    if (!ctx) return;

    musicStarted = true;
    musicStep = 0;
    musicTick();
  };

  window.toggleGameSound = function () {
    musicEnabled = !musicEnabled;

    if (!musicEnabled) {
      musicStarted = false;
      if (musicTimer) {
        clearTimeout(musicTimer);
        musicTimer = null;
      }
    } else {
      startBackgroundMusic();
      const ctx = getAudio();
      if (ctx) tone(660, 0.12, "sine", 0.07);
    }

    updateSoundButton();
  };

  function updateSoundButton() {
    const button = document.getElementById("soundToggle");
    if (!button) return;

    button.textContent = musicEnabled
      ? "🔊 SONIDO: ACTIVADO"
      : "🔇 SONIDO: SILENCIADO";

    button.classList.toggle("sound-on", musicEnabled);
  }

  window.addEventListener("pointerdown", function () {
    if (musicEnabled) startBackgroundMusic();
  }, { once: true });

  window.addEventListener("keydown", function () {
    if (musicEnabled) startBackgroundMusic();
  }, { once: true });

  document.addEventListener("DOMContentLoaded", updateSoundButton);
})();
