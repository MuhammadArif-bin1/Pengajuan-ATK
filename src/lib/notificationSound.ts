/**
 * Generates a clean, pleasant double-chime notification sound using Web Audio API
 */
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Auto-unlock audio context on first mobile tap/click
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("touchend", unlock);
        window.removeEventListener("click", unlock);
      }).catch(() => {});
    } else if (ctx && ctx.state === "running") {
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("click", unlock);
    }
  };
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("touchend", unlock, { passive: true });
  window.addEventListener("click", unlock, { passive: true });
}

export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack and release envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Two-tone chime: D5 (587.33 Hz) then A5 (880.0 Hz)
    playTone(587.33, now, 0.25);
    playTone(880.0, now + 0.12, 0.4);
  } catch (err) {
    console.warn("Audio notification failed:", err);
  }
}
