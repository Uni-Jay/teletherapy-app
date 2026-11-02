"use client";
import { useMemo, useRef } from "react";

/** Generates call tones with the Web Audio API, so no sound files are needed. */
export function useTone() {
  const ctx = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  return useMemo(() => {
    function beep(freqs: number[], ms: number, gain = 0.06) {
      try {
        if (!ctx.current) ctx.current = new AudioContext();
        const ac = ctx.current;
        if (ac.state === "suspended") ac.resume();
        const g = ac.createGain();
        g.connect(ac.destination);
        const now = ac.currentTime;
        g.gain.setValueAtTime(gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
        for (const f of freqs) {
          const o = ac.createOscillator();
          o.frequency.value = f;
          o.connect(g);
          o.start(now);
          o.stop(now + ms / 1000);
        }
      } catch {}
    }

    function stop() {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    }

    return {
      /** What the caller hears while the other phone rings. */
      ringback() {
        stop();
        const play = () => beep([440, 480], 1800, 0.04);
        play();
        timer.current = setInterval(play, 4000);
      },
      /** What the person being called hears. */
      ringtone() {
        stop();
        const play = () => {
          beep([659], 180, 0.08);
          setTimeout(() => beep([784], 180, 0.08), 200);
          setTimeout(() => beep([988], 260, 0.08), 400);
        };
        play();
        timer.current = setInterval(play, 2200);
      },
      stop,
    };
  }, []);
}
