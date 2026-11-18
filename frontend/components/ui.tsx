"use client";

import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import { useReducedMotion } from "motion/react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`grid -rotate-2 place-items-center bg-brand text-white shadow-[0_7px_16px_rgba(105,87,232,0.22)] ${
          compact ? "size-[31px] rounded-[9px]" : "size-9 rounded-[11px]"
        }`}
      >
        <Rocket size={compact ? 18 : 21} strokeWidth={1.8} />
      </span>
      <span className={`font-extrabold tracking-[-0.04em] text-ink ${compact ? "text-lg" : "text-[21px]"}`}>
        first<span className="text-brand">step</span>.
      </span>
    </div>
  );
}

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 800, 1);
      const v = Math.round(start + (value - start) * (1 - Math.pow(1 - p, 3)));
      setShown(v);
      from.current = v;
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <>{shown}</>;
}

/** Eyebrow label used across headings. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="block text-[10px] font-extrabold tracking-[0.16em] text-brand">{children}</span>;
}

export const primaryButton =
  "group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[13px] font-bold text-white shadow-[0_9px_20px_rgba(105,87,232,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_12px_25px_rgba(105,87,232,0.28)] active:translate-y-0 active:scale-[0.98]";
